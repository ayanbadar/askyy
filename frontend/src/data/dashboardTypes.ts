export type WeeklyActivity = {
  day: string;
  conversations: number;
  messages: number;
};

export type ConversationStatus = "resolved" | "active" | "escalated";

export type Conversation = {
  id: string;
  user?: string;
  topic: string;
  messages: number;
  status: ConversationStatus;
  satisfaction: number | null;
  timeAgo: string;
};

export type TopTopic = {
  topic: string;
  count: number;
  percentage: number;
};

export type KnowledgeSource = {
  name: string;
  documents: number;
  status: "synced" | "syncing" | "error";
  lastSynced: string;
};

export type UserDocument = {
  id?: number;
  name: string;
  type: string;
  uploadedAt: string;
  status: "ready" | "processing" | "failed";
};
