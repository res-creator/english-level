/** Release Fix Block 1 regression against real React, Hono and disposable SQLite. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { app } from "../../api/src/index.ts";
import { createTestDb } from "../../api/test/helpers/testDb.ts";
import { createFakeD1 } from "../../api/test/helpers/fakeD1.ts";
import { seedContent } from "../../api/src/content/seedContent.ts";
import { completeOnboardingWithVerifiedLevel } from "../../api/src/repositories/usersRepository.ts";
import { getCourse } from "../../api/src/services/curriculumService.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
} from "../../api/test/helpers/lessonFixtures.ts";

const base = process.env.QA_BASE_URL ?? "http://localhost:5173";
const out = fileURLToPath(
  new URL("../../../artifacts/qa/release-fix-block1/", import.meta.url),
);
await mkdir(out, { recursive: true });
const { db, sqlite } = createTestDb();
await seedContent(db);
const env = {
  DB: createFakeD1(sqlite),
  TELEGRAM_BOT_TOKEN: "dev-fixture-telegram-bot-token-000000",
  ALLOWED_ORIGINS: base,
  ENVIRONMENT: "development",
};
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(12_000);
await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "",
  }),
);
await page.route("http://localhost:8787/**", async (route) => {
  const request = route.request();
  const response = await app.request(
    request.url(),
    {
      method: request.method(),
      headers: await request.allHeaders(),
      body: request.postDataBuffer() ?? undefined,
    },
    env,
  );
  await route.fulfill({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  });
});

try {
  await page.goto(`${base}/welcome`, { waitUntil: "networkidle" });
  for (let i = 0; i < 80; i++) {
    if (
      (await context.cookies()).some((cookie) => cookie.name === "el_session")
    )
      break;
    await page.waitForTimeout(100);
  }
  const user = sqlite
    .prepare("SELECT id FROM users ORDER BY created_at DESC LIMIT 1")
    .get();
  assert.ok(user?.id, "dev-auth user was not created");

  // Mobile onboarding: no horizontal overflow and the CTA is entirely visible.
  sqlite
    .prepare(
      "UPDATE users SET onboarding_stage = 'placement_required' WHERE id = ?",
    )
    .run(user.id);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/onboarding/ready`, { waitUntil: "networkidle" });
    const cta = page.getByRole("button", { name: "Пройти тест" });
    await cta.waitFor();
    const metrics = await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((node) =>
        node.textContent?.includes("Пройти тест"),
      );
      const rect = button.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        width: innerWidth,
        top: rect.top,
        bottom: rect.bottom,
        height: innerHeight,
      };
    });
    assert.ok(metrics.scrollWidth <= metrics.width, JSON.stringify(metrics));
    assert.ok(
      metrics.top >= 0 && metrics.bottom <= metrics.height,
      JSON.stringify(metrics),
    );
    assert.ok(await cta.isEnabled());
    await page.screenshot({
      path: `${out}/onboarding-${viewport.width}x${viewport.height}.png`,
    });
  }

  await completeOnboardingWithVerifiedLevel(db, user.id, "A1");
  await page.setViewportSize({ width: 390, height: 844 });

  // UI and backend agree about a future situation's lock.
  await page.goto(`${base}/course`, { waitUntil: "networkidle" });
  await page.locator(".situation-list").waitFor();
  assert.equal(await page.locator(".situation-row.is-locked").count(), 10);
  await page.goto(`${base}/course/les_sie_a1_e2`, { waitUntil: "networkidle" });
  await page.getByText("Ситуация не открылась").waitFor();
  assert.equal(await page.getByRole("button", { name: "Начать" }).count(), 0);
  const bypassStatus = await page.evaluate(
    async () =>
      (
        await fetch(
          "http://localhost:8787/api/v1/lessons/les_sie_a1_e2/start",
          {
            method: "POST",
            credentials: "include",
          },
        )
      ).status,
  );
  assert.equal(bypassStatus, 403);

  // A started first session is labelled as a resume before any session completes.
  await page.goto(`${base}/course/les_sie_a1_e1/session`, {
    waitUntil: "networkidle",
  });
  await page.locator(".task-sheet").waitFor();
  await page.goto(`${base}/today`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Продолжить/ }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Начать/ }).count(), 0);
  await page.screenshot({ path: `${out}/today-resume.png` });

  // Clear only disposable QA learner state before testing every level boundary.
  sqlite.exec(`DELETE FROM exercise_attempts;
    DELETE FROM user_lesson_progress;
    DELETE FROM learning_sessions;
    DELETE FROM user_item_memory;
    DELETE FROM user_capabilities;`);

  const boundaries = [
    ["A1", "A2", "sit_a2_people_01"],
    ["A2", "B1", "sit_b1_people_01"],
    ["B1", "B2", "sit_b2_people_01"],
    ["B2", null, null],
  ];
  for (const [level, nextLevel, nextFirst] of boundaries) {
    const course = await getCourse(db, level, user.id);
    const lessons = course.chapters.flatMap((chapter) => chapter.episodes);
    const final = lessons.at(-1);
    assert.ok(final);
    const insert = sqlite.prepare(
      `INSERT OR REPLACE INTO user_capabilities
       (user_id, lesson_id, state, sessions_done, sessions_total,
        mission_attempts, can_do_at, started_at, updated_at)
       VALUES (?, ?, 'can_do', 3, 3, 1, CURRENT_TIMESTAMP,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    );
    for (const lesson of lessons.slice(0, -1)) insert.run(user.id, lesson.id);
    const mission = await driveEpisodeToCanDo(db, sqlite, user.id, final.id);
    assert.equal(mission.missionPassed, true);
    assert.equal(mission.nextEpisodeId, nextFirst);
    const persisted = sqlite
      .prepare("SELECT current_cefr_level FROM users WHERE id = ?")
      .get(user.id);
    assert.equal(persisted.current_cefr_level, nextLevel ?? "B2");
    await page.goto(`${base}/today`, { waitUntil: "networkidle" });
    if (nextFirst) {
      await page.getByRole("button", { name: "Начать" }).waitFor();
      const nextCourse = await getCourse(db, nextLevel, user.id);
      const nextTitle = nextCourse.chapters[0].episodes[0].situationTitle;
      await page.getByText(nextTitle, { exact: true }).first().waitFor();
    } else {
      await page.getByText("Ты прошла все ситуации этого уровня").waitFor();
    }
    await page.screenshot({ path: `${out}/after-${level}.png` });
  }

  // Failed B2 Mission presents a human-facing state and never a sentinel zero.
  const failed = await driveLessonToCompletion(
    db,
    sqlite,
    user.id,
    "sit_b2_people_01",
    {
      correct: false,
    },
  );
  assert.equal(failed.result.kind, "mission");
  assert.equal(failed.result.missionPassed, false);
  await page.goto(
    `${base}/course/sit_b2_people_01/result/${failed.sessionId}`,
    { waitUntil: "networkidle" },
  );
  await page.getByText("Почти получилось").waitFor();
  const cue = page.locator(".situation-cue");
  assert.equal((await cue.innerText()).trim().startsWith("0"), false);
  assert.equal(await cue.locator("svg").count(), 1);
  await page.screenshot({ path: `${out}/mission-fail.png` });

  console.log("Release Fix Block 1 Chromium QA: PASS");
} finally {
  await context.close();
  await browser.close();
}
