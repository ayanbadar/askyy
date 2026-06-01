from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from sources.models import GoogleDriveConnection
from sources.serializers import (
    GoogleDriveConnectResponseSerializer,
    GoogleDriveFolderListResponseSerializer,
    GoogleDriveFolderSelectionResponseSerializer,
    GoogleDriveFolderSelectionUpdateSerializer,
    GoogleDriveStatusSerializer,
    SyncedDocumentListResponseSerializer,
)
from sources.services.google_drive import (
    GoogleDriveError,
    GoogleDriveNotConfiguredError,
    build_document_content_disposition,
    complete_oauth_callback,
    create_authorization_url,
    disconnect_google_drive,
    fetch_document_content,
    get_user_synced_file,
    is_google_drive_configured,
    is_viewable_mime_type,
    list_my_drive_folders,
    save_folder_selections,
    sync_connection,
)


def _build_status_payload(user) -> dict:
    configured = is_google_drive_configured()
    connection = (
        GoogleDriveConnection.objects.filter(user=user)
        .prefetch_related('folder_selections')
        .first()
    )

    if connection is None:
        return {
            'connected': False,
            'configured': configured,
            'google_email': '',
            'connected_at': None,
            'selected_folder_count': 0,
            'synced_file_count': 0,
            'active_file_count': 0,
            'last_synced_at': None,
            'last_sync_status': '',
            'last_sync_error': '',
            'last_sync_summary': {},
        }

    synced_files = connection.synced_files.all()
    return {
        'connected': True,
        'configured': configured,
        'google_email': connection.google_email,
        'connected_at': connection.connected_at,
        'selected_folder_count': connection.folder_selections.count(),
        'synced_file_count': synced_files.count(),
        'active_file_count': synced_files.filter(is_deleted=False).count(),
        'last_synced_at': connection.last_synced_at,
        'last_sync_status': connection.last_sync_status,
        'last_sync_error': connection.last_sync_error,
        'last_sync_summary': connection.last_sync_summary or {},
    }


class GoogleDriveStatusView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: GoogleDriveStatusSerializer}, tags=['Sources'])
    def get(self, request: Request) -> Response:
        return Response(_build_status_payload(request.user))


class GoogleDriveConnectView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: GoogleDriveConnectResponseSerializer}, tags=['Sources']
    )
    def get(self, request: Request) -> Response:
        try:
            authorization_url = create_authorization_url(request.user)
        except GoogleDriveNotConfiguredError as exc:
            return Response(
                {'message': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response({'authorization_url': authorization_url})


class GoogleDriveCallbackView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(exclude=True)
    def get(self, request: Request) -> HttpResponseRedirect:
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        error = request.query_params.get('error')
        if error:
            return HttpResponseRedirect(
                f'{frontend_url}/source?google_drive=error&reason={error}',
            )

        code = request.query_params.get('code')
        state = request.query_params.get('state')
        if not code or not state:
            return HttpResponseRedirect(
                f'{frontend_url}/source?google_drive=error&reason=missing_code',
            )

        try:
            complete_oauth_callback(
                code,
                state,
                authorization_response=request.build_absolute_uri(),
            )
        except GoogleDriveError:
            return HttpResponseRedirect(
                f'{frontend_url}/source?google_drive=error&reason=callback_failed',
            )

        return HttpResponseRedirect(f'{frontend_url}/source?google_drive=connected')


class GoogleDriveDisconnectView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(tags=['Sources'])
    def post(self, request: Request) -> Response:
        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        if connection is None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        disconnect_google_drive(connection)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoogleDriveFolderListView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: GoogleDriveFolderListResponseSerializer}, tags=['Sources']
    )
    def get(self, request: Request) -> Response:
        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        if connection is None:
            return Response(
                {'message': 'Google Drive is not connected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parent_id = request.query_params.get('parent_id', 'root')
        try:
            folders = list_my_drive_folders(connection, parent_id=parent_id)
        except GoogleDriveError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'folders': folders, 'parent_id': parent_id})


class GoogleDriveFolderSelectionView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: GoogleDriveFolderSelectionResponseSerializer},
        tags=['Sources'],
    )
    def get(self, request: Request) -> Response:
        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        if connection is None:
            return Response({'folders': []})

        folders = [
            {
                'id': selection.drive_folder_id,
                'name': selection.drive_folder_name,
                'selected_at': selection.selected_at,
            }
            for selection in connection.folder_selections.order_by('drive_folder_name')
        ]
        return Response({'folders': folders})

    @extend_schema(
        request=GoogleDriveFolderSelectionUpdateSerializer,
        responses={200: GoogleDriveFolderSelectionResponseSerializer},
        tags=['Sources'],
    )
    def put(self, request: Request) -> Response:
        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        if connection is None:
            return Response(
                {'message': 'Google Drive is not connected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = GoogleDriveFolderSelectionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        folders = serializer.validated_data['folders']

        selections = save_folder_selections(connection, folders)

        try:
            sync_connection(connection)
        except GoogleDriveError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'folders': [
                    {
                        'id': selection.drive_folder_id,
                        'name': selection.drive_folder_name,
                        'selected_at': selection.selected_at,
                    }
                    for selection in selections
                ],
            },
        )


class GoogleDriveSyncView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(tags=['Sources'])
    def post(self, request: Request) -> Response:
        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        if connection is None:
            return Response(
                {'message': 'Google Drive is not connected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            sync_connection(connection)
        except GoogleDriveError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Sync completed.'})


class SyncedDocumentsListView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: SyncedDocumentListResponseSerializer},
        tags=['Sources'],
    )
    def get(self, request: Request) -> Response:
        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        if connection is None:
            return Response({'documents': [], 'total': 0})

        queryset = (
            connection.synced_files.filter(is_deleted=False)
            .select_related('folder_selection')
            .order_by('-modified_time')
        )

        search = request.query_params.get('q', '').strip()
        if search:
            queryset = queryset.filter(name__icontains=search)

        documents = [
            {
                'id': synced_file.id,
                'drive_file_id': synced_file.drive_file_id,
                'name': synced_file.name,
                'mime_type': synced_file.mime_type,
                'modified_time': synced_file.modified_time,
                'folder_name': (
                    synced_file.folder_selection.drive_folder_name
                    if synced_file.folder_selection
                    else None
                ),
                'source': 'google_drive',
                'first_seen_at': synced_file.first_seen_at,
                'is_viewable': is_viewable_mime_type(synced_file.mime_type),
                'index_status': synced_file.index_status,
                'index_error': synced_file.index_error,
                'chunk_count': synced_file.chunk_count,
            }
            for synced_file in queryset
        ]
        return Response({'documents': documents, 'total': len(documents)})


class SyncedDocumentContentView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(exclude=True)
    def get(self, request: Request, document_id: int) -> HttpResponse | Response:
        try:
            synced_file = get_user_synced_file(request.user, document_id)
        except GoogleDriveError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_404_NOT_FOUND)

        disposition = request.query_params.get('disposition', 'inline')
        for_download = disposition == 'attachment'

        try:
            content, content_type, filename = fetch_document_content(
                synced_file,
                for_download=for_download,
            )
        except GoogleDriveError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content, content_type=content_type)
        response['Content-Disposition'] = build_document_content_disposition(
            filename,
            for_download=for_download,
        )
        return response
