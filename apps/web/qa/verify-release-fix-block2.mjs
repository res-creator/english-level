/** Release Fix Block 2: real React + Hono + disposable SQLite P2 regression. */
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
import { walkToActivityKind } from "../../api/test/helpers/lessonFixtures.ts";

const base = process.env.QA_BASE_URL ?? "http://localhost:5173";
const out = fileURLToPath(
  new URL("../../../artifacts/qa/release-fix-block2/after/", import.meta.url),
);
await mkdir(out, { recursive: true });
const browser = await chromium.launch();

// Protected daily routes explain Telegram entry instead of rendering four
// unrelated network errors.
const guest = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await guest.addInitScript(() => {
  window.Telegram = {
    WebApp: {
      initData: "",
      initDataUnsafe: {},
      colorScheme: "light",
      platform: "web",
      ready() {},
      expand() {},
      onEvent() {},
      offEvent() {},
    },
  };
});
const guestPage = await guest.newPage();
await guestPage.route("https://telegram.org/js/telegram-web-app.js", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "",
  }),
);
for (const route of ["/today", "/course", "/my", "/my/space"]) {
  await guestPage.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await guestPage.getByText("Открой приложение через Telegram").waitFor();
  assert.equal(await guestPage.getByText("Проверь связь").count(), 0);
}
await guestPage.screenshot({ path: `${out}/auth-entry.png` });
await guest.close();

const { db, sqlite } = createTestDb();
await seedContent(db);
const env = {
  DB: createFakeD1(sqlite),
  TELEGRAM_BOT_TOKEN: "dev-fixture-telegram-bot-token-000000",
  ALLOWED_ORIGINS: base,
  ENVIRONMENT: "development",
};
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
  assert.ok(user?.id);
  await completeOnboardingWithVerifiedLevel(db, user.id, "A1");

  // Empty Review has honest guidance and no dead extra-practice action.
  await page.goto(`${base}/review`, { waitUntil: "networkidle" });
  await page.getByText("На сегодня всё повторено.").waitFor();
  assert.equal(await page.getByRole("button", { name: "Хочу ещё" }).count(), 0);
  await page.getByText(/Пройди первую ситуацию/).waitFor();
  await page.screenshot({ path: `${out}/review-empty.png` });

  // All metric labels remain readable on narrow phones.
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/my`, { waitUntil: "networkidle" });
    const labels = await page.locator(".skill-stat__label").allTextContents();
    assert.deepEqual(labels, ["встречено", "закреплено", "пройдено"]);
    assert.equal(
      await page
        .locator(".skill-stat__label")
        .evaluateAll((nodes) =>
          nodes.some((node) => node.scrollWidth > node.clientWidth),
        ),
      false,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({ path: `${out}/my-english-${viewport.width}.png` });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/course`, { waitUntil: "networkidle" });
  await page.locator(".situation-list").waitFor();
  assert.equal(await page.locator(".course-hero").count(), 1);
  assert.equal(await page.locator(".course-chapter").count(), 1);
  assert.equal(await page.locator(".situation-row__thumb img").count(), 0);
  assert.equal(await page.locator(".situation-row__thumb svg").count(), 22);
  await page.screenshot({ path: `${out}/course-a1-art.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 568 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({ path: `${out}/course-a1-mobile.png` });

  // Situation context introduces the scene, fades, and never repeats on the
  // next activity. The recurring cast uses one complete illustration style.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/course/les_sie_a1_e1/session`, {
    waitUntil: "networkidle",
  });
  await page.locator(".task-sheet").waitFor();
  assert.equal(await page.locator(".scene__person svg").count(), 1);
  assert.equal(await page.locator(".scene__label--intro").count(), 1);
  await page.waitForTimeout(2600);
  assert.equal(await page.locator(".scene__label--intro").isVisible(), false);
  await page.screenshot({ path: `${out}/session-after-intro.png` });
  await page.getByRole("button", { name: "Понятно" }).click();
  await page.locator(".task-sheet").waitFor();
  assert.equal(await page.locator(".scene__label").count(), 0);

  // Reach a real grammar card through the engine; the authored title and
  // classification stay intact while the learner sees a Russian function.
  await walkToActivityKind(
    db,
    sqlite,
    user.id,
    "les_sie_a1_e1",
    "grammar_card",
  );
  await page.goto(`${base}/course/les_sie_a1_e1/session`, {
    waitUntil: "networkidle",
  });
  await page.getByText("Пауза на правило").waitFor();
  assert.equal(
    await page.getByText("Be - positive", { exact: true }).count(),
    0,
  );
  await page.getByText("Говорим о людях, фактах и привычках").waitFor();
  await page.screenshot({ path: `${out}/grammar-card.png` });
  await page.setViewportSize({ width: 320, height: 420 });
  const grammarCta = page.getByRole("button", { name: "Понятно" });
  await grammarCta.scrollIntoViewIfNeeded();
  assert.ok(await grammarCta.isVisible());
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({ path: `${out}/grammar-card-keyboard.png` });

  // A late B2 current chapter is compact and brought into view; unopened
  // chapters remain scannable instead of repeating sixteen hero blocks.
  sqlite.exec(`DELETE FROM exercise_attempts;
    DELETE FROM user_lesson_progress;
    DELETE FROM learning_sessions;
    DELETE FROM user_item_memory;
    DELETE FROM user_capabilities;`);
  sqlite
    .prepare("UPDATE users SET current_cefr_level = 'B2' WHERE id = ?")
    .run(user.id);
  const b2 = await getCourse(db, "B2", user.id);
  const lessons = b2.chapters.flatMap((chapter) => chapter.episodes);
  const insert = sqlite.prepare(
    `INSERT INTO user_capabilities
      (user_id, lesson_id, state, sessions_done, sessions_total,
       mission_attempts, can_do_at, started_at, updated_at)
     VALUES (?, ?, 'can_do', 3, 3, 1, CURRENT_TIMESTAMP,
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  for (const lesson of lessons.slice(0, 17)) insert.run(user.id, lesson.id);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/course`, { waitUntil: "networkidle" });
  await page.locator(".course-chapter").first().waitFor();
  assert.equal(await page.locator(".course-hero").count(), 1);
  assert.equal(await page.locator(".course-chapter").count(), 16);
  assert.equal(await page.locator(".course-chapter[open]").count(), 1);
  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    scrollY,
    current: document
      .querySelector(".situation-row.is-current")
      ?.getBoundingClientRect().top,
    viewportHeight: innerHeight,
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
  assert.ok(metrics.scrollHeight < 3500, JSON.stringify(metrics));
  assert.ok(metrics.scrollY > 0, JSON.stringify(metrics));
  assert.ok(
    (metrics.current ?? 9999) < metrics.viewportHeight,
    JSON.stringify(metrics),
  );
  assert.equal(metrics.overflow, 0);
  await page.screenshot({ path: `${out}/course-b2-current-viewport.png` });
  await page.screenshot({
    path: `${out}/course-b2-current.png`,
    fullPage: true,
  });

  console.log("Release Fix Block 2 Chromium QA: PASS");
} finally {
  await context.close();
  await browser.close();
}
