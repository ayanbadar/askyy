import { useId, useState } from "react";
import { Bell } from "lucide-react";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { defaultNotificationPreferences } from "@/data/settingsMock";

type NotificationSettingsSectionProps = {
  onSave: () => Promise<void>;
  isSaving: boolean;
  saved: boolean;
};

export function NotificationSettingsSection({
  onSave,
  isSaving,
  saved,
}: NotificationSettingsSectionProps) {
  const emailId = useId();
  const weeklyId = useId();
  const productId = useId();
  const documentId = useId();

  const [emailNotifications, setEmailNotifications] = useState(
    defaultNotificationPreferences.emailNotifications,
  );
  const [weeklySummary, setWeeklySummary] = useState(
    defaultNotificationPreferences.weeklySummary,
  );
  const [productUpdates, setProductUpdates] = useState(
    defaultNotificationPreferences.productUpdates,
  );
  const [documentProcessingAlerts, setDocumentProcessingAlerts] = useState(
    defaultNotificationPreferences.documentProcessingAlerts,
  );

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose what updates you receive by email."
      icon={Bell}
      onSave={() => void onSave()}
      isSaving={isSaving}
      saved={saved}
    >
      <SettingRow
        label="Email notifications"
        description="Receive alerts for important account activity."
        htmlFor={emailId}
      >
        <SettingsToggle
          id={emailId}
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
        />
      </SettingRow>
      <SettingRow
        label="Weekly activity summary"
        description="A digest of your chat and document activity."
        htmlFor={weeklyId}
      >
        <SettingsToggle
          id={weeklyId}
          checked={weeklySummary}
          onCheckedChange={setWeeklySummary}
        />
      </SettingRow>
      <SettingRow
        label="Product updates"
        description="News about new features and improvements."
        htmlFor={productId}
      >
        <SettingsToggle
          id={productId}
          checked={productUpdates}
          onCheckedChange={setProductUpdates}
        />
      </SettingRow>
      <SettingRow
        label="Document processing alerts"
        description="Notify when uploads finish indexing or fail."
        htmlFor={documentId}
      >
        <SettingsToggle
          id={documentId}
          checked={documentProcessingAlerts}
          onCheckedChange={setDocumentProcessingAlerts}
        />
      </SettingRow>
    </SettingsPanel>
  );
}
