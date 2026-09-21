import {
  HealthResponseSchema,
  type HealthResponse,
} from "@english-level/contracts";
import { API_BASE_URL } from "./apiBaseUrl.ts";

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return HealthResponseSchema.parse(await res.json());
}
