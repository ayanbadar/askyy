import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";
import { getPlatformSettings } from "@/api/settings";
import { LoadingState } from "@/components/LoadingState";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { SettingsSelect } from "@/components/settings/SettingsSelect";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { Input } from "@/components/ui/input";

type PlatformSettingsSectionProps = {
  onSave: (data: {
    default_model: string;
    max_tokens_per_request: number;
    rate_limit_per_minute: number;
    public_signup_enabled: boolean;
    maintenance_mode: boolean;
  }) => Promise<void>;
  isSaving: boolean;
  saved: boolean;
};

export function PlatformSettingsSection({
  onSave,
  isSaving,
  saved,
}: PlatformSettingsSectionProps) {
  const modelId = useId();
  const tokensId = useId();
  const rateLimitId = useId();
  const signupId = useId();
  const maintenanceId = useId();

  const { data: platformSettings, isLoading } = useQuery({
    queryKey: ["settings", "platform"],
    queryFn: getPlatformSettings,
  });

  const [defaultModel, setDefaultModel] = useState("");
  const [maxTokens, setMaxTokens] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [publicSignupEnabled, setPublicSignupEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!platformSettings) {
      return;
    }

    setDefaultModel(platformSettings.default_model);
    setMaxTokens(String(platformSettings.max_tokens_per_request));
    setRateLimit(String(platformSettings.rate_limit_per_minute));
    setPublicSignupEnabled(platformSettings.public_signup_enabled);
    setMaintenanceMode(platformSettings.maintenance_mode);
  }, [platformSettings]);

  async function handleSave() {
    setErrorMessage(null);

    const maxTokensPerRequest = Number(maxTokens);
    const rateLimitPerMinute = Number(rateLimit);

    if (
      !Number.isFinite(maxTokensPerRequest) ||
      maxTokensPerRequest < 256 ||
      maxTokensPerRequest > 128000
    ) {
      setErrorMessage("Max tokens must be between 256 and 128,000.");
      return;
    }

    if (
      !Number.isFinite(rateLimitPerMinute) ||
      rateLimitPerMinute < 1 ||
      rateLimitPerMinute > 1000
    ) {
      setErrorMessage("Rate limit must be between 1 and 1,000.");
      return;
    }

    try {
      await onSave({
        default_model: defaultModel,
        max_tokens_per_request: maxTokensPerRequest,
        rate_limit_per_minute: rateLimitPerMinute,
        public_signup_enabled: publicSignupEnabled,
        maintenance_mode: maintenanceMode,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save platform settings.";
      setErrorMessage(message);
      throw error;
    }
  }

  if (isLoading || !platformSettings) {
    return (
      <LoadingState label="Loading platform settings…" className="py-16" />
    );
  }

  return (
    <SettingsPanel
      title="Platform"
      description="Global chatbot settings for all users on this instance."
      icon={Server}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saved={saved}
    >
      <SettingRow
        label="Default model"
        description="Fallback OpenAI model when users haven't set a preference."
        htmlFor={modelId}
      >
        <SettingsSelect
          id={modelId}
          value={defaultModel}
          options={platformSettings.model_options}
          onChange={(event) => setDefaultModel(event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Max tokens per request"
        description="Upper limit for a single OpenAI API call."
        htmlFor={tokensId}
      >
        <Input
          id={tokensId}
          type="number"
          min={256}
          max={128000}
          value={maxTokens}
          onChange={(event) => setMaxTokens(event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Rate limit (req/min)"
        description="Maximum chat requests per user per minute."
        htmlFor={rateLimitId}
      >
        <Input
          id={rateLimitId}
          type="number"
          min={1}
          max={1000}
          value={rateLimit}
          onChange={(event) => setRateLimit(event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Public sign-up"
        description="Allow new users to create accounts."
        htmlFor={signupId}
      >
        <SettingsToggle
          id={signupId}
          checked={publicSignupEnabled}
          onCheckedChange={setPublicSignupEnabled}
        />
      </SettingRow>
      <SettingRow
        label="Maintenance mode"
        description="Disable chat for non-admin users during updates."
        htmlFor={maintenanceId}
      >
        <SettingsToggle
          id={maintenanceId}
          checked={maintenanceMode}
          onCheckedChange={setMaintenanceMode}
        />
      </SettingRow>
      {errorMessage && (
        <p className="px-1 pt-2 text-sm text-destructive">{errorMessage}</p>
      )}
    </SettingsPanel>
  );
}
