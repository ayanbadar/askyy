from __future__ import annotations

from django.conf import settings
from openai import OpenAI


class EmbeddingService:
    def __init__(self) -> None:
        self._client: OpenAI | None = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        client = self._get_client()
        response = client.embeddings.create(
            model=settings.RAG_EMBEDDING_MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]

    def embed_query(self, query: str) -> list[float]:
        embeddings = self.embed_texts([query])
        return embeddings[0]


embedding_service = EmbeddingService()
