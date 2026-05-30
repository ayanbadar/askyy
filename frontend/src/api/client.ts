import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/config/api";
import { clearAuthTokens, getAccessToken } from "@/lib/authTokens";
import { refreshAccessToken } from "@/lib/refreshAccessToken";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/google") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/me")
  );
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const access = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch {
        clearAuthTokens();
        window.dispatchEvent(new Event("auth:logout"));
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";

    if (status === 401 && !isAuthEndpoint(originalRequest?.url)) {
      clearAuthTokens();
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(new Error(message));
  },
);
