import { apiClient } from "@/api/client";
import { clearAuthTokens, setTokens } from "@/lib/authTokens";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenPairResponse {
  access: string;
  refresh: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<TokenPairResponse> {
  const { data } = await apiClient.post<TokenPairResponse>(
    "/auth/login/",
    credentials,
  );
  setTokens(data.access, data.refresh);
  return data;
}

export async function loginWithGoogle(
  idToken: string,
): Promise<TokenPairResponse> {
  const { data } = await apiClient.post<TokenPairResponse>("/auth/google/", {
    id_token: idToken,
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me/");
  return data;
}

export function logout(): void {
  clearAuthTokens();
}
