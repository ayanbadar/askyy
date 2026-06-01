from django.urls import path

from sources.views import (
    GoogleDriveCallbackView,
    GoogleDriveConnectView,
    GoogleDriveDisconnectView,
    GoogleDriveFolderListView,
    GoogleDriveFolderSelectionView,
    GoogleDriveStatusView,
    GoogleDriveSyncView,
    SyncedDocumentContentView,
    SyncedDocumentsListView,
)

app_name = 'sources'

urlpatterns = [
    path(
        'google/status/',
        GoogleDriveStatusView.as_view(),
        name='google-status',
    ),
    path(
        'google/connect/',
        GoogleDriveConnectView.as_view(),
        name='google-connect',
    ),
    path(
        'google/callback/',
        GoogleDriveCallbackView.as_view(),
        name='google-callback',
    ),
    path(
        'google/disconnect/',
        GoogleDriveDisconnectView.as_view(),
        name='google-disconnect',
    ),
    path(
        'google/folders/',
        GoogleDriveFolderListView.as_view(),
        name='google-folders',
    ),
    path(
        'google/folders/selection/',
        GoogleDriveFolderSelectionView.as_view(),
        name='google-folder-selection',
    ),
    path(
        'google/sync/',
        GoogleDriveSyncView.as_view(),
        name='google-sync',
    ),
    path(
        'documents/',
        SyncedDocumentsListView.as_view(),
        name='documents-list',
    ),
    path(
        'documents/<int:document_id>/content/',
        SyncedDocumentContentView.as_view(),
        name='document-content',
    ),
]
