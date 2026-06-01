from __future__ import annotations

import re
from dataclasses import dataclass

import tiktoken
from django.conf import settings

_RECORD_HEADERS = (
    r'Meeting Notes #\d+',
    r'Internal Email #\d+',
    r'Mock Airline Monthly Invoice',
    r'Contract #\d+',
    r'Customer Support Ticket #\d+',
    r'Field Note #\d+',
    r'Inspection Report #\d+',
    r'Maintenance Report #\d+',
)

RECORD_BOUNDARY = re.compile(
    rf'\n(?=(?:{"|".join(_RECORD_HEADERS)}))',
    re.MULTILINE,
)


@dataclass(frozen=True)
class TextChunk:
    content: str
    token_count: int
    metadata: dict


class TextChunkerService:
    def _get_encoding(self):
        model = settings.RAG_EMBEDDING_MODEL
        try:
            return tiktoken.encoding_for_model(model)
        except KeyError:
            return tiktoken.get_encoding('cl100k_base')

    def count_tokens(self, text: str) -> int:
        return len(self._get_encoding().encode(text))

    def _split_into_segments(self, text: str) -> list[str]:
        segments = [
            segment.strip()
            for segment in RECORD_BOUNDARY.split(text)
            if segment.strip()
        ]
        if segments:
            return segments
        return [text.strip()] if text.strip() else []

    def _split_by_tokens(
        self, text: str, *, chunk_size: int, chunk_overlap: int
    ) -> list[str]:
        encoding = self._get_encoding()
        tokens = encoding.encode(text)
        if not tokens:
            return []

        chunks: list[str] = []
        start = 0

        while start < len(tokens):
            end = min(start + chunk_size, len(tokens))
            chunk_text = encoding.decode(tokens[start:end]).strip()
            if chunk_text:
                chunks.append(chunk_text)

            if end >= len(tokens):
                break
            start = max(end - chunk_overlap, start + 1)

        return chunks

    def split_text(self, text: str) -> list[TextChunk]:
        chunk_size = settings.RAG_CHUNK_SIZE
        chunk_overlap = settings.RAG_CHUNK_OVERLAP
        segments = self._split_into_segments(text)

        if not segments:
            return []

        packed_segments: list[str] = []
        current_parts: list[str] = []
        current_tokens = 0

        def flush_current() -> None:
            if current_parts:
                packed_segments.append('\n\n'.join(current_parts))

        for segment in segments:
            segment_tokens = self.count_tokens(segment)

            if segment_tokens > chunk_size:
                flush_current()
                current_parts = []
                current_tokens = 0
                packed_segments.extend(
                    self._split_by_tokens(
                        segment,
                        chunk_size=chunk_size,
                        chunk_overlap=chunk_overlap,
                    ),
                )
                continue

            if current_tokens + segment_tokens > chunk_size and current_parts:
                flush_current()
                current_parts = [segment]
                current_tokens = segment_tokens
            else:
                current_parts.append(segment)
                current_tokens += segment_tokens

        flush_current()

        chunks: list[TextChunk] = []
        for index, content in enumerate(packed_segments):
            content = content.strip()
            if not content:
                continue
            chunks.append(
                TextChunk(
                    content=content,
                    token_count=self.count_tokens(content),
                    metadata={'chunk_index': index},
                ),
            )

        return chunks


text_chunker_service = TextChunkerService()
