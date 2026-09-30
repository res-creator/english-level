import type { DatabaseSync } from "node:sqlite";
import type { ActivityDTO } from "@english-level/contracts";
import type { CefrLevelRow, Db } from "../../src/db/types.ts";
import {
  completeOnboardingWithVerifiedLevel,
  createUser,
  setOnboardingStage,
} from "../../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../../src/repositories/userSettingsRepository.ts";
import {
  answerActivity,
  startLessonSession,
} from "../../src/services/lessonSessionService.ts";
import type { SessionResultDTO } from "@english-level/contracts";

export async function makeVerifiedUser(
  db: Db,
  telegramUserId: number,
  level: CefrLevelRow,
) {
  const user = await createUser(db, { telegramUserId, firstName: "Test" });
  await createDefaultUserSettings(db, user.id);
  await setOnboardingStage(db, user.id, "placement_required");
  await completeOnboardingWithVerifiedLevel(db, user.id, level);
  return user;
}

/** Test setup for focused engine tests that intentionally exercise a later
 * situation without replaying the entire sequential course first. */
export function unlockLessonPrerequisites(
  sqlite: DatabaseSync,
  userId: string,
  lessonId: string,
) {
  const target = sqlite
    .prepare(
      `SELECT m.level_id, m.order_index AS module_order,
              l.order_index AS lesson_order
       FROM lessons l JOIN modules m ON m.id = l.module_id
       WHERE l.id = ?`,
    )
    .get(lessonId) as
    | { level_id: string; module_order: number; lesson_order: number }
    | undefined;
  if (!target) throw new Error(`unknown lesson ${lessonId}`);
  const prerequisites = sqlite
    .prepare(
      `SELECT l.id
       FROM lessons l JOIN modules m ON m.id = l.module_id
       WHERE m.level_id = ? AND l.status = 'published' AND m.status = 'published'
         AND (m.order_index < ? OR
              (m.order_index = ? AND l.order_index < ?))
       ORDER BY m.order_index, l.order_index`,
    )
    .all(
      target.level_id,
      target.module_order,
      target.module_order,
      target.lesson_order,
    ) as Array<{ id: string }>;
  const insert = sqlite.prepare(
    `INSERT OR IGNORE INTO user_capabilities
      (user_id, lesson_id, state, sessions_done, sessions_total,
       mission_attempts, can_do_at, started_at, updated_at)
     VALUES (?, ?, 'can_do', 3, 3, 1, CURRENT_TIMESTAMP,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  for (const prerequisite of prerequisites) insert.run(userId, prerequisite.id);
}

interface StoredActivityLike {
  id: string;
  kind: string;
  correctOptionId?: string;
  acceptedAnswers?: string[];
  correctAnswer?: string;
}

function planFor(
  sqlite: DatabaseSync,
  sessionId: string,
): StoredActivityLike[] {
  const row = sqlite
    .prepare("SELECT activities_json FROM learning_sessions WHERE id = ?")
    .get(sessionId) as { activities_json: string };
  return JSON.parse(row.activities_json);
}

/** Reads the *stored* (server-only) correct answer directly out of
 * `activities_json` — a test-only shortcut for driving a session, not
 * something the real client can do (the DTO never carries this). */
export function correctAnswerFor(
  sqlite: DatabaseSync,
  sessionId: string,
  activity: ActivityDTO,
): string {
  const stored = planFor(sqlite, sessionId).find((a) => a.id === activity.id);
  if (!stored)
    throw new Error(`activity ${activity.id} not found in stored plan`);
  switch (stored.kind) {
    case "info_card":
    case "grammar_card":
      return "ack";
    case "multiple_choice":
    case "fill_gap_choice":
      if (!stored.correctOptionId)
        throw new Error(`${activity.id} missing correctOptionId`);
      return stored.correctOptionId;
    case "typed_recall":
      if (!stored.acceptedAnswers?.[0])
        throw new Error(`${activity.id} missing acceptedAnswers`);
      return stored.acceptedAnswers[0];
    case "sentence_build":
      if (!stored.correctAnswer)
        throw new Error(`${activity.id} missing correctAnswer`);
      return stored.correctAnswer;
    default:
      throw new Error(`unknown activity kind ${stored.kind}`);
  }
}

const WRONG_ANSWER = "zzz_definitely_not_the_answer_zzz";

/**
 * Drives ONE session (a single slice of an episode, or its Mission) to
 * completion via the real service functions,
 * answering every scored activity either always correctly or always
 * incorrectly. Returns the final result and every `nextActivity` DTO seen
 * along the way (so tests can inspect them for leaked answer keys, etc).
 */
export async function driveLessonToCompletion(
  db: Db,
  sqlite: DatabaseSync,
  userId: string,
  lessonId: string,
  opts: { correct: boolean } = { correct: true },
): Promise<{
  sessionId: string;
  result: SessionResultDTO;
  seenActivities: ActivityDTO[];
}> {
  const start = await startLessonSession(db, userId, lessonId);
  if (!start.ok)
    throw new Error(`start failed: ${JSON.stringify(start.error)}`);
  const sessionId = start.session.sessionId;
  const seenActivities: ActivityDTO[] = [];
  let current = start.session.currentActivity;
  let attemptCounter = 0;

  for (let guard = 0; guard < 400; guard++) {
    if (!current)
      throw new Error(
        `lesson ${lessonId} session ended with no current activity`,
      );
    seenActivities.push(current);
    const answer = opts.correct
      ? correctAnswerFor(sqlite, sessionId, current)
      : WRONG_ANSWER;
    const res = await answerActivity(db, userId, sessionId, {
      activityId: current.id,
      answer,
      attemptId: `fixture-${sessionId}-${attemptCounter++}`,
    });
    if (!res.ok) throw new Error(`answer failed: ${JSON.stringify(res.error)}`);
    if (res.session.status === "completed") {
      return { sessionId, result: res.session.result, seenActivities };
    }
    current = res.session.nextActivity;
  }
  throw new Error(`lesson ${lessonId} did not complete within 400 answers`);
}

/**
 * Drives every session of an episode and then its Mission, the way a
 * learner would over several days. Returns the Mission's result — i.e. the
 * moment the capability is actually earned.
 */
export async function driveEpisodeToCanDo(
  db: Db,
  sqlite: DatabaseSync,
  userId: string,
  lessonId: string,
  opts: { correct: boolean } = { correct: true },
): Promise<SessionResultDTO> {
  let last: SessionResultDTO | null = null;
  for (let guard = 0; guard < 20; guard++) {
    const run = await driveLessonToCompletion(
      db,
      sqlite,
      userId,
      lessonId,
      opts,
    );
    last = run.result;
    if (run.result.kind === "mission") return run.result;
  }
  if (!last) throw new Error(`episode ${lessonId} produced no session`);
  throw new Error(`episode ${lessonId} never reached its Mission`);
}

/**
 * Walks an episode — across as many of its sessions as it takes, exactly
 * as a learner would over several days — until an activity of the wanted
 * kind comes up, answering everything before it correctly.
 *
 * Sessions are short by design, so a given exercise format may simply not
 * be in today's slice; tests that need one must keep going rather than
 * assume the whole episode arrives at once.
 */
export async function walkToActivityKind(
  db: Db,
  sqlite: DatabaseSync,
  userId: string,
  lessonId: string,
  kind: ActivityDTO["kind"],
): Promise<{ sessionId: string; activity: ActivityDTO }> {
  let attempt = 0;
  for (let session = 0; session < 12; session++) {
    const started = await startLessonSession(db, userId, lessonId);
    if (!started.ok)
      throw new Error(`start failed: ${JSON.stringify(started.error)}`);
    const sessionId = started.session.sessionId;
    let current = started.session.currentActivity;

    while (current) {
      if (current.kind === kind) return { sessionId, activity: current };
      const res = await answerActivity(db, userId, sessionId, {
        activityId: current.id,
        answer: correctAnswerFor(sqlite, sessionId, current),
        attemptId: `walk-${sessionId}-${attempt++}`,
      });
      if (!res.ok)
        throw new Error(`answer failed: ${JSON.stringify(res.error)}`);
      if (res.session.status === "completed") break;
      current = res.session.nextActivity;
    }
  }
  throw new Error(`no ${kind} activity found anywhere in ${lessonId}`);
}
