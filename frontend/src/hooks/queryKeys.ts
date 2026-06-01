export const googleDriveStatusQueryKey = [
  "sources",
  "google",
  "status",
] as const;
export const googleDriveFoldersQueryKey = (parentId: string) =>
  ["sources", "google", "folders", parentId] as const;
export const googleDriveSelectionQueryKey = [
  "sources",
  "google",
  "selection",
] as const;
export const documentsQueryKey = (search?: string) =>
  ["documents", search ?? ""] as const;

export const userDashboardQueryKey = ["dashboard", "user"] as const;
export const adminDashboardQueryKey = ["dashboard", "admin"] as const;

export const chatStatusQueryKey = ["chat", "status"] as const;
export const chatConversationsQueryKey = ["chat", "conversations"] as const;
export const chatConversationQueryKey = (conversationId: number | null) =>
  ["chat", "conversation", conversationId] as const;
