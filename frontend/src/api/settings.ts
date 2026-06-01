import { apiClient } from "@/api/client";

export type AccountSettings = {
  id: string;
  username: string;
  email: string;
  name: string;
};

export type UpdateAccountSettingsPayload = {
  name?: string;
  email?: string;
};

export async function getAccountSettings(): Promise<AccountSettings> {
  const { data } = await apiClient.get<AccountSettings>("/settings/account/");
  return data;
}

export async function updateAccountSettings(
  payload: UpdateAccountSettingsPayload,
): Promise<AccountSettings> {
  const { data } = await apiClient.patch<AccountSettings>(
    "/settings/account/",
    payload,
  );
  return data;
}

export type ActiveSession = {
  id: string;
  device: string;
  location: string;
  is_current: boolean;
  last_active_at: string;
};

export type SecuritySettings = {
  requires_current_password: boolean;
  sessions: ActiveSession[];
};

export type ChangePasswordPayload = {
  current_password?: string;
  new_password: string;
  confirm_password: string;
};

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const { data } = await apiClient.get<SecuritySettings>("/settings/security/");
  return data;
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<SecuritySettings> {
  const { data } = await apiClient.post<SecuritySettings>(
    "/settings/security/password/",
    payload,
  );
  return data;
}

export type OpenAIModelOption = {
  value: string;
  label: string;
};

export type PlatformSettings = {
  default_model: string;
  max_tokens_per_request: number;
  rate_limit_per_minute: number;
  public_signup_enabled: boolean;
  maintenance_mode: boolean;
  model_options: OpenAIModelOption[];
};

export type UpdatePlatformSettingsPayload = {
  default_model?: string;
  max_tokens_per_request?: number;
  rate_limit_per_minute?: number;
  public_signup_enabled?: boolean;
  maintenance_mode?: boolean;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data } = await apiClient.get<PlatformSettings>("/settings/platform/");
  return data;
}

export async function updatePlatformSettings(
  payload: UpdatePlatformSettingsPayload,
): Promise<PlatformSettings> {
  const { data } = await apiClient.patch<PlatformSettings>(
    "/settings/platform/",
    payload,
  );
  return data;
}

export type DangerSettings = {
  requires_password_confirmation: boolean;
  can_delete_account: boolean;
};

export type DeleteAccountPayload = {
  password?: string;
};

export async function getDangerSettings(): Promise<DangerSettings> {
  const { data } = await apiClient.get<DangerSettings>("/settings/danger/");
  return data;
}

export async function deleteAccount(
  payload: DeleteAccountPayload = {},
): Promise<void> {
  await apiClient.post("/settings/danger/account/", payload);
}
