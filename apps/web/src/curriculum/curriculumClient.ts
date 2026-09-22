import {
  CurriculumPathResponseSchema,
  ModuleDetailResponseSchema,
  LessonContentDTOSchema,
  ErrorResponseSchema,
  type CurriculumPathResponse,
  type ModuleDetailResponse,
  type LessonContentDTO,
} from "@english-level/contracts";
import { API_BASE_URL } from "../lib/apiBaseUrl.ts";

const CREDENTIALS: RequestCredentials = "include";

export class CurriculumRequestError extends Error {
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
    throw new CurriculumRequestError(
      parsedError.success
        ? parsedError.data.error
        : `request failed (${res.status})`,
      res.status,
    );
  }
  return schema.parse(await res.json());
}

export async function getCurriculumPath(): Promise<CurriculumPathResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/path`, {
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, CurriculumPathResponseSchema);
}

export async function getModuleDetail(
  moduleId: string,
): Promise<ModuleDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/modules/${moduleId}`, {
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, ModuleDetailResponseSchema);
}

export async function getLessonContent(
  lessonId: string,
): Promise<LessonContentDTO> {
  const res = await fetch(`${API_BASE_URL}/api/v1/lessons/${lessonId}`, {
    credentials: CREDENTIALS,
  });
  return parseOrThrow(res, LessonContentDTOSchema);
}
