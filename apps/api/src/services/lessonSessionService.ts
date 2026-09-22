import {
  AnswerActivityRequestSchema,
  type AnswerActivityResponse,
  type AnswerFeedback,
  type LessonResultDTO,
  type LessonSessionDTO,
} from "@english-level/contracts";
import type {
  Db,
  LearningSessionRow,
  LessonRow,
  ModuleRow,
} from "../db/types.ts";
import {
  findPublishedLessonById,
  findPublishedModuleById,
  listLessonItemsByLesson,
} from "../repositories/curriculumRepository.ts";
import { findUserById } from "../repositories/usersRepository.ts";
import {
  advanceSessionStatement,
  completeSessionStatement,
  createSessionStatement,
  findActiveSessionForLesson,
  findSessionById,
  newSessionId,
} from "../repositories/learningSessionsRepository.ts";
import {
  findAttemptByKey,
  recordAttemptStatement,
} from "../repositories/exerciseAttemptsRepository.ts";
import {
  completeProgressStatement,
  startProgressStatement,
} from "../repositories/userLessonProgressRepository.ts";
import {
  buildActivityPlan,
  cloneForRetry,
} from "../lessonEngine/lessonSessionBuilder.ts";
import { toActivityDTO } from "../lessonEngine/activityDto.ts";
import {
  correctAnswerDisplay,
  explanationFor,
  gradeActivity,
} from "../lessonEngine/exerciseGrading.ts";
import {
  isScoredActivity,
  type StoredActivity,
} from "../lessonEngine/activityTypes.ts";

/** A wrong scored answer gets one alternate retry this many positions
 * later in the plan — not immediate, but soon. See
 * docs/lesson-engine.md ("Retry behavior"). */
const RETRY_OFFSET = 3;

export type LessonSessionFailure =
  | { code: "not_found"; message: string }
  | { code: "not_eligible"; message: string }
  | { code: "wrong_level"; message: string }
  | { code: "session_not_active"; message: string }
  | { code: "activity_not_current"; message: string }
  | { code: "not_completed"; message: string }
  | { code: "validation_error"; message: string };

export type LessonSessionResult =
  | { ok: true; session: LessonSessionDTO }
  | { ok: false; error: LessonSessionFailure };

export type SessionResultResult =
  | { ok: true; result: LessonResultDTO }
  | { ok: false; error: LessonSessionFailure };

export type AnswerActivityResult =
  | {
      ok: true;
      feedback: AnswerFeedback;
      session: AnswerActivityResponse["session"];
    }
  | { ok: false; error: LessonSessionFailure };

function levelIdFor(cefrCode: string): string {
  return `lvl_${cefrCode.toLowerCase()}`;
}

function parsePlan(session: LearningSessionRow): StoredActivity[] {
  return JSON.parse(session.activities_json) as StoredActivity[];
}

function sessionToDTO(
  session: LearningSessionRow,
  lesson: LessonRow,
  plan: StoredActivity[],
): LessonSessionDTO {
  const current = plan[session.current_position];
  const currentActivity =
    session.status === "in_progress" && current
      ? toActivityDTO(current, session.current_position, plan.length)
      : null;
  return {
    sessionId: session.id,
    status: session.status,
    lesson: { id: lesson.id, title: lesson.title },
    currentActivity,
  };
}

/** Only callable once `session.status === "completed"` — every field
 * comes straight from the persisted row, so the same result is
 * reconstructable at any later time (see `getSessionResult`), not just
 * in the response that completed the session. */
function buildLessonResult(
  session: LearningSessionRow,
  lesson: LessonRow,
): LessonResultDTO {
  const scoredAttempts = session.correct_count + session.wrong_count;
  const accuracy =
    scoredAttempts === 0
      ? 0
      : Math.round((100 * session.correct_count) / scoredAttempts);
  if (!session.completed_at) {
    throw new Error(
      `buildLessonResult called for session ${session.id} with no completed_at`,
    );
  }
  return {
    sessionId: session.id,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    status: "completed",
    correctCount: session.correct_count,
    wrongCount: session.wrong_count,
    scoredAttempts,
    accuracy,
    completedAt: session.completed_at,
  };
}

function buildFeedback(
  activity: StoredActivity,
  isCorrect: boolean,
): AnswerFeedback {
  if (isCorrect) return { correct: true };
  return {
    correct: false,
    correctAnswer: correctAnswerDisplay(activity),
    explanation: explanationFor(activity),
  };
}

type EligibilityResult =
  | { ok: true; lesson: LessonRow; module: ModuleRow }
  | { ok: false; error: LessonSessionFailure };

/** No prerequisite/unlock system: a lesson is eligible if it's published
 * and its module belongs to the user's currently verified CEFR level. */
async function checkLessonEligibility(
  db: Db,
  lessonId: string,
  cefrLevel: string,
): Promise<EligibilityResult> {
  const lesson = await findPublishedLessonById(db, lessonId);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  const module_ = await findPublishedModuleById(db, lesson.module_id);
  if (!module_) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  if (module_.level_id !== levelIdFor(cefrLevel)) {
    return {
      ok: false,
      error: {
        code: "wrong_level",
        message: "this lesson is not available at your current level",
      },
    };
  }
  return { ok: true, lesson, module: module_ };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Idempotent: resumes an existing in_progress session rather than
 * creating a second one. Otherwise generates a full deterministic
 * activity plan once and stores it on the new session row.
 */
export async function startLessonSession(
  db: Db,
  userId: string,
  lessonId: string,
): Promise<LessonSessionResult> {
  const active = await findActiveSessionForLesson(db, userId, lessonId);
  if (active) {
    const lesson = await findPublishedLessonById(db, lessonId);
    if (!lesson) {
      return {
        ok: false,
        error: { code: "not_found", message: "lesson not found" },
      };
    }
    return {
      ok: true,
      session: sessionToDTO(active, lesson, parsePlan(active)),
    };
  }

  const user = await findUserById(db, userId);
  if (!user) throw new Error(`User ${userId} not found`);

  if (!user.current_cefr_level) {
    return {
      ok: false,
      error: { code: "not_eligible", message: "no verified level yet" },
    };
  }

  const eligibility = await checkLessonEligibility(
    db,
    lessonId,
    user.current_cefr_level,
  );
  if (!eligibility.ok) return eligibility;
  const { lesson, module: module_ } = eligibility;

  const lessonItems = await listLessonItemsByLesson(db, lessonId);
  const plan = await buildActivityPlan(db, module_.level_id, lessonItems);
  if (plan.length === 0) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson has no content" },
    };
  }

  const sessionId = newSessionId();
  const now = new Date().toISOString();
  await db.batch([
    createSessionStatement(
      sessionId,
      userId,
      lessonId,
      JSON.stringify(plan),
      now,
    ),
    startProgressStatement(userId, lessonId, sessionId, now),
  ]);

  const created = await findSessionById(db, sessionId);
  if (!created)
    throw new Error(`Failed to load session ${sessionId} after creation`);
  return { ok: true, session: sessionToDTO(created, lesson, plan) };
}

/** Owner-only; supports resuming after the Mini App is closed and
 * reopened — the session row + stored plan are all that's needed. */
export async function getLessonSession(
  db: Db,
  userId: string,
  sessionId: string,
): Promise<LessonSessionResult> {
  const session = await findSessionById(db, sessionId);
  if (!session || session.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "session not found" },
    };
  }
  const lesson = await findPublishedLessonById(db, session.lesson_id);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  return {
    ok: true,
    session: sessionToDTO(session, lesson, parsePlan(session)),
  };
}

/**
 * Owner-only; only returns a result for a session that has actually
 * completed — an in_progress/abandoned session gets a clear
 * `not_completed` error, never a fabricated or partial result. Every
 * field is read straight off the persisted `learning_sessions` row, so
 * this reconstructs exactly the same `LessonResultDTO` a completing
 * `/answer` response carried, and survives a page reload since it
 * doesn't depend on any client-held state.
 */
export async function getSessionResult(
  db: Db,
  userId: string,
  sessionId: string,
): Promise<SessionResultResult> {
  const session = await findSessionById(db, sessionId);
  if (!session || session.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "session not found" },
    };
  }
  if (session.status !== "completed") {
    return {
      ok: false,
      error: {
        code: "not_completed",
        message: "this session has not completed yet",
      },
    };
  }
  const lesson = await findPublishedLessonById(db, session.lesson_id);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  return { ok: true, result: buildLessonResult(session, lesson) };
}

/**
 * Grades server-side, persists the attempt, advances (or completes) the
 * session, and returns feedback + what comes next. Idempotent on
 * `attemptId`: a duplicate request reconstructs the original response
 * from the stored attempt instead of grading or mutating anything again.
 */
export async function answerActivity(
  db: Db,
  userId: string,
  sessionId: string,
  input: unknown,
): Promise<AnswerActivityResult> {
  const parsed = AnswerActivityRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const session = await findSessionById(db, sessionId);
  if (!session || session.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "session not found" },
    };
  }
  const lesson = await findPublishedLessonById(db, session.lesson_id);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }

  // Idempotent retry: this exact attemptId was already recorded for this
  // session — reconstruct the original response rather than re-grading,
  // re-counting, or skipping ahead.
  const existing = await findAttemptByKey(db, sessionId, parsed.data.attemptId);
  if (existing) {
    const plan = parsePlan(session);
    const activity = plan[existing.activity_index];
    if (!activity) {
      throw new Error(
        `Attempt ${existing.id} references activity_index ${existing.activity_index}, outside the stored plan`,
      );
    }
    const feedback = buildFeedback(activity, existing.is_correct === 1);
    const nextIndex = existing.activity_index + 1;
    const next = plan[nextIndex];
    if (!next) {
      return {
        ok: true,
        feedback,
        session: {
          status: "completed",
          result: buildLessonResult(session, lesson),
        },
      };
    }
    return {
      ok: true,
      feedback,
      session: {
        status: "in_progress",
        nextActivity: toActivityDTO(next, nextIndex, plan.length),
      },
    };
  }

  if (session.status !== "in_progress") {
    return {
      ok: false,
      error: {
        code: "session_not_active",
        message: "this session is no longer active",
      },
    };
  }

  const plan = parsePlan(session);
  const currentIndex = session.current_position;
  const current = plan[currentIndex];
  if (!current || current.id !== parsed.data.activityId) {
    return {
      ok: false,
      error: {
        code: "activity_not_current",
        message: "this activity is not the current one for this session",
      },
    };
  }

  const isCorrect = gradeActivity(current, parsed.data.answer);
  const feedback = buildFeedback(current, isCorrect);

  let correctCount = session.correct_count;
  let wrongCount = session.wrong_count;
  if (isScoredActivity(current)) {
    if (isCorrect) correctCount += 1;
    else wrongCount += 1;
  }

  let nextPlan = plan;
  if (!isCorrect && isScoredActivity(current) && !current.isRetry) {
    const retry = cloneForRetry(current, `${current.id}_retry`);
    const insertAt = Math.min(currentIndex + 1 + RETRY_OFFSET, plan.length);
    nextPlan = [...plan.slice(0, insertAt), retry, ...plan.slice(insertAt)];
  }

  const newPosition = currentIndex + 1;
  const activitiesJson = JSON.stringify(nextPlan);
  const attemptStatement = recordAttemptStatement({
    userId,
    sessionId,
    activityId: current.id,
    activityIndex: currentIndex,
    targetType: current.targetType,
    targetId: current.targetId,
    exerciseType: current.kind,
    answer: parsed.data.answer,
    isCorrect,
    responseTimeMs: parsed.data.responseTimeMs ?? null,
    attemptKey: parsed.data.attemptId,
  });

  if (newPosition >= nextPlan.length) {
    const now = new Date().toISOString();
    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((100 * correctCount) / total);
    await db.batch([
      attemptStatement,
      completeSessionStatement(
        sessionId,
        {
          currentPosition: newPosition,
          correctCount,
          wrongCount,
          activitiesJson,
        },
        now,
      ),
      completeProgressStatement(
        userId,
        session.lesson_id,
        { sessionId, accuracy },
        now,
      ),
    ]);
    const completed = await findSessionById(db, sessionId);
    if (!completed)
      throw new Error(`Session ${sessionId} missing after completion`);
    return {
      ok: true,
      feedback,
      session: {
        status: "completed",
        result: buildLessonResult(completed, lesson),
      },
    };
  }

  const upcoming = nextPlan[newPosition];
  if (!upcoming) {
    throw new Error(
      `Plan for session ${sessionId} missing activity at position ${newPosition}`,
    );
  }

  await db.batch([
    attemptStatement,
    advanceSessionStatement(sessionId, {
      currentPosition: newPosition,
      correctCount,
      wrongCount,
      activitiesJson,
    }),
  ]);

  return {
    ok: true,
    feedback,
    session: {
      status: "in_progress",
      nextActivity: toActivityDTO(upcoming, newPosition, nextPlan.length),
    },
  };
}
