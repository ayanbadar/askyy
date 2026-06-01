import os
import secrets
from datetime import UTC, datetime, timedelta
from io import BytesIO
from typing import Any
from urllib.parse import quote

from django.conf import settings
from django.utils import timezone
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

from sources.models import (
    DriveSyncedFile,
    GoogleDriveConnection,
    GoogleDriveFolderSelection,
    GoogleDriveOAuthState,
)
from sources.services.token_crypto import decrypt_token, encrypt_token

# Sign-In may already grant openid/email/profile on the same OAuth client.
# Incremental Drive auth can return those extra scopes; relax strict matching.
os.environ.setdefault('OAUTHLIB_RELAX_TOKEN_SCOPE', '1')
if settings.DEBUG and settings.GOOGLE_DRIVE_REDIRECT_URI.startswith('http://'):
    os.environ.setdefault('OAUTHLIB_INSECURE_TRANSPORT', '1')

try:
    from rag.services.indexer import document_indexer_service
except ImportError:
    document_indexer_service = None

DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
# Request only Drive during connect. Re-requesting openid/email/profile conflicts
# with the same OAuth client used for Google Sign-In on the frontend.
GOOGLE_DRIVE_CONNECT_SCOPES = [DRIVE_SCOPE]
GOOGLE_DRIVE_OAUTH_SCOPES = GOOGLE_DRIVE_CONNECT_SCOPES
FOLDER_MIME = 'application/vnd.google-apps.folder'
MY_DRIVE_ROOT = 'root'
GOOGLE_APP_EXPORT: dict[str, dict[str, str]] = {
    'application/vnd.google-apps.document': {
        'view': 'application/pdf',
        'download': (
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ),
        'download_ext': '.docx',
    },
    'application/vnd.google-apps.spreadsheet': {
        'view': 'application/pdf',
        'download': (
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ),
        'download_ext': '.xlsx',
    },
    'application/vnd.google-apps.presentation': {
        'view': 'application/pdf',
        'download': (
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ),
        'download_ext': '.pptx',
    },
    'application/vnd.google-apps.drawing': {
        'view': 'image/png',
        'download': 'image/png',
        'download_ext': '.png',
    },
}
VIEWABLE_MIME_TYPES = {
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/html',
}


class GoogleDriveError(Exception):
    """Raised when Google Drive operations fail."""


class GoogleDriveNotConfiguredError(GoogleDriveError):
    """Raised when Google Drive OAuth is not configured."""


def is_google_drive_configured() -> bool:
    return bool(
        settings.GOOGLE_OAUTH_CLIENT_ID
        and settings.GOOGLE_OAUTH_CLIENT_SECRET
        and settings.GOOGLE_DRIVE_REDIRECT_URI
        and settings.GOOGLE_TOKEN_ENCRYPTION_KEY
    )


def _require_configured() -> None:
    if not is_google_drive_configured():
        raise GoogleDriveNotConfiguredError(
            'Google Drive integration is not configured on the server.',
        )


def _client_config() -> dict[str, Any]:
    return {
        'web': {
            'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'redirect_uris': [settings.GOOGLE_DRIVE_REDIRECT_URI],
        },
    }


def cleanup_expired_oauth_states() -> None:
    cutoff = timezone.now() - timedelta(minutes=15)
    GoogleDriveOAuthState.objects.filter(created_at__lt=cutoff).delete()


def _create_oauth_flow():
    from google_auth_oauthlib.flow import Flow

    return Flow.from_client_config(
        _client_config(),
        scopes=GOOGLE_DRIVE_CONNECT_SCOPES,
        redirect_uri=settings.GOOGLE_DRIVE_REDIRECT_URI,
        autogenerate_code_verifier=False,
    )


def create_authorization_url(user) -> str:
    _require_configured()
    cleanup_expired_oauth_states()

    state = secrets.token_urlsafe(32)
    GoogleDriveOAuthState.objects.create(user=user, state=state)

    flow = _create_oauth_flow()
    authorization_url, _state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='select_account consent',
        state=state,
    )
    return authorization_url


def complete_oauth_callback(
    code: str,
    state: str,
    *,
    authorization_response: str | None = None,
) -> GoogleDriveConnection:
    _require_configured()

    oauth_state = (
        GoogleDriveOAuthState.objects.select_related('user').filter(state=state).first()
    )
    if oauth_state is None:
        raise GoogleDriveError('Invalid or expired OAuth state.')

    user = oauth_state.user

    flow = _create_oauth_flow()
    try:
        if authorization_response:
            flow.fetch_token(authorization_response=authorization_response)
        else:
            flow.fetch_token(code=code)
    except Warning as exc:
        raise GoogleDriveError(
            'Google OAuth scope mismatch. Remove Askyy from '
            'https://myaccount.google.com/permissions and connect again.',
        ) from exc

    credentials = flow.credentials

    granted_scopes = set(credentials.scopes or [])
    if DRIVE_SCOPE not in granted_scopes:
        raise GoogleDriveError(
            'Google did not grant Drive access. Remove Askyy from '
            'https://myaccount.google.com/permissions, connect again, and '
            'approve read-only Google Drive access.',
        )

    if not credentials.refresh_token:
        raise GoogleDriveError(
            'Google did not return a refresh token. Disconnect the app in your '
            'Google Account permissions and try connecting again.',
        )

    oauth_state.delete()

    google_email = _fetch_google_account_email(credentials)

    connection, _created = GoogleDriveConnection.objects.update_or_create(
        user=user,
        defaults={
            'refresh_token_encrypted': encrypt_token(credentials.refresh_token),
            'access_token_encrypted': encrypt_token(credentials.token or ''),
            'token_expiry': credentials.expiry,
            'google_email': google_email,
            'last_sync_status': GoogleDriveConnection.SyncStatus.PENDING,
            'last_sync_error': '',
        },
    )
    return connection


def _fetch_google_account_email(credentials: Credentials) -> str:
    service = build('drive', 'v3', credentials=credentials, cache_discovery=False)
    try:
        about = service.about().get(fields='user').execute()
    except HttpError as exc:
        raise GoogleDriveError('Could not read Google account email.') from exc

    email = about.get('user', {}).get('emailAddress')
    if not email:
        raise GoogleDriveError('Could not read Google account email.')
    return email


def _build_credentials(connection: GoogleDriveConnection) -> Credentials:
    _require_configured()
    credentials = Credentials(
        token=decrypt_token(connection.access_token_encrypted) or None,
        refresh_token=decrypt_token(connection.refresh_token_encrypted),
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
        scopes=GOOGLE_DRIVE_OAUTH_SCOPES,
    )
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        connection.access_token_encrypted = encrypt_token(credentials.token or '')
        connection.token_expiry = credentials.expiry
        connection.save(
            update_fields=['access_token_encrypted', 'token_expiry', 'updated_at'],
        )
    return credentials


def get_drive_service(connection: GoogleDriveConnection):
    credentials = _build_credentials(connection)
    return build('drive', 'v3', credentials=credentials, cache_discovery=False)


def list_my_drive_folders(
    connection: GoogleDriveConnection,
    *,
    parent_id: str = MY_DRIVE_ROOT,
) -> list[dict[str, str]]:
    service = get_drive_service(connection)
    folders: list[dict[str, str]] = []
    page_token = None

    while True:
        try:
            response = (
                service.files()
                .list(
                    q=(
                        f"'{parent_id}' in parents and "
                        f"mimeType='{FOLDER_MIME}' and trashed=false"
                    ),
                    fields='nextPageToken, files(id, name)',
                    orderBy='name',
                    pageSize=100,
                    pageToken=page_token,
                    supportsAllDrives=False,
                    includeItemsFromAllDrives=False,
                )
                .execute()
            )
        except HttpError as exc:
            raise GoogleDriveError('Failed to list Google Drive folders.') from exc

        folders.extend(response.get('files', []))
        page_token = response.get('nextPageToken')
        if not page_token:
            break

    return folders


def _parse_drive_datetime(value: str) -> datetime:
    if value.endswith('Z'):
        value = value.replace('Z', '+00:00')
    parsed = datetime.fromisoformat(value)
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed, UTC)
    return parsed


def _collect_files_recursively(
    service,
    folder_id: str,
) -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    folders_to_visit = [folder_id]

    while folders_to_visit:
        current_folder = folders_to_visit.pop()
        page_token = None

        while True:
            response = (
                service.files()
                .list(
                    q=f"'{current_folder}' in parents and trashed=false",
                    fields=(
                        'nextPageToken, files('
                        'id, name, mimeType, modifiedTime, parents'
                        ')'
                    ),
                    pageSize=100,
                    pageToken=page_token,
                    supportsAllDrives=False,
                    includeItemsFromAllDrives=False,
                )
                .execute()
            )

            for item in response.get('files', []):
                if item.get('mimeType') == FOLDER_MIME:
                    folders_to_visit.append(item['id'])
                else:
                    collected.append(item)

            page_token = response.get('nextPageToken')
            if not page_token:
                break

    return collected


def sync_connection(connection: GoogleDriveConnection) -> dict[str, int]:
    selections = list(connection.folder_selections.all())
    if not selections:
        connection.last_sync_status = GoogleDriveConnection.SyncStatus.SUCCESS
        connection.last_synced_at = timezone.now()
        connection.last_sync_error = ''
        connection.last_sync_summary = {'added': 0, 'updated': 0, 'deleted': 0}
        connection.save(
            update_fields=[
                'last_sync_status',
                'last_synced_at',
                'last_sync_error',
                'last_sync_summary',
                'updated_at',
            ],
        )
        return connection.last_sync_summary

    connection.last_sync_status = GoogleDriveConnection.SyncStatus.SYNCING
    connection.last_sync_error = ''
    connection.save(update_fields=['last_sync_status', 'last_sync_error', 'updated_at'])

    service = get_drive_service(connection)
    seen_file_ids: set[str] = set()
    summary = {'added': 0, 'updated': 0, 'deleted': 0}
    files_to_index: list[int] = []

    for selection in selections:
        drive_files = _collect_files_recursively(service, selection.drive_folder_id)
        for drive_file in drive_files:
            file_id = drive_file['id']
            seen_file_ids.add(file_id)
            modified_time = _parse_drive_datetime(drive_file['modifiedTime'])

            existing = DriveSyncedFile.objects.filter(
                connection=connection,
                drive_file_id=file_id,
            ).first()

            if existing is None:
                new_file = DriveSyncedFile.objects.create(
                    connection=connection,
                    folder_selection=selection,
                    drive_file_id=file_id,
                    name=drive_file.get('name', 'Untitled'),
                    mime_type=drive_file.get('mimeType', ''),
                    modified_time=modified_time,
                    is_deleted=False,
                )
                summary['added'] += 1
                files_to_index.append(new_file.id)
                continue

            changed = False
            if existing.is_deleted:
                existing.is_deleted = False
                summary['added'] += 1
                changed = True
            elif existing.modified_time != modified_time:
                summary['updated'] += 1
                changed = True
            elif existing.name != drive_file.get('name', existing.name):
                summary['updated'] += 1
                changed = True

            if changed:
                existing.name = drive_file.get('name', existing.name)
                existing.mime_type = drive_file.get('mimeType', existing.mime_type)
                existing.modified_time = modified_time
                existing.folder_selection = selection
                if document_indexer_service is not None:
                    document_indexer_service.mark_file_for_reindexing(existing)
                existing.save()
                files_to_index.append(existing.id)

    stale_files = DriveSyncedFile.objects.filter(
        connection=connection,
        is_deleted=False,
    ).exclude(drive_file_id__in=seen_file_ids)

    deleted_count = stale_files.count()
    if deleted_count:
        stale_files.update(is_deleted=True)
        summary['deleted'] = deleted_count

    connection.last_sync_status = GoogleDriveConnection.SyncStatus.SUCCESS
    connection.last_synced_at = timezone.now()
    connection.last_sync_error = ''
    connection.last_sync_summary = summary
    connection.save(
        update_fields=[
            'last_sync_status',
            'last_synced_at',
            'last_sync_error',
            'last_sync_summary',
            'updated_at',
        ],
    )

    if files_to_index and document_indexer_service is not None:
        from rag.tasks import index_document

        for file_id in files_to_index:
            index_document.delay(file_id)

    return summary


def disconnect_google_drive(connection: GoogleDriveConnection) -> None:
    try:
        credentials = _build_credentials(connection)
        if credentials.token:
            import requests

            requests.post(
                'https://oauth2.googleapis.com/revoke',
                params={'token': credentials.token},
                timeout=10,
            )
    except (GoogleDriveError, HttpError, OSError):
        pass

    connection.delete()


def save_folder_selections(
    connection: GoogleDriveConnection,
    folders: list[dict[str, str]],
) -> list[GoogleDriveFolderSelection]:
    connection.folder_selections.all().delete()

    selections = [
        GoogleDriveFolderSelection(
            connection=connection,
            drive_folder_id=folder['id'],
            drive_folder_name=folder['name'],
        )
        for folder in folders
    ]
    return GoogleDriveFolderSelection.objects.bulk_create(selections)


def is_viewable_mime_type(mime_type: str) -> bool:
    if mime_type.startswith('image/'):
        return True
    if mime_type in VIEWABLE_MIME_TYPES:
        return True
    return mime_type in GOOGLE_APP_EXPORT


def _download_drive_request(request) -> bytes:
    buffer = BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buffer.getvalue()


def _ensure_filename_extension(filename: str, extension: str) -> str:
    if filename.lower().endswith(extension.lower()):
        return filename
    return f'{filename}{extension}'


def _build_content_disposition(filename: str, disposition: str) -> str:
    ascii_fallback = filename.encode('ascii', 'ignore').decode() or 'document'
    encoded = quote(filename)
    return f'{disposition}; filename="{ascii_fallback}"; filename*=UTF-8\'\'{encoded}'


def get_user_synced_file(user, document_id: int) -> DriveSyncedFile:
    synced_file = (
        DriveSyncedFile.objects.select_related('connection')
        .filter(
            id=document_id,
            connection__user=user,
            is_deleted=False,
        )
        .first()
    )
    if synced_file is None:
        raise GoogleDriveError('Document not found.')
    return synced_file


def fetch_document_content(
    synced_file: DriveSyncedFile,
    *,
    for_download: bool = False,
) -> tuple[bytes, str, str]:
    if synced_file.mime_type == FOLDER_MIME:
        raise GoogleDriveError('Folders cannot be opened or downloaded.')

    service = get_drive_service(synced_file.connection)
    mime_type = synced_file.mime_type

    try:
        if mime_type.startswith('application/vnd.google-apps.'):
            export_config = GOOGLE_APP_EXPORT.get(mime_type)
            if export_config is None:
                raise GoogleDriveError('This Google Drive file type is not supported.')

            export_mime = export_config['download' if for_download else 'view']
            request = service.files().export_media(
                fileId=synced_file.drive_file_id,
                mimeType=export_mime,
            )
            content_type = export_mime
            filename = synced_file.name
            if for_download:
                filename = _ensure_filename_extension(
                    filename,
                    export_config['download_ext'],
                )
            elif export_mime == 'application/pdf':
                filename = _ensure_filename_extension(filename, '.pdf')
        else:
            request = service.files().get_media(fileId=synced_file.drive_file_id)
            content = _download_drive_request(request)
            content_type = mime_type or 'application/octet-stream'
            return content, content_type, synced_file.name

        content = _download_drive_request(request)
    except HttpError as exc:
        raise GoogleDriveError('Failed to fetch document from Google Drive.') from exc

    return content, content_type, filename


def build_document_content_disposition(filename: str, *, for_download: bool) -> str:
    disposition = 'attachment' if for_download else 'inline'
    return _build_content_disposition(filename, disposition)
