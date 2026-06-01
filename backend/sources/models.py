from django.conf import settings
from django.db import models


class GoogleDriveOAuthState(models.Model):
    state = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['created_at'])]

    def __str__(self) -> str:
        return f'OAuth state for {self.user_id}'


class GoogleDriveConnection(models.Model):
    class SyncStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SYNCING = 'syncing', 'Syncing'
        SUCCESS = 'success', 'Success'
        ERROR = 'error', 'Error'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_drive_connection',
    )
    refresh_token_encrypted = models.TextField()
    access_token_encrypted = models.TextField(blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    google_email = models.EmailField()
    connected_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(
        max_length=20,
        choices=SyncStatus.choices,
        default=SyncStatus.PENDING,
    )
    last_sync_error = models.TextField(blank=True)
    last_sync_summary = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:
        return f'Google Drive ({self.google_email})'


class GoogleDriveFolderSelection(models.Model):
    connection = models.ForeignKey(
        GoogleDriveConnection,
        on_delete=models.CASCADE,
        related_name='folder_selections',
    )
    drive_folder_id = models.CharField(max_length=255)
    drive_folder_name = models.CharField(max_length=512)
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['connection', 'drive_folder_id'],
                name='unique_folder_per_connection',
            ),
        ]

    def __str__(self) -> str:
        return self.drive_folder_name


class DriveSyncedFile(models.Model):
    class IndexStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        INDEXED = 'indexed', 'Indexed'
        FAILED = 'failed', 'Failed'
        SKIPPED = 'skipped', 'Skipped'

    connection = models.ForeignKey(
        GoogleDriveConnection,
        on_delete=models.CASCADE,
        related_name='synced_files',
    )
    folder_selection = models.ForeignKey(
        GoogleDriveFolderSelection,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='synced_files',
    )
    drive_file_id = models.CharField(max_length=255)
    name = models.CharField(max_length=512)
    mime_type = models.CharField(max_length=255)
    modified_time = models.DateTimeField()
    is_deleted = models.BooleanField(default=False)
    first_seen_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    index_status = models.CharField(
        max_length=20,
        choices=IndexStatus.choices,
        default=IndexStatus.PENDING,
    )
    index_error = models.TextField(blank=True)
    chunk_count = models.PositiveIntegerField(default=0)
    indexed_at = models.DateTimeField(null=True, blank=True)
    indexed_modified_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['connection', 'drive_file_id'],
                name='unique_drive_file_per_connection',
            ),
        ]
        indexes = [
            models.Index(fields=['connection', 'is_deleted']),
            models.Index(fields=['connection', 'index_status']),
        ]

    def __str__(self) -> str:
        return self.name
