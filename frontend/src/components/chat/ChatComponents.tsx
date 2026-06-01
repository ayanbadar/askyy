import { FileText, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ConversationSummary } from "@/api/chat";
import { cn } from "@/lib/utils";

const chatMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 [&:not(:first-child)]:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-sm font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-medium first:mt-0">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-md bg-background/60 px-3 py-2 font-mono text-xs">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-md bg-background/60 p-3 last:mb-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-background/40 px-2 py-1 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2 py-1">{children}</td>
  ),
};

type ChatMessageContentProps = {
  content: string;
  isStreaming?: boolean;
};

export function ChatMessageContent({
  content,
  isStreaming = false,
}: ChatMessageContentProps) {
  return (
    <div className="chat-markdown break-words">
      <ReactMarkdown components={chatMarkdownComponents}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-current align-text-bottom" />
      )}
    </div>
  );
}

type ConversationSidebarProps = {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  isLoading: boolean;
  onSelect: (conversationId: number) => void;
  onNew: () => void;
  onDelete: (conversationId: number) => void;
  isCreating: boolean;
};

export function ConversationSidebar({
  conversations,
  activeConversationId,
  isLoading,
  onSelect,
  onNew,
  onDelete,
  isCreating,
}: ConversationSidebarProps) {
  return (
    <aside className="flex w-full flex-col rounded-xl border bg-card lg:w-72 lg:shrink-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium">Conversations</h2>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={onNew}
          disabled={isCreating}
          aria-label="New conversation"
        >
          {isCreating ? <Spinner /> : <Plus />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new chat.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                    activeConversationId === conversation.id
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelect(conversation.id)}
                  >
                    <p className="truncate text-sm font-medium">
                      {conversation.title || "New conversation"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conversation.message_count} messages
                    </p>
                  </button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => onDelete(conversation.id)}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

type ChatCitationListProps = {
  citations: Array<{
    document_id: number;
    document_name: string;
    excerpt: string;
  }>;
};

export function ChatCitationList({ citations }: ChatCitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Sources
      </p>
      <ul className="space-y-2">
        {citations.map((citation) => (
          <li
            key={`${citation.document_id}-${citation.excerpt.slice(0, 24)}`}
            className="rounded-lg bg-muted/50 px-3 py-2 text-xs"
          >
            <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">{citation.document_name}</span>
            </div>
            <p className="line-clamp-2 text-muted-foreground">
              {citation.excerpt}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
