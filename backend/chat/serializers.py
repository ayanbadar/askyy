from rest_framework import serializers

from chat.models import Conversation, Message, MessageCitation
from settings_app.platform import is_openai_chat_model


class CitationSerializer(serializers.ModelSerializer):
    document_id = serializers.IntegerField(source='chunk.synced_file_id')
    document_name = serializers.CharField(source='chunk.synced_file.name')

    class Meta:
        model = MessageCitation
        fields = (
            'document_id',
            'document_name',
            'excerpt',
            'relevance_score',
        )


class MessageSerializer(serializers.ModelSerializer):
    citations = CitationSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'role', 'content', 'created_at', 'citations')


class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'title', 'created_at', 'updated_at', 'message_count')


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'title', 'created_at', 'updated_at', 'messages')


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=8000, trim_whitespace=True)
    stream = serializers.BooleanField(default=True)
    model = serializers.CharField(max_length=64, required=False, allow_blank=True)
    language = serializers.CharField(max_length=16, required=False, default='en')
    show_citations = serializers.BooleanField(default=True)

    def validate_content(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')
        return value.strip()

    def validate_model(self, value: str) -> str:
        if value and not is_openai_chat_model(value):
            raise serializers.ValidationError('Select a supported OpenAI model.')
        return value
