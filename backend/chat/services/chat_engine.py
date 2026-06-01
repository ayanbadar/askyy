from __future__ import annotations

import json
from collections.abc import Iterator

from django.db import transaction

from chat.models import Conversation, Message, MessageCitation
from chat.services.llm import chat_llm_service
from chat.services.retriever import RetrievedChunk, chunk_retriever_service
from rag.models import DocumentChunk


class ChatEngineService:
    @staticmethod
    def _history_for_conversation(
        conversation: Conversation,
        *,
        exclude_message_id: int | None = None,
    ) -> list[dict[str, str]]:
        queryset = conversation.messages.order_by('-created_at')
        if exclude_message_id is not None:
            queryset = queryset.exclude(pk=exclude_message_id)
        recent_messages = queryset[:6]
        ordered = reversed(list(recent_messages))
        return [
            {'role': message.role, 'content': message.content}
            for message in ordered
            if message.role in {Message.Role.USER, Message.Role.ASSISTANT}
        ]

    @staticmethod
    def _generate_title(user_message: str) -> str:
        title = user_message.strip().replace('\n', ' ')
        if len(title) > 80:
            return f'{title[:77]}...'
        return title or 'New conversation'

    @staticmethod
    def _save_citations(
        assistant_message: Message,
        chunks: list[RetrievedChunk],
    ) -> None:
        if not chunks:
            return

        chunk_map = {
            chunk.id: chunk
            for chunk in DocumentChunk.objects.filter(
                id__in=[item.chunk_id for item in chunks],
            )
        }
        citations = [
            MessageCitation(
                message=assistant_message,
                chunk=chunk_map[item.chunk_id],
                excerpt=item.content[:500],
                relevance_score=item.score,
            )
            for item in chunks
            if item.chunk_id in chunk_map
        ]
        MessageCitation.objects.bulk_create(citations)

    @transaction.atomic
    def create_user_message(self, conversation: Conversation, content: str) -> Message:
        return Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=content,
        )

    def chat_stream_events(
        self,
        *,
        conversation: Conversation,
        user_message: str,
        user_message_id: int,
        model: str,
        language: str,
        show_citations: bool,
    ) -> Iterator[str]:
        context_chunks = chunk_retriever_service.retrieve_relevant_chunks(
            conversation.user,
            user_message,
        )
        citation_chunks = chunk_retriever_service.select_citation_chunks(
            context_chunks,
            user_message,
        )
        history = self._history_for_conversation(
            conversation,
            exclude_message_id=user_message_id,
        )
        messages = chat_llm_service.build_messages(
            user_message=user_message,
            history=history,
            context_chunks=context_chunks,
            language=language,
        )

        if show_citations and citation_chunks:
            citations_payload = [
                {
                    'document_id': chunk.document_id,
                    'document_name': chunk.document_name,
                    'excerpt': chunk.content[:300],
                    'score': chunk.score,
                }
                for chunk in citation_chunks
            ]
            yield f'event: citations\ndata: {json.dumps(citations_payload)}\n\n'

        assistant_parts: list[str] = []
        for token in chat_llm_service.stream_chat_completion(messages, model=model):
            assistant_parts.append(token)
            yield f'event: token\ndata: {json.dumps(token)}\n\n'

        assistant_content = ''.join(assistant_parts)
        assistant_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=assistant_content,
        )
        self._save_citations(assistant_message, citation_chunks)

        if not conversation.title:
            conversation.title = self._generate_title(user_message)
            conversation.save(update_fields=['title', 'updated_at'])
        else:
            conversation.save(update_fields=['updated_at'])

        done_data = json.dumps({'message_id': assistant_message.id})
        yield f'event: done\ndata: {done_data}\n\n'

    def chat_complete(
        self,
        *,
        conversation: Conversation,
        user_message: str,
        user_message_id: int,
        model: str,
        language: str,
    ) -> tuple[Message, list[RetrievedChunk]]:
        context_chunks = chunk_retriever_service.retrieve_relevant_chunks(
            conversation.user,
            user_message,
        )
        citation_chunks = chunk_retriever_service.select_citation_chunks(
            context_chunks,
            user_message,
        )
        history = self._history_for_conversation(
            conversation,
            exclude_message_id=user_message_id,
        )
        messages = chat_llm_service.build_messages(
            user_message=user_message,
            history=history,
            context_chunks=context_chunks,
            language=language,
        )
        assistant_content = chat_llm_service.generate_chat_completion(
            messages, model=model
        )
        assistant_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=assistant_content,
        )
        self._save_citations(assistant_message, citation_chunks)

        if not conversation.title:
            conversation.title = self._generate_title(user_message)
            conversation.save(update_fields=['title', 'updated_at'])
        else:
            conversation.save(update_fields=['updated_at'])

        return assistant_message, citation_chunks


chat_engine_service = ChatEngineService()
