import type {
  Conversation,
  TopTopic,
  UserDocument,
  WeeklyActivity,
} from "@/data/dashboardTypes";

export const userDashboardStats = {
  myConversations: 24,
  myConversationsChange: 20,
  messagesThisWeek: 89,
  messagesThisWeekChange: 15,
  myDocuments: 12,
  myDocumentsChange: 2,
  savedAnswers: 8,
  savedAnswersChange: 1,
};

export const userWeeklyActivity: WeeklyActivity[] = [
  { day: "Mon", conversations: 3, messages: 14 },
  { day: "Tue", conversations: 5, messages: 22 },
  { day: "Wed", conversations: 4, messages: 18 },
  { day: "Thu", conversations: 6, messages: 28 },
  { day: "Fri", conversations: 4, messages: 19 },
  { day: "Sat", conversations: 1, messages: 4 },
  { day: "Sun", conversations: 1, messages: 4 },
];

export const userRecentChats: Conversation[] = [
  {
    id: "my-conv-001",
    topic: "How do I reset my password?",
    messages: 4,
    status: "resolved",
    satisfaction: 5,
    timeAgo: "1 hr ago",
  },
  {
    id: "my-conv-002",
    topic: "Export chat history",
    messages: 6,
    status: "active",
    satisfaction: null,
    timeAgo: "3 hr ago",
  },
  {
    id: "my-conv-003",
    topic: "Upload PDF documents",
    messages: 3,
    status: "resolved",
    satisfaction: 4,
    timeAgo: "Yesterday",
  },
  {
    id: "my-conv-004",
    topic: "Billing cycle questions",
    messages: 7,
    status: "resolved",
    satisfaction: 5,
    timeAgo: "2 days ago",
  },
];

export const userTopQuestions: TopTopic[] = [
  { topic: "Account & login", count: 9, percentage: 38 },
  { topic: "Document uploads", count: 6, percentage: 25 },
  { topic: "Billing", count: 4, percentage: 17 },
  { topic: "Product how-to", count: 3, percentage: 12 },
  { topic: "Other", count: 2, percentage: 8 },
];

export const userDocuments: UserDocument[] = [
  {
    name: "Q1 Product Roadmap.pdf",
    type: "PDF",
    uploadedAt: "2 days ago",
    status: "ready",
  },
  {
    name: "Support FAQ.docx",
    type: "Word",
    uploadedAt: "5 days ago",
    status: "ready",
  },
  {
    name: "Team Onboarding.md",
    type: "Markdown",
    uploadedAt: "1 week ago",
    status: "ready",
  },
  {
    name: "Pricing Sheet 2026.xlsx",
    type: "Excel",
    uploadedAt: "Just now",
    status: "processing",
  },
];
