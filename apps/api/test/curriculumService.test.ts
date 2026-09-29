import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { resolveCurrentUser } from "../src/services/authService.ts";
import {
  getCourse,
  getLessonContent,
} from "../src/services/curriculumService.ts";
import { startLessonSession } from "../src/services/lessonSessionService.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";

const CHAPTER = "mod_sie_a1_01";
const EPISODE_1 = "les_sie_a1_e1";
const EPISODE_2 = "les_sie_a1_e2";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

// --- auth gate -----------------------------------------------------------

test("unauthenticated curriculum access is rejected (same requireAuth gate the routes use)", async () => {
  const { db } = createTestDb();
  assert.equal(await resolveCurrentUser(db, undefined), null);
});

// --- GET /course ----------------------------------------------------------

test("A1 course is the starter chapter of situations", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, "A1", "usr_test");
  assert.equal(course.level, "A1");
  assert.equal(course.chapters.length, 1);
  assert.equal(course.chapters[0]?.id, CHAPTER);
  assert.equal(course.chapters[0]?.title, "Первые разговоры");
  assert.equal(course.episodesTotal, 11);
});

test("the archived original A1 chapters are not part of the course any more", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, "A1", "usr_test");
  const ids = course.chapters.map((c) => c.id);
  assert.ok(!ids.includes("mod_a1_01"));
  assert.ok(!ids.includes("mod_a1_02"));
  assert.ok(!ids.includes("mod_a1_03"));
});

test("every episode states the capability it unlocks", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, "A1", "usr_test");
  for (const episode of course.chapters[0]?.episodes ?? []) {
    assert.ok(
      episode.capability?.startsWith("Я могу"),
      `${episode.id} has no concrete capability`,
    );
    assert.ok(episode.situationTitle, `${episode.id} has no situation title`);
  }
});

test("the published A2 course exposes all nine authored V2 chapters and seventeen situations", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, "A2", "usr_test");
  assert.equal(course.chapters.length, 9);
  assert.deepEqual(
    course.chapters.flatMap((chapter) =>
      chapter.episodes.map((episode) => episode.id),
    ),
    [
      "sit_a2_people_01",
      "sit_a2_people_02",
      "sit_a2_cafe_01",
      "sit_a2_restaurant_01",
      "sit_a2_restaurant_02",
      "sit_a2_travel_01",
      "sit_a2_travel_02",
      "sit_a2_daily_01",
      "sit_a2_daily_02",
      "sit_a2_shop_01",
      "sit_a2_shop_02",
      "sit_a2_health_01",
      "sit_a2_work_01",
      "sit_a2_work_02",
      "sit_a2_social_01",
      "sit_a2_problems_01",
      "sit_a2_problems_02",
    ],
  );
  assert.equal(course.episodesTotal, 17);
});

test("the published B1 course exposes twelve authored situations in frozen progression order", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, "B1", "usr_test");
  assert.deepEqual(
    course.chapters.flatMap((chapter) => chapter.episodes.map((episode) => episode.id)),
    ["sit_b1_people_01", "sit_b1_people_02", "sit_b1_cafe_01", "sit_b1_restaurant_01", "sit_b1_restaurant_02", "sit_b1_travel_01", "sit_b1_travel_02", "sit_b1_daily_01", "sit_b1_daily_02", "sit_b1_shop_01", "sit_b1_shop_02", "sit_b1_work_01"],
  );
  assert.equal(course.episodesTotal, 12);
});

test("a level with no seeded content returns an empty course, not an error", async () => {
  const { db } = await seeded();
  const b2 = await getCourse(db, "B2", "usr_test");
  assert.deepEqual(b2.chapters, []);
  assert.equal(b2.episodesTotal, 0);
  assert.equal(b2.currentEpisodeId, null);
});

test("no verified level yet returns an empty course", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, null, "usr_test");
  assert.equal(course.level, null);
  assert.deepEqual(course.chapters, []);
});

test("a fresh learner is placed at the very first situation", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 201, "A1");
  const course = await getCourse(db, "A1", user.id);
  assert.equal(course.currentEpisodeId, EPISODE_1);
  assert.equal(course.episodesDone, 0);
  for (const episode of course.chapters[0]?.episodes ?? []) {
    assert.equal(episode.state, null);
    assert.equal(episode.sessionsDone, 0);
  }
});

test("an episode counts as done only once its Mission is passed", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 202, "A1");

  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1, {
    correct: true,
  });
  const midway = await getCourse(db, "A1", user.id);
  assert.equal(midway.episodesDone, 0);
  assert.equal(midway.currentEpisodeId, EPISODE_1);
  const started = midway.chapters[0]?.episodes.find((e) => e.id === EPISODE_1);
  assert.equal(started?.state, "learning");
  assert.equal(started?.sessionsDone, 1);
  assert.ok((started?.sessionsTotal ?? 0) >= 1);

  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  const after = await getCourse(db, "A1", user.id);
  assert.equal(after.episodesDone, 1);
  assert.equal(after.currentEpisodeId, EPISODE_2);
});

test("progress is scoped per learner and never leaks between accounts", async () => {
  const { db, sqlite } = await seeded();
  const userA = await makeVerifiedUser(db, 203, "A1");
  const userB = await makeVerifiedUser(db, 204, "A1");
  await driveEpisodeToCanDo(db, sqlite, userA.id, EPISODE_1);

  const courseA = await getCourse(db, "A1", userA.id);
  const courseB = await getCourse(db, "A1", userB.id);
  assert.equal(courseA.episodesDone, 1);
  assert.equal(courseB.episodesDone, 0);
  assert.equal(courseB.currentEpisodeId, EPISODE_1);
});

test("the course exposes exactly the fields the path screen needs — nothing invented", async () => {
  const { db } = await seeded();
  const course = await getCourse(db, "A1", "usr_test");
  const episode = course.chapters[0]?.episodes[0];
  assert.ok(episode);
  assert.deepEqual(Object.keys(episode).sort(), [
    "capability",
    "estimatedMinutes",
    "id",
    "missionReady",
    "order",
    "scene",
    "sessionsDone",
    "sessionsTotal",
    "situationTitle",
    "state",
    "teaser",
    "title",
    "type",
  ]);
});

// --- GET /lessons/:id --------------------------------------------------

test("episode content returns its learning items and grammar patterns in order", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, EPISODE_1, "usr_test");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.ok(result.content.content.length > 0);
  const types = new Set(result.content.content.map((e) => e.contentType));
  assert.ok(types.has("learning_item"));
  assert.ok(types.has("grammar_pattern"));
});

test("episode content order is deterministic across repeated calls", async () => {
  const { db } = await seeded();
  const first = await getLessonContent(db, EPISODE_1, "usr_test");
  const second = await getLessonContent(db, EPISODE_1, "usr_test");
  assert.deepEqual(first, second);
});

test("episode content carries the situation framing the preview screen needs", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, EPISODE_1, "usr_test");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.content.moduleId, CHAPTER);
  assert.equal(result.content.moduleTitle, "Первые разговоры");
  assert.equal(result.content.situationTitle, "Первое знакомство");
  assert.ok(result.content.scene);
  assert.ok(result.content.capability?.startsWith("Я могу"));
  assert.equal(typeof result.content.estimatedMinutes, "number");
});

test("an episode the learner never touched reports not_started", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 205, "A1");
  const result = await getLessonContent(db, EPISODE_1, user.id);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.content.progressStatus, "not_started");
});

test("an in-progress session makes the episode report in_progress — the server-backed source of truth for resume", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 206, "A1");
  const start = await startLessonSession(db, user.id, EPISODE_1);
  assert.equal(start.ok, true);

  const result = await getLessonContent(db, EPISODE_1, user.id);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.content.progressStatus, "in_progress");
});

test("a finished episode reports completed, and only for the learner who finished it", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 207, "A1");
  const other = await makeVerifiedUser(db, 208, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);

  const mine = await getLessonContent(db, EPISODE_1, user.id);
  const theirs = await getLessonContent(db, EPISODE_1, other.id);
  assert.equal(mine.ok && mine.content.progressStatus, "completed");
  assert.equal(theirs.ok && theirs.content.progressStatus, "not_started");
});

test("an unknown lesson id returns not_found", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, "les_does_not_exist", "usr_test");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("an archived lesson is not returned", async () => {
  const { db, sqlite } = await seeded();
  sqlite
    .prepare("UPDATE lessons SET status = 'archived' WHERE id = ?")
    .run(EPISODE_2);
  const result = await getLessonContent(db, EPISODE_2, "usr_test");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("the episode content DTO exposes no internal DB fields (frequency, difficulty, provenance, timestamps, status)", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, EPISODE_1, "usr_test");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const itemEntry = result.content.content.find(
    (e) => e.contentType === "learning_item",
  );
  assert.ok(itemEntry && itemEntry.contentType === "learning_item");
  assert.deepEqual(Object.keys(itemEntry.item).sort(), [
    "displayForm",
    "id",
    "itemType",
    "primaryExample",
    "translation",
    "usageNote",
  ]);
  for (const forbidden of [
    "frequency_band",
    "difficulty",
    "provenance",
    "content_version",
    "status",
    "created_at",
    "updated_at",
    "topic",
    "audio_key",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(itemEntry.item, forbidden),
      false,
    );
  }
});

// --- read-only guarantees -------------------------------------------------

test("reading the course does not mutate any table (no progress/completion is created)", async () => {
  const { db, sqlite } = await seeded();

  const snapshot = () =>
    [
      "modules",
      "lessons",
      "learning_items",
      "grammar_patterns",
      "lesson_items",
      "users",
      "user_settings",
      "user_capabilities",
      "user_item_memory",
      "user_rewards",
    ]
      .map(
        (t) =>
          (
            sqlite.prepare(`SELECT COUNT(*) as n FROM ${t}`).get() as {
              n: number;
            }
          ).n,
      )
      .join(",");

  const before = snapshot();
  await getCourse(db, "A1", "usr_test");
  await getLessonContent(db, EPISODE_1, "usr_test");
  await getLessonContent(db, EPISODE_2, "usr_test");
  const after = snapshot();

  assert.equal(after, before);
});
