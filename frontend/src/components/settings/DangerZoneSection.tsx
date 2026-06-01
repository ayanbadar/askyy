import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { deleteAccount, getDangerSettings } from "@/api/settings";
import { LoadingState } from "@/components/LoadingState";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export function DangerZoneSection() {
  const { logout } = useAuth();
  const passwordId = useId();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: dangerSettings, isLoading } = useQuery({
    queryKey: ["settings", "danger"],
    queryFn: getDangerSettings,
  });

  async function handleDeleteAccount() {
    setErrorMessage(null);
    setIsDeleting(true);

    try {
      await deleteAccount(
        dangerSettings?.requires_password_confirmation ? { password } : {},
      );
      setDeleteDialogOpen(false);
      setPassword("");
      logout();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete account.";
      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading || !dangerSettings) {
    return <LoadingState label="Loading danger zone…" className="py-16" />;
  }

  return (
    <SettingsPanel
      title="Danger zone"
      description="Irreversible actions for your account."
      icon={AlertTriangle}
      hideSave
    >
      <SettingRow
        label="Sign out"
        description="End your session on this device."
      >
        <Button type="button" variant="outline" onClick={logout}>
          <LogOut />
          Log out
        </Button>
      </SettingRow>
      <SettingRow
        label="Delete account"
        description="Permanently remove your account and all associated data."
      >
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setPassword("");
              setErrorMessage(null);
            }
          }}
        >
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                disabled={!dangerSettings.can_delete_account}
              >
                <Trash2 />
                Delete account
              </Button>
            }
          />
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All your conversations, documents,
                and settings will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            {!dangerSettings.can_delete_account && (
              <p className="text-sm text-destructive">
                You cannot delete the only admin account on this instance.
              </p>
            )}
            {dangerSettings.requires_password_confirmation && (
              <div className="space-y-2">
                <label htmlFor={passwordId} className="text-sm font-medium">
                  Confirm with your password
                </label>
                <Input
                  id={passwordId}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  disabled={isDeleting}
                />
              </div>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDeleteAccount()}
                disabled={
                  isDeleting ||
                  !dangerSettings.can_delete_account ||
                  (dangerSettings.requires_password_confirmation && !password)
                }
              >
                {isDeleting ? "Deleting…" : "Delete account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SettingRow>
    </SettingsPanel>
  );
}
