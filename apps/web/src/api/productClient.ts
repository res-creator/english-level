import {
  AnswerReviewResponseSchema,
  AnswerSessionResponseSchema,
  CompanionDTOSchema,
  CourseResponseSchema,
  EpisodeSessionDTOSchema,
  ErrorResponseSchema,
  FriendStateResponseSchema,
  InviteCodeResponseSchema,
  LessonContentDTOSchema,
  MyEnglishResponseSchema,
  MySpaceResponseSchema,
  ReviewSessionDTOSchema,
  ReviewStateResponseSchema,
  SessionResultDTOSchema,
  TodayResponseSchema,
  type AnswerReviewResponse,
  type AnswerSessionResponse,
  type CompanionDTO,
  type CourseResponse,
  type EpisodeSessionDTO,
  type FriendStateResponse,
  type LessonContentDTO,
  type MyEnglishResponse,
  type MySpaceResponse,
  type ReviewSessionDTO,
  type ReviewStateResponse,
  type SessionResultDTO,
  type TodayResponse,
} from "@english-level/contracts";
import { API_BASE_URL } from "../lib/apiBaseUrl.ts";

const CREDENTIALS: RequestCredentials = "include";

/** Every failure the UI can act on differently carries its HTTP status,
 * so a screen can tell "nothing due" apart from "we're offline". */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  schema: { parse: (v: unknown) => T },
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    credentials: CREDENTIALS,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const parsed = ErrorResponseSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? parsed.data.error : `request failed (${res.status})`,
      res.status,
    );
  }
  return schema.parse(await res.json());
}

function post<T>(
  path: string,
  schema: { parse: (v: unknown) => T },
  body?: unknown,
): Promise<T> {
  return request(path, schema, {
    method: "POST",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}

// --- the day --------------------------------------------------------------

export function getToday(): Promise<TodayResponse> {
  return request("/today", TodayResponseSchema);
}

export function getCourse(): Promise<CourseResponse> {
  return request("/course", CourseResponseSchema);
}

export function getEpisodeContent(
  episodeId: string,
): Promise<LessonContentDTO> {
  return request(`/lessons/${episodeId}`, LessonContentDTOSchema);
}

// --- sessions and missions ------------------------------------------------

export function startEpisodeSession(
  episodeId: string,
): Promise<EpisodeSessionDTO> {
  return post(`/lessons/${episodeId}/start`, EpisodeSessionDTOSchema);
}

export function getEpisodeSession(
  sessionId: string,
): Promise<EpisodeSessionDTO> {
  return request(`/sessions/${sessionId}`, EpisodeSessionDTOSchema);
}

/** Read back off persisted data, so the result screen survives a reload
 * or a direct link instead of depending on navigation state. */
export function getSessionResult(sessionId: string): Promise<SessionResultDTO> {
  return request(`/sessions/${sessionId}/result`, SessionResultDTOSchema);
}

export function answerActivity(
  sessionId: string,
  body: {
    activityId: string;
    answer: string;
    responseTimeMs?: number;
    attemptId: string;
  },
): Promise<AnswerSessionResponse> {
  return post(
    `/sessions/${sessionId}/answer`,
    AnswerSessionResponseSchema,
    body,
  );
}

// --- review ---------------------------------------------------------------

export function getReviewState(): Promise<ReviewStateResponse> {
  return request("/review", ReviewStateResponseSchema);
}

export function startReview(
  options: { extraPractice?: boolean } = {},
): Promise<ReviewSessionDTO> {
  return post(
    options.extraPractice ? "/review/start?extra=1" : "/review/start",
    ReviewSessionDTOSchema,
  );
}

export function getReviewSession(sessionId: string): Promise<ReviewSessionDTO> {
  return request(`/review/sessions/${sessionId}`, ReviewSessionDTOSchema);
}

export function answerReview(
  sessionId: string,
  body: {
    activityId: string;
    answer: string;
    responseTimeMs?: number;
    attemptId: string;
  },
): Promise<AnswerReviewResponse> {
  return post(
    `/review/sessions/${sessionId}/answer`,
    AnswerReviewResponseSchema,
    body,
  );
}

// --- what the learner owns -------------------------------------------------

export function getMyEnglish(): Promise<MyEnglishResponse> {
  return request("/my/english", MyEnglishResponseSchema);
}

export function getMySpace(): Promise<MySpaceResponse> {
  return request("/my/space", MySpaceResponseSchema);
}

export function chooseCompanion(companionId: string): Promise<CompanionDTO> {
  return post("/my/companion", CompanionDTOSchema, { companionId });
}

export function getFriendState(): Promise<FriendStateResponse> {
  return request("/my/friend", FriendStateResponseSchema);
}

export function createFriendInvite(): Promise<{ code: string }> {
  return post("/my/friend/invite", InviteCodeResponseSchema);
}

export function acceptFriendInvite(code: string): Promise<FriendStateResponse> {
  return post("/my/friend/accept", FriendStateResponseSchema, { code });
}
