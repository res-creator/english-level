/**
 * Full authenticated QA — drives the real first-run flow (Welcome ->
 * Demo -> onboarding -> Placement -> Today -> Course -> Session ->
 * Mission Result) against a LOCAL dev server, using the app's own
 * existing dev-mock Telegram auth (apps/web/src/auth/devTelegramFixture.ts).
 *
 * This is NOT meant to run against a deployed preview/production URL —
 * it only authenticates because `vite dev` (import.meta.env.DEV=true)
 * plus no real window.Telegram makes the app sign itself in with a
 * fixture initData that ONLY the local (unnamed) API environment
 * trusts (see apps/api/wrangler.toml's default TELEGRAM_BOT_TOKEN).
 * No auth bypass is added here — this is the codebase's own existing
 * local-dev path, just driven by Playwright instead of a person.
 *
 * Intended to run in CI (see .github/workflows/qa-authenticated.yml),
 * where the local API is already up via `wrangler dev` with migrations + seed
 * content applied. It ALSO needs a fresh per-run user: the dev fixture
 * always presents Telegram user id 0
 * (apps/web/src/telegram/webapp.ts's createMockTelegramWebApp), so a
 * second run against the same D1 file would resume an already-
 * onboarded account instead of a fresh one — the CI job re-applies
 * migrations to a throwaway local D1 every run for exactly this
 * reason (see the workflow).
 *
 * Every click here picks whatever answer is fastest to automate (the
 * first option, a placeholder string), never a "correct" one — none
 * of this asserts learning correctness, only that the flow, its
 * transcript and its controls render sanely. The Mission may well
 * come back "failed" as a result; SessionResult handles that case too
 * and this script screenshots whichever one actually happens.
 */
import { chromium, devices, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO_ROOT, "artifacts", "qa");

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:5173";
const VIEWPORT = { width: 390, height: 844 };

interface Finding {
  screen: string;
  severity: "bug" | "note";
  message: string;
}
const findings: Finding[] = [];
function report(
  screen: string,
  severity: Finding["severity"],
  message: string,
) {
  findings.push({ screen, severity, message });
  console.log(`[${severity.toUpperCase()}] ${screen}: ${message}`);
}

let shotIndex = 0;
async function shoot(page: Page, name: string) {
  shotIndex += 1;
  const file = path.join(
    OUT_DIR,
    `${String(shotIndex).padStart(2, "0")}-${name}`,
  );
  await page.screenshot({ path: file });
  console.log(`saved ${path.relative(REPO_ROOT, file)}`);
}

async function checkLayout(page: Page, screen: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflow > 1) {
    report(
      screen,
      "bug",
      `Horizontal overflow: ${overflow}px wider than the viewport.`,
    );
  }
}

/** Snake_case-looking tokens (no spaces, underscore-joined lowercase)
 * never occur in real English/Russian dialogue copy — a decent, cheap
 * proxy for "an internal id/label leaked into user-facing text". */
const INTERNAL_LABEL_RE = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/;

async function checkNoInternalLabels(
  page: Page,
  selector: string,
  screen: string,
) {
  const texts = await page.locator(selector).allInnerTexts();
  for (const text of texts) {
    if (INTERNAL_LABEL_RE.test(text)) {
      report(
        screen,
        "bug",
        `Possible internal label leaked into user-facing text: "${text}"`,
      );
    }
  }
}

async function clickByText(page: Page, text: string | RegExp) {
  await page.locator(".btn, button", { hasText: text }).first().click();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: devices["iPhone 13"].deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 13"].userAgent,
  });
  const page = await context.newPage();

  // --- Welcome -> Demo (marks welcome seen; the only path onward) -----
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: "networkidle" });
  await checkLayout(page, "welcome");
  await clickByText(page, "Попробовать иначе");
  await page.waitForURL(/\/demo$/, { timeout: 15_000 });

  // Drive the 2-step demo with whatever's fastest — content itself is
  // already covered by qa/run.ts against the deployed preview.
  for (let i = 0; i < 2; i++) {
    await page.waitForSelector(".task-sheet", { timeout: 10_000 });
    const choice = page.locator(".answer").first();
    const bank = page.locator(".word").first();
    if ((await choice.count()) > 0) await choice.click();
    else if ((await bank.count()) > 0) await bank.click();
    await clickByText(page, "Ответить");
    await page.waitForTimeout(300);
    await clickByText(page, "Дальше");
    await page.waitForTimeout(300);
  }
  await clickByText(page, "Дальше"); // DemoDone -> /demo/result
  await page.waitForURL(/\/demo\/result$/, { timeout: 10_000 });
  await clickByText(page, "Продолжить"); // -> /onboarding/companion
  await page.waitForURL(/\/onboarding\/companion$/, { timeout: 10_000 });

  // --- Companion, then Goals -> Level (A1) -> Daily time -> Ready -----
  await page.waitForSelector(".pick-screen", { timeout: 10_000 });
  await clickByText(page, /^Оставить/);
  await page.waitForURL(/\/onboarding(\/goals)?$/, { timeout: 10_000 });

  await page.waitForSelector(".goal-grid", { timeout: 10_000 });
  await page.locator(".goal-chip").first().click();
  await clickByText(page, "Дальше");

  await page.waitForURL(/\/onboarding\/level$/, { timeout: 10_000 });
  await page.locator(".answer", { hasText: "A1" }).click();
  await clickByText(page, "Дальше");

  await page.waitForURL(/\/onboarding\/time$/, { timeout: 10_000 });
  await page.locator(".answer").first().click();
  await clickByText(page, "Дальше");

  await page.waitForURL(/\/onboarding\/ready$/, { timeout: 10_000 });
  await clickByText(page, "Пройти тест");

  // --- Placement (adaptive, ~15-25 questions) --------------------------
  await page.waitForURL(/\/placement$/, { timeout: 10_000 });
  const startBtn = page.locator(".btn", { hasText: "Начать тест" });
  if ((await startBtn.count()) > 0) await startBtn.click();

  const PLACEMENT_MAX_QUESTIONS = 40; // adaptive engine stops at ~25; this is a safety ceiling, not the expected count
  for (let i = 0; i < PLACEMENT_MAX_QUESTIONS; i++) {
    if (/\/placement\/result\//.test(page.url())) break;
    await page.waitForSelector(".task-sheet, .answer-input", {
      timeout: 15_000,
    });
    const options = page.locator(".answer");
    const input = page.locator(".answer-input");
    if ((await options.count()) > 0) {
      await options.first().click();
    } else if ((await input.count()) > 0) {
      await input.fill("placeholder");
    }
    await clickByText(page, "Ответить");
    await page.waitForTimeout(250);
    if (/\/placement\/result\//.test(page.url())) break;
  }
  await page.waitForURL(/\/placement\/result\//, { timeout: 15_000 });
  await shoot(page, "placement-result.png");
  await checkLayout(page, "placement-result");

  // CTA is either "Начать: <title>" (-> /course/:id) or "Открыть курс"
  // (-> /course) depending on whether Today's first episode resolved
  // yet — either way it lands us in the real curriculum.
  await page.locator(".hero-screen__actions .btn").first().click();
  await page.waitForLoadState("networkidle");

  // --- Today -----------------------------------------------------------
  await page.goto(`${BASE_URL}/today`, { waitUntil: "networkidle" });
  await shoot(page, "today.png");
  await checkLayout(page, "today");
  const todayCta = page.locator(".today-hero__card .btn");
  if ((await todayCta.count()) === 0) {
    report("today", "bug", "No primary CTA found in the Today hero card.");
  }

  // --- Course ------------------------------------------------------------
  await page.goto(`${BASE_URL}/course`, { waitUntil: "networkidle" });
  await shoot(page, "course.png");
  await checkLayout(page, "course");
  const currentCta = page.locator(".situation-row.is-current .btn");
  if ((await currentCta.count()) === 0) {
    report(
      "course",
      "bug",
      "No CTA button found on the current situation's card.",
    );
  } else {
    await currentCta.first().click();
    await page.waitForURL(/\/session$/, { timeout: 15_000 });
  }

  // --- Session: repeat across every session of the first episode until
  //     a completed Mission redirects to a real SessionResult. ----------
  const MAX_ROUNDS = 8; // sessions-before-mission for one A1 episode is small (seen: 3); generous ceiling
  let missionSeen = false;
  for (let round = 0; round < MAX_ROUNDS && !missionSeen; round++) {
    const MAX_STEPS = 12;
    for (let step = 0; step < MAX_STEPS; step++) {
      await page.waitForSelector(".task-sheet", { timeout: 15_000 });
      if (/\/result\//.test(page.url())) break;

      await checkLayout(page, `session-r${round}-s${step}`);
      await checkNoInternalLabels(
        page,
        ".bubble, .mission-log__bubble, .task-sheet__title",
        `session-r${round}-s${step}`,
      );

      const bubbles = page.locator(".bubble");
      const bubbleCount = await bubbles.count();
      if (bubbleCount > 1) {
        const order: string[] = [];
        for (let i = 0; i < bubbleCount; i++) {
          const cls = await bubbles.nth(i).getAttribute("class");
          order.push(cls?.includes("bubble--you") ? "you" : "them");
        }
        const themIdx = order.indexOf("them");
        const youIdx = order.indexOf("you");
        if (themIdx !== -1 && youIdx !== -1 && themIdx > youIdx) {
          report(
            `session-r${round}-s${step}`,
            "bug",
            `Dialogue bubble order looks wrong: ${JSON.stringify(order)}.`,
          );
        }
      }

      await shoot(page, `session-r${round}-s${step}.png`);

      const understoodBtn = page.locator(".btn", { hasText: "Понятно" });
      const answerBtn = page.locator(".btn", { hasText: "Ответить" });
      const nextBtn = page.locator(".btn", { hasText: "Дальше" });

      if ((await understoodBtn.count()) > 0) {
        await understoodBtn.click();
      } else if ((await answerBtn.count()) > 0) {
        const mcOptions = page.locator(".answer");
        const wordBankTokens = page.locator(".word-bank .word:not(:disabled)");
        const buildLineWords = page.locator(".build-line .word");
        const textInput = page.locator(".answer-input");

        if ((await mcOptions.count()) > 0) {
          await mcOptions.first().click();
        } else if ((await wordBankTokens.count()) > 0) {
          // sentence_build: tap every available token once, in whatever
          // order they're offered — enough to make `answer` non-empty,
          // which is all the real submit button requires.
          const n = await wordBankTokens.count();
          for (let i = 0; i < n; i++) {
            const still = page.locator(".word-bank .word:not(:disabled)");
            if ((await still.count()) === 0) break;
            await still.first().click();
            await page.waitForTimeout(60);
          }
          void buildLineWords; // (kept for readability of intent above)
        } else if ((await textInput.count()) > 0) {
          await textInput.fill("placeholder");
        }

        const enabledAnswerBtn = page.locator(".btn", { hasText: "Ответить" });
        if (!(await enabledAnswerBtn.first().isDisabled())) {
          await enabledAnswerBtn.first().click();
          await page.waitForTimeout(300);

          // Word-bank collectability: whatever the REAL correct answer
          // turns out to be (revealed only now, in the miss panel), every
          // one of its words must have existed in the token bank shown.
          const missAnswer = page.locator(".miss__answer");
          if (
            (await missAnswer.count()) > 0 &&
            (await wordBankTokens.count()) >= 0
          ) {
            const correct = (await missAnswer.innerText()).trim();
            const bankTextsNow = await page
              .locator(".word-bank .word, .build-line .word")
              .allInnerTexts();
            const bankSet = new Set(bankTextsNow.map((t) => t.trim()));
            const missingWords = correct
              .split(/\s+/)
              .filter((w) => w.length > 0 && !bankSet.has(w));
            if (missingWords.length > 0 && bankTextsNow.length > 0) {
              report(
                `session-r${round}-s${step}`,
                "bug",
                `Correct answer "${correct}" isn't fully assembleable from the shown word bank (missing: ${missingWords.join(", ")}).`,
              );
            }
          }
        }
      }

      if ((await nextBtn.count()) > 0) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }

      if (/\/result\//.test(page.url())) break;
    }

    await page.waitForURL(/\/result\//, { timeout: 15_000 });
    await page.waitForSelector(".hero-screen", { timeout: 10_000 });

    const isMissionResult = (await page.locator(".can-list").count()) > 0;
    const isFailedMission =
      (await page.locator("text=Ещё пара заходов").count()) > 0;

    if (isMissionResult || isFailedMission) {
      missionSeen = true;
      await shoot(page, "mission-result.png");
      await checkLayout(page, "mission-result");
      const title = (await page.locator("h1").first().innerText()).trim();
      if (!title) {
        report("mission-result", "bug", "Result screen has no visible title.");
      }
      report(
        "mission-result",
        "note",
        `Mission outcome: ${isMissionResult ? "passed" : "failed"} — answers were picked for automatability, not correctness, so either is expected.`,
      );
      break;
    }

    // A regular (non-mission) session finished — go back to the episode
    // preview and start the next one.
    await shoot(page, `session-result-r${round}.png`);
    const backToSituation = page.locator(".btn.btn-ghost", {
      hasText: "К ситуации",
    });
    if ((await backToSituation.count()) > 0) {
      await backToSituation.click();
    } else {
      break; // nothing more to continue from
    }
    await page.waitForURL(/\/course\/[^/]+$/, { timeout: 10_000 });
    await clickByText(page, /Продолжить|Начать/);
    await page.waitForURL(/\/session$/, { timeout: 15_000 });
  }

  if (!missionSeen) {
    report(
      "mission-result",
      "bug",
      `Never reached a Mission result after ${MAX_ROUNDS} session rounds — either the episode has more sessions than expected, or something didn't advance.`,
    );
  }

  await browser.close();

  await writeFile(
    path.join(OUT_DIR, "findings-authenticated.json"),
    JSON.stringify(findings, null, 2),
  );
  console.log(
    `\n${findings.length} findings written to artifacts/qa/findings-authenticated.json`,
  );

  if (findings.some((f) => f.severity === "bug")) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
