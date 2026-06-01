import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Send, User } from "lucide-react";
import {
  ChatCitationList,
  ChatMessageContent,
  ConversationSidebar,
} from "@/components/chat/ChatComponents";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ChatCitation, ChatMessage } from "@/api/chat";
import { defaultChatPreferences } from "@/data/settingsMock";
import {
  useChatStatusQuery,
  useConversationQuery,
  useConversationsQuery,
  useCreateConversationMutation,
  useDeleteConversationMutation,
  useSendMessageMutation,
} from "@/hooks/useChat";
import { cn } from "@/lib/utils";

type LocalMessage = ChatMessage & {
  isStreaming?: boolean;
  pendingCitations?: ChatCitation[];
};

function MessageBubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ChatMessageContent
            content={message.content}
            isStreaming={message.isStreaming}
          />
        )}
        {!isUser && message.pendingCitations && (
          <ChatCitationList citations={message.pendingCitations} />
        )}
        {!isUser && message.citations && message.citations.length > 0 && (
          <ChatCitationList citations={message.citations} />
        )}
      </div>
    </div>
  );
}

export function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatStatus } = useChatStatusQuery();
  const { data: conversations = [], isLoading: conversationsLoading } =
    useConversationsQuery();
  const { data: conversation, isLoading: conversationLoading } =
    useConversationQuery(activeConversationId);
  const createConversation = useCreateConversationMutation();
  const deleteConversation = useDeleteConversationMutation();
  const sendMessage = useSendMessageMutation();

  useEffect(() => {
    if (conversation?.messages) {
      setLocalMessages(conversation.messages);
    }
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleNewConversation = async () => {
    setError(null);
    const created = await createConversation.mutateAsync();
    setActiveConversationId(created.id);
    setLocalMessages([]);
  };

  const handleDeleteConversation = async (conversationId: number) => {
    await deleteConversation.mutateAsync(conversationId);
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setLocalMessages([]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sendMessage.isPending) {
      return;
    }

    setError(null);
    setDraft("");

    let conversationId = activeConversationId;
    if (conversationId === null) {
      const created = await createConversation.mutateAsync();
      conversationId = created.id;
      setActiveConversationId(created.id);
    }

    const userMessage: LocalMessage = {
      id: Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    const assistantPlaceholder: LocalMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      isStreaming: true,
      pendingCitations: [],
    };

    setLocalMessages((current) => [
      ...current,
      userMessage,
      assistantPlaceholder,
    ]);

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content,
        options: {
          model: defaultChatPreferences.model,
          language: defaultChatPreferences.language,
          showCitations: defaultChatPreferences.showCitations,
        },
        onToken: (token) => {
          setLocalMessages((current) =>
            current.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, content: message.content + token }
                : message,
            ),
          );
        },
        onCitations: (citations) => {
          setLocalMessages((current) =>
            current.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, pendingCitations: citations }
                : message,
            ),
          );
        },
      });

      setLocalMessages((current) =>
        current.map((message) =>
          message.id === assistantPlaceholder.id
            ? {
                ...message,
                isStreaming: false,
                citations: message.pendingCitations,
                pendingCitations: undefined,
              }
            : message,
        ),
      );
    } catch (submitError) {
      setLocalMessages((current) =>
        current.filter((message) => message.id !== assistantPlaceholder.id),
      );
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send message.",
      );
      setDraft(content);
    }
  };

  const isReady = chatStatus?.configured;
  const isIndexing = (chatStatus?.pending_documents ?? 0) > 0;

  return (
    <section className="flex h-[calc(100vh-5rem)] flex-col gap-4">
      <div>
        <h1 className="text-3xl font-normal">Chat</h1>
        <p className="mt-2 text-muted-foreground">
          Ask questions and get answers from your synced documents.
        </p>
      </div>

      {!isReady && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            OpenAI API key is not configured. Add{" "}
            <code className="rounded bg-background/50 px-1">
              OPENAI_API_KEY
            </code>{" "}
            to your backend environment to enable the chatbot.
          </span>
        </div>
      )}

      {isReady && isIndexing && (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>
            Indexing {chatStatus?.pending_documents} document
            {chatStatus?.pending_documents === 1 ? "" : "s"} for search. You can
            chat now, but answers improve as indexing completes.
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={conversationsLoading}
          onSelect={setActiveConversationId}
          onNew={() => void handleNewConversation()}
          onDelete={(id) => void handleDeleteConversation(id)}
          isCreating={createConversation.isPending}
        />

        <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card">
          <div className="flex-1 overflow-y-auto p-4">
            {conversationLoading && activeConversationId !== null ? (
              <div className="flex h-full items-center justify-center">
                <Spinner className="size-6" />
              </div>
            ) : localMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Bot className="size-10 opacity-40" />
                <p className="text-sm">
                  {chatStatus?.indexed_documents
                    ? `${chatStatus.indexed_documents} documents indexed · ${chatStatus.total_chunks} chunks`
                    : "Sync documents from Google Drive to get started."}
                </p>
                <p className="max-w-md text-sm">
                  Ask anything about your knowledge base — answers include
                  citations from your documents.
                </p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {localMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="border-t px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="flex items-end gap-2 border-t p-4"
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit(event);
                }
              }}
              placeholder={
                isReady
                  ? "Ask a question about your documents..."
                  : "Configure OpenAI to start chatting..."
              }
              disabled={!isReady || sendMessage.isPending}
              rows={3}
              className="max-h-48 min-h-[5rem] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!isReady || !draft.trim() || sendMessage.isPending}
              size="icon"
            >
              {sendMessage.isPending ? <Spinner /> : <Send />}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
