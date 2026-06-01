from __future__ import annotations

from collections.abc import Iterator

from django.conf import settings
from openai import OpenAI

from chat.services.retriever import RetrievedChunk


class ChatLLMService:
    def __init__(self) -> None:
        self._client: OpenAI | None = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    @staticmethod
    def build_system_prompt(*, language: str) -> str:
        language_instruction = (
            'Respond in the same language as the user.'
            if language == 'auto'
            else f'Respond in {language}.'
        )
        return (
            'You are Askyy, a precise knowledge assistant that answers questions '
            "using the user's synced documents.\n\n"
            'Rules:\n'
            '- Use ONLY the provided context to answer.\n'
            '- When the context contains the requested information, extract and '
            'state it clearly — even if it appears in only one passage.\n'
            '- For questions about a specific ID, invoice, email, or meeting, '
            'find the matching record in the context and answer from that record.\n'
            '- For broad questions (e.g. "recent meeting"), summarize the most '
            'relevant records found in the context. If dates are present, prefer '
            'the latest date.\n'
            '- Only say you do not have enough information when the context truly '
            'does not contain an answer.\n'
            '- Be concise, accurate, and helpful.\n'
            '- When citing sources, refer to them by their document name in brackets, '
            'e.g. [Report Q3.pdf].\n'
            f'- {language_instruction}'
        )

    @staticmethod
    def build_context_block(chunks: list[RetrievedChunk]) -> str:
        if not chunks:
            return 'No relevant documents were found.'

        parts: list[str] = []
        for index, chunk in enumerate(chunks, start=1):
            parts.append(
                f'[{index}] Document: {chunk.document_name}\n{chunk.content}',
            )
        return '\n\n---\n\n'.join(parts)

    def build_messages(
        self,
        *,
        user_message: str,
        history: list[dict[str, str]],
        context_chunks: list[RetrievedChunk],
        language: str,
    ) -> list[dict[str, str]]:
        system_content = (
            f'{self.build_system_prompt(language=language)}\n\n'
            f'Context from knowledge base:\n\n'
            f'{self.build_context_block(context_chunks)}'
        )
        messages: list[dict[str, str]] = [{'role': 'system', 'content': system_content}]
        messages.extend(history)
        messages.append({'role': 'user', 'content': user_message})
        return messages

    def stream_chat_completion(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        max_tokens: int | None = None,
    ) -> Iterator[str]:
        from settings_app.platform import get_platform_settings

        platform_settings = get_platform_settings()
        client = self._get_client()
        stream = client.chat.completions.create(
            model=model or platform_settings.default_model,
            messages=messages,
            temperature=0.2,
            max_tokens=max_tokens or platform_settings.max_tokens_per_request,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    def generate_chat_completion(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        max_tokens: int | None = None,
    ) -> str:
        from settings_app.platform import get_platform_settings

        platform_settings = get_platform_settings()
        client = self._get_client()
        response = client.chat.completions.create(
            model=model or platform_settings.default_model,
            messages=messages,
            temperature=0.2,
            max_tokens=max_tokens or platform_settings.max_tokens_per_request,
        )
        return response.choices[0].message.content or ''


chat_llm_service = ChatLLMService()
