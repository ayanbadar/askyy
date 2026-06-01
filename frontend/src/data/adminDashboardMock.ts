import type {
  Conversation,
  KnowledgeSource,
  TopTopic,
  WeeklyActivity,
} from "@/data/dashboardTypes";

export const adminDashboardStats = {
  totalConversations: 1247,
  totalConversationsChange: 12.4,
  messagesToday: 384,
  messagesTodayChange: 8.2,
  avgResponseTimeSec: 1.8,
  avgResponseTimeChange: -15.3,
  satisfactionRate: 94.2,
  satisfactionChange: 2.1,
  documentsIndexed: 156,
  documentsChange: 5,
  tokenUsageToday: 842_000,
  tokenUsageChange: 11.6,
};

export const adminWeeklyActivity: WeeklyActivity[] = [
  { day: "Mon", conversations: 142, messages: 520 },
  { day: "Tue", conversations: 168, messages: 612 },
  { day: "Wed", conversations: 155, messages: 580 },
  { day: "Thu", conversations: 189, messages: 701 },
  { day: "Fri", conversations: 201, messages: 748 },
  { day: "Sat", conversations: 98, messages: 312 },
  { day: "Sun", conversations: 87, messages: 289 },
];

export const adminRecentConversations: Conversation[] = [
  {
    id: "conv-001",
    user: "Sarah Chen",
    topic: "Product pricing tiers",
    messages: 8,
    status: "resolved",
    satisfaction: 5,
    timeAgo: "2 min ago",
  },
  {
    id: "conv-002",
    user: "Marcus Webb",
    topic: "API rate limits",
    messages: 12,
    status: "active",
    satisfaction: null,
    timeAgo: "8 min ago",
  },
  {
    id: "conv-003",
    user: "Elena Rodriguez",
    topic: "Refund policy",
    messages: 5,
    status: "resolved",
    satisfaction: 4,
    timeAgo: "15 min ago",
  },
  {
    id: "conv-004",
    user: "James Okonkwo",
    topic: "Integration setup",
    messages: 18,
    status: "escalated",
    satisfaction: 2,
    timeAgo: "32 min ago",
  },
  {
    id: "conv-005",
    user: "Priya Sharma",
    topic: "Account permissions",
    messages: 6,
    status: "resolved",
    satisfaction: 5,
    timeAgo: "1 hr ago",
  },
];

export const adminTopTopics: TopTopic[] = [
  { topic: "Billing & payments", count: 234, percentage: 28 },
  { topic: "Product features", count: 189, percentage: 23 },
  { topic: "Technical support", count: 156, percentage: 19 },
  { topic: "Account management", count: 112, percentage: 13 },
  { topic: "Onboarding", count: 89, percentage: 11 },
  { topic: "Other", count: 52, percentage: 6 },
];

export const adminResponseBreakdown = {
  resolvedFirstTry: 78,
  multiTurn: 14,
  escalated: 5,
  abandoned: 3,
};

export const adminKnowledgeSources: KnowledgeSource[] = [
  {
    name: "Company wiki",
    documents: 45,
    status: "synced",
    lastSynced: "10 min ago",
  },
  {
    name: "Help center",
    documents: 62,
    status: "synced",
    lastSynced: "1 hr ago",
  },
  {
    name: "Product docs",
    documents: 38,
    status: "syncing",
    lastSynced: "Syncing…",
  },
  {
    name: "Support tickets",
    documents: 11,
    status: "error",
    lastSynced: "Failed 2 hr ago",
  },
];

export const adminModelUsage = {
  model: "GPT-4o mini",
  requestsToday: 384,
  avgTokensPerRequest: 2190,
  estimatedCostUsd: 4.82,
};

export const ADMIN_TOTAL_CHUNKS = 4280;
