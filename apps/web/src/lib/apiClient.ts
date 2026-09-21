import {
  HealthResponseSchema,
  type HealthResponse,
} from "@english-level/contracts";

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return HealthResponseSchema.parse(await res.json());
}
