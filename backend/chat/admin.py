from django.contrib import admin

from chat.models import Conversation, Message, MessageCitation


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('role', 'content', 'created_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'updated_at')
    search_fields = ('title', 'user__username', 'user__email')
    inlines = (MessageInline,)


@admin.register(MessageCitation)
class MessageCitationAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'chunk', 'relevance_score')
    raw_id_fields = ('message', 'chunk')
