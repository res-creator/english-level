import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import {
  buildReminderText,
  runDailyReminders,
  type TelegramSendResult,
  type TelegramSender,
} from "../src/services/notificationService.ts";
import { getToday } from "../src/services/todayService.ts";
import {
  createDefaultUserSettings,
  getUserSettings,
  updateUserSettings,
} from "../src/repositories/userSettingsRepository.ts";
import {
  createUser,
  setOnboardingStage,
} from "../src/repositories/usersRepository.ts";
import {
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";

const EPISODE_1 = "les_sie_a1_e1";
const WEB_APP_URL = "https://example.workers.dev";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

/** Records every call so a test can assert who was messaged, and lets
 * each call's outcome be scripted. */
function fakeSender(
  outcome: (chatId: number) => TelegramSendResult = () => ({
    ok: true,
    blocked: false,
  }),
) {
  const calls: { chatId: number; text: string; webAppUrl: string }[] = [];
  const sender: TelegramSender = {
    async send(chatId, text, webAppUrl) {
      calls.push({ chatId, text, webAppUrl });
      return outcome(chatId);
    },
  };
  return { sender, calls };
}

// --- message content ---------------------------------------------------

test("the message names the actual situation waiting today, not a generic nudge", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 601, "A1");
  const today = await getToday(db, user.id, "A1");
  const text = buildReminderText(today);
  assert.ok(text);
  assert.ok(text.includes("Первое знакомство"));
});

test("nothing meaningful to offer means no text at all, not an empty nudge", () => {
  const text = buildReminderText({
    action: "none",
    episode: null,
    chapterTitle: null,
    level: null,
    estimatedMinutes: null,
    reviewDue: 0,
    capabilities: { canDo: 0, consolidated: 0 },
    chapterProgress: null,
    companionId: null,
    daysAway: null,
    weeklyGoal: null,
  });
  assert.equal(text, null);
});

test("review-only days mention the real due count, correctly pluralised", () => {
  const base = {
    action: "review" as const,
    episode: null,
    chapterTitle: null,
    level: "A1" as const,
    estimatedMinutes: null,
    capabilities: { canDo: 0, consolidated: 0 },
    chapterProgress: null,
    companionId: null,
    daysAway: null,
    weeklyGoal: null,
  };
  assert.match(
    buildReminderText({ ...base, reviewDue: 1 }) ?? "",
    /1 фраза ждёт/,
  );
  assert.match(
    buildReminderText({ ...base, reviewDue: 3 }) ?? "",
    /3 фраз ждут/,
  );
});

// --- selection -----------------------------------------------------------

test("a fresh, opted-in learner with nothing done today gets exactly one message", async () => {
  const { db, sqlite } = await seeded();
  await makeVerifiedUser(db, 602, "A1");
  const { sender, calls } = fakeSender();

  const summary = await runDailyReminders(db, sender, WEB_APP_URL);

  assert.equal(summary.sent, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.webAppUrl, WEB_APP_URL);

  const row = sqlite
    .prepare(
      "SELECT event_name FROM analytics_events WHERE event_name = 'reminder_sent'",
    )
    .get() as { event_name: string } | undefined;
  assert.equal(row?.event_name, "reminder_sent");
});

test("someone who already practised today is not messaged", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 603, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  const { sender, calls } = fakeSender();

  const summary = await runDailyReminders(db, sender, WEB_APP_URL);

  assert.equal(calls.length, 0);
  assert.equal(summary.alreadyActiveToday, 1);
  assert.equal(summary.sent, 0);
});

test("running twice in the same day never sends a second message to the same learner", async () => {
  const { db } = await seeded();
  await makeVerifiedUser(db, 604, "A1");
  const { sender, calls } = fakeSender();

  const first = await runDailyReminders(db, sender, WEB_APP_URL);
  const second = await runDailyReminders(db, sender, WEB_APP_URL);

  assert.equal(first.sent, 1);
  assert.equal(second.sent, 0);
  assert.equal(second.alreadyRemindedToday, 1);
  assert.equal(calls.length, 1);
});

test("a learner who turned reminders off is never a candidate at all", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 605, "A1");
  await updateUserSettings(db, user.id, { dailyReminderEnabled: false });
  const { sender, calls } = fakeSender();

  const summary = await runDailyReminders(db, sender, WEB_APP_URL);

  assert.equal(summary.candidates, 0);
  assert.equal(calls.length, 0);
});

test("someone who hasn't finished onboarding is never messaged — there's no 'today' for them yet", async () => {
  const { db } = await seeded();
  const user = await createUser(db, { telegramUserId: 606, firstName: "Test" });
  await createDefaultUserSettings(db, user.id);
  await setOnboardingStage(db, user.id, "goals");
  const { sender, calls } = fakeSender();

  const summary = await runDailyReminders(db, sender, WEB_APP_URL);

  assert.equal(summary.candidates, 0);
  assert.equal(calls.length, 0);
});

// --- delivery outcomes -----------------------------------------------------

test("a blocked bot turns the reminder off for that learner instead of retrying forever", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 607, "A1");
  const { sender } = fakeSender(() => ({ ok: false, blocked: true }));

  const summary = await runDailyReminders(db, sender, WEB_APP_URL);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.sent, 0);

  const settings = await getUserSettings(db, user.id);
  assert.equal(settings?.daily_reminder_enabled, 0);

  // And the next run doesn't even consider them a candidate any more.
  const { sender: sender2, calls } = fakeSender();
  const second = await runDailyReminders(db, sender2, WEB_APP_URL);
  assert.equal(second.candidates, 0);
  assert.equal(calls.length, 0);
});

test("a transient delivery failure is not recorded as sent, and is retried on the next run", async () => {
  const { db } = await seeded();
  await makeVerifiedUser(db, 608, "A1");
  const { sender: failing } = fakeSender(() => ({
    ok: false,
    blocked: false,
  }));

  const first = await runDailyReminders(db, failing, WEB_APP_URL);
  assert.equal(first.sent, 0);
  assert.equal(first.blocked, 0);

  const { sender: working, calls } = fakeSender();
  const second = await runDailyReminders(db, working, WEB_APP_URL);
  assert.equal(second.sent, 1);
  assert.equal(calls.length, 1);
});

// --- scope -------------------------------------------------------------

test("only the learner who hasn't practised today is messaged, and about no one else's situation", async () => {
  const { db, sqlite } = await seeded();
  const a = await makeVerifiedUser(db, 609, "A1");
  const b = await makeVerifiedUser(db, 610, "A1");
  await driveLessonToCompletion(db, sqlite, a.id, EPISODE_1);
  const { sender, calls } = fakeSender();

  const summary = await runDailyReminders(db, sender, WEB_APP_URL);

  assert.equal(summary.sent, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.chatId, b.telegram_user_id);
});
