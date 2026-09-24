import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { getToday } from "../src/services/todayService.ts";
import { startLessonSession } from "../src/services/lessonSessionService.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";

const FIRST_EPISODE = "les_sie_a1_e1";
const SECOND_EPISODE = "les_sie_a1_e2";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

test("no verified level yet leaves Today with nothing to do", async () => {
  const { db } = await seeded();
  const today = await getToday(db, "usr_does_not_exist", null);
  assert.equal(today.action, "none");
  assert.equal(today.episode, null);
  assert.equal(today.reviewDue, 0);
});

test("a level with no published content is honestly 'unavailable', never 'course complete'", async () => {
  const { db } = await seeded();
  // Public V1 is A1-only: A2's modules are archived, not deleted — exactly
  // like B1/B2/C1 having no content at all. Someone placement legitimately
  // scores above A1 must never see this collapse into "you finished
  // everything", since they haven't done anything yet.
  const user = await makeVerifiedUser(db, 103, "A2");
  const today = await getToday(db, user.id, "A2");
  assert.equal(today.action, "unavailable");
  assert.equal(today.episode, null);
  assert.equal(today.reviewDue, 0);
});

test("a fresh verified user is pointed at the first situation", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 101, "A1");
  const today = await getToday(db, user.id, "A1");
  assert.equal(today.action, "session");
  assert.equal(today.episode?.id, FIRST_EPISODE);
  assert.equal(today.chapterTitle, "Первые разговоры");
  assert.ok(today.episode?.capability?.startsWith("Я могу"));
});

test("an unfinished session is always what Today offers", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 102, "A1");
  const start = await startLessonSession(db, user.id, SECOND_EPISODE);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const today = await getToday(db, user.id, "A1");
  assert.equal(today.action, "session");
  assert.equal(today.episode?.id, SECOND_EPISODE);
});

test("once every session of an episode is done, Today offers the Mission", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 103, "A1");

  for (let guard = 0; guard < 20; guard++) {
    const today = await getToday(db, user.id, "A1");
    if (today.action === "mission") {
      assert.equal(today.episode?.id, FIRST_EPISODE);
      assert.equal(today.episode?.missionReady, true);
      return;
    }
    await driveLessonToCompletion(db, sqlite, user.id, FIRST_EPISODE, {
      correct: true,
    });
  }
  assert.fail("Today never offered the Mission");
});

test("a passed Mission moves Today on to the next situation", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 104, "A1");
  const mission = await driveEpisodeToCanDo(db, sqlite, user.id, FIRST_EPISODE);
  assert.equal(mission.missionPassed, true);

  const today = await getToday(db, user.id, "A1");
  assert.equal(today.episode?.id, SECOND_EPISODE);
  assert.equal(today.capabilities.canDo, 1);
});

test("Today reports real chapter progress, never an invented number", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 105, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, FIRST_EPISODE);

  const today = await getToday(db, user.id, "A1");
  assert.deepEqual(today.chapterProgress, { done: 1, total: 5 });
});

test("Today does not start a session or fabricate progress just by being read", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 106, "A1");
  const count = () =>
    sqlite
      .prepare(
        `SELECT (SELECT COUNT(*) FROM learning_sessions) as s,
                (SELECT COUNT(*) FROM user_capabilities) as c,
                (SELECT COUNT(*) FROM user_rewards) as r`,
      )
      .get() as { s: number; c: number; r: number };

  const before = count();
  await getToday(db, user.id, "A1");
  assert.deepEqual(count(), before);
});

test("coming back after a long absence never presents a pile of review debt", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 107, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, FIRST_EPISODE);
  await driveLessonToCompletion(db, sqlite, user.id, SECOND_EPISODE);

  // Everything fell due weeks ago and the learner hasn't been back.
  const longAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  sqlite.prepare("UPDATE user_item_memory SET due_at = ?").run(longAgo);
  sqlite
    .prepare(
      "UPDATE learning_sessions SET completed_at = ? WHERE completed_at IS NOT NULL",
    )
    .run(longAgo);

  const today = await getToday(db, user.id, "A1");
  assert.ok(today.daysAway !== null && today.daysAway >= 4);
  assert.ok(
    today.reviewDue <= 12,
    `review queue after absence: ${today.reviewDue}`,
  );
});
