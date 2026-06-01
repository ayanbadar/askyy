from rest_framework import serializers


class WeeklyActivitySerializer(serializers.Serializer):
    day = serializers.CharField()
    conversations = serializers.IntegerField()
    messages = serializers.IntegerField()


class DashboardConversationSerializer(serializers.Serializer):
    id = serializers.CharField()
    topic = serializers.CharField()
    messages = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['resolved', 'active', 'escalated'])
    satisfaction = serializers.IntegerField(allow_null=True)
    time_ago = serializers.CharField()
    user = serializers.CharField(required=False)


class TopTopicSerializer(serializers.Serializer):
    topic = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class UserDocumentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    type = serializers.CharField()
    mime_type = serializers.CharField()
    uploaded_at = serializers.CharField()
    first_seen_at = serializers.DateTimeField()
    status = serializers.ChoiceField(choices=['ready', 'processing', 'failed'])
    index_status = serializers.CharField()


class UserDashboardStatsSerializer(serializers.Serializer):
    my_conversations = serializers.IntegerField()
    my_conversations_change = serializers.FloatField()
    messages_this_week = serializers.IntegerField()
    messages_this_week_change = serializers.FloatField()
    my_documents = serializers.IntegerField()
    my_documents_change = serializers.IntegerField()
    saved_answers = serializers.IntegerField()
    saved_answers_change = serializers.IntegerField()


class UserDashboardSerializer(serializers.Serializer):
    stats = UserDashboardStatsSerializer()
    weekly_activity = WeeklyActivitySerializer(many=True)
    recent_conversations = DashboardConversationSerializer(many=True)
    top_topics = TopTopicSerializer(many=True)
    documents = UserDocumentSerializer(many=True)


class AdminDashboardStatsSerializer(serializers.Serializer):
    total_conversations = serializers.IntegerField()
    total_conversations_change = serializers.FloatField()
    messages_today = serializers.IntegerField()
    messages_today_change = serializers.FloatField()
    avg_response_time_sec = serializers.FloatField(allow_null=True)
    avg_response_time_change = serializers.FloatField(allow_null=True)
    satisfaction_rate = serializers.FloatField(allow_null=True)
    satisfaction_change = serializers.FloatField(allow_null=True)
    documents_indexed = serializers.IntegerField()
    documents_change = serializers.IntegerField()
    token_usage_today = serializers.IntegerField()
    token_usage_change = serializers.FloatField()


class ResponseBreakdownSerializer(serializers.Serializer):
    resolved_first_try = serializers.IntegerField()
    multi_turn = serializers.IntegerField()
    escalated = serializers.IntegerField()
    abandoned = serializers.IntegerField()


class KnowledgeSourceSerializer(serializers.Serializer):
    name = serializers.CharField()
    documents = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['synced', 'syncing', 'error'])
    last_synced = serializers.CharField()
    google_email = serializers.EmailField(required=False)


class ModelUsageSerializer(serializers.Serializer):
    model = serializers.CharField()
    requests_today = serializers.IntegerField()
    avg_tokens_per_request = serializers.IntegerField()
    estimated_cost_usd = serializers.FloatField()


class AdminDashboardSerializer(serializers.Serializer):
    stats = AdminDashboardStatsSerializer()
    weekly_activity = WeeklyActivitySerializer(many=True)
    recent_conversations = DashboardConversationSerializer(many=True)
    top_topics = TopTopicSerializer(many=True)
    response_breakdown = ResponseBreakdownSerializer()
    knowledge_sources = KnowledgeSourceSerializer(many=True)
    model_usage = ModelUsageSerializer()
    total_chunks = serializers.IntegerField()
