import { getAccessToken } from "@/lib/authTokens";
import { API_BASE_URL } from "@/config/api";

export type ChatCitation = {
  document_id: number;
  document_name: string;
  excerpt: string;
  score: number;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  citations?: ChatCitation[];
};

export type ConversationSummary = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

export type ConversationDetail = ConversationSummary & {
  messages: ChatMessage[];
};

export type ChatStatus = {
  configured: boolean;
  indexed_documents: number;
  pending_documents: number;
  total_chunks: number;
  chat_model: string;
  embedding_model: string;
};

export type SendMessageOptions = {
  stream?: boolean;
  model?: string;
  language?: string;
  showCitations?: boolean;
};

export type StreamEventHandlers = {
  onToken: (token: string) => void;
  onCitations: (citations: ChatCitation[]) => void;
  onDone: (payload: { message_id: number }) => void;
  onError: (message: string) => void;
};

export async function getChatStatus(): Promise<ChatStatus> {
  const { apiClient } = await import("@/api/client");
  const response = await apiClient.get<ChatStatus>("/chat/status/");
  return response.data;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const { apiClient } = await import("@/api/client");
  const response = await apiClient.get<{
    conversations: ConversationSummary[];
  }>("/chat/conversations/");
  return response.data.conversations;
}

export async function createConversation(): Promise<ConversationDetail> {
  const { apiClient } = await import("@/api/client");
  const response = await apiClient.post<ConversationDetail>(
    "/chat/conversations/",
  );
  return response.data;
}

export async function getConversation(
  conversationId: number,
): Promise<ConversationDetail> {
  const { apiClient } = await import("@/api/client");
  const response = await apiClient.get<ConversationDetail>(
    `/chat/conversations/${conversationId}/`,
  );
  return response.data;
}

export async function deleteConversation(
  conversationId: number,
): Promise<void> {
  const { apiClient } = await import("@/api/client");
  await apiClient.delete(`/chat/conversations/${conversationId}/`);
}

export async function sendMessageStream(
  conversationId: number,
  content: string,
  options: SendMessageOptions,
  handlers: StreamEventHandlers,
): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/chat/conversations/${conversationId}/messages/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        content,
        stream: true,
        model: options.model,
        language: options.language ?? "en",
        show_citations: options.showCitations ?? true,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(errorBody?.message ?? "Failed to send message.");
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const eventBlock of events) {
      const lines = eventBlock.split("\n");
      let eventName = "";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim();
        }
      }

      if (!eventName || !dataLine) {
        continue;
      }

      if (eventName === "token") {
        handlers.onToken(JSON.parse(dataLine) as string);
      } else if (eventName === "citations") {
        handlers.onCitations(JSON.parse(dataLine) as ChatCitation[]);
      } else if (eventName === "done") {
        handlers.onDone(JSON.parse(dataLine) as { message_id: number });
      } else if (eventName === "error") {
        handlers.onError(JSON.parse(dataLine) as string);
      }
    }
  }
}
