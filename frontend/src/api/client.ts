import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_TOKEN_KEY } from '@/constants/auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';

    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    return Promise.reject(new Error(message));
  },
);
