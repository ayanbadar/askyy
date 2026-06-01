import { apiClient } from "@/api/client";

export type GoogleDriveStatus = {
  connected: boolean;
  configured: boolean;
  google_email: string;
  connected_at: string | null;
  selected_folder_count: number;
  synced_file_count: number;
  active_file_count: number;
  last_synced_at: string | null;
  last_sync_status: string;
  last_sync_error: string;
  last_sync_summary: {
    added?: number;
    updated?: number;
    deleted?: number;
  };
};

export type GoogleDriveFolder = {
  id: string;
  name: string;
};

export type GoogleDriveSelectedFolder = GoogleDriveFolder & {
  selected_at: string;
};

export async function getGoogleDriveStatus(): Promise<GoogleDriveStatus> {
  const { data } = await apiClient.get<GoogleDriveStatus>(
    "/sources/google/status/",
  );
  return data;
}

export async function getGoogleDriveConnectUrl(): Promise<string> {
  const { data } = await apiClient.get<{ authorization_url: string }>(
    "/sources/google/connect/",
  );
  return data.authorization_url;
}

export async function disconnectGoogleDrive(): Promise<void> {
  await apiClient.post("/sources/google/disconnect/");
}

export async function listGoogleDriveFolders(
  parentId = "root",
): Promise<{ folders: GoogleDriveFolder[]; parent_id: string }> {
  const { data } = await apiClient.get<{
    folders: GoogleDriveFolder[];
    parent_id: string;
  }>("/sources/google/folders/", {
    params: { parent_id: parentId },
  });
  return data;
}

export async function getGoogleDriveFolderSelection(): Promise<
  GoogleDriveSelectedFolder[]
> {
  const { data } = await apiClient.get<{
    folders: GoogleDriveSelectedFolder[];
  }>("/sources/google/folders/selection/");
  return data.folders;
}

export async function saveGoogleDriveFolderSelection(
  folders: GoogleDriveFolder[],
): Promise<GoogleDriveSelectedFolder[]> {
  const { data } = await apiClient.put<{
    folders: GoogleDriveSelectedFolder[];
  }>("/sources/google/folders/selection/", { folders });
  return data.folders;
}

export async function triggerGoogleDriveSync(): Promise<void> {
  await apiClient.post("/sources/google/sync/");
}
