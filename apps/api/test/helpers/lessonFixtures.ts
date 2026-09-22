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
import type { LessonResultDTO } from "@english-level/contracts";

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
 * Drives a lesson session to completion via the real service functions,
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
  result: LessonResultDTO;
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
