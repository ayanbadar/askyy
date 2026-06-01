from django.contrib import admin

from rag.models import DocumentChunk


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ('id', 'synced_file', 'chunk_index', 'token_count', 'created_at')
    search_fields = ('synced_file__name', 'content')
    raw_id_fields = ('synced_file',)
