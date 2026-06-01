from __future__ import annotations

from django.test import SimpleTestCase

from rag.services.chunker import text_chunker_service

CONTRACT_BLOCK = """\
Contract #1
Company: SkyBridge Airlines (Mock Data)
Contract ID: CTR-2026-0001
Contract Type: Ground Handling Services Agreement
Status: Active
"""

INVOICE_BLOCK = """\
Mock Airline Monthly Invoice
Airline Company: SkyBridge Airlines (Mock Data)
Invoice Number: INV-2026-0052
Billing Month: 2026-04
Description: Monthly aviation services and operational charges
Amount Due: USD 12,124.00
Status: Paid
"""


class ChunkerTests(SimpleTestCase):
    def test_invoice_record_is_not_split(self):
        text = '\n\n'.join(
            [
                INVOICE_BLOCK,
                INVOICE_BLOCK.replace('0052', '0053').replace('12,124', '12,261'),
            ]
        )
        chunks = text_chunker_service.split_text(text)
        matching = [chunk for chunk in chunks if 'INV-2026-0053' in chunk.content]
        self.assertTrue(matching)
        self.assertIn('12,261', matching[0].content)

    def test_contract_records_are_split_by_boundary(self):
        text = '\n\n'.join(
            [
                CONTRACT_BLOCK,
                CONTRACT_BLOCK.replace('#1', '#2').replace('0001', '0002'),
            ]
        )
        segments = text_chunker_service._split_into_segments(text)
        self.assertEqual(len(segments), 2)
        self.assertIn('CTR-2026-0001', segments[0])
        self.assertIn('CTR-2026-0002', segments[1])
