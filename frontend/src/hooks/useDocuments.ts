import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/api/documents";
import type { SyncedDocument } from "@/api/documents";
import { documentsQueryKey } from "@/hooks/queryKeys";

function hasActiveIndexing(documents: SyncedDocument[]): boolean {
  return documents.some(
    (document) =>
      document.index_status === "pending" ||
      document.index_status === "processing",
  );
}

export function useDocumentsQuery(search?: string) {
  return useQuery({
    queryKey: documentsQueryKey(search),
    queryFn: () => listDocuments(search),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const documents = query.state.data?.documents ?? [];
      return hasActiveIndexing(documents) ? 5_000 : false;
    },
  });
}
