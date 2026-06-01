import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Unplug,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { GoogleDriveStatus } from "@/api/sources";
import { cn } from "@/lib/utils";

type GoogleDriveConnectionCardProps = {
  status: GoogleDriveStatus | undefined;
  isLoading: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
};

function formatWhen(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

function syncStatusLabel(status: GoogleDriveStatus) {
  switch (status.last_sync_status) {
    case "syncing":
      return "Syncing your folders…";
    case "success":
      return "Up to date";
    case "error":
      return "Sync failed";
    default:
      return "Waiting for first sync";
  }
}

export function GoogleDriveConnectionCard({
  status,
  isLoading,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
  onSyncNow,
  isSyncing,
}: GoogleDriveConnectionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    );
  }

  if (!status?.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Drive</CardTitle>
          <CardDescription>
            Google Drive is not configured on the server yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Setup required</AlertTitle>
            <AlertDescription>
              Ask your administrator to add Google OAuth credentials and enable
              the Drive API.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Drive</CardTitle>
          <CardDescription>
            Connect My Drive so Askyy can read documents from folders you
            choose.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ll sign in with Google and allow read-only access to My
            Drive. Only folders you select will be used.
          </p>
          <Button type="button" onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="animate-spin" />
                Opening Google…
              </>
            ) : (
              "Connect Google Drive"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary = status.last_sync_summary ?? {};

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-chart-4" />
            Google Drive connected
          </CardTitle>
          <CardDescription>
            Connected as {status.google_email || "your Google account"}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? <Loader2 className="animate-spin" /> : <Unplug />}
          Disconnect
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Selected folders</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {status.selected_folder_count}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Tracked documents</p>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {status.active_file_count}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Last synced</p>
            <p className="mt-1 text-sm font-medium">
              {formatWhen(status.last_synced_at)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
            status.last_sync_status === "error" &&
              "border-destructive/30 bg-destructive/5 text-destructive",
            status.last_sync_status === "success" &&
              "border-chart-4/30 bg-chart-4/5 text-chart-4",
            status.last_sync_status === "syncing" &&
              "border-primary/30 bg-primary/5 text-primary",
          )}
        >
          {status.last_sync_status === "syncing" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : status.last_sync_status === "error" ? (
            <AlertCircle className="size-4" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          <span>{syncStatusLabel(status)}</span>
          {(summary.added || summary.updated || summary.deleted) &&
            status.last_sync_status === "success" && (
              <span className="text-muted-foreground">
                · {summary.added ?? 0} added, {summary.updated ?? 0} updated,{" "}
                {summary.deleted ?? 0} removed
              </span>
            )}
        </div>

        {status.last_sync_error && (
          <Alert variant="destructive">
            <AlertTitle>Sync error</AlertTitle>
            <AlertDescription>{status.last_sync_error}</AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Askyy checks your selected folders every 5 minutes for new, updated,
          or deleted documents.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSyncNow}
          disabled={isSyncing || status.last_sync_status === "syncing"}
        >
          {isSyncing || status.last_sync_status === "syncing" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          Sync now
        </Button>
      </CardContent>
    </Card>
  );
}
