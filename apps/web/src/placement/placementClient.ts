import {
  PlacementStartResponseSchema,
  PlacementCurrentResponseSchema,
  PlacementAnswerResponseSchema,
  PlacementResultResponseSchema,
  ErrorResponseSchema,
  type PlacementStartResponse,
  type PlacementCurrentResponse,
  type PlacementAnswerResponse,
  type PlacementResultResponse,
} from "@english-level/contracts";
import { API_BASE_URL } from "../lib/apiBaseUrl.ts";

const CREDENTIALS: RequestCredentials = "include";

export class PlacementRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function parseOrThrow<T>(
  res: Response,
  schema: { parse: (v: unknown) => T },
): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const parsedError = ErrorResponseSchema.safeParse(body);
    throw new PlacementRequestError(
      parsedError.success
        ? parsedError.data.error
        : `request failed (${res.status})`,
      res.status,
    );
  }
  return schema.parse(await res.json());
}

export async function startPlacement(): Promise<PlacementStartResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/placement/start`, {
    method: "POST",
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, PlacementStartResponseSchema);
}

export async function getCurrentPlacement(): Promise<PlacementCurrentResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/placement/current`, {
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, PlacementCurrentResponseSchema);
}

export async function answerPlacement(
  attemptId: string,
  body: { questionId: string; answer: string; responseTimeMs?: number },
): Promise<PlacementAnswerResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/placement/${attemptId}/answer`,
    {
      method: "POST",
      credentials: CREDENTIALS,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow(res, PlacementAnswerResponseSchema);
}

export async function getPlacementResult(
  attemptId: string,
): Promise<PlacementResultResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/placement/${attemptId}/result`,
    {
      credentials: CREDENTIALS,
    },
  );
  return parseOrThrow(res, PlacementResultResponseSchema);
}
