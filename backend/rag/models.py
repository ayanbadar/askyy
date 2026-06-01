from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from pgvector.django import HnswIndex, VectorField

from sources.models import DriveSyncedFile


class DocumentChunk(models.Model):
    synced_file = models.ForeignKey(
        DriveSyncedFile,
        on_delete=models.CASCADE,
        related_name='chunks',
    )
    chunk_index = models.PositiveIntegerField()
    content = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding = VectorField(dimensions=1536)
    search_vector = SearchVectorField(null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['synced_file', 'chunk_index'],
                name='unique_chunk_per_document',
            ),
        ]
        indexes = [
            HnswIndex(
                name='chunk_embedding_hnsw_idx',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops'],
            ),
            GinIndex(fields=['search_vector']),
        ]
        ordering = ['synced_file_id', 'chunk_index']

    def __str__(self) -> str:
        return f'{self.synced_file.name} [{self.chunk_index}]'
