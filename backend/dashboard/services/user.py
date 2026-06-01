from __future__ import annotations

from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser
from django.db.models import Q
from django.utils import timezone

from chat.models import Conversation, Message
from dashboard.services.metrics import dashboard_metrics_service
from dashboard.services.time_utils import time_utils_service


class UserDashboardService:
    def build_user_dashboard(self, user: AbstractBaseUser) -> dict:
        now = timezone.now()
        week_start = time_utils_service.start_of_day(
            now - timedelta(days=now.weekday())
        )
        previous_week_start = week_start - timedelta(days=7)
        previous_week_end = week_start

        user_filter = Q(user=user)
        conversations = Conversation.objects.filter(user=user)

        total_conversations = conversations.count()
        previous_conversations = conversations.filter(
            created_at__gte=previous_week_start,
            created_at__lt=week_start,
        ).count()
        current_week_conversations = conversations.filter(
            created_at__gte=week_start,
        ).count()

        messages = Message.objects.filter(conversation__user=user)
        messages_this_week = messages.filter(created_at__gte=week_start).count()
        messages_previous_week = messages.filter(
            created_at__gte=previous_week_start,
            created_at__lt=previous_week_end,
        ).count()

        document_count, _indexed_count = dashboard_metrics_service.user_document_stats(
            user
        )
        documents_previous_week = self._documents_before(user, week_start)
        documents_current_week = document_count - documents_previous_week

        return {
            'stats': {
                'my_conversations': total_conversations,
                'my_conversations_change': time_utils_service.percent_change(
                    current_week_conversations,
                    previous_conversations,
                ),
                'messages_this_week': messages_this_week,
                'messages_this_week_change': time_utils_service.percent_change(
                    messages_this_week,
                    messages_previous_week,
                ),
                'my_documents': document_count,
                'my_documents_change': max(documents_current_week, 0),
                'saved_answers': 0,
                'saved_answers_change': 0,
            },
            'weekly_activity': dashboard_metrics_service.weekly_activity(
                conversation_filter=user_filter,
                message_filter=Q(conversation__user=user),
            ),
            'recent_conversations': dashboard_metrics_service.recent_conversations(
                conversations
            ),
            'top_topics': dashboard_metrics_service.top_topics(conversations),
            'documents': dashboard_metrics_service.serialize_user_documents(user),
        }

    @staticmethod
    def _documents_before(user: AbstractBaseUser, cutoff) -> int:
        from sources.models import GoogleDriveConnection

        connection = GoogleDriveConnection.objects.filter(user=user).first()
        if connection is None:
            return 0

        return connection.synced_files.filter(
            is_deleted=False,
            first_seen_at__lt=cutoff,
        ).count()


user_dashboard_service = UserDashboardService()
