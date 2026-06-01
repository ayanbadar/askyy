import { apiClient } from "@/api/client";
import { clearAuthTokens, setTokens } from "@/lib/authTokens";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  is_superuser: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  email: string;
}

export interface VerifySignupPayload {
  email: string;
  otp: string;
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

export async function signup(
  credentials: SignupCredentials,
): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>(
    "/auth/signup/",
    credentials,
  );
  return data;
}

export async function verifySignup(
  payload: VerifySignupPayload,
): Promise<TokenPairResponse> {
  const { data } = await apiClient.post<TokenPairResponse>(
    "/auth/signup/verify/",
    payload,
  );
  setTokens(data.access, data.refresh);
  return data;
}

export async function resendSignupOtp(email: string): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>(
    "/auth/signup/resend/",
    { email },
  );
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me/");
  return data;
}

export function logout(): void {
  clearAuthTokens();
}
