import { apiClient } from '@/api/client';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/login',
    credentials,
  );
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}
