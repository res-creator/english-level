import {
  AnswerActivityRequestSchema,
  type AnswerFeedback,
  type EpisodeDTO,
  type EpisodeSessionDTO,
  type SessionResultDTO,
  type UnlockedRewardDTO,
} from "@english-level/contracts";
import type {
  Db,
  LearningSessionRow,
  LessonRow,
  ModuleRow,
  UserCapabilityRow,
} from "../db/types.ts";
import {
  findPublishedLessonById,
  findPublishedModuleById,
  listLessonItemsByLesson,
  listPublishedLessonsByModule,
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
  advanceSessionsDoneStatement,
  findCapability,
  recordMissionAttemptStatement,
  startCapabilityStatement,
} from "../repositories/capabilitiesRepository.ts";
import {
  countDueMemory,
  seedMemoryStatement,
} from "../repositories/itemMemoryRepository.ts";
import { cloneForRetry } from "../lessonEngine/lessonSessionBuilder.ts";
import {
  MISSION_PASS_ACCURACY,
  buildMissionPlan,
  planEpisodeSessions,
} from "../lessonEngine/episodePlan.ts";
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
import {
  evaluateChapterReward,
  evaluateWeekMilestone,
  grantMissionReward,
} from "./rewardService.ts";

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
  | { ok: true; session: EpisodeSessionDTO }
  | { ok: false; error: LessonSessionFailure };

export type SessionResultResult =
  | { ok: true; result: SessionResultDTO }
  | { ok: false; error: LessonSessionFailure };

export type AnswerActivityResult =
  | {
      ok: true;
      feedback: AnswerFeedback;
      session:
        | {
            status: "in_progress";
            nextActivity: ReturnType<typeof toActivityDTO>;
          }
        | { status: "completed"; result: SessionResultDTO };
    }
  | { ok: false; error: LessonSessionFailure };

function levelIdFor(cefrCode: string): string {
  return `lvl_${cefrCode.toLowerCase()}`;
}

function parsePlan(session: LearningSessionRow): StoredActivity[] {
  return JSON.parse(session.activities_json) as StoredActivity[];
}

// ---------------------------------------------------------------------------
// Episode view
// ---------------------------------------------------------------------------

/**
 * One situation, as the learner sees it. `sessionsTotal` is whatever the
 * episode turned out to slice into when it was first started — it is not
 * recomputed on every read, so the number the learner sees never shifts
 * mid-episode.
 */
export function buildEpisodeDTO(
  lesson: LessonRow,
  capability: UserCapabilityRow | null,
): EpisodeDTO {
  const sessionsDone = capability?.sessions_done ?? 0;
  const sessionsTotal = capability?.sessions_total ?? 0;
  const state = capability?.state ?? null;
  return {
    id: lesson.id,
    title: lesson.title,
    situationTitle: lesson.situation_title,
    scene: lesson.scene,
    capability: lesson.capability,
    teaser: lesson.teaser,
    type: lesson.lesson_type,
    order: lesson.order_index,
    estimatedMinutes: lesson.estimated_minutes,
    state,
    sessionsDone,
    sessionsTotal,
    missionReady:
      sessionsTotal > 0 &&
      sessionsDone >= sessionsTotal &&
      state === "learning",
  };
}

function sessionToDTO(
  session: LearningSessionRow,
  episode: EpisodeDTO,
  plan: StoredActivity[],
): EpisodeSessionDTO {
  const current = plan[session.current_position];
  const currentActivity =
    session.status === "in_progress" && current
      ? toActivityDTO(current, session.current_position, plan.length)
      : null;
  return {
    sessionId: session.id,
    kind: session.session_kind,
    status: session.status,
    sessionIndex: session.session_index,
    sessionTotal: Math.max(episode.sessionsTotal, session.session_index),
    episode,
    currentActivity,
  };
}

type EligibilityResult =
  | { ok: true; lesson: LessonRow; module: ModuleRow }
  | { ok: false; error: LessonSessionFailure };

/** No prerequisite/unlock system: an episode is eligible if it's published
 * and its chapter belongs to the user's currently verified CEFR level. */
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
// Starting
// ---------------------------------------------------------------------------

/**
 * Serves **one session**, not a whole episode: the engine builds the
 * episode's deterministic plan, cuts it into 5–8 minute sessions, and this
 * hands over the next one the learner hasn't done. Once every session is
 * done the same call starts the Mission instead, so the client never has
 * to know which comes next.
 *
 * Idempotent: an in-progress session is resumed rather than duplicated.
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
    const capability = await findCapability(db, userId, lessonId);
    return {
      ok: true,
      session: sessionToDTO(
        active,
        buildEpisodeDTO(lesson, capability),
        parsePlan(active),
      ),
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
  const { sessions, total } = await planEpisodeSessions(
    db,
    module_.level_id,
    lessonItems,
  );
  if (total === 0) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson has no content" },
    };
  }

  const capability = await findCapability(db, userId, lessonId);
  const sessionsDone = capability?.sessions_done ?? 0;
  const isMission = sessionsDone >= total;

  const plan: StoredActivity[] = isMission
    ? await buildMissionPlan(db, module_.level_id, lessonItems)
    : (sessions[sessionsDone] ?? []);
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
      {
        kind: isMission ? "mission" : "lesson",
        index: isMission ? total + 1 : sessionsDone + 1,
      },
    ),
    startCapabilityStatement(userId, lessonId, total, now),
    startProgressStatement(userId, lessonId, sessionId, now),
  ]);

  const created = await findSessionById(db, sessionId);
  if (!created)
    throw new Error(`Failed to load session ${sessionId} after creation`);
  const stored = await findCapability(db, userId, lessonId);
  return {
    ok: true,
    session: sessionToDTO(created, buildEpisodeDTO(lesson, stored), plan),
  };
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
  const capability = await findCapability(db, userId, session.lesson_id);
  return {
    ok: true,
    session: sessionToDTO(
      session,
      buildEpisodeDTO(lesson, capability),
      parsePlan(session),
    ),
  };
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function accuracyOf(session: LearningSessionRow): number {
  const scored = session.correct_count + session.wrong_count;
  return scored === 0 ? 0 : Math.round((100 * session.correct_count) / scored);
}

/** Which episode follows this one inside the same chapter, if any. */
async function findNextEpisodeId(
  db: Db,
  lesson: LessonRow,
): Promise<string | null> {
  const siblings = await listPublishedLessonsByModule(db, lesson.module_id);
  const index = siblings.findIndex((l) => l.id === lesson.id);
  if (index === -1) return null;
  return siblings[index + 1]?.id ?? null;
}

/**
 * The result of a finished session. Every number is read back off the
 * persisted row, so reloading the result screen shows exactly what the
 * completing response showed. `rewards` is intentionally empty here — a
 * reward is celebrated once, in the response that unlocked it.
 */
async function buildSessionResult(
  db: Db,
  session: LearningSessionRow,
  lesson: LessonRow,
  rewards: UnlockedRewardDTO[],
): Promise<SessionResultDTO> {
  if (!session.completed_at) {
    throw new Error(
      `buildSessionResult called for session ${session.id} with no completed_at`,
    );
  }
  const capability = await findCapability(db, session.user_id, lesson.id);
  const accuracy = accuracyOf(session);
  const isMission = session.session_kind === "mission";
  const episode = buildEpisodeDTO(lesson, capability);
  const due = await countDueMemory(
    db,
    session.user_id,
    new Date().toISOString(),
  );
  return {
    sessionId: session.id,
    kind: session.session_kind,
    episodeId: lesson.id,
    episodeTitle: lesson.situation_title ?? lesson.title,
    correctCount: session.correct_count,
    wrongCount: session.wrong_count,
    scoredAttempts: session.correct_count + session.wrong_count,
    accuracy,
    completedAt: session.completed_at,
    sessionsDone: episode.sessionsDone,
    sessionsTotal: Math.max(episode.sessionsTotal, 1),
    missionPassed: isMission ? accuracy >= MISSION_PASS_ACCURACY : null,
    capability: lesson.capability,
    capabilityState: episode.state,
    missionReady: episode.missionReady,
    teaser: lesson.teaser,
    nextEpisodeId: await findNextEpisodeId(db, lesson),
    rewards,
    reviewDue: due?.n ?? 0,
  };
}

/**
 * Owner-only; only returns a result for a session that has actually
 * completed — an in_progress/abandoned session gets a clear
 * `not_completed` error, never a fabricated or partial result.
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
  return {
    ok: true,
    result: await buildSessionResult(db, session, lesson, []),
  };
}

// ---------------------------------------------------------------------------
// Answering
// ---------------------------------------------------------------------------

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

/** Everything the session touched enters spaced memory, so review is
 * always built from language the learner has actually met. */
function seedStatementsFor(
  userId: string,
  lessonId: string,
  plan: StoredActivity[],
  now: Date,
) {
  const seen = new Set<string>();
  return plan
    .filter((activity) => {
      const key = `${activity.targetType}:${activity.targetId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((activity) =>
      seedMemoryStatement(
        userId,
        activity.targetType,
        activity.targetId,
        lessonId,
        now,
      ),
    );
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
          result: await buildSessionResult(db, session, lesson, []),
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

  // The Mission is a proof, not a lesson: it never hands out a second try.
  const retryAllowed =
    session.session_kind === "lesson" &&
    isScoredActivity(current) &&
    !current.isRetry;
  let nextPlan = plan;
  if (!isCorrect && retryAllowed) {
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
    const completedAt = new Date();
    const now = completedAt.toISOString();
    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((100 * correctCount) / total);
    const isMission = session.session_kind === "mission";
    const missionPassed = isMission && accuracy >= MISSION_PASS_ACCURACY;
    const capability = await findCapability(db, userId, session.lesson_id);

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
      // The episode counts as completed only once its Mission is passed —
      // finishing one of its daily sessions is progress, not proof.
      ...(missionPassed
        ? [
            completeProgressStatement(
              userId,
              session.lesson_id,
              { sessionId, accuracy },
              now,
            ),
          ]
        : []),
      isMission
        ? recordMissionAttemptStatement(
            userId,
            session.lesson_id,
            missionPassed,
            now,
          )
        : advanceSessionsDoneStatement(
            userId,
            session.lesson_id,
            Math.max(
              (capability?.sessions_done ?? 0) + 1,
              session.session_index,
            ),
            now,
          ),
      ...seedStatementsFor(userId, session.lesson_id, nextPlan, completedAt),
    ]);

    const rewards: UnlockedRewardDTO[] = [];
    if (missionPassed) {
      const missionReward = await grantMissionReward(
        db,
        userId,
        session.lesson_id,
      );
      if (missionReward) rewards.push(missionReward);
      const chapterReward = await evaluateChapterReward(
        db,
        userId,
        lesson.module_id,
      );
      if (chapterReward) rewards.push(chapterReward);
    }
    const milestone = await evaluateWeekMilestone(db, userId, completedAt);
    if (milestone) rewards.push(milestone);

    const completed = await findSessionById(db, sessionId);
    if (!completed)
      throw new Error(`Session ${sessionId} missing after completion`);
    return {
      ok: true,
      feedback,
      session: {
        status: "completed",
        result: await buildSessionResult(db, completed, lesson, rewards),
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
