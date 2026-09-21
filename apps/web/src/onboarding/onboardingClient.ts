import {
  OnboardingStateResponseSchema,
  ErrorResponseSchema,
  type OnboardingStateResponse,
  type LearningGoal,
  type DailyMinutes,
  type SelfReportedCefrLevel,
} from "@english-level/contracts";
import { API_BASE_URL } from "../lib/apiBaseUrl.ts";

const CREDENTIALS: RequestCredentials = "include";

export class OnboardingRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function parseOrThrow(res: Response): Promise<OnboardingStateResponse> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const parsedError = ErrorResponseSchema.safeParse(body);
    throw new OnboardingRequestError(
      parsedError.success
        ? parsedError.data.error
        : `request failed (${res.status})`,
      res.status,
    );
  }
  return OnboardingStateResponseSchema.parse(await res.json());
}

export async function getOnboardingState(): Promise<OnboardingStateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/onboarding`, {
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res);
}

function put(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/v1/onboarding${path}`, {
    method: "PUT",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateGoals(
  goals: LearningGoal[],
): Promise<OnboardingStateResponse> {
  return parseOrThrow(await put("/goals", { goals }));
}

export async function updateDailyTime(
  minutes: DailyMinutes,
): Promise<OnboardingStateResponse> {
  return parseOrThrow(await put("/daily-time", { minutes }));
}

export async function updateLevel(
  level: SelfReportedCefrLevel,
): Promise<OnboardingStateResponse> {
  return parseOrThrow(await put("/level", { level }));
}
