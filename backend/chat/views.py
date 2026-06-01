import json

from django.conf import settings
from django.db.models import Count
from django.http import StreamingHttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Conversation, Message
from chat.serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    MessageSerializer,
    SendMessageSerializer,
)
from chat.services.chat_engine import chat_engine_service
from settings_app.platform import get_platform_settings
from settings_app.policies import (
    check_chat_rate_limit,
    is_chat_available_for_user,
    resolve_chat_model,
)
from sources.models import GoogleDriveConnection


class ChatNotConfiguredError(Exception):
    pass


def _require_openai_configured() -> None:
    if not settings.OPENAI_API_KEY:
        raise ChatNotConfiguredError(
            'OpenAI API key is not configured. '
            'Set OPENAI_API_KEY in the backend environment.',
        )


def _get_user_conversation(user, conversation_id: int) -> Conversation | None:
    return Conversation.objects.filter(pk=conversation_id, user=user).first()


class ConversationListCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: ConversationListSerializer(many=True)}, tags=['Chat']
    )
    def get(self, request: Request) -> Response:
        conversations = (
            Conversation.objects.filter(user=request.user)
            .annotate(message_count=Count('messages'))
            .order_by('-updated_at')[:50]
        )
        serializer = ConversationListSerializer(conversations, many=True)
        return Response({'conversations': serializer.data})

    @extend_schema(responses={201: ConversationDetailSerializer}, tags=['Chat'])
    def post(self, request: Request) -> Response:
        conversation = Conversation.objects.create(user=request.user)
        serializer = ConversationDetailSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: ConversationDetailSerializer}, tags=['Chat'])
    def get(self, request: Request, conversation_id: int) -> Response:
        conversation = _get_user_conversation(request.user, conversation_id)
        if conversation is None:
            return Response(
                {'message': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        conversation = Conversation.objects.prefetch_related(
            'messages__citations__chunk__synced_file',
        ).get(pk=conversation.pk)
        serializer = ConversationDetailSerializer(conversation)
        return Response(serializer.data)

    @extend_schema(tags=['Chat'])
    def delete(self, request: Request, conversation_id: int) -> Response:
        conversation = _get_user_conversation(request.user, conversation_id)
        if conversation is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SendMessageView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=SendMessageSerializer, tags=['Chat'])
    def post(
        self, request: Request, conversation_id: int
    ) -> Response | StreamingHttpResponse:
        try:
            _require_openai_configured()
        except ChatNotConfiguredError as exc:
            return Response(
                {'message': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if not is_chat_available_for_user(request.user):
            return Response(
                {'message': 'Chat is temporarily unavailable due to maintenance.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not check_chat_rate_limit(request.user):
            return Response(
                {'message': 'Rate limit exceeded. Please try again in a minute.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        conversation = _get_user_conversation(request.user, conversation_id)
        if conversation is None:
            return Response(
                {'message': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user_message = chat_engine_service.create_user_message(
            conversation, data['content']
        )
        model = resolve_chat_model(data.get('model') or None)
        language = data.get('language', 'en')
        show_citations = data.get('show_citations', True)

        if data.get('stream', True):

            def event_stream():
                try:
                    yield from chat_engine_service.chat_stream_events(
                        conversation=conversation,
                        user_message=data['content'],
                        user_message_id=user_message.id,
                        model=model,
                        language=language,
                        show_citations=show_citations,
                    )
                except Exception as exc:
                    yield f'event: error\ndata: {json.dumps(str(exc))}\n\n'

            response = StreamingHttpResponse(
                event_stream(),
                content_type='text/event-stream',
            )
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response

        try:
            assistant_message, context_chunks = chat_engine_service.chat_complete(
                conversation=conversation,
                user_message=data['content'],
                user_message_id=user_message.id,
                model=model,
                language=language,
            )
        except Exception as exc:
            return Response({'message': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                'user_message': MessageSerializer(user_message).data,
                'assistant_message': MessageSerializer(
                    Message.objects.prefetch_related(
                        'citations__chunk__synced_file',
                    ).get(pk=assistant_message.pk),
                ).data,
                'citations': [
                    {
                        'document_id': chunk.document_id,
                        'document_name': chunk.document_name,
                        'excerpt': chunk.content[:300],
                        'score': chunk.score,
                    }
                    for chunk in context_chunks
                ],
            },
        )


class ChatStatusView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(tags=['Chat'])
    def get(self, request: Request) -> Response:
        from sources.models import DriveSyncedFile

        connection = GoogleDriveConnection.objects.filter(user=request.user).first()
        indexed_count = 0
        pending_count = 0
        total_chunks = 0

        if connection is not None:
            files = connection.synced_files.filter(is_deleted=False)
            indexed_count = files.filter(
                index_status=DriveSyncedFile.IndexStatus.INDEXED,
            ).count()
            pending_count = files.filter(
                index_status__in=[
                    DriveSyncedFile.IndexStatus.PENDING,
                    DriveSyncedFile.IndexStatus.PROCESSING,
                    DriveSyncedFile.IndexStatus.FAILED,
                ],
            ).count()
            total_chunks = sum(files.values_list('chunk_count', flat=True))

        platform_settings = get_platform_settings()

        return Response(
            {
                'configured': bool(settings.OPENAI_API_KEY),
                'indexed_documents': indexed_count,
                'pending_documents': pending_count,
                'total_chunks': total_chunks,
                'chat_model': platform_settings.default_model,
                'embedding_model': settings.RAG_EMBEDDING_MODEL,
                'maintenance_mode': platform_settings.maintenance_mode,
            },
        )
