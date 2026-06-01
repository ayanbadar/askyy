from rest_framework import serializers


class GoogleDriveConnectResponseSerializer(serializers.Serializer):
    authorization_url = serializers.URLField()


class GoogleDriveFolderSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()


class GoogleDriveFolderListResponseSerializer(serializers.Serializer):
    folders = GoogleDriveFolderSerializer(many=True)
    parent_id = serializers.CharField()


class GoogleDriveSelectedFolderSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    selected_at = serializers.DateTimeField()


class GoogleDriveFolderSelectionResponseSerializer(serializers.Serializer):
    folders = GoogleDriveSelectedFolderSerializer(many=True)


class GoogleDriveFolderSelectionUpdateSerializer(serializers.Serializer):
    folders = GoogleDriveFolderSerializer(many=True)


class GoogleDriveStatusSerializer(serializers.Serializer):
    connected = serializers.BooleanField()
    configured = serializers.BooleanField()
    google_email = serializers.EmailField(required=False, allow_blank=True)
    connected_at = serializers.DateTimeField(required=False, allow_null=True)
    selected_folder_count = serializers.IntegerField()
    synced_file_count = serializers.IntegerField()
    active_file_count = serializers.IntegerField()
    last_synced_at = serializers.DateTimeField(required=False, allow_null=True)
    last_sync_status = serializers.CharField(required=False, allow_blank=True)
    last_sync_error = serializers.CharField(required=False, allow_blank=True)
    last_sync_summary = serializers.DictField(required=False)


class SyncedDocumentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    drive_file_id = serializers.CharField()
    name = serializers.CharField()
    mime_type = serializers.CharField()
    modified_time = serializers.DateTimeField()
    folder_name = serializers.CharField(required=False, allow_null=True)
    source = serializers.CharField()
    first_seen_at = serializers.DateTimeField()
    is_viewable = serializers.BooleanField()
    index_status = serializers.CharField()
    index_error = serializers.CharField(required=False, allow_blank=True)
    chunk_count = serializers.IntegerField()


class SyncedDocumentListResponseSerializer(serializers.Serializer):
    documents = SyncedDocumentSerializer(many=True)
    total = serializers.IntegerField()
