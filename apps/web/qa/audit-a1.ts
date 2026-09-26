/**
 * Full A1 content/learning/UX audit — NOT a regression smoke test like
 * qa/run-authenticated.ts. This drives all 5 public A1 situations
 * (les_sie_a1_e1..e5) end to end, through every regular session round
 * AND the Mission, and records rich structured data per activity
 * (instruction, NPC/context text, options/word-bank, submitted answer,
 * whether it was marked correct, the revealed correct answer, feedback
 * copy) plus a deliberate fail-then-pass double attempt at every
 * Mission, so both the success and failure result screens get
 * exercised and captured for every situation.
 *
 * Reuses the exact same auth bootstrap as qa/run-authenticated.ts
 * (same root causes, same fixes — see that file's header for the full
 * history: the telegram-web-app.js route block, the post-login reload
 * to dodge the StrictMode double-insert race). This script does not
 * touch app code and does not fix anything it finds — it only reports.
 *
 * Output (never committed — see .gitignore's artifacts/qa/ rule):
 *   artifacts/qa/audit-a1/*.png            — one screenshot per activity/result
 *   artifacts/qa/audit-a1/activities.json  — full per-activity data dump
 *   artifacts/qa/audit-a1/findings.json    — categorized findings
 *
 * These two JSON files are what the human-readable A1_FULL_LEARNING_QA.md
 * report gets built from after this run completes.
 */
import { chromium, devices, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO_ROOT, "artifacts", "qa", "audit-a1");

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:5173";
const VIEWPORT = { width: 390, height: 844 };
const SESSION_COOKIE_NAME = "el_session"; // apps/api/src/auth/session.ts

const SITUATIONS = [
  { id: "les_sie_a1_e1", title: "Первое знакомство" },
  { id: "les_sie_a1_e2", title: "Заказ в кафе" },
  { id: "les_sie_a1_e3", title: "Мой обычный день" },
  { id: "les_sie_a1_e4", title: "Я потерялась в городе" },
  { id: "les_sie_a1_e5", title: "Заказ пошёл не по плану" },
];

// ---------------------------------------------------------------------
// Findings + activity log
// ---------------------------------------------------------------------

type FindingCategory =
  | "BLOCKER"
  | "CONTENT_LOGIC"
  | "LEARNING_UX"
  | "STATE_LOGIC"
  | "VISUAL"
  | "POLISH";

interface Finding {
  category: FindingCategory;
  situation: string;
  activity: string;
  screenshot: string | null;
  whatHappens: string;
  whyProblem: string;
  expectedBehavior: string;
}
const findings: Finding[] = [];
function report(f: Finding) {
  findings.push(f);
  console.log(`[${f.category}] ${f.situation} / ${f.activity}: ${f.whatHappens}`);
}

interface ActivityRecord {
  situationId: string;
  situationTitle: string;
  phase: "session" | "mission";
  round: number;
  missionAttempt: number | null;
  step: number;
  kind: string;
  instruction: string;
  contextChip: string | null;
  sentenceLine: string | null;
  inputHint: string | null;
  options: string[];
  wordBank: string[];
  dialogueBubbles: { speaker: string; text: string }[];
  submittedAnswer: string;
  wasCorrect: boolean | null;
  correctAnswerRevealed: string | null;
  feedbackNote: string | null;
  screenshot: string;
}
const activities: ActivityRecord[] = [];

let shotIndex = 0;
async function shoot(page: Page, name: string): Promise<string> {
  shotIndex += 1;
  const filename = `${String(shotIndex).padStart(3, "0")}-${name}`;
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file });
  return filename;
}

function slug(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------
// Bootstrap helpers — identical to qa/run-authenticated.ts (see its
// header for the full root-cause history of each of these).
// ---------------------------------------------------------------------

async function describeCookies(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  if (cookies.length === 0) return "(no cookies at all)";
  return cookies
    .map((c) => `${c.name}@${c.domain} (sameSite=${c.sameSite})`)
    .join(", ");
}

async function waitForSessionCookie(page: Page, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cookies = await page.context().cookies();
    if (cookies.find((c) => c.name === SESSION_COOKIE_NAME)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(
    `Session cookie never appeared within ${timeoutMs}ms. Cookies: ${await describeCookies(page)}`,
  );
}

async function waitForScreen(
  page: Page,
  name: string,
  marker: import("playwright").Locator,
  opts?: { urlPattern?: RegExp; timeout?: number },
) {
  const timeout = opts?.timeout ?? 15_000;
  try {
    await marker.first().waitFor({ state: "visible", timeout });
  } catch (err) {
    console.error(`FAILED waiting for "${name}" — url is now ${page.url()}`);
    try {
      await page.screenshot({ path: path.join(OUT_DIR, `FAILURE-${slug(name)}.png`) });
    } catch {
      /* best effort */
    }
    throw err;
  }
}

async function checkLayout(page: Page, situation: string, activity: string, screenshot: string | null) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflow > 1) {
    report({
      category: "VISUAL",
      situation,
      activity,
      screenshot,
      whatHappens: `Horizontal overflow: ${overflow}px wider than the 390px viewport.`,
      whyProblem: "Causes side-scrolling or clipped content on a real phone screen.",
      expectedBehavior: "Page content should fit the viewport width with no horizontal scroll.",
    });
  }
}

async function clickByText(page: Page, text: string | RegExp) {
  await page.locator(".btn, button", { hasText: text }).first().click();
}

/**
 * After advancing past an activity (Дальше/Понятно), the just-answered
 * one's disabled/status-classed options can linger in the DOM for a
 * beat before the next activity mounts. Waits for that leftover state
 * to actually clear instead of a flat sleep, so the next capture/answer
 * never races a stale disabled node (see the long comment at
 * captureActivity's `:not(:disabled)` filters for the full story).
 */
async function waitForFreshActivity(page: Page, timeoutMs = 8_000) {
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll(".answer:disabled").length === 0 &&
        !document.querySelector(".miss"),
      { timeout: timeoutMs },
    )
    .catch(() => {
      /* best effort — proceed regardless; :not(:disabled) filters
         downstream still prevent acting on a stale node even if this
         wait itself times out. */
    });
}

// ---------------------------------------------------------------------
// Answer/content normalization (mirrors apps/api/src/lessonEngine/
// exerciseGrading.ts's normalizeAnswer as closely as a black-box client
// reasonably can: trim, lowercase, collapse whitespace, strip a single
// trailing terminal punctuation mark).
// ---------------------------------------------------------------------
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.?!]+$/, "");
}
function normalizeWord(s: string): string {
  return s.trim().toLowerCase().replace(/^[.,!?;:]+|[.,!?;:]+$/g, "");
}

// ---------------------------------------------------------------------
// Per-activity content capture (read-only, called before answering)
// ---------------------------------------------------------------------
async function captureActivity(
  page: Page,
  situation: (typeof SITUATIONS)[number],
  phase: "session" | "mission",
  missionAttempt: number | null,
  round: number,
  step: number,
): Promise<ActivityRecord> {
  const overlineText = (await page.locator(".overline").first().innerText().catch(() => "")).trim();
  const hasAnswerInput = (await page.locator(".answer-input").count()) > 0;
  // :not(:disabled) throughout this function: a just-answered activity's
  // options/tokens stay in the DOM (now disabled, status-classed) for a
  // beat while the next activity mounts, and an unfiltered `.answer`/
  // `.word-bank .word` query can catch that stale, permanently-disabled
  // node instead of the fresh one — confirmed in run 36236354904 (every
  // captured MC option list was duplicated, and one click hung the full
  // 30s Playwright action timeout against a disabled leftover button).
  const hasWordBank = (await page.locator(".word-bank .word:not(:disabled)").count()) > 0;
  const hasAnswerOptions = (await page.locator(".answer:not(:disabled)").count()) > 0;
  const hasSentenceLine = (await page.locator(".sentence-line").count()) > 0;

  // .overline is styled text-transform: uppercase (apps/web/src/styles.css),
  // and Playwright's innerText() reflects rendered (post-CSS) text, not
  // the raw DOM string — so this compared "Новое выражение" against an
  // actual "НОВОЕ ВЫРАЖЕНИЕ" and never matched. Confirmed in run
  // 36244900024: every info_card/grammar_card activity was misclassified
  // "unknown" as a result (72 of 406 screenshots). Not a product bug —
  // purely this script's own string comparison. Case-insensitive fixes it.
  const overlineUpper = overlineText.toUpperCase();
  let kind: string;
  if (overlineUpper === "НОВОЕ ВЫРАЖЕНИЕ") kind = "info_card";
  else if (overlineUpper === "ПАУЗА НА ПРАВИЛО") kind = "grammar_card";
  else if (overlineUpper === "СОБЕРИ ОТВЕТ" || hasWordBank) kind = "sentence_build";
  else if (hasAnswerInput) kind = "typed_recall";
  else if (hasAnswerOptions && hasSentenceLine) kind = "fill_gap_choice";
  else if (hasAnswerOptions) kind = "multiple_choice";
  else kind = "unknown";

  const instruction = (await page.locator(".task-sheet__title").first().innerText().catch(() => "")).trim();
  const contextChip = (await page.locator(".context-chip").count()) > 0
    ? (await page.locator(".context-chip").first().innerText()).trim()
    : null;
  const sentenceLine = hasSentenceLine
    ? (await page.locator(".sentence-line").first().innerText()).trim()
    : null;
  const inputHint = hasAnswerInput
    ? (await page.locator(".body.muted").first().innerText().catch(() => "")).trim() || null
    : null;
  const options = hasAnswerOptions
    ? (await page.locator(".answer:not(:disabled)").allInnerTexts()).map((t) => t.trim())
    : [];
  const wordBank = hasWordBank
    ? (await page.locator(".word-bank .word:not(:disabled)").allInnerTexts()).map((t) => t.trim())
    : [];

  const bubbleEls = page.locator(".bubble, .mission-log__bubble");
  const bubbleCount = await bubbleEls.count();
  const dialogueBubbles: { speaker: string; text: string }[] = [];
  for (let i = 0; i < bubbleCount; i++) {
    const cls = (await bubbleEls.nth(i).getAttribute("class")) ?? "";
    const text = (await bubbleEls.nth(i).innerText()).trim();
    dialogueBubbles.push({ speaker: cls.includes("--you") ? "you" : "them", text });
  }

  return {
    situationId: situation.id,
    situationTitle: situation.title,
    phase,
    round,
    missionAttempt,
    step,
    kind,
    instruction,
    contextChip,
    sentenceLine,
    inputHint,
    options,
    wordBank,
    dialogueBubbles,
    submittedAnswer: "",
    wasCorrect: null,
    correctAnswerRevealed: null,
    feedbackNote: null,
    screenshot: "",
  };
}

type AnswerMode = "session" | "mission-fail" | "mission-pass";

async function answerActivity(
  page: Page,
  mode: AnswerMode,
  record: ActivityRecord,
  recordedAnswers: Map<string, string>,
): Promise<void> {
  const understoodBtn = page.locator(".btn", { hasText: "Понятно" });
  if ((await understoodBtn.count()) > 0) {
    record.submittedAnswer = "(info/grammar card — acknowledged, not scored)";
    await understoodBtn.click();
    await waitForFreshActivity(page);
    return;
  }

  // sentence_build has no .task-sheet__title at all (confirmed in
  // ActivityPanel.tsx's SentenceBuilder — only .overline "Собери
  // ответ", no per-item prompt text), so record.instruction is always
  // "" for that kind. Keying purely on kind+instruction then collapses
  // every sentence_build item in a situation onto the same key,
  // silently reusing whichever one's answer got recorded last for
  // every other one — this was the actual cause of every mission
  // "informed" attempt failing in runs 36236354904 through 36244900024
  // (confirmed by cross-referencing screenshots against
  // ActivityPanel.tsx's source, not a real app grading bug). Fall back
  // to the word bank's own contents, which — unlike the instruction —
  // does distinguish one sentence_build item from another.
  const key =
    record.kind === "sentence_build" && !record.instruction
      ? `sentence_build::${record.wordBank.slice().sort().join("|")}`
      : `${record.kind}::${record.instruction}`;
  const recorded = recordedAnswers.get(key);

  const hasAnswerOptions = (await page.locator(".answer:not(:disabled)").count()) > 0;
  const hasWordBank = (await page.locator(".word-bank .word:not(:disabled)").count()) > 0;
  const hasAnswerInput = (await page.locator(".answer-input").count()) > 0;

  if (hasAnswerOptions) {
    const options = page.locator(".answer:not(:disabled)");
    const n = await options.count();
    let idx = 0;
    if (mode === "mission-pass" && recorded) {
      let found = -1;
      for (let i = 0; i < n; i++) {
        const t = (await options.nth(i).innerText()).trim();
        if (normalize(t) === normalize(recorded)) {
          found = i;
          break;
        }
      }
      idx = found >= 0 ? found : 0;
    } else if (mode === "mission-fail") {
      idx = n - 1;
    }
    record.submittedAnswer = (await options.nth(idx).innerText()).trim();
    await options.nth(idx).click();
  } else if (hasWordBank) {
    if (mode === "mission-pass" && recorded) {
      for (const w of recorded.split(/\s+/)) {
        const target = normalizeWord(w);
        const tokens = page.locator(".word-bank .word:not(:disabled)");
        const tn = await tokens.count();
        let clicked = false;
        for (let i = 0; i < tn; i++) {
          const t = (await tokens.nth(i).innerText()).trim();
          if (normalizeWord(t) === target) {
            await tokens.nth(i).click();
            clicked = true;
            await page.waitForTimeout(60);
            break;
          }
        }
        if (!clicked) {
          const still = page.locator(".word-bank .word:not(:disabled)");
          if ((await still.count()) > 0) {
            await still.first().click();
            await page.waitForTimeout(60);
          }
        }
      }
    } else {
      const initial = await page.locator(".word-bank .word:not(:disabled)").allInnerTexts();
      const order = mode === "mission-fail" ? [...initial].reverse() : initial;
      for (const w of order) {
        const tokens = page.locator(".word-bank .word:not(:disabled)", { hasText: w });
        if ((await tokens.count()) > 0) {
          await tokens.first().click();
          await page.waitForTimeout(60);
        }
      }
    }
    record.submittedAnswer = (await page.locator(".build-line .word").allInnerTexts()).join(" ");
  } else if (hasAnswerInput) {
    const input = page.locator(".answer-input");
    if (mode === "mission-pass" && recorded) {
      record.submittedAnswer = recorded;
    } else if (mode === "mission-fail") {
      record.submittedAnswer = "xxxdeliberatelywrongxxx";
    } else {
      record.submittedAnswer = "placeholder";
    }
    await input.fill(record.submittedAnswer);
  }

  const answerBtn = page.locator(".btn", { hasText: "Ответить" });
  if ((await answerBtn.count()) > 0 && !(await answerBtn.first().isDisabled())) {
    await answerBtn.first().click();
    await page.waitForTimeout(300);
  }

  const missAnswer = page.locator(".miss__answer");
  const hasMiss = (await missAnswer.count()) > 0;
  record.correctAnswerRevealed = hasMiss ? (await missAnswer.first().innerText()).trim() : null;
  record.feedbackNote =
    (await page.locator(".miss__note").count()) > 0
      ? (await page.locator(".miss__note").first().innerText()).trim()
      : null;
  record.wasCorrect = !hasMiss;

  if (record.correctAnswerRevealed) {
    recordedAnswers.set(key, record.correctAnswerRevealed);
  }
}

// ---------------------------------------------------------------------
// Per-situation flags so structural findings that recur at every single
// step (the one-sided-dialogue bug, the raw grammar-label bug) are
// reported once per situation with full detail, not duplicated 15+ times.
// ---------------------------------------------------------------------
interface SituationFlags {
  dialogueBugLogged: boolean;
  grammarLabelLogged: boolean;
}

async function runSituation(page: Page, situation: (typeof SITUATIONS)[number]): Promise<boolean> {
  const flags: SituationFlags = { dialogueBugLogged: false, grammarLabelLogged: false };
  const sessionAnswers = new Map<string, string>();
  const missionAnswers = new Map<string, string>();

  await page.goto(`${BASE_URL}/course/${situation.id}`, { waitUntil: "networkidle" });
  const previewShot = await shoot(page, `${situation.id}-00-preview.png`);
  await checkLayout(page, situation.title, "Situation preview", previewShot);
  await clickByText(page, /Продолжить|Начать/);
  await waitForScreen(page, `${situation.id}-session`, page.locator(".scene"), {
    urlPattern: /\/session$/,
  });

  let missionPassed = false;
  let missionAttempt = 0;
  const MAX_ROUNDS = 12;

  for (let round = 0; round < MAX_ROUNDS && !missionPassed; round++) {
    await page.waitForSelector(".task-sheet, .hero-screen", { timeout: 20_000 });

    const missionLabelText = await page
      .locator(".lesson-top__label")
      .first()
      .innerText()
      .catch(() => "");
    const isMission = missionLabelText.includes("Миссия");
    if (isMission) missionAttempt++;
    const mode: AnswerMode = !isMission ? "session" : missionAttempt === 1 ? "mission-fail" : "mission-pass";
    const recordedAnswers = isMission ? missionAnswers : sessionAnswers;
    const roundLabel = isMission ? `mission-attempt${missionAttempt}` : `r${round}`;

    const MAX_STEPS = isMission ? 20 : 30;
    for (let step = 0; step < MAX_STEPS; step++) {
      const gotTaskSheet = await page
        .waitForSelector(".task-sheet", { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (!gotTaskSheet || /\/result\//.test(page.url())) break;

      const record = await captureActivity(page, situation, isMission ? "mission" : "session", isMission ? missionAttempt : null, round, step);

      // One-sided-dialogue structural bug (see qa/audit-a1.ts design
      // notes / A1_FULL_LEARNING_QA.md): after a couple of steps, no
      // `them` bubble should still be entirely absent while `you`
      // bubbles pile up, if this bug is present.
      const themCount = record.dialogueBubbles.filter((b) => b.speaker === "them").length;
      const youCount = record.dialogueBubbles.filter((b) => b.speaker === "you").length;
      if (!flags.dialogueBugLogged && step >= 2 && record.dialogueBubbles.length > 0 && themCount === 0 && youCount > 0) {
        flags.dialogueBugLogged = true;
        const shot = await shoot(page, `${situation.id}-${roundLabel}-s${step}-dialogue-onesided.png`);
        report({
          category: "CONTENT_LOGIC",
          situation: situation.title,
          activity: `${roundLabel} step ${step} (${record.kind})`,
          screenshot: shot,
          whatHappens: `The dialogue/mission-log transcript shows only user ("you") bubbles — no NPC ("them") line has appeared since the opening greeting. Visible bubbles: ${JSON.stringify(record.dialogueBubbles.map((b) => b.speaker))}.`,
          whyProblem:
            "Structural: Session.tsx seeds the dialogue array with a single opening `them` line and only ever appends `you` lines afterward (confirmed in source — no code path ever pushes a fresh `them` entry). The scene reads as the learner talking to themselves after the first exchange, in every session and every Mission, for all 5 situations.",
          expectedBehavior:
            "Each new activity that represents an NPC turn should push a fresh `them` bubble with that NPC's actual line, so the transcript alternates NPC/user realistically instead of accumulating only user lines.",
        });
      }

      // Raw grammar-pattern-title / metalinguistic-label bug.
      if (!flags.grammarLabelLogged && record.kind === "grammar_card") {
        flags.grammarLabelLogged = true;
        const shot = await shoot(page, `${situation.id}-${roundLabel}-s${step}-grammar-raw-title.png`);
        report({
          category: "LEARNING_UX",
          situation: situation.title,
          activity: `${roundLabel} step ${step} (grammar_card)`,
          screenshot: shot,
          whatHappens: `Grammar card's title is shown as the raw internal pattern name "${record.instruction}", not a learner-facing explanation.`,
          whyProblem:
            "grammar_card renders pattern.title directly with no translation/localization layer applied (confirmed in ActivityPanel.tsx) — an A1 beginner sees an academic grammar-terminology label instead of plain guidance.",
          expectedBehavior:
            'A beginner-friendly heading (e.g. "Как сказать \'я...\'" instead of "Be - positive") — the underlying rule can still be taught, but the label itself should not require already knowing grammar terminology.',
        });
      }
      if (!flags.grammarLabelLogged && record.instruction === "Какое здесь правило?") {
        flags.grammarLabelLogged = true;
        const shot = await shoot(page, `${situation.id}-${roundLabel}-s${step}-grammar-mc-raw-options.png`);
        report({
          category: "LEARNING_UX",
          situation: situation.title,
          activity: `${roundLabel} step ${step} (multiple_choice, grammar recognition)`,
          screenshot: shot,
          whatHappens: `Prompt "Какое здесь правило?" offers raw pattern-title options: ${JSON.stringify(record.options)}.`,
          whyProblem:
            "The prompt itself is translated to Russian, but the answer options are the same raw internal pattern titles (e.g. \"Be - positive\", \"Can - ability\") — a true beginner must already know academic grammar terminology to answer, which contradicts the level this content targets.",
          expectedBehavior:
            "Options should describe the rule in plain, concrete terms a beginner recognizes (e.g. by example sentence or a plain-language description), not by its internal grammar-reference name.",
        });
      }

      const shot = await shoot(page, `${situation.id}-${roundLabel}-s${step}-${record.kind}.png`);
      record.screenshot = shot;
      await checkLayout(page, situation.title, `${roundLabel} step ${step} (${record.kind})`, shot);

      await answerActivity(page, mode, record, recordedAnswers);
      activities.push(record);

      if (record.kind === "sentence_build" && record.correctAnswerRevealed) {
        const correctWords = record.correctAnswerRevealed.split(/\s+/).map(normalizeWord).filter(Boolean);
        const bankSet = new Set(record.wordBank.map(normalizeWord));
        const missing = correctWords.filter((w) => !bankSet.has(w));
        if (missing.length > 0) {
          report({
            category: "CONTENT_LOGIC",
            situation: situation.title,
            activity: `${roundLabel} step ${step}: "${record.instruction}"`,
            screenshot: shot,
            whatHappens: `Correct answer "${record.correctAnswerRevealed}" isn't fully assembleable from the shown word bank ${JSON.stringify(record.wordBank)} (missing: ${missing.join(", ")}).`,
            whyProblem:
              "A learner physically cannot construct the expected phrase from the tokens offered — the target answer is unreachable regardless of understanding.",
            expectedBehavior:
              "Every word in the target answer (or an equivalent joinable token) should be present in the word bank offered for that exact activity.",
          });
        }
      }

      const nextBtn = page.locator(".btn", { hasText: "Дальше" });
      if ((await nextBtn.count()) > 0) {
        await nextBtn.click();
        await waitForFreshActivity(page);
      }
      if (/\/result\//.test(page.url())) break;
    }

    await waitForScreen(page, `${situation.id}-${roundLabel}-result`, page.locator(".hero-screen"), {
      urlPattern: /\/result\//,
      timeout: 15_000,
    });
    const resultShot = await shoot(page, `${situation.id}-${roundLabel}-result.png`);
    await checkLayout(page, situation.title, `${roundLabel} result`, resultShot);

    const isMissionResult = (await page.locator(".can-list").count()) > 0;
    const isFailedMission = (await page.locator("text=Ещё пара заходов").count()) > 0;

    if (isMission) {
      if (isMissionResult) {
        missionPassed = true;
        const capability = (await page.locator(".can-list__text").allInnerTexts()).join("; ");
        report({
          category: "STATE_LOGIC",
          situation: situation.title,
          activity: `Mission attempt ${missionAttempt} (informed pass)`,
          screenshot: resultShot,
          whatHappens: `Mission passed on attempt ${missionAttempt}. Capability text: "${capability}".`,
          whyProblem: "(informational — not a bug) Confirms the success result screen and scoring for this situation.",
          expectedBehavior: "N/A — recorded for the report's Mission section, not a defect.",
        });
      } else if (isFailedMission) {
        if (missionAttempt === 1) {
          report({
            category: "STATE_LOGIC",
            situation: situation.title,
            activity: "Mission attempt 1 (deliberate fail)",
            screenshot: resultShot,
            whatHappens: 'Mission failed as expected on a deliberately-wrong attempt — failure result screen shown ("Ещё пара заходов — и миссия получится").',
            whyProblem: "(informational — not a bug) Confirms the failure result screen renders for this situation.",
            expectedBehavior: "N/A — recorded for the report's Mission section, not a defect.",
          });
        }
        if (missionAttempt >= 3) {
          report({
            category: "BLOCKER",
            situation: situation.title,
            activity: `Mission attempt ${missionAttempt}`,
            screenshot: resultShot,
            whatHappens: `Mission still failed after ${missionAttempt} attempts, including informed attempts using answers revealed on the first (deliberate-fail) try.`,
            whyProblem: "Either the mission's answer-matching is stricter than the revealed correct-answer text, or scoring/threshold behaves unexpectedly — this situation's mission could not be verified as passable within this audit.",
            expectedBehavior: "A learner answering with the exact text the app itself revealed as correct should pass the mission.",
          });
          break;
        }
        const backBtn = page.locator(".btn.btn-ghost", { hasText: "К ситуации" });
        if ((await backBtn.count()) === 0) {
          report({
            category: "BLOCKER",
            situation: situation.title,
            activity: `Mission attempt ${missionAttempt}`,
            screenshot: resultShot,
            whatHappens: 'No "К ситуации" retry button found on the failed-mission screen.',
            whyProblem: "Cannot retry the mission to test the pass path.",
            expectedBehavior: 'A retry affordance ("К ситуации") should be present on mission failure.',
          });
          break;
        }
        await backBtn.click();
        await waitForScreen(page, `${situation.id}-preview-retry`, page.locator(".preview-screen"), {
          urlPattern: /\/course\/[^/]+$/,
        });
        await clickByText(page, /Продолжить|Начать/);
        await waitForScreen(page, `${situation.id}-session-retry`, page.locator(".scene"), {
          urlPattern: /\/session$/,
        });
      } else {
        report({
          category: "BLOCKER",
          situation: situation.title,
          activity: `Mission attempt ${missionAttempt}`,
          screenshot: resultShot,
          whatHappens: "Mission result screen matched neither the success (.can-list) nor known failure copy pattern.",
          whyProblem: "Cannot classify the mission outcome — script cannot safely continue this situation.",
          expectedBehavior: "Mission result should be unambiguously a pass or a fail.",
        });
        break;
      }
    } else {
      const backToSituation = page.locator(".btn.btn-ghost", { hasText: "К ситуации" });
      if ((await backToSituation.count()) === 0) break;
      await backToSituation.click();
      await waitForScreen(page, `${situation.id}-preview-r${round}`, page.locator(".preview-screen"), {
        urlPattern: /\/course\/[^/]+$/,
      });
      await clickByText(page, /Продолжить|Начать/);
      await waitForScreen(page, `${situation.id}-session-r${round + 1}`, page.locator(".scene"), {
        urlPattern: /\/session$/,
      });
    }
  }

  if (!missionPassed) {
    report({
      category: "BLOCKER",
      situation: situation.title,
      activity: "Mission",
      screenshot: null,
      whatHappens: `Never reached a passed Mission result within ${MAX_ROUNDS} rounds.`,
      whyProblem: "Cannot fully audit this situation's Mission, and (if this blocks progression) cannot reach the next situation.",
      expectedBehavior: "Mission should be reachable and passable within a reasonable number of rounds/attempts.",
    });
  }

  return missionPassed;
}

// ---------------------------------------------------------------------
// Bootstrap: identical flow to qa/run-authenticated.ts through
// Placement -> Today -> Course arrival. See that file for the full
// root-cause history of every step below.
// ---------------------------------------------------------------------
async function bootstrap(page: Page) {
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: "networkidle" });
  await waitForSessionCookie(page);
  await page.reload({ waitUntil: "networkidle" });
  await waitForSessionCookie(page);
  await clickByText(page, "Попробовать иначе");
  await waitForScreen(page, "demo", page.locator(".lesson-screen"), { urlPattern: /\/demo$/ });

  for (let i = 0; i < 2; i++) {
    await page.waitForSelector(".task-sheet", { timeout: 10_000 });
    // :not(:disabled) — see qa/audit-a1.ts's captureActivity comment:
    // a just-answered option/token lingers in the DOM, disabled, for a
    // beat before the next one mounts; run 36241526961 crashed exactly
    // here (bootstrap:720 in that build) on a stale disabled button.
    const choice = page.locator(".answer:not(:disabled)").first();
    const bank = page.locator(".word:not(:disabled)").first();
    if ((await choice.count()) > 0) await choice.click();
    else if ((await bank.count()) > 0) await bank.click();
    await clickByText(page, "Ответить");
    await waitForFreshActivity(page);
    await clickByText(page, "Дальше");
    await waitForFreshActivity(page);
  }
  await clickByText(page, "Дальше");
  await waitForScreen(page, "demo-result", page.locator(".transcript"), { urlPattern: /\/demo\/result$/ });
  await clickByText(page, "Продолжить");
  await waitForScreen(page, "onboarding-companion", page.locator(".pick-screen"), {
    urlPattern: /\/onboarding\/companion$/,
  });

  await clickByText(page, /^Оставить/);
  await waitForScreen(page, "onboarding-goals", page.locator(".goal-grid"), {
    urlPattern: /\/onboarding(\/goals)?$/,
  });
  await page.locator(".goal-chip").first().click();
  await clickByText(page, "Дальше");
  await waitForScreen(
    page,
    "onboarding-level",
    page.locator(".task-sheet__title", { hasText: "Как сейчас с английским?" }),
    { urlPattern: /\/onboarding\/level$/ },
  );
  await page.locator(".answer:not(:disabled)", { hasText: "A1" }).click();
  await clickByText(page, "Дальше");
  await waitForScreen(
    page,
    "onboarding-time",
    page.locator(".task-sheet__title", { hasText: "Сколько минут в день?" }),
    { urlPattern: /\/onboarding\/time$/ },
  );
  await page.locator(".answer:not(:disabled)").first().click();
  await clickByText(page, "Дальше");
  await waitForScreen(page, "onboarding-ready", page.locator("text=Всё готово"), {
    urlPattern: /\/onboarding\/ready$/,
  });
  await clickByText(page, "Пройти тест");
  await waitForScreen(page, "placement-intro", page.locator(".btn", { hasText: "Начать тест" }), {
    urlPattern: /\/placement$/,
  });

  const startBtn = page.locator(".btn", { hasText: "Начать тест" });
  if ((await startBtn.count()) > 0) await startBtn.click();
  for (let i = 0; i < 40; i++) {
    if (/\/placement\/result\//.test(page.url())) break;
    await page.waitForSelector(".task-sheet, .answer-input", { timeout: 15_000 });
    const options = page.locator(".answer:not(:disabled)");
    const input = page.locator(".answer-input");
    if ((await options.count()) > 0) await options.first().click();
    else if ((await input.count()) > 0) await input.fill("placeholder");
    await clickByText(page, "Ответить");
    await waitForFreshActivity(page, 4_000);
    if (/\/placement\/result\//.test(page.url())) break;
  }
  await waitForScreen(page, "placement-result", page.locator("text=Твой уровень"), {
    urlPattern: /\/placement\/result\//,
  });
  await page.locator(".hero-screen__actions .btn").first().click();
  await page.waitForLoadState("networkidle");
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

  // Same fix as qa/run-authenticated.ts: block the real Telegram SDK
  // script so window.Telegram never gets defined in this plain browser,
  // letting the app's existing dev-mock fallback activate correctly.
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
  page.on("pageerror", (err) => console.error(`[browser:pageerror] ${err.message}`));

  try {
    await bootstrap(page);
    console.log("bootstrap complete — reached Today/Course as an onboarded user");

    for (const situation of SITUATIONS) {
      console.log(`\n=== ${situation.id} — ${situation.title} ===`);
      try {
        const passed = await runSituation(page, situation);
        console.log(`--- ${situation.id}: mission ${passed ? "PASSED" : "NOT PASSED"} ---`);
      } catch (err) {
        console.error(`Situation ${situation.id} aborted:`, err);
        try {
          await page.screenshot({ path: path.join(OUT_DIR, `CRASH-${situation.id}.png`) });
        } catch {
          /* best effort */
        }
        report({
          category: "BLOCKER",
          situation: situation.title,
          activity: "(situation run)",
          screenshot: null,
          whatHappens: `Script aborted: ${err instanceof Error ? err.message : String(err)}`,
          whyProblem: "Could not complete auditing this situation.",
          expectedBehavior: "N/A — infrastructure/script failure, investigate before trusting this situation's results.",
        });
      }
    }
  } finally {
    await browser.close();
    await writeFile(path.join(OUT_DIR, "activities.json"), JSON.stringify(activities, null, 2));
    await writeFile(path.join(OUT_DIR, "findings.json"), JSON.stringify(findings, null, 2));
    console.log(`\n${activities.length} activities recorded, ${findings.length} findings written.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
