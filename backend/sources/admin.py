from django.contrib import admin

from sources.models import (
    DriveSyncedFile,
    GoogleDriveConnection,
    GoogleDriveFolderSelection,
    GoogleDriveOAuthState,
)

admin.site.register(GoogleDriveOAuthState)
admin.site.register(GoogleDriveConnection)
admin.site.register(GoogleDriveFolderSelection)
admin.site.register(DriveSyncedFile)
