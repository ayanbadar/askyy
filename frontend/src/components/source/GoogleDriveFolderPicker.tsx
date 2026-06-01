import { useEffect, useMemo, useState } from "react";
import { Folder, Loader2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { GoogleDriveFolder } from "@/api/sources";
import { cn } from "@/lib/utils";

type GoogleDriveFolderPickerProps = {
  folders: GoogleDriveFolder[];
  selectedFolderIds: Set<string>;
  savedFolderIds: Set<string>;
  isLoading: boolean;
  isSaving: boolean;
  onToggleFolder: (folder: GoogleDriveFolder) => void;
  onSave: () => void;
  hasChanges: boolean;
};

export function GoogleDriveFolderPicker({
  folders,
  selectedFolderIds,
  savedFolderIds,
  isLoading,
  isSaving,
  onToggleFolder,
  onSave,
  hasChanges,
}: GoogleDriveFolderPickerProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose folders from My Drive</CardTitle>
        <CardDescription>
          Select the folders Askyy should watch. Documents inside these folders
          will stay in sync automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {folders.length === 0 ? (
          <Alert>
            <AlertTitle>No folders found</AlertTitle>
            <AlertDescription>
              Create a folder in My Drive, then refresh this page.
            </AlertDescription>
          </Alert>
        ) : (
          <ul className="space-y-2">
            {folders.map((folder) => {
              const isSelected = selectedFolderIds.has(folder.id);
              const isSaved = savedFolderIds.has(folder.id);

              return (
                <li key={folder.id}>
                  <button
                    type="button"
                    onClick={() => onToggleFolder(folder)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Folder className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {folder.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {isSaved
                          ? "Currently synced"
                          : isSelected
                            ? "Selected — save to start syncing"
                            : "Not selected"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "size-4 shrink-0 rounded border",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-input bg-background",
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {folders.length > 0 && (
        <CardFooter className="justify-end gap-3">
          <p className="mr-auto text-sm text-muted-foreground">
            {selectedFolderIds.size} folder
            {selectedFolderIds.size === 1 ? "" : "s"} selected
          </p>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save />
                Save folders
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

type UseFolderSelectionStateOptions = {
  savedFolders: GoogleDriveFolder[];
};

export function useFolderSelectionState({
  savedFolders,
}: UseFolderSelectionStateOptions) {
  const savedFolderIds = useMemo(
    () => new Set(savedFolders.map((folder) => folder.id)),
    [savedFolders],
  );

  const [selectedFolders, setSelectedFolders] = useState<
    Map<string, GoogleDriveFolder>
  >(new Map());

  useEffect(() => {
    const next = new Map<string, GoogleDriveFolder>();
    for (const folder of savedFolders) {
      next.set(folder.id, folder);
    }
    setSelectedFolders(next);
  }, [savedFolders]);

  const selectedFolderIds = useMemo(
    () => new Set(selectedFolders.keys()),
    [selectedFolders],
  );

  const hasChanges = useMemo(() => {
    if (selectedFolderIds.size !== savedFolderIds.size) {
      return true;
    }

    for (const id of selectedFolderIds) {
      if (!savedFolderIds.has(id)) {
        return true;
      }
    }

    return false;
  }, [savedFolderIds, selectedFolderIds]);

  function toggleFolder(folder: GoogleDriveFolder) {
    setSelectedFolders((current) => {
      const next = new Map(current);
      if (next.has(folder.id)) {
        next.delete(folder.id);
      } else {
        next.set(folder.id, folder);
      }
      return next;
    });
  }

  function getSelectedFolderList() {
    return Array.from(selectedFolders.values());
  }

  return {
    savedFolderIds,
    selectedFolderIds,
    hasChanges,
    toggleFolder,
    getSelectedFolderList,
  };
}
