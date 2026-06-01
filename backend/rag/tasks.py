from celery import shared_task

from rag.services.indexer import document_indexer_service


@shared_task(name='rag.tasks.index_document', bind=True, max_retries=2)
def index_document(self, synced_file_id: int) -> dict:
    try:
        return document_indexer_service.index_synced_file(synced_file_id)
    except Exception as exc:
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=30) from exc
        raise


@shared_task(name='rag.tasks.index_pending_documents')
def index_pending_documents() -> dict[str, int]:
    from sources.models import DriveSyncedFile

    pending_ids = list(
        DriveSyncedFile.objects.filter(
            is_deleted=False,
            index_status__in=[
                DriveSyncedFile.IndexStatus.PENDING,
                DriveSyncedFile.IndexStatus.FAILED,
            ],
        ).values_list('id', flat=True)[:100],
    )

    for file_id in pending_ids:
        index_document.delay(file_id)

    return {'queued': len(pending_ids)}
