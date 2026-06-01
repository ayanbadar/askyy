from django.urls import path

from chat.views import (
    ChatStatusView,
    ConversationDetailView,
    ConversationListCreateView,
    SendMessageView,
)

urlpatterns = [
    path('status/', ChatStatusView.as_view(), name='chat-status'),
    path(
        'conversations/',
        ConversationListCreateView.as_view(),
        name='chat-conversations',
    ),
    path(
        'conversations/<int:conversation_id>/',
        ConversationDetailView.as_view(),
        name='chat-conversation-detail',
    ),
    path(
        'conversations/<int:conversation_id>/messages/',
        SendMessageView.as_view(),
        name='chat-send-message',
    ),
]
