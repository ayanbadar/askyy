from django.conf import settings
from django.db import models


class Conversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations',
    )
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
        ]

    def __str__(self) -> str:
        return self.title or f'Conversation {self.pk}'


class Message(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]

    def __str__(self) -> str:
        preview = self.content[:50]
        return f'{self.role}: {preview}'


class MessageCitation(models.Model):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='citations',
    )
    chunk = models.ForeignKey(
        'rag.DocumentChunk',
        on_delete=models.CASCADE,
        related_name='citations',
    )
    excerpt = models.TextField()
    relevance_score = models.FloatField(default=0.0)

    class Meta:
        ordering = ['-relevance_score']

    def __str__(self) -> str:
        return f'Citation for message {self.message_id}'
