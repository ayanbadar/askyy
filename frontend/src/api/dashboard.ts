import { apiClient } from "@/api/client";
import type {
  Conversation,
  KnowledgeSource,
  TopTopic,
  UserDocument,
  WeeklyActivity,
} from "@/data/dashboardTypes";

export type UserDashboardStatsResponse = {
  my_conversations: number;
  my_conversations_change: number;
  messages_this_week: number;
  messages_this_week_change: number;
  my_documents: number;
  my_documents_change: number;
  saved_answers: number;
  saved_answers_change: number;
};

export type DashboardConversationResponse = {
  id: string;
  topic: string;
  messages: number;
  status: "resolved" | "active" | "escalated";
  satisfaction: number | null;
  time_ago: string;
  user?: string;
};

export type UserDocumentResponse = {
  id: number;
  name: string;
  type: string;
  mime_type: string;
  uploaded_at: string;
  first_seen_at: string;
  status: "ready" | "processing" | "failed";
  index_status: string;
};

export type UserDashboardResponse = {
  stats: UserDashboardStatsResponse;
  weekly_activity: WeeklyActivity[];
  recent_conversations: DashboardConversationResponse[];
  top_topics: TopTopic[];
  documents: UserDocumentResponse[];
};

export type AdminDashboardStatsResponse = {
  total_conversations: number;
  total_conversations_change: number;
  messages_today: number;
  messages_today_change: number;
  avg_response_time_sec: number | null;
  avg_response_time_change: number | null;
  satisfaction_rate: number | null;
  satisfaction_change: number | null;
  documents_indexed: number;
  documents_change: number;
  token_usage_today: number;
  token_usage_change: number;
};

export type ResponseBreakdownResponse = {
  resolved_first_try: number;
  multi_turn: number;
  escalated: number;
  abandoned: number;
};

export type KnowledgeSourceResponse = {
  name: string;
  documents: number;
  status: "synced" | "syncing" | "error";
  last_synced: string;
  google_email?: string;
};

export type ModelUsageResponse = {
  model: string;
  requests_today: number;
  avg_tokens_per_request: number;
  estimated_cost_usd: number;
};

export type AdminDashboardResponse = {
  stats: AdminDashboardStatsResponse;
  weekly_activity: WeeklyActivity[];
  recent_conversations: DashboardConversationResponse[];
  top_topics: TopTopic[];
  response_breakdown: ResponseBreakdownResponse;
  knowledge_sources: KnowledgeSourceResponse[];
  model_usage: ModelUsageResponse;
  total_chunks: number;
};

export type UserDashboardViewModel = {
  stats: {
    myConversations: number;
    myConversationsChange: number;
    messagesThisWeek: number;
    messagesThisWeekChange: number;
    myDocuments: number;
    myDocumentsChange: number;
    savedAnswers: number;
    savedAnswersChange: number;
  };
  weeklyActivity: WeeklyActivity[];
  recentConversations: Conversation[];
  topTopics: TopTopic[];
  documents: UserDocument[];
};

export type AdminDashboardViewModel = {
  stats: {
    totalConversations: number;
    totalConversationsChange: number;
    messagesToday: number;
    messagesTodayChange: number;
    avgResponseTimeSec: number | null;
    avgResponseTimeChange: number | null;
    satisfactionRate: number | null;
    satisfactionChange: number | null;
    documentsIndexed: number;
    documentsChange: number;
    tokenUsageToday: number;
    tokenUsageChange: number;
  };
  weeklyActivity: WeeklyActivity[];
  recentConversations: Conversation[];
  topTopics: TopTopic[];
  responseBreakdown: {
    resolvedFirstTry: number;
    multiTurn: number;
    escalated: number;
    abandoned: number;
  };
  knowledgeSources: KnowledgeSource[];
  modelUsage: {
    model: string;
    requestsToday: number;
    avgTokensPerRequest: number;
    estimatedCostUsd: number;
  };
  totalChunks: number;
};

function mapConversation(
  conversation: DashboardConversationResponse,
): Conversation {
  return {
    id: conversation.id,
    user: conversation.user,
    topic: conversation.topic,
    messages: conversation.messages,
    status: conversation.status,
    satisfaction: conversation.satisfaction,
    timeAgo: conversation.time_ago,
  };
}

function mapUserDocument(document: UserDocumentResponse): UserDocument {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    uploadedAt: document.uploaded_at,
    status: document.status,
  };
}

function mapKnowledgeSource(source: KnowledgeSourceResponse): KnowledgeSource {
  return {
    name: source.name,
    documents: source.documents,
    status: source.status,
    lastSynced: source.last_synced,
  };
}

export function mapUserDashboard(
  response: UserDashboardResponse,
): UserDashboardViewModel {
  const { stats } = response;

  return {
    stats: {
      myConversations: stats.my_conversations,
      myConversationsChange: stats.my_conversations_change,
      messagesThisWeek: stats.messages_this_week,
      messagesThisWeekChange: stats.messages_this_week_change,
      myDocuments: stats.my_documents,
      myDocumentsChange: stats.my_documents_change,
      savedAnswers: stats.saved_answers,
      savedAnswersChange: stats.saved_answers_change,
    },
    weeklyActivity: response.weekly_activity,
    recentConversations: response.recent_conversations.map(mapConversation),
    topTopics: response.top_topics,
    documents: response.documents.map(mapUserDocument),
  };
}

export function mapAdminDashboard(
  response: AdminDashboardResponse,
): AdminDashboardViewModel {
  const { stats, response_breakdown, model_usage } = response;

  return {
    stats: {
      totalConversations: stats.total_conversations,
      totalConversationsChange: stats.total_conversations_change,
      messagesToday: stats.messages_today,
      messagesTodayChange: stats.messages_today_change,
      avgResponseTimeSec: stats.avg_response_time_sec,
      avgResponseTimeChange: stats.avg_response_time_change,
      satisfactionRate: stats.satisfaction_rate,
      satisfactionChange: stats.satisfaction_change,
      documentsIndexed: stats.documents_indexed,
      documentsChange: stats.documents_change,
      tokenUsageToday: stats.token_usage_today,
      tokenUsageChange: stats.token_usage_change,
    },
    weeklyActivity: response.weekly_activity,
    recentConversations: response.recent_conversations.map(mapConversation),
    topTopics: response.top_topics,
    responseBreakdown: {
      resolvedFirstTry: response_breakdown.resolved_first_try,
      multiTurn: response_breakdown.multi_turn,
      escalated: response_breakdown.escalated,
      abandoned: response_breakdown.abandoned,
    },
    knowledgeSources: response.knowledge_sources.map(mapKnowledgeSource),
    modelUsage: {
      model: model_usage.model,
      requestsToday: model_usage.requests_today,
      avgTokensPerRequest: model_usage.avg_tokens_per_request,
      estimatedCostUsd: model_usage.estimated_cost_usd,
    },
    totalChunks: response.total_chunks,
  };
}

export async function getUserDashboard(): Promise<UserDashboardViewModel> {
  const { data } = await apiClient.get<UserDashboardResponse>("/dashboard/");
  return mapUserDashboard(data);
}

export async function getAdminDashboard(): Promise<AdminDashboardViewModel> {
  const { data } =
    await apiClient.get<AdminDashboardResponse>("/dashboard/admin/");
  return mapAdminDashboard(data);
}
