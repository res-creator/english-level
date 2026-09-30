import test from "node:test";
import assert from "node:assert/strict";
import type { CefrLevel } from "@english-level/contracts";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { getCourse } from "../src/services/curriculumService.ts";
import { getToday } from "../src/services/todayService.ts";
import { startLessonSession } from "../src/services/lessonSessionService.ts";
import { resolveCourseLevel } from "../src/services/courseProgressionService.ts";
import {
  driveEpisodeToCanDo,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";

const BOUNDARIES: Array<{
  level: CefrLevel;
  next: CefrLevel | null;
  nextFirst: string | null;
}> = [
  { level: "A1", next: "A2", nextFirst: "sit_a2_people_01" },
  { level: "A2", next: "B1", nextFirst: "sit_b1_people_01" },
  { level: "B1", next: "B2", nextFirst: "sit_b2_people_01" },
  { level: "B2", next: null, nextFirst: null },
];

function earnCapability(
  sqlite: ReturnType<typeof createTestDb>["sqlite"],
  userId: string,
  lessonId: string,
) {
  sqlite
    .prepare(
      `INSERT INTO user_capabilities
        (user_id, lesson_id, state, sessions_done, sessions_total,
         mission_attempts, can_do_at, started_at, updated_at)
       VALUES (?, ?, 'can_do', 3, 3, 1, CURRENT_TIMESTAMP,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET state = 'can_do'`,
    )
    .run(userId, lessonId);
}

test("successful final Missions advance A1 to A2 to B1 to B2, while final B2 stays complete", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  const user = await makeVerifiedUser(db, 991, "A1");

  for (const boundary of BOUNDARIES) {
    const course = await getCourse(db, boundary.level, user.id);
    const lessons = course.chapters.flatMap((chapter) => chapter.episodes);
    const final = lessons.at(-1);
    assert.ok(final, `${boundary.level} must contain a final situation`);
    for (const lesson of lessons.slice(0, -1)) {
      earnCapability(sqlite, user.id, lesson.id);
    }

    const mission = await driveEpisodeToCanDo(db, sqlite, user.id, final.id);
    assert.equal(mission.kind, "mission");
    assert.equal(mission.missionPassed, true);
    assert.equal(mission.nextEpisodeId, boundary.nextFirst);

    const row = sqlite
      .prepare("SELECT current_cefr_level FROM users WHERE id = ?")
      .get(user.id) as { current_cefr_level: CefrLevel };
    assert.equal(row.current_cefr_level, boundary.next ?? "B2");

    const today = await getToday(db, user.id, row.current_cefr_level);
    if (boundary.nextFirst) {
      assert.equal(today.action, "session");
      assert.equal(today.episode?.id, boundary.nextFirst);
      const start = await startLessonSession(db, user.id, boundary.nextFirst);
      assert.equal(start.ok, true, JSON.stringify(start));
      if (start.ok) {
        sqlite
          .prepare(
            "UPDATE learning_sessions SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
          )
          .run(start.session.sessionId);
      }
    } else {
      assert.equal(today.episode, null);
      assert.notEqual(today.action, "session");
    }
  }
});

test("an account that completed A1 before transitions existed is reconciled idempotently", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  const user = await makeVerifiedUser(db, 992, "A1");
  const a1 = await getCourse(db, "A1", user.id);
  for (const lesson of a1.chapters.flatMap((chapter) => chapter.episodes)) {
    earnCapability(sqlite, user.id, lesson.id);
  }

  assert.equal(await resolveCourseLevel(db, user.id, "A1"), "A2");
  assert.equal(await resolveCourseLevel(db, user.id, "A2"), "A2");
  const next = await startLessonSession(db, user.id, "sit_a2_people_01");
  assert.equal(next.ok, true, JSON.stringify(next));
});
