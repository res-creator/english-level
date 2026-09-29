/** Local regression QA: real React + Hono handlers + disposable SQLite.
 * Start Vite first. No Cloudflare runtime, remote DB, or canned API responses.
 * Episode IDs may be passed as command-line arguments; defaults cover the authored A1, A2, B1, or B2 batch/course.
 * Onboarding/placement and course run through the UI; authentication uses signed dev auth.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { app } from "../../api/src/index.ts";
import { createTestDb } from "../../api/test/helpers/testDb.ts";
import { createFakeD1 } from "../../api/test/helpers/fakeD1.ts";
import { seedContent } from "../../api/src/content/seedContent.ts";
import { openingLine } from "../src/brand/situationScenes.ts";

const base = process.env.QA_BASE_URL ?? "http://localhost:5173";
const out = fileURLToPath(
  new URL("../../../artifacts/qa/session-dialogue/", import.meta.url),
);
const QA_LEVEL = process.env.QA_LEVEL ?? "A1";
assert.ok(
  ["A1", "A2", "B1", "B2"].includes(QA_LEVEL),
  `Unsupported QA_LEVEL=${QA_LEVEL}`,
);
const qaPrefix = QA_LEVEL.toLowerCase();
const defaultEpisodes =
  QA_LEVEL === "A2"
    ? [
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
      ]
    : QA_LEVEL === "B1"
      ? ["sit_b1_people_01", "sit_b1_people_02", "sit_b1_cafe_01", "sit_b1_restaurant_01", "sit_b1_restaurant_02", "sit_b1_travel_01", "sit_b1_travel_02", "sit_b1_daily_01", "sit_b1_daily_02", "sit_b1_shop_01", "sit_b1_shop_02", "sit_b1_health_01", "sit_b1_work_01", "sit_b1_work_02", "sit_b1_work_03", "sit_b1_social_01", "sit_b1_social_02", "sit_b1_problems_01", "sit_b1_problems_02"]
      : QA_LEVEL === "B2"
        ? ["sit_b2_people_01", "sit_b2_restaurant_01", "sit_b2_restaurant_02", "sit_b2_travel_01", "sit_b2_travel_02", "sit_b2_daily_01", "sit_b2_shop_01", "sit_b2_work_01", "sit_b2_work_02", "sit_b2_work_03", "sit_b2_work_04", "sit_b2_social_01", "sit_b2_problems_01", "sit_b2_problems_02", "sit_b2_people_03"]
        : [1, 2, 3, 4, 5].map((n) => `les_sie_a1_e${n}`);
const expectedCourseCount = QA_LEVEL === "A2" ? 17 : QA_LEVEL === "B1" ? 19 : QA_LEVEL === "B2" ? 15 : 11;
const expectedChapterProgress =
  QA_LEVEL === "A2"
    ? [
        "0 из 2",
        "0 из 1",
        "0 из 2",
        "0 из 2",
        "0 из 2",
        "0 из 3",
        "0 из 2",
        "0 из 1",
        "0 из 2",
      ]
    : QA_LEVEL === "B1"
      ? ["0 из 2", "0 из 1", "0 из 2", "0 из 2", "0 из 2", "0 из 3", "0 из 3", "0 из 2", "0 из 2"]
      : QA_LEVEL === "B2"
        ? ["0 из 1", "0 из 2", "0 из 2", "0 из 1", "0 из 1", "0 из 4", "0 из 1", "0 из 2", "0 из 1"]
        : ["0 из 11"];
const completedChapterProgress =
  QA_LEVEL === "A2"
    ? [
        "2 из 2",
        "1 из 1",
        "2 из 2",
        "2 из 2",
        "2 из 2",
        "3 из 3",
        "2 из 2",
        "1 из 1",
        "2 из 2",
      ]
    : QA_LEVEL === "B1"
      ? ["2 из 2", "1 из 1", "2 из 2", "2 из 2", "2 из 2", "3 из 3", "3 из 3", "2 из 2", "2 из 2"]
      : QA_LEVEL === "B2"
        ? ["1 из 1", "2 из 2", "2 из 2", "1 из 1", "1 из 1", "4 из 4", "1 из 1", "2 из 2", "1 из 1"]
        : ["11 из 11"];
const episodes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : defaultEpisodes;
const preferredFailEpisode =
  QA_LEVEL === "A2"
    ? "sit_a2_health_01"
    : QA_LEVEL === "B1"
      ? "sit_b1_people_01"
      : QA_LEVEL === "B2"
        ? "sit_b2_people_01"
        : episodes[0];
const failEpisode = episodes.includes(preferredFailEpisode)
  ? preferredFailEpisode
  : episodes[0];
await mkdir(out, { recursive: true });
const results = [];
const snapshots = [];
const browser = await chromium.launch();

async function run(failMission) {
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
  page.setDefaultTimeout(10000);
  let started;
  let answered;
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    }),
  );
  await page.route("http://localhost:8787/**", async (route) => {
    const req = route.request();
    const response = await app.request(
      req.url(),
      {
        method: req.method(),
        headers: await req.allHeaders(),
        body: req.postDataBuffer() ?? undefined,
      },
      env,
    );
    const body = await response.text();
    if (req.url().endsWith("/start") && req.url().includes("/lessons/"))
      started = JSON.parse(body);
    if (req.url().endsWith("/answer")) answered = JSON.parse(body);
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body,
    });
  });
  try {
    await page.goto(`${base}/welcome`, { waitUntil: "networkidle" });
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await context.cookies()).some((c) => c.name === "el_session")) break;
      await page.waitForTimeout(100);
    }
    assert.ok(
      (await context.cookies()).some((c) => c.name === "el_session"),
      "signed dev auth cookie missing",
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Попробовать иначе" }).click();
    await page.locator(".lesson-screen").waitFor();
    for (let i = 0; i < 2; i++) {
      await page.locator(".task-sheet").waitFor();
      const choice = page.locator(".answer:not(:disabled)").first();
      const word = page.locator(".word:not(:disabled)").first();
      if (await choice.count()) await choice.click();
      else if (await word.count()) await word.click();
      await page.getByRole("button", { name: "Ответить" }).click();
      await page.waitForTimeout(150);
      await page.getByRole("button", { name: "Дальше" }).click();
    }
    await page.getByRole("button", { name: "Дальше" }).click();
    await page.locator(".transcript").waitFor();
    await page.getByRole("button", { name: "Продолжить" }).click();
    await page.locator(".pick-screen").waitFor();
    await page.getByRole("button", { name: /Оставить/ }).click();
    await page.locator(".goal-grid").waitFor();
    await page.locator(".goal-chip").first().click();
    await page.getByRole("button", { name: "Дальше" }).click();
    await page
      .locator(".task-sheet__title", { hasText: "Как сейчас с английским?" })
      .waitFor();
    await page.locator(".answer:not(:disabled)", { hasText: "A1" }).click();
    await page.getByRole("button", { name: "Дальше" }).click();
    await page
      .locator(".task-sheet__title", { hasText: "Сколько минут в день?" })
      .waitFor();
    await page.locator(".answer:not(:disabled)").first().click();
    await page.getByRole("button", { name: "Дальше" }).click();
    await page.getByText("Всё готово").waitFor();
    await page.screenshot({ path: `${out}/${qaPrefix}-onboarding-ready.png` });
    await page.getByRole("button", { name: "Пройти тест" }).click();
    await page.getByRole("button", { name: "Начать тест" }).click();
    for (let i = 0; i < 40 && !page.url().includes("/placement/result"); i++) {
      await page.locator(".task-sheet, .answer-input").first().waitFor();
      const choice = page.locator(".answer:not(:disabled)").last();
      const input = page.locator(".answer-input");
      if (await choice.count()) await choice.click();
      else await input.fill("not an answer");
      await page.getByRole("button", { name: "Ответить" }).click();
      await page.waitForTimeout(300);
    }
    await page.locator("text=Твой уровень").waitFor();
    assert.match(await page.locator(".hero-screen").innerText(), /A1/i);
    await page.screenshot({ path: `${out}/${qaPrefix}-placement-result.png` });
    if (QA_LEVEL !== "A1") {
      // Local disposable preview only: placement has already been exercised;
      // set its test user to the course level under QA so its path is reachable.
      sqlite
        .prepare(
          "UPDATE users SET current_cefr_level = ? WHERE onboarding_completed = 1",
        )
        .run(QA_LEVEL);
    }
    await page.locator(".hero-screen__actions .btn").first().click();
    await page.goto(`${base}/course`, { waitUntil: "networkidle" });
    await page.locator(".situation-list").first().waitFor();
    assert.equal(
      await page.locator(".situation-row").count(),
      expectedCourseCount,
    );
    assert.deepEqual(
      await page.locator(".course-progress__count").allTextContents(),
      expectedChapterProgress,
    );
    assert.equal(await page.locator(".situation-row.is-current").count(), 1);
    assert.equal(
      await page.locator(".situation-row.is-locked").count(),
      expectedCourseCount - 1,
    );
    await page.screenshot({
      path: `${out}/${qaPrefix}-course-start.png`,
      fullPage: true,
    });
    const episodesToRun = failMission
      ? episodes.slice(0, episodes.indexOf(failEpisode) + 1)
      : episodes;
    for (const episode of episodesToRun) {
      let finished = false;
      for (let round = 0; round < 20 && !finished; round++) {
        started = undefined;
        if (round === 0) {
          await page.goto(`${base}/course`, { waitUntil: "networkidle" });
          const pathRow = page
            .locator(".situation-row")
            .nth(episodes.indexOf(episode));
          assert.ok(
            await pathRow.evaluate((node) =>
              node.classList.contains("is-current"),
            ),
            `${episode} is not the next unlocked Course node`,
          );
          await pathRow
            .getByRole("button", { name: /Начать|Продолжить/ })
            .click();
        } else {
          await page.goto(`${base}/course/${episode}/session`, {
            waitUntil: "networkidle",
          });
        }
        await page.locator(".task-sheet").waitFor();
        assert.ok(started?.currentActivity, JSON.stringify(started));
        const session = started;
        const wrong =
          failMission && episode === failEpisode && session.kind === "mission";
        const suffix = `${episode}-${wrong ? "fail" : "pass"}-s${session.sessionIndex}`;
        let expected =
          session.kind === "lesson" && session.sessionIndex === 1
            ? [{ from: "them", text: openingLine(episode) }]
            : [];
        const completed = new Set();
        async function checkTranscript() {
          const actual = await page
            .locator(".scene__dialogue .bubble")
            .evaluateAll((nodes) =>
              nodes
                .filter((n) => n.querySelector(".en"))
                .map((n) => ({
                  from: n.classList.contains("bubble--you") ? "you" : "them",
                  text: n.querySelector(".en").textContent,
                })),
            );
          assert.deepEqual(
            actual,
            expected.slice(-3),
            `${suffix}: transcript differs`,
          );
          assert.ok(
            actual.every((l) => !/[\u0400-\u04ff]/.test(l.text)),
            "Cyrillic in English transcript",
          );
          if (session.kind === "mission") {
            const log = await page
              .locator(".mission-log__bubble")
              .allTextContents();
            assert.deepEqual(
              log,
              expected.map((l) => l.text),
            );
          }
          snapshots.push({
            episode,
            sessionIndex: session.sessionIndex,
            kind: session.kind,
            wrong,
            actual,
          });
        }
        await checkTranscript();
        await page.screenshot({ path: `${out}/${suffix}-start.png` });
        let activity = session.currentActivity;
        for (let step = 0; step < 400; step++) {
          const row = sqlite
            .prepare(
              "SELECT activities_json FROM learning_sessions WHERE id = ?",
            )
            .get(session.sessionId);
          const stored = JSON.parse(row.activities_json).find(
            (a) => a.id === activity.id,
          );
          assert.ok(stored);
          const card = ["info_card", "grammar_card"].includes(activity.kind);
          let text;
          if (!card) {
            if (
              ["multiple_choice", "fill_gap_choice"].includes(activity.kind)
            ) {
              const option = stored.options.find((o) =>
                wrong
                  ? o.id !== stored.correctOptionId
                  : o.id === stored.correctOptionId,
              );
              const index = stored.options.findIndex((o) => o.id === option.id);
              await page.locator(".answer").nth(index).click();
              if (activity.kind === "fill_gap_choice")
                text = activity.content.sentence.replace(
                  "___",
                  () => option.text,
                );
            } else if (activity.kind === "typed_recall") {
              text = wrong ? "zzzz" : stored.acceptedAnswers[0];
              await page.locator(".answer-input").fill(text);
            } else {
              const tokens = stored.correctAnswer.trim().split(/\s+/);
              if (wrong) tokens.reverse();
              text = tokens.join(" ");
              for (const token of tokens) {
                const bank = page.locator(".word-bank .word:not(:disabled)");
                const values = await bank.allTextContents();
                const index = values.indexOf(token);
                assert.notEqual(index, -1, `unconstructible token ${token}`);
                await bank.nth(index).click();
              }
            }
          }
          answered = undefined;
          const response = page.waitForResponse((r) =>
            r.url().endsWith("/answer"),
          );
          await page
            .getByRole("button", {
              name: card ? "Понятно" : "Ответить",
              exact: false,
            })
            .click();
          await response;
          assert.ok(answered?.session, JSON.stringify(answered));
          if (!card) {
            await page
              .getByRole("button", { name: "Дальше", exact: true })
              .waitFor();
            assert.equal(
              answered.feedback.correct,
              !wrong,
              `${suffix}: unexpected grade`,
            );
            if (
              !wrong &&
              activity.dialogueTurnId &&
              !completed.has(activity.dialogueTurnId)
            ) {
              assert.ok(text, "spoken boundary must have an English utterance");
              completed.add(activity.dialogueTurnId);
              expected.push({ from: "you", text });
              if (activity.npcReply)
                expected.push({
                  from: "them",
                  text: activity.npcReply.correct,
                });
            }
            await checkTranscript();
            if (
              activity.dialogueTurnId &&
              (stored.targetId === "itm_sie_i_dont_understand" ||
                stored.targetId === "itm_sie_where_is_the" ||
                stored.targetId.startsWith("itm_sie_a11_") ||
                stored.targetId.startsWith("itm_sie_a19_") ||
                stored.targetId.startsWith("itm_sie_a110_") ||
                stored.targetId.startsWith("itm_sie_ha1_") ||
                stored.targetId.startsWith("itm_a2_a21_") ||
                stored.targetId.startsWith("itm_a2_a22_") ||
                stored.targetId.startsWith("itm_a2_a23_") ||
                stored.targetId.startsWith("itm_a2_a24_") ||
                stored.targetId.startsWith("itm_a2_a25_") ||
                stored.targetId.startsWith("itm_a2_a26_") ||
                stored.targetId.startsWith("itm_a2_a27_") ||
                stored.targetId.startsWith("itm_a2_a28_") ||
                stored.targetId.startsWith("itm_a2_a29_") ||
                stored.targetId.startsWith("itm_a2_a210_") ||
                stored.targetId.startsWith("itm_a2_a211_") ||
                stored.targetId.startsWith("itm_a2_a212_") ||
                stored.targetId.startsWith("itm_a2_a213_") ||
                stored.targetId.startsWith("itm_a2_a214_") ||
                stored.targetId.startsWith("itm_a2_a215_") ||
                stored.targetId.startsWith("itm_a2_a216_") ||
                stored.targetId.startsWith("itm_a2_ha2_") ||
                stored.targetId.startsWith("itm_b1_b11_") ||
                stored.targetId.startsWith("itm_b1_b12_") ||
                stored.targetId.startsWith("itm_b1_b13_") ||
                stored.targetId.startsWith("itm_b1_b14_") ||
                stored.targetId.startsWith("itm_b1_b15_") ||
                stored.targetId.startsWith("itm_b1_b16_") ||
                stored.targetId.startsWith("itm_b1_b17_") ||
                stored.targetId.startsWith("itm_b1_b18_") ||
                stored.targetId.startsWith("itm_b1_b19_") ||
                stored.targetId.startsWith("itm_b1_b110_") ||
                stored.targetId.startsWith("itm_b1_b111_") ||
                stored.targetId.startsWith("itm_b1_b112_") ||
                stored.targetId.startsWith("itm_b1_b113_") ||
                stored.targetId.startsWith("itm_b1_b114_") ||
                stored.targetId.startsWith("itm_b1_b115_") ||
                stored.targetId.startsWith("itm_b1_b116_") ||
                stored.targetId.startsWith("itm_b1_b117_") ||
                stored.targetId.startsWith("itm_b1_b118_") ||
                stored.targetId.startsWith("itm_b1_hb1_") ||
                stored.targetId.startsWith("itm_b2_b21_") ||
                stored.targetId.startsWith("itm_b2_b22_") ||
                stored.targetId.startsWith("itm_b2_b23_") ||
                stored.targetId.startsWith("itm_b2_b24_") ||
                stored.targetId.startsWith("itm_b2_b25_") ||
                stored.targetId.startsWith("itm_b2_b26_") ||
                stored.targetId.startsWith("itm_b2_b27_") ||
                stored.targetId.startsWith("itm_b2_b28_") ||
                stored.targetId.startsWith("itm_b2_b29_") ||
                stored.targetId.startsWith("itm_b2_b210_") ||
                stored.targetId.startsWith("itm_b2_b211_") ||
                stored.targetId.startsWith("itm_b2_b212_") ||
                stored.targetId.startsWith("itm_b2_b213_") ||
                stored.targetId.startsWith("itm_b2_b214_") ||
                stored.targetId.startsWith("itm_b2_b215_"))
            ) {
              await page.screenshot({
                path: `${out}/${suffix}-${stored.targetId}.png`,
              });
            }
            await page
              .getByRole("button", { name: "Дальше", exact: true })
              .click();
          }
          if (answered.session.status === "completed") {
            await page.locator(".hero-screen").waitFor();
            if (session.kind === "mission") {
              assert.equal(answered.session.result.missionPassed, !wrong);
              assert.equal(
                answered.session.result.capabilityState,
                wrong ? "learning" : "can_do",
              );
              await page.screenshot({
                path: `${out}/${suffix}-mission-result.png`,
              });
              results.push(answered.session.result);
              console.log(
                `${episode}: Mission ${wrong ? "FAIL path" : "PASS"} verified; transcript assertions passed`,
              );
              finished = true;
            }
            break;
          }
          activity = answered.session.nextActivity;
          await page.waitForFunction(
            (current) =>
              document.querySelectorAll(".seg.is-on").length === current,
            activity.progress.current,
          );
        }
      }
      assert.ok(finished, `${episode}: no Mission result`);
    }
    if (!failMission && episodes.length === expectedCourseCount) {
      await page.goto(`${base}/course`, { waitUntil: "networkidle" });
      await page.locator(".situation-list").first().waitFor();
      assert.deepEqual(
        await page.locator(".course-progress__count").allTextContents(),
        completedChapterProgress,
      );
      assert.equal(
        await page.locator(".situation-row").count(),
        expectedCourseCount,
      );
      await page.screenshot({
        path: `${out}/${QA_LEVEL.toLowerCase()}-course-complete.png`,
        fullPage: true,
      });
    }
    assert.deepEqual(errors, []);
  } catch (err) {
    await page.screenshot({ path: `${out}/failure.png` });
    throw err;
  } finally {
    await context.close();
    sqlite.close();
  }
}

try {
  await run(false);
  if (!process.env.QA_PASS_ONLY) await run(true);
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify({ results, snapshots }, null, 2),
  );
  await browser.close();
}
