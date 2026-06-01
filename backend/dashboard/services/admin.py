from __future__ import annotations

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from chat.models import Conversation, Message
from dashboard.services.metrics import dashboard_metrics_service
from dashboard.services.time_utils import time_utils_service
from rag.models import DocumentChunk
from settings_app.platform import get_platform_settings
from sources.models import DriveSyncedFile


def build_admin_dashboard() -> dict:
    now = timezone.now()
    today_start = time_utils_service.start_of_day(now)
    yesterday_start = today_start - timedelta(days=1)
    week_start = time_utils_service.start_of_day(now - timedelta(days=now.weekday()))
    previous_week_start = week_start - timedelta(days=7)
    previous_week_end = week_start

    conversations = Conversation.objects.all()
    messages = Message.objects.all()
    assistant_messages_today = messages.filter(
        role=Message.Role.ASSISTANT,
        created_at__gte=today_start,
    )

    total_conversations = conversations.count()
    conversations_previous_week = conversations.filter(
        created_at__gte=previous_week_start,
        created_at__lt=previous_week_end,
    ).count()
    conversations_this_week = conversations.filter(created_at__gte=week_start).count()

    messages_today = messages.filter(created_at__gte=today_start).count()
    messages_yesterday = messages.filter(
        created_at__gte=yesterday_start,
        created_at__lt=today_start,
    ).count()

    avg_response_time = dashboard_metrics_service.average_response_time_seconds(
        since=week_start
    )
    previous_avg_response_time = (
        dashboard_metrics_service.average_response_time_seconds(
            since=previous_week_start,
            message_filter=Q(created_at__lt=previous_week_end),
        )
    )
    avg_response_time_change = _response_time_change(
        avg_response_time,
        previous_avg_response_time,
    )

    indexed_documents = DriveSyncedFile.objects.filter(
        is_deleted=False,
        index_status=DriveSyncedFile.IndexStatus.INDEXED,
    ).count()
    documents_previous_week = DriveSyncedFile.objects.filter(
        is_deleted=False,
        index_status=DriveSyncedFile.IndexStatus.INDEXED,
        indexed_at__lt=week_start,
    ).count()
    documents_this_week = max(indexed_documents - documents_previous_week, 0)

    token_usage_today = dashboard_metrics_service.estimate_tokens_for_messages(
        assistant_messages_today,
    )
    assistant_messages_yesterday = messages.filter(
        role=Message.Role.ASSISTANT,
        created_at__gte=yesterday_start,
        created_at__lt=today_start,
    )
    token_usage_yesterday = dashboard_metrics_service.estimate_tokens_for_messages(
        assistant_messages_yesterday,
    )

    total_chunks = DocumentChunk.objects.count()
    platform_settings = get_platform_settings()
    requests_today = assistant_messages_today.count()

    return {
        'stats': {
            'total_conversations': total_conversations,
            'total_conversations_change': time_utils_service.percent_change(
                conversations_this_week,
                conversations_previous_week,
            ),
            'messages_today': messages_today,
            'messages_today_change': time_utils_service.percent_change(
                messages_today,
                messages_yesterday,
            ),
            'avg_response_time_sec': avg_response_time,
            'avg_response_time_change': avg_response_time_change,
            'satisfaction_rate': None,
            'satisfaction_change': None,
            'documents_indexed': indexed_documents,
            'documents_change': documents_this_week,
            'token_usage_today': token_usage_today,
            'token_usage_change': time_utils_service.percent_change(
                token_usage_today,
                token_usage_yesterday,
            ),
        },
        'weekly_activity': dashboard_metrics_service.weekly_activity(),
        'recent_conversations': dashboard_metrics_service.recent_conversations(
            conversations,
            include_user=True,
            limit=5,
        ),
        'top_topics': dashboard_metrics_service.top_topics(conversations),
        'response_breakdown': dashboard_metrics_service.response_breakdown(
            conversations
        ),
        'knowledge_sources': dashboard_metrics_service.knowledge_sources(),
        'model_usage': {
            'model': platform_settings.default_model,
            'requests_today': requests_today,
            'avg_tokens_per_request': round(
                token_usage_today / requests_today,
            )
            if requests_today
            else 0,
            'estimated_cost_usd': _estimate_cost_usd(
                token_usage_today,
                platform_settings.default_model,
            ),
        },
        'total_chunks': total_chunks,
    }


def _response_time_change(
    current: float | None,
    previous: float | None,
) -> float | None:
    if current is None or previous is None or previous == 0:
        return None
    return time_utils_service.percent_change(current, previous)


def _estimate_cost_usd(token_count: int, model: str) -> float:
    # Rough public pricing placeholders for dashboard estimates only.
    rates_per_million = {
        'gpt-4o-mini': 0.15,
        'gpt-4o': 2.50,
        'gpt-4.1-mini': 0.40,
        'gpt-4.1': 2.00,
    }
    rate = rates_per_million.get(model, 0.15)
    return round((token_count / 1_000_000) * rate, 2)
