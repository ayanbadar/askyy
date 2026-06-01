import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleDriveConnectionCard } from "@/components/source/GoogleDriveConnectionCard";
import {
  GoogleDriveFolderPicker,
  useFolderSelectionState,
} from "@/components/source/GoogleDriveFolderPicker";
import {
  useGoogleDriveFoldersQuery,
  useGoogleDriveMutations,
  useGoogleDriveSelectionQuery,
  useGoogleDriveStatusQuery,
} from "@/hooks/useGoogleDrive";

export function SourcePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [banner, setBanner] = useState<string | null>(null);

  const statusQuery = useGoogleDriveStatusQuery();
  const connected = statusQuery.data?.connected ?? false;

  const foldersQuery = useGoogleDriveFoldersQuery("root", connected);
  const selectionQuery = useGoogleDriveSelectionQuery(connected);
  const { connect, disconnect, saveSelection, syncNow } =
    useGoogleDriveMutations();

  const savedFolders = selectionQuery.data ?? [];
  const availableFolders = foldersQuery.data?.folders ?? [];

  const {
    savedFolderIds,
    selectedFolderIds,
    hasChanges,
    toggleFolder,
    getSelectedFolderList,
  } = useFolderSelectionState({
    savedFolders,
  });

  useEffect(() => {
    const result = searchParams.get("google_drive");
    if (!result) {
      return;
    }

    if (result === "connected") {
      setBanner(
        "Google Drive connected successfully. Choose folders to sync below.",
      );
    } else {
      setBanner(
        "Google Drive connection failed. Please try again or contact support if the problem continues.",
      );
    }

    searchParams.delete("google_drive");
    searchParams.delete("reason");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-normal">Source</h1>
        <p className="mt-2 text-muted-foreground">
          Connect Google Drive and choose which My Drive folders Askyy should
          keep in sync for your chatbot.
        </p>
      </div>

      {banner && (
        <Alert>
          <AlertTitle>Google Drive</AlertTitle>
          <AlertDescription>{banner}</AlertDescription>
        </Alert>
      )}

      <GoogleDriveConnectionCard
        status={statusQuery.data}
        isLoading={statusQuery.isLoading}
        isConnecting={connect.isPending}
        isDisconnecting={disconnect.isPending}
        onConnect={() => connect.mutate()}
        onDisconnect={() => disconnect.mutate()}
        onSyncNow={() => syncNow.mutate()}
        isSyncing={syncNow.isPending}
      />

      {connected && (
        <GoogleDriveFolderPicker
          folders={availableFolders}
          selectedFolderIds={selectedFolderIds}
          savedFolderIds={savedFolderIds}
          isLoading={foldersQuery.isLoading || selectionQuery.isLoading}
          isSaving={saveSelection.isPending}
          onToggleFolder={toggleFolder}
          onSave={() => saveSelection.mutate(getSelectedFolderList())}
          hasChanges={hasChanges}
        />
      )}
    </section>
  );
}
