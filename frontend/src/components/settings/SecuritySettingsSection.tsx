import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Monitor, Shield } from "lucide-react";
import { getSecuritySettings } from "@/api/settings";
import { LoadingState } from "@/components/LoadingState";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SecuritySettingsSectionProps = {
  onSave: (data: {
    current_password?: string;
    new_password: string;
    confirm_password: string;
  }) => Promise<void>;
  isSaving: boolean;
  saved: boolean;
};

export function SecuritySettingsSection({
  onSave,
  isSaving,
  saved,
}: SecuritySettingsSectionProps) {
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: securitySettings, isLoading } = useQuery({
    queryKey: ["settings", "security"],
    queryFn: getSecuritySettings,
  });

  useEffect(() => {
    if (saved) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage(null);
    }
  }, [saved]);

  async function handleSave() {
    setErrorMessage(null);
    try {
      await onSave({
        ...(securitySettings?.requires_current_password
          ? { current_password: currentPassword }
          : {}),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password.";
      setErrorMessage(message);
      throw error;
    }
  }

  if (isLoading) {
    return (
      <LoadingState label="Loading security settings…" className="py-16" />
    );
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Security"
        description="Update your password and review active sessions."
        icon={Shield}
        onSave={() => void handleSave()}
        isSaving={isSaving}
        saved={saved}
        saveLabel="Update password"
      >
        {securitySettings?.requires_current_password && (
          <SettingRow label="Current password" htmlFor={currentPasswordId}>
            <div className="relative">
              <Input
                id={currentPasswordId}
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowCurrentPassword((value) => !value)}
                aria-label={
                  showCurrentPassword ? "Hide password" : "Show password"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </SettingRow>
        )}
        <SettingRow label="New password" htmlFor={newPasswordId}>
          <div className="relative">
            <Input
              id={newPasswordId}
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setShowNewPassword((value) => !value)}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
        </SettingRow>
        <SettingRow label="Confirm new password" htmlFor={confirmPasswordId}>
          <Input
            id={confirmPasswordId}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </SettingRow>
        {errorMessage && (
          <p className="px-1 pt-2 text-sm text-destructive">{errorMessage}</p>
        )}
      </SettingsPanel>

      <SettingsPanel
        title="Active sessions"
        description="Devices currently signed in to your account."
        hideSave
      >
        {securitySettings?.sessions.map((session) => (
          <div key={session.id} className="flex items-start gap-3 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Monitor className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{session.device}</p>
              <p className="text-sm text-muted-foreground">
                {session.location}
              </p>
            </div>
            {session.is_current && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  "bg-chart-4/15 text-chart-4",
                )}
              >
                Current
              </span>
            )}
          </div>
        ))}
      </SettingsPanel>
    </div>
  );
}
