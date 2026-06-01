from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import F
from pgvector.django import CosineDistance

from rag.models import DocumentChunk
from rag.services.embeddings import embedding_service
from rag.services.query_parser import query_parser_service


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: int
    content: str
    document_id: int
    document_name: str
    score: float


class ChunkRetrieverService:
    @staticmethod
    def _reciprocal_rank_fusion(
        ranked_lists: list[list[int]],
        *,
        k: int = 60,
    ) -> dict[int, float]:
        scores: dict[int, float] = {}
        for ranked_ids in ranked_lists:
            for rank, chunk_id in enumerate(ranked_ids, start=1):
                scores[chunk_id] = scores.get(chunk_id, 0.0) + (1.0 / (k + rank))
        return scores

    def _keyword_ranked_lists(self, base_qs, query: str, limit: int) -> list[list[int]]:
        ranked_lists: list[list[int]] = []
        phrase_terms = query_parser_service.extract_search_terms(query)

        for term in phrase_terms:
            search_query = SearchQuery(term, search_type='phrase', config='english')
            chunk_ids = list(
                base_qs.filter(search_vector=search_query)
                .order_by('chunk_index')
                .values_list('id', flat=True)[:limit],
            )
            if chunk_ids:
                ranked_lists.append(chunk_ids)

        plain_terms = query_parser_service.extract_plain_search_terms(query)
        if phrase_terms:
            # Specific record IDs — skip broad plain terms that dilute phrase matches.
            plain_terms = []
        if plain_terms:
            search_query = SearchQuery(
                ' | '.join(plain_terms), search_type='plain', config='english'
            )
            chunk_ids = list(
                base_qs.annotate(rank=SearchRank(F('search_vector'), search_query))
                .filter(search_vector=search_query)
                .order_by('-rank')
                .values_list('id', flat=True)[:limit],
            )
            if chunk_ids:
                ranked_lists.append(chunk_ids)

        return ranked_lists

    def _rerank_chunk_ids(
        self,
        chunk_ids: list[int],
        fused_scores: dict[int, float],
        chunks_by_id: dict[int, DocumentChunk],
        query: str,
        search_terms: list[str],
    ) -> list[int]:
        def final_score(chunk_id: int) -> float:
            chunk = chunks_by_id.get(chunk_id)
            if chunk is None:
                return -1.0
            base = fused_scores.get(chunk_id, 0.0)
            overlap = (
                query_parser_service.query_term_overlap_score(
                    chunk.content, search_terms
                )
                * 0.05
            )
            context = (
                query_parser_service.contextual_match_score(
                    chunk.content, search_terms, query
                )
                * 0.03
            )
            exact = (
                0.15
                if query_parser_service.chunk_matches_terms(chunk.content, search_terms)
                else 0.0
            )
            return base + overlap + context + exact

        return sorted(chunk_ids, key=final_score, reverse=True)

    def _filter_redundant_chunks(
        self,
        chunk_ids: list[int],
        chunks_by_id: dict[int, DocumentChunk],
        search_terms: list[str],
    ) -> list[int]:
        """Drop partial chunks superseded by a better chunk from the same document."""
        if not search_terms:
            return chunk_ids

        kept: list[int] = []
        for chunk_id in chunk_ids:
            chunk = chunks_by_id.get(chunk_id)
            if chunk is None:
                continue

            if not query_parser_service.chunk_matches_terms(
                chunk.content, search_terms
            ):
                kept.append(chunk_id)
                continue

            chunk_score = query_parser_service.contextual_match_score(
                chunk.content, search_terms, ''
            )
            superseded = False
            for other_id in chunk_ids:
                if other_id == chunk_id:
                    continue
                other = chunks_by_id.get(other_id)
                if other is None or other.synced_file_id != chunk.synced_file_id:
                    continue
                if not query_parser_service.chunk_matches_terms(
                    other.content, search_terms
                ):
                    continue
                if (
                    query_parser_service.contextual_match_score(
                        other.content, search_terms, ''
                    )
                    > chunk_score
                ):
                    superseded = True
                    break

            if not superseded:
                kept.append(chunk_id)

        return kept

    def select_citation_chunks(
        self,
        chunks: list[RetrievedChunk],
        query: str,
    ) -> list[RetrievedChunk]:
        if not chunks:
            return []

        max_citations = settings.RAG_MAX_CITATIONS
        search_terms = query_parser_service.extract_search_terms(query)

        if search_terms:
            matched = [
                chunk
                for chunk in chunks
                if query_parser_service.chunk_matches_terms(chunk.content, search_terms)
            ]
            if matched:
                return matched[:max_citations]

        if len(chunks) == 1:
            return chunks[:1]

        top_score = chunks[0].score
        second_score = chunks[1].score
        if second_score > 0 and top_score >= second_score * 1.15:
            return chunks[:1]

        return []

    def retrieve_relevant_chunks(self, user, query: str) -> list[RetrievedChunk]:
        query = query.strip()
        if not query:
            return []

        search_terms = query_parser_service.extract_search_terms(query)
        query_embedding = embedding_service.embed_query(query)
        base_qs = DocumentChunk.objects.select_related('synced_file').filter(
            synced_file__connection__user=user,
            synced_file__is_deleted=False,
            synced_file__index_status='indexed',
        )

        vector_limit = settings.RAG_RETRIEVAL_CANDIDATES
        vector_ids = list(
            base_qs.annotate(distance=CosineDistance('embedding', query_embedding))
            .order_by('distance')
            .values_list('id', flat=True)[:vector_limit],
        )

        keyword_lists = self._keyword_ranked_lists(base_qs, query, vector_limit)
        ranked_lists = [vector_ids, *keyword_lists]

        if not any(ranked_lists):
            return []

        fused_scores = self._reciprocal_rank_fusion(ranked_lists)
        candidate_ids = sorted(
            fused_scores,
            key=fused_scores.get,
            reverse=True,
        )[: max(settings.RAG_TOP_K * 2, settings.RAG_RETRIEVAL_CANDIDATES)]

        chunks_by_id = {
            chunk.id: chunk for chunk in base_qs.filter(id__in=candidate_ids)
        }

        reranked_ids = self._rerank_chunk_ids(
            candidate_ids,
            fused_scores,
            chunks_by_id,
            query,
            search_terms,
        )
        reranked_ids = self._filter_redundant_chunks(
            reranked_ids, chunks_by_id, search_terms
        )
        top_chunk_ids = reranked_ids[: settings.RAG_TOP_K]

        results: list[RetrievedChunk] = []
        for chunk_id in top_chunk_ids:
            chunk = chunks_by_id.get(chunk_id)
            if chunk is None:
                continue
            results.append(
                RetrievedChunk(
                    chunk_id=chunk.id,
                    content=chunk.content,
                    document_id=chunk.synced_file_id,
                    document_name=chunk.synced_file.name,
                    score=fused_scores[chunk_id],
                ),
            )
        return results


chunk_retriever_service = ChunkRetrieverService()
