import {
  LessonSessionDTOSchema,
  LessonResultDTOSchema,
  AnswerActivityResponseSchema,
  ErrorResponseSchema,
  type LessonSessionDTO,
  type LessonResultDTO,
  type AnswerActivityResponse,
} from "@english-level/contracts";
import { API_BASE_URL } from "../lib/apiBaseUrl.ts";

const CREDENTIALS: RequestCredentials = "include";

export class LessonSessionRequestError extends Error {
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
    throw new LessonSessionRequestError(
      parsedError.success
        ? parsedError.data.error
        : `request failed (${res.status})`,
      res.status,
    );
  }
  return schema.parse(await res.json());
}

export async function startLesson(lessonId: string): Promise<LessonSessionDTO> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lessons/${lessonId}/start`, {
    method: "POST",
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, LessonSessionDTOSchema);
}

export async function getLessonSession(
  sessionId: string,
): Promise<LessonSessionDTO> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, LessonSessionDTOSchema);
}

/** Reconstructs the same result a completing `/answer` response carried
 * — used so `LessonResult` survives a page reload or a direct link,
 * since it's read straight from persisted backend data instead of
 * relying on router navigation state. */
export async function getSessionResult(
  sessionId: string,
): Promise<LessonResultDTO> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/sessions/${sessionId}/result`,
    {
      credentials: CREDENTIALS,
    },
  );
  return parseOrThrow(res, LessonResultDTOSchema);
}

export async function answerActivity(
  sessionId: string,
  body: {
    activityId: string;
    answer: string;
    responseTimeMs?: number;
    attemptId: string;
  },
): Promise<AnswerActivityResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/sessions/${sessionId}/answer`,
    {
      method: "POST",
      credentials: CREDENTIALS,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return parseOrThrow(res, AnswerActivityResponseSchema);
}
