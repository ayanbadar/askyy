import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import {
  clearAuthTokens,
  getRefreshToken,
  setAccessToken,
} from "@/lib/authTokens";

interface TokenRefreshResponse {
  access: string;
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();

  if (!refresh) {
    clearAuthTokens();
    throw new Error("Session expired. Please sign in again.");
  }

  const { data } = await axios.post<TokenRefreshResponse>(
    `${API_BASE_URL}/auth/refresh`,
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );

  setAccessToken(data.access);
  return data.access;
}
