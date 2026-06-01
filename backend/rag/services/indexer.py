from __future__ import annotations

import logging

from django.contrib.postgres.search import SearchVector
from django.db import transaction
from django.utils import timezone

from rag.models import DocumentChunk
from rag.services.chunker import text_chunker_service
from rag.services.embeddings import embedding_service
from rag.services.text_extractor import (
    TextExtractionError,
    text_extractor_service,
)
from sources.models import DriveSyncedFile

logger = logging.getLogger(__name__)

BATCH_SIZE = 64


class DocumentIndexerService:
    def index_synced_file(self, synced_file_id: int) -> dict[str, int | str]:
        synced_file = (
            DriveSyncedFile.objects.select_related('connection')
            .filter(pk=synced_file_id, is_deleted=False)
            .first()
        )
        if synced_file is None:
            return {'status': 'missing', 'chunks': 0}

        if not text_extractor_service.is_indexable_mime_type(synced_file.mime_type):
            synced_file.index_status = DriveSyncedFile.IndexStatus.SKIPPED
            synced_file.index_error = 'File type is not supported for indexing.'
            synced_file.chunk_count = 0
            synced_file.save(
                update_fields=[
                    'index_status',
                    'index_error',
                    'chunk_count',
                    'last_seen_at',
                ],
            )
            DocumentChunk.objects.filter(synced_file=synced_file).delete()
            return {'status': 'skipped', 'chunks': 0}

        synced_file.index_status = DriveSyncedFile.IndexStatus.PROCESSING
        synced_file.index_error = ''
        synced_file.save(update_fields=['index_status', 'index_error', 'last_seen_at'])

        try:
            text = text_extractor_service.extract_text_from_synced_file(synced_file)
        except (TextExtractionError, Exception) as exc:
            logger.exception(
                'Text extraction failed for synced file %s', synced_file_id
            )
            synced_file.index_status = DriveSyncedFile.IndexStatus.FAILED
            synced_file.index_error = str(exc)
            synced_file.save(
                update_fields=['index_status', 'index_error', 'last_seen_at'],
            )
            return {'status': 'failed', 'chunks': 0, 'error': str(exc)}

        if not text.strip():
            synced_file.index_status = DriveSyncedFile.IndexStatus.SKIPPED
            synced_file.index_error = 'No extractable text found.'
            synced_file.chunk_count = 0
            synced_file.save(
                update_fields=[
                    'index_status',
                    'index_error',
                    'chunk_count',
                    'last_seen_at',
                ],
            )
            DocumentChunk.objects.filter(synced_file=synced_file).delete()
            return {'status': 'skipped', 'chunks': 0}

        chunks = text_chunker_service.split_text(text)
        if not chunks:
            synced_file.index_status = DriveSyncedFile.IndexStatus.SKIPPED
            synced_file.index_error = 'Document produced no chunks.'
            synced_file.chunk_count = 0
            synced_file.save(
                update_fields=[
                    'index_status',
                    'index_error',
                    'chunk_count',
                    'last_seen_at',
                ],
            )
            DocumentChunk.objects.filter(synced_file=synced_file).delete()
            return {'status': 'skipped', 'chunks': 0}

        with transaction.atomic():
            DocumentChunk.objects.filter(synced_file=synced_file).delete()

            chunk_rows: list[DocumentChunk] = []
            for index, chunk in enumerate(chunks):
                chunk_rows.append(
                    DocumentChunk(
                        synced_file=synced_file,
                        chunk_index=index,
                        content=chunk.content,
                        token_count=chunk.token_count,
                        metadata=chunk.metadata,
                        embedding=[0.0] * 1536,
                    ),
                )

            created_chunks = DocumentChunk.objects.bulk_create(chunk_rows)

            for batch_start in range(0, len(created_chunks), BATCH_SIZE):
                batch = created_chunks[batch_start : batch_start + BATCH_SIZE]
                embeddings = embedding_service.embed_texts(
                    [chunk.content for chunk in batch]
                )
                for chunk, embedding in zip(batch, embeddings, strict=True):
                    chunk.embedding = embedding
                DocumentChunk.objects.bulk_update(batch, ['embedding'])

            DocumentChunk.objects.filter(synced_file=synced_file).update(
                search_vector=SearchVector('content', config='english'),
            )

            synced_file.index_status = DriveSyncedFile.IndexStatus.INDEXED
            synced_file.index_error = ''
            synced_file.chunk_count = len(created_chunks)
            synced_file.indexed_at = timezone.now()
            synced_file.indexed_modified_time = synced_file.modified_time
            synced_file.save(
                update_fields=[
                    'index_status',
                    'index_error',
                    'chunk_count',
                    'indexed_at',
                    'indexed_modified_time',
                    'last_seen_at',
                ],
            )

        return {'status': 'indexed', 'chunks': len(created_chunks)}

    @staticmethod
    def mark_file_for_reindexing(synced_file: DriveSyncedFile) -> None:
        synced_file.index_status = DriveSyncedFile.IndexStatus.PENDING
        synced_file.index_error = ''
        synced_file.save(update_fields=['index_status', 'index_error', 'last_seen_at'])

    def enqueue_pending_files_for_connection(self, connection_id: int) -> int:
        pending_ids = list(
            DriveSyncedFile.objects.filter(
                connection_id=connection_id,
                is_deleted=False,
                index_status__in=[
                    DriveSyncedFile.IndexStatus.PENDING,
                    DriveSyncedFile.IndexStatus.FAILED,
                ],
            ).values_list('id', flat=True),
        )

        from rag.tasks import index_document

        for file_id in pending_ids:
            index_document.delay(file_id)

        return len(pending_ids)


document_indexer_service = DocumentIndexerService()
