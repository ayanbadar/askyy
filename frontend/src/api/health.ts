import { apiClient } from "@/api/client";

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/health/");
  return data;
}
