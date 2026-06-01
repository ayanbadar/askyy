from __future__ import annotations

from django.test import SimpleTestCase

from chat.services.retriever import RetrievedChunk, chunk_retriever_service
from rag.services.query_parser import query_parser_service


class QueryParserTests(SimpleTestCase):
    def test_extracts_invoice_id(self):
        query = 'what is the amount due for invoice number: INV-2026-0053'
        self.assertEqual(
            query_parser_service.extract_search_terms(query), ['INV-2026-0053']
        )

    def test_extracts_email_reference(self):
        query = 'show me internal email INT-0042'
        self.assertIn('INT-0042', query_parser_service.extract_search_terms(query))

    def test_extracts_contract_number(self):
        query = 'Explain Contract #73'
        self.assertEqual(
            query_parser_service.extract_search_terms(query), ['Contract #73']
        )

    def test_extracts_contract_id(self):
        query = 'details for CTR-2026-0073'
        self.assertEqual(
            query_parser_service.extract_search_terms(query), ['CTR-2026-0073']
        )

    def test_extracts_contract_without_hash(self):
        query = 'summarize contract 73'
        self.assertEqual(
            query_parser_service.extract_search_terms(query), ['Contract #73']
        )

    def test_plain_terms_skip_stop_words(self):
        terms = query_parser_service.extract_plain_search_terms(
            'Tell me about my recent meeting,',
        )
        self.assertIn('meeting', terms)
        self.assertNotIn('tell', terms)
        self.assertNotIn('recent', terms)

    def test_contextual_match_prefers_complete_invoice(self):
        partial = 'Invoice Number: INV-2026-0053'
        complete = (
            'Invoice Number: INV-2026-0053\nAmount Due: USD 12,261.00\nStatus: Paid'
        )
        terms = ['INV-2026-0053']
        query = 'amount due for invoice INV-2026-0053'
        self.assertGreater(
            query_parser_service.contextual_match_score(complete, terms, query),
            query_parser_service.contextual_match_score(partial, terms, query),
        )

    def test_chunk_matches_terms(self):
        self.assertTrue(
            query_parser_service.chunk_matches_terms(
                'Invoice INV-2026-0053',
                ['INV-2026-0053'],
            ),
        )


class CitationSelectionTests(SimpleTestCase):
    def _chunk(self, chunk_id: int, content: str, score: float) -> RetrievedChunk:
        return RetrievedChunk(
            chunk_id=chunk_id,
            content=content,
            document_id=1,
            document_name='test.pdf',
            score=score,
        )

    def test_citations_match_specific_id(self):
        chunks = [
            self._chunk(
                1, 'Invoice Number: INV-2026-0053\nAmount Due: USD 12,261.00', 0.02
            ),
            self._chunk(2, 'Unrelated invoice content', 0.019),
        ]
        citations = chunk_retriever_service.select_citation_chunks(
            chunks,
            'amount due for invoice INV-2026-0053',
        )
        self.assertEqual(len(citations), 1)
        self.assertEqual(citations[0].chunk_id, 1)

    def test_citations_match_contract_number(self):
        chunks = [
            self._chunk(
                1,
                'Contract #73\nContract ID: CTR-2026-0073\nStatus: Active',
                0.02,
            ),
            self._chunk(
                2,
                'Contract #70\nContract ID: CTR-2026-0070\nStatus: Active',
                0.019,
            ),
        ]
        citations = chunk_retriever_service.select_citation_chunks(
            chunks, 'Explain Contract #73'
        )
        self.assertEqual(len(citations), 1)
        self.assertEqual(citations[0].chunk_id, 1)

    def test_no_citations_for_ambiguous_broad_query(self):
        chunks = [
            self._chunk(1, 'Meeting Notes #1', 0.016),
            self._chunk(2, 'Meeting Notes #2', 0.015),
        ]
        citations = chunk_retriever_service.select_citation_chunks(
            chunks,
            'Tell me about my recent meeting,',
        )
        self.assertEqual(citations, [])
