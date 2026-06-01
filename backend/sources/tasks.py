from celery import shared_task
from django.db.models import Count

from sources.models import GoogleDriveConnection
from sources.services.google_drive import GoogleDriveError, sync_connection


@shared_task(name='sources.tasks.sync_all_google_drive_connections')
def sync_all_google_drive_connections() -> dict[str, int]:
    connections = (
        GoogleDriveConnection.objects.annotate(
            selected_folder_count=Count('folder_selections'),
        )
        .filter(selected_folder_count__gt=0)
        .exclude(last_sync_status=GoogleDriveConnection.SyncStatus.SYNCING)
    )

    processed = 0
    errors = 0

    for connection in connections:
        try:
            sync_connection(connection)
            processed += 1
        except GoogleDriveError as exc:
            errors += 1
            connection.last_sync_status = GoogleDriveConnection.SyncStatus.ERROR
            connection.last_sync_error = str(exc)
            connection.save(
                update_fields=['last_sync_status', 'last_sync_error', 'updated_at'],
            )

    return {'processed': processed, 'errors': errors}


@shared_task(name='sources.tasks.sync_google_drive_connection')
def sync_google_drive_connection(connection_id: int) -> dict[str, int]:
    connection = GoogleDriveConnection.objects.filter(pk=connection_id).first()
    if connection is None:
        return {'processed': 0, 'errors': 1}

    try:
        summary = sync_connection(connection)
    except GoogleDriveError as exc:
        connection.last_sync_status = GoogleDriveConnection.SyncStatus.ERROR
        connection.last_sync_error = str(exc)
        connection.save(
            update_fields=['last_sync_status', 'last_sync_error', 'updated_at'],
        )
        return {'processed': 0, 'errors': 1}

    return {'processed': 1, 'errors': 0, **summary}
