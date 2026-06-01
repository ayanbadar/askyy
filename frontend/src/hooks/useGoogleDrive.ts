import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disconnectGoogleDrive,
  getGoogleDriveConnectUrl,
  getGoogleDriveFolderSelection,
  getGoogleDriveStatus,
  listGoogleDriveFolders,
  saveGoogleDriveFolderSelection,
  triggerGoogleDriveSync,
  type GoogleDriveFolder,
} from "@/api/sources";
import {
  googleDriveFoldersQueryKey,
  googleDriveSelectionQueryKey,
  googleDriveStatusQueryKey,
  userDashboardQueryKey,
  adminDashboardQueryKey,
} from "@/hooks/queryKeys";

export function useGoogleDriveStatusQuery() {
  return useQuery({
    queryKey: googleDriveStatusQueryKey,
    queryFn: getGoogleDriveStatus,
    refetchInterval: (query) => {
      const status = query.state.data?.last_sync_status;
      return status === "syncing" ? 3000 : false;
    },
  });
}

export function useGoogleDriveFoldersQuery(parentId: string, enabled: boolean) {
  return useQuery({
    queryKey: googleDriveFoldersQueryKey(parentId),
    queryFn: () => listGoogleDriveFolders(parentId),
    enabled,
  });
}

export function useGoogleDriveSelectionQuery(enabled: boolean) {
  return useQuery({
    queryKey: googleDriveSelectionQueryKey,
    queryFn: getGoogleDriveFolderSelection,
    enabled,
  });
}

export function useGoogleDriveMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: googleDriveStatusQueryKey });
    void queryClient.invalidateQueries({
      queryKey: googleDriveSelectionQueryKey,
    });
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
    void queryClient.invalidateQueries({ queryKey: userDashboardQueryKey });
    void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey });
  };

  const connect = useMutation({
    mutationFn: getGoogleDriveConnectUrl,
    onSuccess: (authorizationUrl) => {
      window.location.href = authorizationUrl;
    },
  });

  const disconnect = useMutation({
    mutationFn: disconnectGoogleDrive,
    onSuccess: invalidate,
  });

  const saveSelection = useMutation({
    mutationFn: (folders: GoogleDriveFolder[]) =>
      saveGoogleDriveFolderSelection(folders),
    onSuccess: invalidate,
  });

  const syncNow = useMutation({
    mutationFn: triggerGoogleDriveSync,
    onSuccess: invalidate,
  });

  return { connect, disconnect, saveSelection, syncNow };
}
