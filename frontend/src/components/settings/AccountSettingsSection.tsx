import { useEffect, useId, useState } from "react";
import { User } from "lucide-react";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

type AccountSettingsSectionProps = {
  onSave: (data: { name: string; email: string }) => Promise<void>;
  isSaving: boolean;
  saved: boolean;
};

export function AccountSettingsSection({
  onSave,
  isSaving,
  saved,
}: AccountSettingsSectionProps) {
  const { user } = useAuth();
  const nameId = useId();
  const emailId = useId();
  const usernameId = useId();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.email, user?.name]);

  return (
    <SettingsPanel
      title="Account"
      description="Manage your profile information and how others see you."
      icon={User}
      onSave={() => void onSave({ name, email })}
      isSaving={isSaving}
      saved={saved}
    >
      <SettingRow
        label="Display name"
        description="Shown in the app header and chat."
        htmlFor={nameId}
      >
        <Input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
        />
      </SettingRow>
      <SettingRow
        label="Username"
        description="Your unique login identifier."
        htmlFor={usernameId}
      >
        <Input
          id={usernameId}
          value={user?.username ?? ""}
          readOnly
          disabled
          className="bg-muted/50"
        />
      </SettingRow>
      <SettingRow
        label="Email"
        description="Used for notifications and account recovery."
        htmlFor={emailId}
      >
        <Input
          id={emailId}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </SettingRow>
    </SettingsPanel>
  );
}
