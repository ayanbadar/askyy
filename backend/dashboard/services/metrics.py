from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta

from django.contrib.auth.models import AbstractBaseUser
from django.db.models import Count, Q, QuerySet
from django.utils import timezone

from chat.models import Conversation, Message
from dashboard.services.time_utils import time_utils_service
from rag.services.chunker import text_chunker_service
from sources.models import DriveSyncedFile, GoogleDriveConnection

ACTIVE_CONVERSATION_WINDOW = timedelta(hours=2)
RECENT_CONVERSATION_LIMIT = 5
TOP_TOPIC_LIMIT = 6


class DashboardMetricsService:
    @staticmethod
    def conversation_status(conversation: Conversation) -> str:
        if timezone.now() - conversation.updated_at <= ACTIVE_CONVERSATION_WINDOW:
            return 'active'
        return 'resolved'

    def serialize_recent_conversation(
        self,
        conversation: Conversation,
        *,
        message_count: int,
        user_display: str | None = None,
    ) -> dict:
        topic = conversation.title.strip() or 'New conversation'
        payload = {
            'id': str(conversation.pk),
            'topic': topic,
            'messages': message_count,
            'status': self.conversation_status(conversation),
            'satisfaction': None,
            'time_ago': time_utils_service.format_time_ago(conversation.updated_at),
        }
        if user_display is not None:
            payload['user'] = user_display
        return payload

    def weekly_activity(
        self,
        *,
        conversation_filter: Q | None = None,
        message_filter: Q | None = None,
        days: int = 7,
    ) -> list[dict[str, int | str]]:
        today = timezone.localdate()
        day_starts = [
            timezone.make_aware(datetime.combine(day, datetime.min.time()))
            for day in time_utils_service.date_range(today, days=days)
        ]

        conversation_qs = Conversation.objects.all()
        message_qs = Message.objects.all()
        if conversation_filter is not None:
            conversation_qs = conversation_qs.filter(conversation_filter)
        if message_filter is not None:
            message_qs = message_qs.filter(message_filter)

        conversation_counts = dict(
            conversation_qs.filter(
                created_at__date__gte=today - timedelta(days=days - 1),
            )
            .values('created_at__date')
            .annotate(count=Count('id'))
            .values_list('created_at__date', 'count'),
        )

        message_counts = dict(
            message_qs.filter(
                created_at__date__gte=today - timedelta(days=days - 1),
            )
            .values('created_at__date')
            .annotate(count=Count('id'))
            .values_list('created_at__date', 'count'),
        )

        activity: list[dict[str, int | str]] = []
        for day_start in day_starts:
            day = day_start.date()
            activity.append(
                {
                    'day': time_utils_service.day_label(day),
                    'conversations': conversation_counts.get(day, 0),
                    'messages': message_counts.get(day, 0),
                },
            )
        return activity

    @staticmethod
    def top_topics(
        conversation_qs: QuerySet[Conversation],
        *,
        limit: int = TOP_TOPIC_LIMIT,
    ) -> list[dict[str, int | float | str]]:
        titles = [
            (conversation.title or 'New conversation').strip()
            for conversation in conversation_qs.only('title')
            if (conversation.title or '').strip()
        ]
        if not titles:
            return []

        counts = Counter(titles)
        total = sum(counts.values())
        ranked = counts.most_common(limit)
        return [
            {
                'topic': topic,
                'count': count,
                'percentage': round((count / total) * 100) if total else 0,
            }
            for topic, count in ranked
        ]

    def recent_conversations(
        self,
        conversation_qs: QuerySet[Conversation],
        *,
        include_user: bool = False,
        limit: int = RECENT_CONVERSATION_LIMIT,
    ) -> list[dict]:
        queryset = (
            conversation_qs.annotate(message_count=Count('messages'))
            .select_related('user')
            .order_by('-updated_at')[:limit]
        )
        results: list[dict] = []
        for conversation in queryset:
            user_display = None
            if include_user:
                user = conversation.user
                user_display = user.get_full_name() or user.username
            results.append(
                self.serialize_recent_conversation(
                    conversation,
                    message_count=conversation.message_count,
                    user_display=user_display,
                ),
            )
        return results

    @staticmethod
    def response_breakdown(conversation_qs: QuerySet[Conversation]) -> dict[str, int]:
        annotated = conversation_qs.annotate(message_count=Count('messages'))
        total = annotated.count()
        if total == 0:
            return {
                'resolved_first_try': 0,
                'multi_turn': 0,
                'escalated': 0,
                'abandoned': 0,
            }

        resolved_first_try = annotated.filter(message_count=2).count()
        multi_turn = annotated.filter(
            message_count__gte=3, message_count__lte=10
        ).count()
        escalated = annotated.filter(message_count__gt=10).count()
        abandoned = annotated.filter(message_count=1).count()

        return {
            'resolved_first_try': DashboardMetricsService._to_percentage(
                resolved_first_try, total
            ),
            'multi_turn': DashboardMetricsService._to_percentage(multi_turn, total),
            'escalated': DashboardMetricsService._to_percentage(escalated, total),
            'abandoned': DashboardMetricsService._to_percentage(abandoned, total),
        }

    @staticmethod
    def average_response_time_seconds(
        *,
        since: datetime,
        message_filter: Q | None = None,
    ) -> float | None:
        assistant_messages = Message.objects.filter(
            role=Message.Role.ASSISTANT,
            created_at__gte=since,
        )
        if message_filter is not None:
            assistant_messages = assistant_messages.filter(message_filter)

        deltas: list[float] = []
        for assistant_message in assistant_messages.select_related(
            'conversation'
        ).iterator():
            user_message = (
                Message.objects.filter(
                    conversation_id=assistant_message.conversation_id,
                    role=Message.Role.USER,
                    created_at__lt=assistant_message.created_at,
                )
                .order_by('-created_at')
                .only('created_at')
                .first()
            )
            if user_message is None:
                continue
            delta = assistant_message.created_at - user_message.created_at
            deltas.append(max(delta.total_seconds(), 0.0))

        if not deltas:
            return None
        return round(sum(deltas) / len(deltas), 1)

    @staticmethod
    def estimate_tokens_for_messages(message_qs: QuerySet[Message]) -> int:
        total = 0
        for content in message_qs.values_list('content', flat=True).iterator():
            total += text_chunker_service.count_tokens(content)
        return total

    @staticmethod
    def user_document_stats(user: AbstractBaseUser) -> tuple[int, int]:
        connection = GoogleDriveConnection.objects.filter(user=user).first()
        if connection is None:
            return 0, 0

        files = connection.synced_files.filter(is_deleted=False)
        return files.count(), files.filter(
            index_status=DriveSyncedFile.IndexStatus.INDEXED,
        ).count()

    def serialize_user_documents(
        self,
        user: AbstractBaseUser,
        *,
        limit: int = 4,
    ) -> list[dict]:
        connection = GoogleDriveConnection.objects.filter(user=user).first()
        if connection is None:
            return []

        files = (
            connection.synced_files.filter(is_deleted=False)
            .select_related('folder_selection')
            .order_by('-first_seen_at')[:limit]
        )

        documents: list[dict] = []
        for synced_file in files:
            documents.append(
                {
                    'id': synced_file.pk,
                    'name': synced_file.name,
                    'type': self._mime_type_label(synced_file.mime_type),
                    'mime_type': synced_file.mime_type,
                    'uploaded_at': time_utils_service.format_time_ago(
                        synced_file.first_seen_at
                    ),
                    'first_seen_at': synced_file.first_seen_at,
                    'status': self._document_status(synced_file.index_status),
                    'index_status': synced_file.index_status,
                },
            )
        return documents

    def knowledge_sources(self) -> list[dict]:
        connections = GoogleDriveConnection.objects.prefetch_related(
            'folder_selections',
            'synced_files',
        ).order_by('-updated_at')

        sources: list[dict] = []
        for connection in connections:
            for folder in connection.folder_selections.all():
                files = connection.synced_files.filter(
                    folder_selection=folder,
                    is_deleted=False,
                )
                sources.append(
                    {
                        'name': folder.drive_folder_name,
                        'documents': files.count(),
                        'status': self._sync_status(connection.last_sync_status),
                        'last_synced': self._format_sync_time(connection),
                        'google_email': connection.google_email,
                    },
                )

            if not connection.folder_selections.exists():
                active_files = connection.synced_files.filter(is_deleted=False)
                if active_files.exists():
                    sources.append(
                        {
                            'name': f'Google Drive ({connection.google_email})',
                            'documents': active_files.count(),
                            'status': self._sync_status(connection.last_sync_status),
                            'last_synced': self._format_sync_time(connection),
                            'google_email': connection.google_email,
                        },
                    )

        return sources

    @staticmethod
    def _to_percentage(value: int, total: int) -> int:
        if total == 0:
            return 0
        return round((value / total) * 100)

    @staticmethod
    def _document_status(index_status: str) -> str:
        if index_status == DriveSyncedFile.IndexStatus.INDEXED:
            return 'ready'
        if index_status in {
            DriveSyncedFile.IndexStatus.PENDING,
            DriveSyncedFile.IndexStatus.PROCESSING,
        }:
            return 'processing'
        if index_status == DriveSyncedFile.IndexStatus.FAILED:
            return 'failed'
        return 'processing'

    @staticmethod
    def _mime_type_label(mime_type: str) -> str:
        labels = {
            'application/pdf': 'PDF',
            (
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ): 'Word',
            (
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ): 'Excel',
            'text/markdown': 'Markdown',
            'text/plain': 'Text',
        }
        if mime_type in labels:
            return labels[mime_type]
        subtype = mime_type.split('/')[-1]
        return subtype.replace('.', ' ').replace('_', ' ').title()

    @staticmethod
    def _sync_status(status: str) -> str:
        mapping = {
            GoogleDriveConnection.SyncStatus.SUCCESS: 'synced',
            GoogleDriveConnection.SyncStatus.SYNCING: 'syncing',
            GoogleDriveConnection.SyncStatus.ERROR: 'error',
            GoogleDriveConnection.SyncStatus.PENDING: 'syncing',
        }
        return mapping.get(status, 'syncing')

    @staticmethod
    def _format_sync_time(connection: GoogleDriveConnection) -> str:
        if connection.last_sync_status == GoogleDriveConnection.SyncStatus.SYNCING:
            return 'Syncing…'
        if connection.last_sync_status == GoogleDriveConnection.SyncStatus.ERROR:
            if connection.last_synced_at:
                ago = time_utils_service.format_time_ago(connection.last_synced_at)
                return f'Failed {ago}'
            return 'Sync failed'
        if connection.last_synced_at:
            return time_utils_service.format_time_ago(connection.last_synced_at)
        return 'Never synced'


dashboard_metrics_service = DashboardMetricsService()
