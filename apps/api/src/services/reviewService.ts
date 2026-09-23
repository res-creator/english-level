import {
  AnswerActivityRequestSchema,
  type AnswerFeedback,
  type ReviewResultDTO,
  type ReviewSessionDTO,
  type ReviewStateResponse,
  type UnlockedRewardDTO,
} from "@english-level/contracts";
import type { Db, LessonItemRow, UserItemMemoryRow } from "../db/types.ts";
import { findUserById } from "../repositories/usersRepository.ts";
import {
  findPublishedLessonById,
  findPublishedModuleById,
} from "../repositories/curriculumRepository.ts";
import {
  countDueMemory,
  listDueMemory,
  listMemory,
  recordReviewStatement,
} from "../repositories/itemMemoryRepository.ts";
import {
  advanceReviewSessionStatement,
  completeReviewSessionStatement,
  createReviewSessionStatement,
  findActiveReviewSession,
  findReviewSessionById,
  newReviewSessionId,
} from "../repositories/reviewSessionsRepository.ts";
import {
  consolidateStatement,
  listCapabilities,
} from "../repositories/capabilitiesRepository.ts";
import { buildItemActivity } from "../lessonEngine/lessonSessionBuilder.ts";
import { toActivityDTO } from "../lessonEngine/activityDto.ts";
import {
  correctAnswerDisplay,
  explanationFor,
  gradeActivity,
} from "../lessonEngine/exerciseGrading.ts";
import type { StoredActivity } from "../lessonEngine/activityTypes.ts";
import { grantConsolidationReward } from "./rewardService.ts";

/**
 * Review never shows everything that is technically due. A capped, finite
 * queue is the difference between "5 minutes" and a wall of debt — the
 * rest simply waits its turn tomorrow.
 */
export const MAX_REVIEW_ITEMS = 12;

/** A capability only becomes CONSOLIDATED once its language has survived a
 * real gap. Anything sooner would be testing short-term memory. */
export const CONSOLIDATION_MIN_DAYS = 7;

export type ReviewFailure =
  | { code: "not_found"; message: string }
  | { code: "nothing_due"; message: string }
  | { code: "not_eligible"; message: string }
  | { code: "session_not_active"; message: string }
  | { code: "activity_not_current"; message: string }
  | { code: "validation_error"; message: string };

export type ReviewSessionResult =
  { ok: true; session: ReviewSessionDTO } | { ok: false; error: ReviewFailure };

export type AnswerReviewResult =
  | {
      ok: true;
      feedback: AnswerFeedback;
      session:
        | {
            status: "in_progress";
            nextActivity: ReturnType<typeof toActivityDTO>;
          }
        | { status: "completed"; result: ReviewResultDTO };
    }
  | { ok: false; error: ReviewFailure };

function levelIdFor(cefrCode: string): string {
  return `lvl_${cefrCode.toLowerCase()}`;
}

function parsePlan(json: string): StoredActivity[] {
  return JSON.parse(json) as StoredActivity[];
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

/** A memory row carries everything the engine needs to rebuild an exercise,
 * so review reuses the exact activity builders lessons use — no separate,
 * drifting "review question" format. */
function asLessonItem(memory: UserItemMemoryRow): LessonItemRow {
  return {
    id: `rev_${memory.target_type}_${memory.target_id}`,
    lesson_id: memory.lesson_id ?? "",
    content_type: memory.target_type,
    content_id: memory.target_id,
    role: "review",
    order_index: 0,
    required: 1,
  };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export async function getReviewState(
  db: Db,
  userId: string,
): Promise<ReviewStateResponse> {
  const nowIso = new Date().toISOString();
  const due = await countDueMemory(db, userId, nowIso);
  const memory = await listMemory(db, userId);
  const weak = memory.filter((m) => m.last_result === "wrong").length;
  const capabilities = await listCapabilities(db, userId);
  const awaiting = capabilities.filter((c) => c.state === "can_do").length;
  const active = await findActiveReviewSession(db, userId);
  const count = Math.min(due?.n ?? 0, MAX_REVIEW_ITEMS);
  return {
    due: count,
    weak,
    awaitingConsolidation: awaiting,
    // ~20 seconds per retrieval, rounded up to a whole minute.
    estimatedMinutes: count === 0 ? 0 : Math.max(1, Math.round(count / 3)),
    activeSessionId: active?.id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Builds a finite review queue from what is actually due, weakest box
 * first. Idempotent: an unfinished review session is resumed.
 *
 * `extraPractice` relaxes the due filter so a learner who wants more can
 * get it — without that practice pulling future reviews forward, since the
 * scheduler still owns `due_at`.
 */
export async function startReviewSession(
  db: Db,
  userId: string,
  options: { extraPractice?: boolean } = {},
): Promise<ReviewSessionResult> {
  const active = await findActiveReviewSession(db, userId);
  if (active) {
    const plan = parsePlan(active.activities_json);
    const current = plan[active.current_position];
    return {
      ok: true,
      session: {
        sessionId: active.id,
        status: active.status,
        total: plan.length,
        currentActivity: current
          ? toActivityDTO(current, active.current_position, plan.length)
          : null,
      },
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
  const levelId = levelIdFor(user.current_cefr_level);

  const nowIso = new Date().toISOString();
  let candidates = await listDueMemory(db, userId, nowIso, MAX_REVIEW_ITEMS);
  if (candidates.length === 0 && options.extraPractice) {
    // "Хочу ещё": practise the shakiest language even though nothing is due.
    const all = await listMemory(db, userId);
    candidates = all
      .slice()
      .sort((a, b) => a.box - b.box)
      .slice(0, MAX_REVIEW_ITEMS);
  }
  if (candidates.length === 0) {
    return {
      ok: false,
      error: { code: "nothing_due", message: "nothing to review right now" },
    };
  }

  const plan: StoredActivity[] = [];
  for (const memory of candidates) {
    // Higher boxes earn a harder retrieval — recognition is no longer proof
    // at that point.
    const mode = memory.box >= 3 ? "production" : "context";
    const activity = await buildItemActivity(
      db,
      levelId,
      asLessonItem(memory),
      mode,
    );
    if (activity) plan.push(activity);
  }
  if (plan.length === 0) {
    return {
      ok: false,
      error: { code: "nothing_due", message: "nothing to review right now" },
    };
  }

  const sessionId = newReviewSessionId();
  await db.batch([
    createReviewSessionStatement(
      sessionId,
      userId,
      JSON.stringify(plan),
      nowIso,
    ),
  ]);
  const first = plan[0];
  return {
    ok: true,
    session: {
      sessionId,
      status: "in_progress",
      total: plan.length,
      currentActivity: first ? toActivityDTO(first, 0, plan.length) : null,
    },
  };
}

export async function getReviewSession(
  db: Db,
  userId: string,
  sessionId: string,
): Promise<ReviewSessionResult> {
  const session = await findReviewSessionById(db, sessionId);
  if (!session || session.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "session not found" },
    };
  }
  const plan = parsePlan(session.activities_json);
  const current = plan[session.current_position];
  return {
    ok: true,
    session: {
      sessionId: session.id,
      status: session.status,
      total: plan.length,
      currentActivity:
        session.status === "in_progress" && current
          ? toActivityDTO(current, session.current_position, plan.length)
          : null,
    },
  };
}

/**
 * Successful spaced retrieval is the only route to CONSOLIDATED. We check
 * it at the end of the session: a capability whose language was reviewed
 * correctly, at least a week after it was earned, has held.
 */
async function applyConsolidation(
  db: Db,
  userId: string,
  correctLessonIds: Set<string>,
  now: Date,
): Promise<{ consolidated: string[]; rewards: UnlockedRewardDTO[] }> {
  const capabilities = await listCapabilities(db, userId);
  const consolidated: string[] = [];
  const statements = [];
  for (const capability of capabilities) {
    if (capability.state !== "can_do") continue;
    if (!correctLessonIds.has(capability.lesson_id)) continue;
    if (!capability.can_do_at) continue;
    const elapsedDays =
      (now.getTime() - new Date(capability.can_do_at).getTime()) / 86_400_000;
    if (elapsedDays < CONSOLIDATION_MIN_DAYS) continue;
    statements.push(
      consolidateStatement(userId, capability.lesson_id, now.toISOString()),
    );
    consolidated.push(capability.lesson_id);
  }
  if (statements.length === 0) return { consolidated: [], rewards: [] };
  await db.batch(statements);

  const rewards: UnlockedRewardDTO[] = [];
  const first = consolidated[0];
  if (first) {
    const reward = await grantConsolidationReward(db, userId, first);
    if (reward) rewards.push(reward);
  }
  return { consolidated, rewards };
}

async function buildReviewResult(
  db: Db,
  userId: string,
  sessionId: string,
  correctCount: number,
  wrongCount: number,
  correctLessonIds: Set<string>,
  now: Date,
): Promise<ReviewResultDTO> {
  const reviewed = correctCount + wrongCount;
  const { consolidated, rewards } = await applyConsolidation(
    db,
    userId,
    correctLessonIds,
    now,
  );
  return {
    sessionId,
    reviewed,
    correctCount,
    accuracy: reviewed === 0 ? 0 : Math.round((100 * correctCount) / reviewed),
    consolidated,
    rewards,
  };
}

/** Grades one review answer and reschedules that item. There is no retry
 * inside review: a miss is information, and the item simply comes back
 * tomorrow. */
export async function answerReviewActivity(
  db: Db,
  userId: string,
  sessionId: string,
  input: unknown,
): Promise<AnswerReviewResult> {
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

  const session = await findReviewSessionById(db, sessionId);
  if (!session || session.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "session not found" },
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

  const plan = parsePlan(session.activities_json);
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
  const correctCount = session.correct_count + (isCorrect ? 1 : 0);
  const wrongCount = session.wrong_count + (isCorrect ? 0 : 1);
  const now = new Date();
  const nowIso = now.toISOString();

  const memoryRow = await db.first<{ box: number }>(
    `SELECT box FROM user_item_memory
     WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    [userId, current.targetType, current.targetId],
  );
  const scheduleStatement = recordReviewStatement(
    userId,
    current.targetType,
    current.targetId,
    memoryRow?.box ?? 1,
    isCorrect,
    now,
  );

  const newPosition = currentIndex + 1;
  if (newPosition >= plan.length) {
    await db.batch([
      scheduleStatement,
      completeReviewSessionStatement(
        sessionId,
        { currentPosition: newPosition, correctCount, wrongCount },
        nowIso,
      ),
    ]);

    // Which episodes the learner got right this session — the input to
    // consolidation. Answers are re-read from the plan, not from a client
    // claim.
    const correctLessonIds = new Set<string>();
    for (const [index, activity] of plan.entries()) {
      const wasCorrect =
        index === currentIndex
          ? isCorrect
          : await wasAnsweredCorrectly(db, userId, activity);
      if (!wasCorrect) continue;
      const memory = await db.first<{ lesson_id: string | null }>(
        `SELECT lesson_id FROM user_item_memory
         WHERE user_id = ? AND target_type = ? AND target_id = ?`,
        [userId, activity.targetType, activity.targetId],
      );
      if (memory?.lesson_id) correctLessonIds.add(memory.lesson_id);
    }

    return {
      ok: true,
      feedback,
      session: {
        status: "completed",
        result: await buildReviewResult(
          db,
          userId,
          sessionId,
          correctCount,
          wrongCount,
          correctLessonIds,
          now,
        ),
      },
    };
  }

  await db.batch([
    scheduleStatement,
    advanceReviewSessionStatement(
      sessionId,
      { currentPosition: newPosition, correctCount, wrongCount },
      nowIso,
    ),
  ]);

  const upcoming = plan[newPosition];
  if (!upcoming) {
    throw new Error(
      `Review plan ${sessionId} missing activity at position ${newPosition}`,
    );
  }
  return {
    ok: true,
    feedback,
    session: {
      status: "in_progress",
      nextActivity: toActivityDTO(upcoming, newPosition, plan.length),
    },
  };
}

/** Did this item's most recent scheduling record a correct answer? */
async function wasAnsweredCorrectly(
  db: Db,
  userId: string,
  activity: StoredActivity,
): Promise<boolean> {
  const row = await db.first<{ last_result: string | null }>(
    `SELECT last_result FROM user_item_memory
     WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    [userId, activity.targetType, activity.targetId],
  );
  return row?.last_result === "correct";
}

/** Used by Today and the re-entry path to know whether review is worth
 * offering at all. */
export async function countDueForUser(db: Db, userId: string): Promise<number> {
  const due = await countDueMemory(db, userId, new Date().toISOString());
  return Math.min(due?.n ?? 0, MAX_REVIEW_ITEMS);
}

/** Exposed for the "My English" list: which episode a phrase came from. */
export async function describeMemoryOrigin(
  db: Db,
  lessonId: string | null,
): Promise<{ episodeTitle: string | null; moduleTitle: string | null }> {
  if (!lessonId) return { episodeTitle: null, moduleTitle: null };
  const lesson = await findPublishedLessonById(db, lessonId);
  if (!lesson) return { episodeTitle: null, moduleTitle: null };
  const module_ = await findPublishedModuleById(db, lesson.module_id);
  return {
    episodeTitle: lesson.situation_title ?? lesson.title,
    moduleTitle: module_?.title ?? null,
  };
}
