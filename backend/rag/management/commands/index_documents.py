from django.core.management.base import BaseCommand

from rag.services.indexer import document_indexer_service
from rag.tasks import index_document, index_pending_documents
from sources.models import DriveSyncedFile, GoogleDriveConnection


class Command(BaseCommand):
    help = 'Queue indexing for all pending Google Drive documents.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-all',
            action='store_true',
            help=(
                'Mark every indexed document for re-indexing '
                '(e.g. after chunking changes).'
            ),
        )

    def handle(self, *args, **options):
        if options['force_all']:
            indexed_files = DriveSyncedFile.objects.filter(
                is_deleted=False,
                index_status=DriveSyncedFile.IndexStatus.INDEXED,
            )
            count = indexed_files.count()
            for synced_file in indexed_files.iterator():
                document_indexer_service.mark_file_for_reindexing(synced_file)
                index_document.delay(synced_file.id)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Queued {count} indexed documents for re-indexing.'
                ),
            )
            return

        queued = index_pending_documents()
        self.stdout.write(
            self.style.SUCCESS(f'Queued {queued["queued"]} documents for indexing.'),
        )

        for connection in GoogleDriveConnection.objects.all():
            count = document_indexer_service.enqueue_pending_files_for_connection(
                connection.id
            )
            if count:
                self.stdout.write(
                    f'Connection {connection.id}: queued {count} pending files.',
                )
