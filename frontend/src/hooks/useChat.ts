import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  deleteConversation,
  getChatStatus,
  getConversation,
  listConversations,
  sendMessageStream,
  type ChatCitation,
  type SendMessageOptions,
} from "@/api/chat";
import {
  chatConversationQueryKey,
  chatConversationsQueryKey,
  chatStatusQueryKey,
  userDashboardQueryKey,
  adminDashboardQueryKey,
} from "@/hooks/queryKeys";

export function useChatStatusQuery() {
  return useQuery({
    queryKey: chatStatusQueryKey,
    queryFn: getChatStatus,
  });
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatConversationsQueryKey,
    queryFn: listConversations,
  });
}

export function useConversationQuery(conversationId: number | null) {
  return useQuery({
    queryKey: chatConversationQueryKey(conversationId),
    queryFn: () => getConversation(conversationId!),
    enabled: conversationId !== null,
  });
}

export function useCreateConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatConversationsQueryKey,
      });
      void queryClient.invalidateQueries({ queryKey: userDashboardQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey });
    },
  });
}

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatConversationsQueryKey,
      });
      void queryClient.invalidateQueries({ queryKey: userDashboardQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey });
    },
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      options,
      onToken,
      onCitations,
    }: {
      conversationId: number;
      content: string;
      options?: SendMessageOptions;
      onToken: (token: string) => void;
      onCitations: (citations: ChatCitation[]) => void;
    }) => {
      await sendMessageStream(conversationId, content, options ?? {}, {
        onToken,
        onCitations,
        onDone: () => undefined,
        onError: (message) => {
          throw new Error(message);
        },
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: chatConversationQueryKey(variables.conversationId),
      });
      await queryClient.invalidateQueries({
        queryKey: chatConversationsQueryKey,
      });
      void queryClient.invalidateQueries({ queryKey: userDashboardQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey });
    },
  });
}
