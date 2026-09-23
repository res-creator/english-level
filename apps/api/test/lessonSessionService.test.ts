import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { resolveCurrentUser } from "../src/services/authService.ts";
import {
  answerActivity,
  getLessonSession,
  getSessionResult,
  startLessonSession,
} from "../src/services/lessonSessionService.ts";
import { getLessonContent } from "../src/services/curriculumService.ts";
import { findProgress } from "../src/repositories/userLessonProgressRepository.ts";
import { createUser } from "../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../src/repositories/userSettingsRepository.ts";
import {
  correctAnswerFor,
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
  walkToActivityKind,
} from "./helpers/lessonFixtures.ts";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

const LESSON = "les_sie_a1_e1"; // "Первое знакомство": 7 introduce items
const GRAMMAR_LESSON = "les_sie_a1_e3"; // two grammar patterns, "target" role

// --- auth gate -------------------------------------------------------------

test("unauthenticated lesson access is rejected (same requireAuth gate the routes use)", async () => {
  const { db } = createTestDb();
  assert.equal(await resolveCurrentUser(db, undefined), null);
});

// --- eligibility -------------------------------------------------------------

test("an unpublished/unknown lesson is rejected", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 1, "A1");
  const result = await startLessonSession(db, user.id, "les_does_not_exist");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("an archived lesson is rejected", async () => {
  const { db, sqlite } = await seeded();
  sqlite
    .prepare("UPDATE lessons SET status = 'archived' WHERE id = ?")
    .run(LESSON);
  const user = await makeVerifiedUser(db, 2, "A1");
  const result = await startLessonSession(db, user.id, LESSON);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("a lesson at a different level than the user's verified level is rejected", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 3, "A2");
  const result = await startLessonSession(db, user.id, LESSON); // LESSON is A1
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "wrong_level");
});

test("a user with no verified level yet cannot start a lesson", async () => {
  const { db } = await seeded();
  const unplaced = await createUser(db, {
    telegramUserId: 4,
    firstName: "Unplaced",
  });
  await createDefaultUserSettings(db, unplaced.id);
  const result = await startLessonSession(db, unplaced.id, LESSON);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_eligible");
});

test("a published lesson at the user's own level starts successfully", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 5, "A1");
  const result = await startLessonSession(db, user.id, LESSON);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.session.status, "in_progress");
    assert.equal(result.session.episode.id, LESSON);
    assert.ok(result.session.currentActivity);
  }
});

// --- session/progress creation ----------------------------------------------

test("starting a lesson creates a learning_sessions row", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 6, "A1");
  const result = await startLessonSession(db, user.id, LESSON);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const row = sqlite
    .prepare("SELECT * FROM learning_sessions WHERE id = ?")
    .get(result.session.sessionId) as {
    user_id: string;
    lesson_id: string;
    status: string;
  };
  assert.equal(row.user_id, user.id);
  assert.equal(row.lesson_id, LESSON);
  assert.equal(row.status, "in_progress");
});

test("starting a lesson creates a user_lesson_progress row (in_progress)", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 7, "A1");
  const result = await startLessonSession(db, user.id, LESSON);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const progress = await findProgress(db, user.id, LESSON);
  assert.ok(progress);
  assert.equal(progress?.status, "in_progress");
  assert.equal(progress?.attempt_count, 1);
  assert.equal(progress?.last_session_id, result.session.sessionId);
});

test("starting the same lesson twice resumes the existing active session, not a second one", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 8, "A1");
  const first = await startLessonSession(db, user.id, LESSON);
  const second = await startLessonSession(db, user.id, LESSON);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.session.sessionId, second.session.sessionId);

  const count = sqlite
    .prepare(
      "SELECT COUNT(*) as n FROM learning_sessions WHERE user_id = ? AND lesson_id = ?",
    )
    .get(user.id, LESSON) as { n: number };
  assert.equal(count.n, 1);
});

// --- ownership ---------------------------------------------------------------

test("another user cannot access someone else's session", async () => {
  const { db } = await seeded();
  const owner = await makeVerifiedUser(db, 9, "A1");
  const intruder = await makeVerifiedUser(db, 10, "A1");
  const started = await startLessonSession(db, owner.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = await getLessonSession(
    db,
    intruder.id,
    started.session.sessionId,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

// --- ActivityDTO does not leak answer keys ------------------------------------

test("the current activity contains no answer-key fields", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 11, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const activity = started.session.currentActivity! as unknown as Record<
    string,
    unknown
  >;
  for (const forbidden of [
    "correctOptionId",
    "acceptedAnswers",
    "correctAnswer",
    "isRetry",
    "targetType",
    "targetId",
    "explanation",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(activity, forbidden),
      false,
      `leaked field "${forbidden}"`,
    );
  }
});

// --- activity kinds ------------------------------------------------------------

test("info_card can be acknowledged/advanced without an answer", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 12, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const activity = started.session.currentActivity!;
  assert.equal(activity.kind, "info_card");

  const res = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: activity.id,
    answer: "",
    attemptId: "advance-1",
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(res.feedback, { correct: true });
    assert.equal(res.session.status, "in_progress");
  }
});

test("multiple_choice grades correct and incorrect answers server-side", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 13, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  // Advance past the info_card to the multiple_choice recognition check.
  const ack = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: started.session.currentActivity!.id,
    answer: "",
    attemptId: "adv",
  });
  assert.equal(ack.ok, true);
  if (!ack.ok || ack.session.status !== "in_progress") return;
  const mc = ack.session.nextActivity;
  assert.equal(mc.kind, "multiple_choice");

  const wrong = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: mc.id,
    answer: "zzz-not-an-option",
    attemptId: "mc-wrong",
  });
  assert.equal(wrong.ok, true);
  if (!wrong.ok) return;
  assert.equal(wrong.feedback.correct, false);
  if (wrong.feedback.correct === false) {
    assert.ok(wrong.feedback.correctAnswer.length > 0);
  }
});

test("fill_gap_choice is graded server-side from the selected option id", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 14, "A1");
  const { sessionId, activity } = await walkToActivityKind(
    db,
    sqlite,
    user.id,
    LESSON,
    "fill_gap_choice",
  );

  const correctAnswer = correctAnswerFor(sqlite, sessionId, activity);
  const res = await answerActivity(db, user.id, sessionId, {
    activityId: activity.id,
    answer: correctAnswer,
    attemptId: "fillgap-correct",
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.deepEqual(res.feedback, { correct: true });
});

test("typed_recall normalizes whitespace/case before grading", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 15, "A1");
  const { sessionId, activity } = await walkToActivityKind(
    db,
    sqlite,
    user.id,
    GRAMMAR_LESSON,
    "typed_recall",
  );

  const correctAnswer = correctAnswerFor(sqlite, sessionId, activity);
  const res = await answerActivity(db, user.id, sessionId, {
    activityId: activity.id,
    answer: `   ${correctAnswer.toUpperCase()}  `,
    attemptId: "typed-messy",
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.deepEqual(res.feedback, { correct: true });
});

test("sentence_build is graded server-side against the original sentence", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 16, "A1");
  const { sessionId, activity } = await walkToActivityKind(
    db,
    sqlite,
    user.id,
    "les_sie_a1_e2",
    "sentence_build",
  );
  assert.ok(
    activity.kind === "sentence_build" && activity.content.tokens.length >= 3,
  );

  const correctAnswer = correctAnswerFor(sqlite, sessionId, activity);
  const res = await answerActivity(db, user.id, sessionId, {
    activityId: activity.id,
    answer: correctAnswer,
    attemptId: "sentence-correct",
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.deepEqual(res.feedback, { correct: true });
});

test("sentence_build grading uses the canonical sentence order, not the shuffled display order shown in the DTO", async () => {
  async function walkToSentenceBuild(userId: number) {
    const { db, sqlite } = await seeded();
    const user = await makeVerifiedUser(db, userId, "A1");
    const started = await startLessonSession(db, user.id, "les_sie_a1_e2");
    assert.equal(started.ok, true);
    if (!started.ok) throw new Error("start failed");

    const sessionId = started.session.sessionId;
    let current = started.session.currentActivity!;
    for (let i = 0; i < 40; i++) {
      if (current.kind === "sentence_build") break;
      const correct = correctAnswerFor(sqlite, sessionId, current);
      const res = await answerActivity(db, user.id, sessionId, {
        activityId: current.id,
        answer: correct,
        attemptId: `walk2-${i}`,
      });
      assert.equal(res.ok, true);
      if (!res.ok || res.session.status !== "in_progress") break;
      current = res.session.nextActivity;
    }
    assert.equal(current.kind, "sentence_build");
    if (current.kind !== "sentence_build") throw new Error("unreachable");
    return { db, sqlite, user, sessionId, current };
  }

  // Two independent sessions reach the exact same deterministic
  // sentence_build activity (same shuffled display tokens, same
  // canonical answer, since generation is deterministic) — one submits
  // the displayed (shuffled) order, the other the canonical order.
  const a = await walkToSentenceBuild(50);
  const b = await walkToSentenceBuild(51);
  assert.deepEqual(a.current.content.tokens, b.current.content.tokens);

  const canonicalAnswer = correctAnswerFor(a.sqlite, a.sessionId, a.current);
  const displayedOrder = a.current.content.tokens.join(" ");

  if (displayedOrder !== canonicalAnswer) {
    const wrong = await answerActivity(a.db, a.user.id, a.sessionId, {
      activityId: a.current.id,
      answer: displayedOrder,
      attemptId: "sentence-shuffled-order",
    });
    assert.equal(wrong.ok, true);
    if (wrong.ok) {
      assert.equal(wrong.feedback.correct, false);
      if (wrong.feedback.correct === false) {
        assert.equal(wrong.feedback.correctAnswer, canonicalAnswer);
      }
    }
  }

  const right = await answerActivity(b.db, b.user.id, b.sessionId, {
    activityId: b.current.id,
    answer: canonicalAnswer,
    attemptId: "sentence-canonical-order",
  });
  assert.equal(right.ok, true);
  if (right.ok) assert.deepEqual(right.feedback, { correct: true });
});

test("grammar_card and its recognition check both work", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 17, "A1");
  const { sessionId, activity } = await walkToActivityKind(
    db,
    sqlite,
    user.id,
    GRAMMAR_LESSON,
    "grammar_card",
  );

  const ack = await answerActivity(db, user.id, sessionId, {
    activityId: activity.id,
    answer: "",
    attemptId: "grammar-ack",
  });
  assert.equal(ack.ok, true);
  if (!ack.ok || ack.session.status !== "in_progress") return;
  assert.equal(ack.session.nextActivity.kind, "multiple_choice");

  const correctAnswer = correctAnswerFor(
    sqlite,
    sessionId,
    ack.session.nextActivity,
  );
  const res = await answerActivity(db, user.id, sessionId, {
    activityId: ack.session.nextActivity.id,
    answer: correctAnswer,
    attemptId: "grammar-mc",
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.deepEqual(res.feedback, { correct: true });
});

// --- position integrity -------------------------------------------------------

test("answering a non-current activity id is rejected", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 18, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const res = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: "act_999_not_current",
    answer: "x",
    attemptId: "bad-activity",
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.error.code, "activity_not_current");
});

// --- idempotency ---------------------------------------------------------------

test("a duplicate attemptId is idempotent: same response, no double grading", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 19, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const activity = started.session.currentActivity!;
  const body = { activityId: activity.id, answer: "", attemptId: "dup-key" };
  const first = await answerActivity(
    db,
    user.id,
    started.session.sessionId,
    body,
  );
  const second = await answerActivity(
    db,
    user.id,
    started.session.sessionId,
    body,
  );
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (first.ok && second.ok) assert.deepEqual(first, second);

  const attemptCount = sqlite
    .prepare(
      "SELECT COUNT(*) as n FROM exercise_attempts WHERE session_id = ? AND attempt_key = ?",
    )
    .get(started.session.sessionId, "dup-key") as { n: number };
  assert.equal(attemptCount.n, 1);
});

test("a duplicate attemptId does not increment counters twice", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 20, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  // Advance to a scored activity.
  const ack = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: started.session.currentActivity!.id,
    answer: "",
    attemptId: "adv",
  });
  assert.equal(ack.ok, true);
  if (!ack.ok || ack.session.status !== "in_progress") return;
  const mc = ack.session.nextActivity;
  const correctAnswer = correctAnswerFor(sqlite, started.session.sessionId, mc);
  const body = {
    activityId: mc.id,
    answer: correctAnswer,
    attemptId: "mc-dup",
  };

  await answerActivity(db, user.id, started.session.sessionId, body);
  await answerActivity(db, user.id, started.session.sessionId, body);
  await answerActivity(db, user.id, started.session.sessionId, body);

  const row = sqlite
    .prepare(
      "SELECT correct_count, wrong_count FROM learning_sessions WHERE id = ?",
    )
    .get(started.session.sessionId) as {
    correct_count: number;
    wrong_count: number;
  };
  assert.equal(row.correct_count, 1);
  assert.equal(row.wrong_count, 0);
});

// --- resume ----------------------------------------------------------------

test("a session can be read again (simulated Mini App reopen) and shows the same current activity", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 21, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const reopened = await getLessonSession(
    db,
    user.id,
    started.session.sessionId,
  );
  assert.equal(reopened.ok, true);
  if (reopened.ok) assert.deepEqual(reopened.session, started.session);
});

// --- completion --------------------------------------------------------------

test("finishing one session records it without claiming the episode is done", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 22, "A1");
  const { sessionId, result } = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    LESSON,
    {
      correct: true,
    },
  );

  assert.equal(result.episodeId, LESSON);
  assert.equal(result.kind, "lesson");
  assert.ok(result.scoredAttempts > 0);
  assert.equal(result.correctCount, result.scoredAttempts);
  assert.equal(result.accuracy, 100);
  assert.equal(result.sessionsDone, 1);

  const sessionRow = sqlite
    .prepare("SELECT status FROM learning_sessions WHERE id = ?")
    .get(sessionId) as { status: string };
  assert.equal(sessionRow.status, "completed");

  // The capability is still only LEARNING: proof comes from the Mission.
  const progress = await findProgress(db, user.id, LESSON);
  assert.equal(progress?.status, "in_progress");
  const capability = sqlite
    .prepare(
      "SELECT state FROM user_capabilities WHERE user_id = ? AND lesson_id = ?",
    )
    .get(user.id, LESSON) as { state: string };
  assert.equal(capability.state, "learning");
});

test("a session never exceeds a short, finishable length", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 122, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const plan = JSON.parse(
    (
      sqlite
        .prepare("SELECT activities_json FROM learning_sessions WHERE id = ?")
        .get(started.session.sessionId) as { activities_json: string }
    ).activities_json,
  ) as unknown[];
  assert.ok(
    plan.length <= 12,
    `a daily session must stay under 12 activities, got ${plan.length}`,
  );
});

test("a completed session cannot be answered again", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 23, "A1");
  const { sessionId } = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    LESSON,
    {
      correct: true,
    },
  );

  const res = await answerActivity(db, user.id, sessionId, {
    activityId: "act_001",
    answer: "anything",
    attemptId: "post-completion",
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.error.code, "session_not_active");
});

test("a wrong scored answer inserts one later retry, not an immediate repeat", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 24, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const ack = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: started.session.currentActivity!.id,
    answer: "",
    attemptId: "adv",
  });
  assert.equal(ack.ok, true);
  if (!ack.ok || ack.session.status !== "in_progress") return;
  const mc = ack.session.nextActivity;

  const wrong = await answerActivity(db, user.id, started.session.sessionId, {
    activityId: mc.id,
    answer: "zzz-not-an-option",
    attemptId: "mc-wrong-retry",
  });
  assert.equal(wrong.ok, true);
  if (!wrong.ok || wrong.session.status !== "in_progress") return;

  // The very next activity must NOT be the identical question again.
  assert.notEqual(wrong.session.nextActivity.id, mc.id);

  const plan = JSON.parse(
    (
      sqlite
        .prepare("SELECT activities_json FROM learning_sessions WHERE id = ?")
        .get(started.session.sessionId) as { activities_json: string }
    ).activities_json,
  ) as Array<{ id: string; isRetry?: boolean }>;
  assert.ok(plan.some((a) => a.id === `${mc.id}_retry` && a.isRetry === true));
});

// --- replay ------------------------------------------------------------------

test("replaying a completed lesson creates a new session and preserves history", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 25, "A1");
  const { sessionId: firstSessionId } = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    LESSON,
    {
      correct: true,
    },
  );

  const replay = await startLessonSession(db, user.id, LESSON);
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.notEqual(replay.session.sessionId, firstSessionId);

  const progress = await findProgress(db, user.id, LESSON);
  assert.equal(progress?.attempt_count, 2);

  const oldSessionStillThere = sqlite
    .prepare("SELECT status FROM learning_sessions WHERE id = ?")
    .get(firstSessionId) as { status: string } | undefined;
  assert.equal(oldSessionStillThere?.status, "completed");

  const attemptsForOldSession = sqlite
    .prepare("SELECT COUNT(*) as n FROM exercise_attempts WHERE session_id = ?")
    .get(firstSessionId) as { n: number };
  assert.ok(
    attemptsForOldSession.n > 0,
    "previous session's attempts must remain stored",
  );
});

// --- read-only content API + no unrelated side effects ------------------------

test("reading lesson content (Phase 5 API) never creates a session", async () => {
  const { db, sqlite } = await seeded();
  await getLessonContent(db, LESSON, "usr_test");
  await getLessonContent(db, LESSON, "usr_test");
  const count = sqlite
    .prepare("SELECT COUNT(*) as n FROM learning_sessions")
    .get() as {
    n: number;
  };
  assert.equal(count.n, 0);
});

test("no mastery/SRS/streak tables exist and completing a lesson doesn't touch unrelated user fields", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 26, "A1");
  const before = sqlite
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(user.id) as Record<string, unknown>;
  await driveLessonToCompletion(db, sqlite, user.id, LESSON, { correct: true });
  const after = sqlite
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(user.id) as Record<string, unknown>;

  // Only last_active_at/updated_at-style bookkeeping fields on `users` are
  // allowed to move; current_cefr_level, onboarding_*, status must not.
  assert.equal(after.current_cefr_level, before.current_cefr_level);
  assert.equal(after.onboarding_stage, before.onboarding_stage);
  assert.equal(after.status, before.status);

  const tableNames = (
    sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>
  ).map((r) => r.name);
  for (const forbidden of [
    "review_queue",
    "user_item_progress",
    "user_module_progress",
    "streaks",
  ]) {
    assert.equal(
      tableNames.includes(forbidden),
      false,
      `unexpected table ${forbidden}`,
    );
  }
});

// --- end-to-end fixture --------------------------------------------------------

test("end-to-end: every session plus the Mission earns the capability", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 27, "A1");

  const mission = await driveEpisodeToCanDo(db, sqlite, user.id, LESSON);
  assert.equal(mission.kind, "mission");
  assert.equal(mission.episodeId, LESSON);
  assert.equal(mission.missionPassed, true);
  assert.equal(mission.capabilityState, "can_do");
  assert.ok(mission.capability?.startsWith("Я могу"));

  const progress = await findProgress(db, user.id, LESSON);
  assert.equal(progress?.status, "completed");
});

test("a failed Mission does not grant the capability", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 127, "A1");

  for (let guard = 0; guard < 12; guard++) {
    const started = await startLessonSession(db, user.id, LESSON);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    const isMission = started.session.kind === "mission";
    // Learn properly, then fail the proof.
    const run = await driveLessonToCompletion(db, sqlite, user.id, LESSON, {
      correct: !isMission,
    });
    if (!isMission) continue;

    assert.equal(run.result.missionPassed, false);
    assert.equal(run.result.capabilityState, "learning");
    const rewards = sqlite
      .prepare("SELECT COUNT(*) n FROM user_rewards WHERE user_id = ?")
      .get(user.id) as { n: number };
    assert.equal(rewards.n, 0, "a failed Mission must unlock nothing");
    return;
  }
  assert.fail("never reached the Mission");
});

test("a Mission gives no second try — proof is not practice", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 128, "A1");

  for (let guard = 0; guard < 12; guard++) {
    const started = await startLessonSession(db, user.id, LESSON);
    assert.equal(started.ok, true);
    if (!started.ok) return;
    if (started.session.kind !== "mission") {
      await driveLessonToCompletion(db, sqlite, user.id, LESSON, {
        correct: true,
      });
      continue;
    }

    const planLength = JSON.parse(
      (
        sqlite
          .prepare("SELECT activities_json FROM learning_sessions WHERE id = ?")
          .get(started.session.sessionId) as { activities_json: string }
      ).activities_json,
    ).length as number;

    const first = started.session.currentActivity!;
    const res = await answerActivity(db, user.id, started.session.sessionId, {
      activityId: first.id,
      answer: "definitely wrong",
      attemptId: "mission-wrong",
    });
    assert.equal(res.ok, true);

    const after = JSON.parse(
      (
        sqlite
          .prepare("SELECT activities_json FROM learning_sessions WHERE id = ?")
          .get(started.session.sessionId) as { activities_json: string }
      ).activities_json,
    ).length as number;
    assert.equal(after, planLength, "the Mission plan must not grow a retry");
    return;
  }
  assert.fail("never reached the Mission");
});

// --- persistent result (GET /sessions/:sessionId/result) ----------------------

test("a completed lesson's result can be retrieved after completion via GET /result", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 28, "A1");
  const { sessionId, result: inlineResult } = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    LESSON,
    { correct: true },
  );

  const fetched = await getSessionResult(db, user.id, sessionId);
  assert.equal(fetched.ok, true);
  if (!fetched.ok) return;
  assert.deepEqual(fetched.result, inlineResult);
  assert.equal(fetched.result.sessionId, sessionId);
  assert.equal(fetched.result.kind, "lesson");
  assert.ok(fetched.result.completedAt.length > 0);
  assert.equal(
    fetched.result.correctCount + fetched.result.wrongCount,
    fetched.result.scoredAttempts,
  );
});

test("the result survives a simulated frontend reload (a second, independent GET returns the same result)", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 29, "A1");
  const { sessionId } = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    LESSON,
    {
      correct: false,
    },
  );

  // Simulate the page being reloaded: a brand new request for the same
  // sessionId, with nothing carried over from the completing response.
  const first = await getSessionResult(db, user.id, sessionId);
  const second = await getSessionResult(db, user.id, sessionId);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (first.ok && second.ok) assert.deepEqual(first.result, second.result);
});

test("another user cannot access someone else's session result", async () => {
  const { db, sqlite } = await seeded();
  const owner = await makeVerifiedUser(db, 30, "A1");
  const intruder = await makeVerifiedUser(db, 31, "A1");
  const { sessionId } = await driveLessonToCompletion(
    db,
    sqlite,
    owner.id,
    LESSON,
    {
      correct: true,
    },
  );

  const result = await getSessionResult(db, intruder.id, sessionId);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("an incomplete (in_progress) session does not expose a result", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 32, "A1");
  const started = await startLessonSession(db, user.id, LESSON);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = await getSessionResult(db, user.id, started.session.sessionId);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_completed");
});

test("the public session-result DTO contains no answer keys or internal grading data", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 33, "A1");
  const { sessionId } = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    LESSON,
    {
      correct: true,
    },
  );

  const result = await getSessionResult(db, user.id, sessionId);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(Object.keys(result.result).sort(), [
    "accuracy",
    "capability",
    "capabilityState",
    "completedAt",
    "correctCount",
    "episodeId",
    "episodeTitle",
    "kind",
    "missionPassed",
    "missionReady",
    "nextEpisodeId",
    "reviewDue",
    "rewards",
    "scoredAttempts",
    "sessionId",
    "sessionsDone",
    "sessionsTotal",
    "teaser",
    "wrongCount",
  ]);
  for (const forbidden of [
    "correctOptionId",
    "acceptedAnswers",
    "correctAnswer",
    "activities_json",
    "answer",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(result.result, forbidden),
      false,
      `leaked "${forbidden}"`,
    );
  }
});
