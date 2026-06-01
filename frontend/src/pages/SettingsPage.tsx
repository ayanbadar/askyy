import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, Server, Shield, User } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { AccountSettingsSection } from "@/components/settings/AccountSettingsSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { NotificationSettingsSection } from "@/components/settings/NotificationSettingsSection";
import { PlatformSettingsSection } from "@/components/settings/PlatformSettingsSection";
import { SecuritySettingsSection } from "@/components/settings/SecuritySettingsSection";
import {
  SettingsNav,
  type SettingsNavItem,
  type SettingsSectionId,
} from "@/components/settings/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  changePassword,
  updatePlatformSettings,
  type ChangePasswordPayload,
  type UpdatePlatformSettingsPayload,
} from "@/api/settings";

function useSaveFeedback<T = void>(action?: (data: T) => Promise<void>) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(
    async (data: T) => {
      setIsSaving(true);
      setSaved(false);
      try {
        if (action) {
          await action(data);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      } finally {
        setIsSaving(false);
      }
    },
    [action],
  );

  return { isSaving, saved, save };
}

export function SettingsPage() {
  const { user, isLoading, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("account");
  const saveFeedback = useSaveFeedback();
  const accountSaveFeedback = useSaveFeedback(updateProfile);
  const securitySaveFeedback = useSaveFeedback<ChangePasswordPayload>(
    async (data) => {
      await changePassword(data);
      await queryClient.invalidateQueries({
        queryKey: ["settings", "security"],
      });
    },
  );
  const platformSaveFeedback = useSaveFeedback<UpdatePlatformSettingsPayload>(
    async (data) => {
      await updatePlatformSettings(data);
      await queryClient.invalidateQueries({
        queryKey: ["settings", "platform"],
      });
    },
  );

  const navItems = useMemo<SettingsNavItem[]>(() => {
    const items: SettingsNavItem[] = [
      { id: "account", label: "Account", icon: User },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "security", label: "Security", icon: Shield },
    ];

    if (user?.is_superuser) {
      items.push({
        id: "platform",
        label: "Platform",
        icon: Server,
        adminOnly: true,
      });
    }

    items.push({ id: "danger", label: "Danger zone", icon: AlertTriangle });

    return items;
  }, [user?.is_superuser]);

  if (isLoading) {
    return <LoadingState label="Loading settings…" className="py-16" />;
  }

  function renderSection() {
    const sectionProps = {
      onSave: () => saveFeedback.save(undefined as void),
      isSaving: saveFeedback.isSaving,
      saved: saveFeedback.saved,
    };

    switch (activeSection) {
      case "account":
        return (
          <AccountSettingsSection
            onSave={accountSaveFeedback.save}
            isSaving={accountSaveFeedback.isSaving}
            saved={accountSaveFeedback.saved}
          />
        );
      case "notifications":
        return <NotificationSettingsSection {...sectionProps} />;
      case "security":
        return (
          <SecuritySettingsSection
            onSave={securitySaveFeedback.save}
            isSaving={securitySaveFeedback.isSaving}
            saved={securitySaveFeedback.saved}
          />
        );
      case "platform":
        return user?.is_superuser ? (
          <PlatformSettingsSection
            onSave={platformSaveFeedback.save}
            isSaving={platformSaveFeedback.isSaving}
            saved={platformSaveFeedback.saved}
          />
        ) : null;
      case "danger":
        return <DangerZoneSection />;
      default:
        return null;
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-normal">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account, security, and notifications.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsNav
          items={navItems}
          activeId={activeSection}
          onChange={setActiveSection}
        />
        <div>{renderSection()}</div>
      </div>
    </section>
  );
}
