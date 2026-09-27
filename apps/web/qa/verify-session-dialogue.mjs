/** Local regression QA: real React + Hono handlers + disposable SQLite.
 * Start Vite first. No Cloudflare runtime, remote DB, or canned API responses.
 * Episode IDs may be passed as command-line arguments; default is shipped e1-e5.
 * Onboarding is a verified fixture; authentication still uses signed dev auth.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { app } from "../../api/src/index.ts";
import { createTestDb } from "../../api/test/helpers/testDb.ts";
import { createFakeD1 } from "../../api/test/helpers/fakeD1.ts";
import { seedContent } from "../../api/src/content/seedContent.ts";
import { makeVerifiedUser } from "../../api/test/helpers/lessonFixtures.ts";
import { openingLine } from "../src/brand/situationScenes.ts";

const base = "http://localhost:5173";
const out = fileURLToPath(
  new URL("../../../artifacts/qa/session-dialogue/", import.meta.url),
);
const episodes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [1, 2, 3, 4, 5].map((n) => `les_sie_a1_e${n}`);
await mkdir(out, { recursive: true });
const results = [];
const snapshots = [];
const browser = await chromium.launch();

async function run(failMission) {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  await makeVerifiedUser(db, 1, "A1");
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
    for (const episode of failMission ? [episodes[0]] : episodes) {
      let finished = false;
      for (let round = 0; round < 20 && !finished; round++) {
        started = undefined;
        await page.goto(`${base}/course/${episode}/session`, {
          waitUntil: "networkidle",
        });
        await page.locator(".task-sheet").waitFor();
        assert.ok(started?.currentActivity, JSON.stringify(started));
        const session = started;
        const wrong = failMission && session.kind === "mission";
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
              .getByRole("button", { name: "Дальше", exact: false })
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
                stored.targetId === "itm_sie_where_is_the")
            ) {
              await page.screenshot({
                path: `${out}/${suffix}-${stored.targetId}.png`,
              });
            }
            await page
              .getByRole("button", { name: "Дальше", exact: false })
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
  await run(true);
} finally {
  await writeFile(
    `${out}/results.json`,
    JSON.stringify({ results, snapshots }, null, 2),
  );
  await browser.close();
}
