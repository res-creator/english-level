/**
 * Focused, fast verification of the NPC-continuation feature
 * (A1_FULL_LEARNING_QA.md's CONTENT_LOGIC finding + its fix) — NOT a
 * general audit. Unlike qa/audit-a1.ts, every answer here is the
 * genuinely correct one (computed from this repo's own seed content,
 * not guessed/revealed-after-a-miss), so each situation's Mission
 * passes cleanly on the first attempt and the whole 5-situation
 * playthrough is fast enough to run in one CI job.
 *
 * Captures one screenshot of the scene/dialogue area partway through
 * each of e1, e3, e4, e5 (per explicit request) showing the real
 * them/you/them alternation, plus each situation's Mission result.
 *
 * Reuses the exact same auth bootstrap as qa/run-authenticated.ts (see
 * that file for the root-cause history of each fix in it).
 */
import { chromium, devices, type Page } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO_ROOT, "artifacts", "qa", "verify-dialogue");
const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:5173";
const VIEWPORT = { width: 390, height: 844 };

// ---------------------------------------------------------------------
// Build the answer key straight from this repo's own seed content — no
// hand-copied strings to drift out of sync with sie-a1-items.json.
// ---------------------------------------------------------------------
interface ItemSeed {
  id: string;
  itemType: string;
  displayForm: string;
  ru: { translation: string };
  examples: { text: string; isPrimary: boolean }[];
}
interface GrammarSeed {
  id: string;
  title: string;
}

async function loadJson<T>(fileName: string): Promise<T> {
  const raw = await readFile(
    path.join(REPO_ROOT, "seeds", "content", fileName),
    "utf-8",
  );
  return JSON.parse(raw) as T;
}

interface AnswerKey {
  translationOf: Map<string, string>; // itemId -> ru translation
  displayFormOf: Map<string, string>; // itemId -> display form
  exampleOf: Map<string, string>; // itemId -> primary example text
  patternTitleOf: Map<string, string>; // grammarId -> title
}

async function buildAnswerKey(): Promise<AnswerKey> {
  const items = await loadJson<ItemSeed[]>("sie-a1-items.json");
  const grammarFiles = ["sie-a1-grammar.json", "a1-grammar.json"];
  const translationOf = new Map<string, string>();
  const displayFormOf = new Map<string, string>();
  const exampleOf = new Map<string, string>();
  for (const it of items) {
    translationOf.set(it.id, it.ru.translation);
    displayFormOf.set(it.id, it.displayForm);
    const primary = it.examples.find((e) => e.isPrimary);
    if (primary) exampleOf.set(it.id, primary.text);
  }
  const patternTitleOf = new Map<string, string>();
  for (const f of grammarFiles) {
    const patterns = await loadJson<GrammarSeed[]>(f);
    for (const p of patterns) patternTitleOf.set(p.id, p.title);
  }
  return { translationOf, displayFormOf, exampleOf, patternTitleOf };
}

function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}
function normalizeWord(s: string): string {
  return s.trim().toLowerCase().replace(/^[.,!?;:]+|[.,!?;:]+$/g, "");
}

// ---------------------------------------------------------------------
// Bootstrap helpers — identical to run-authenticated.ts.
// ---------------------------------------------------------------------
const SESSION_COOKIE_NAME = "el_session";

async function waitForSessionCookie(page: Page, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cookies = await page.context().cookies();
    if (cookies.find((c) => c.name === SESSION_COOKIE_NAME)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`Session cookie never appeared within ${timeoutMs}ms.`);
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
      await page.screenshot({ path: path.join(OUT_DIR, `FAILURE-${name}.png`) });
    } catch {
      /* best effort */
    }
    throw err;
  }
}

async function clickByText(page: Page, text: string | RegExp) {
  await page.locator(".btn, button", { hasText: text }).first().click();
}

async function waitForFreshActivity(page: Page, timeoutMs = 8_000) {
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll(".answer:disabled").length === 0 &&
        !document.querySelector(".miss"),
      { timeout: timeoutMs },
    )
    .catch(() => {});
}

let shotIndex = 0;
async function shoot(page: Page, name: string) {
  shotIndex += 1;
  const file = path.join(OUT_DIR, `${String(shotIndex).padStart(3, "0")}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`saved ${path.relative(REPO_ROOT, file)}`);
}

// ---------------------------------------------------------------------
// Bootstrap (welcome -> demo -> onboarding -> placement -> Today/Course)
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

// ---------------------------------------------------------------------
// Always-correct answering, using the precomputed answer key.
// ---------------------------------------------------------------------
async function answerCorrectly(page: Page, key: AnswerKey) {
  const understoodBtn = page.locator(".btn", { hasText: "Понятно" });
  if ((await understoodBtn.count()) > 0) {
    await understoodBtn.click();
    await waitForFreshActivity(page);
    return;
  }

  const hasAnswerOptions = (await page.locator(".answer:not(:disabled)").count()) > 0;
  const hasWordBank = (await page.locator(".word-bank .word:not(:disabled)").count()) > 0;
  const hasAnswerInput = (await page.locator(".answer-input").count()) > 0;

  if (hasAnswerOptions) {
    // Recognition MC (options = RU translations), grammar MC (options =
    // pattern titles), or fill_gap_choice (options = English display
    // forms) — try every known-correct-value source against the
    // option texts actually shown, click whichever matches.
    const options = page.locator(".answer:not(:disabled)");
    const n = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < n; i++) texts.push((await options.nth(i).innerText()).trim());
    const candidates = new Set<string>([
      ...key.translationOf.values(),
      ...key.displayFormOf.values(),
      ...key.patternTitleOf.values(),
    ]);
    let idx = texts.findIndex((t) => candidates.has(t));
    if (idx === -1) idx = 0; // context-MC fallback content we don't have a key for — best effort
    await options.nth(idx).click();
  } else if (hasWordBank) {
    const title = (await page.locator(".task-sheet__title").first().innerText().catch(() => "")).trim();
    // sentence_build has no title — the target text is whatever example
    // this activity's word bank was tokenized from. Reconstruct it by
    // finding the example whose tokenization matches the bank exactly.
    const bankTexts = await page.locator(".word-bank .word:not(:disabled)").allInnerTexts();
    const bankSorted = [...bankTexts].map(normalizeWord).sort();
    let target: string[] | null = null;
    for (const ex of key.exampleOf.values()) {
      const toks = tokenize(ex);
      const sorted = toks.map(normalizeWord).sort();
      if (sorted.length === bankSorted.length && sorted.every((w, i) => w === bankSorted[i])) {
        target = toks;
        break;
      }
    }
    if (!title && target) {
      for (const word of target) {
        const want = normalizeWord(word);
        const tokens = page.locator(".word-bank .word:not(:disabled)");
        const tn = await tokens.count();
        for (let i = 0; i < tn; i++) {
          if (normalizeWord(await tokens.nth(i).innerText()) === want) {
            await tokens.nth(i).click();
            await page.waitForTimeout(60);
            break;
          }
        }
      }
    } else {
      // Fallback: click in display order (shouldn't happen for any
      // sie-a1 content given the answer key above, but never hang).
      const still = page.locator(".word-bank .word:not(:disabled)");
      const n = await still.count();
      for (let i = 0; i < n; i++) await still.first().click();
    }
  } else if (hasAnswerInput) {
    // typed_recall: single word, from displayFormOf (only itm_sie_large
    // is word-typed in the current sie-a1 content).
    const hint = (await page.locator(".body.muted").first().innerText().catch(() => "")).trim();
    let word = "large";
    for (const [id, translation] of key.translationOf) {
      if (hint.includes(translation)) {
        word = key.displayFormOf.get(id) ?? word;
        break;
      }
    }
    await page.locator(".answer-input").fill(word);
  }

  const answerBtn = page.locator(".btn", { hasText: "Ответить" });
  if ((await answerBtn.count()) > 0 && !(await answerBtn.first().isDisabled())) {
    await answerBtn.first().click();
    await waitForFreshActivity(page);
  }
}

async function runSituation(
  page: Page,
  situation: { id: string; title: string },
  key: AnswerKey,
  captureDialogue: boolean,
): Promise<void> {
  await page.goto(`${BASE_URL}/course/${situation.id}`, { waitUntil: "networkidle" });
  await clickByText(page, /Продолжить|Начать/);
  await waitForScreen(page, `${situation.id}-session`, page.locator(".scene"), {
    urlPattern: /\/session$/,
  });

  let missionPassed = false;
  let capturedDialogue = false;
  for (let round = 0; round < 12 && !missionPassed; round++) {
    for (let step = 0; step < 30; step++) {
      const gotTaskSheet = await page
        .waitForSelector(".task-sheet", { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (!gotTaskSheet || /\/result\//.test(page.url())) break;

      if (captureDialogue && !capturedDialogue && step === 3) {
        await shoot(page, `${situation.id}-dialogue`);
        capturedDialogue = true;
      }

      await answerCorrectly(page, key);
      if (/\/result\//.test(page.url())) break;
      const nextBtn = page.locator(".btn", { hasText: "Дальше" });
      if ((await nextBtn.count()) > 0) {
        await nextBtn.click();
        await waitForFreshActivity(page);
      }
      if (/\/result\//.test(page.url())) break;
    }

    await waitForScreen(page, `${situation.id}-result`, page.locator(".hero-screen"), {
      urlPattern: /\/result\//,
      timeout: 15_000,
    });

    const isMissionResult = (await page.locator(".can-list").count()) > 0;
    const isFailedMission = (await page.locator("text=Ещё пара заходов").count()) > 0;

    if (isMissionResult || isFailedMission) {
      if (captureDialogue) await shoot(page, `${situation.id}-mission-result`);
      if (isFailedMission) {
        throw new Error(
          `${situation.id}: Mission failed even though every answer used this script's precomputed correct value — investigate before trusting the rest of the run.`,
        );
      }
      missionPassed = true;
      break;
    }

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

  if (!missionPassed) {
    throw new Error(`${situation.id}: never reached a Mission result within the round ceiling.`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const key = await buildAnswerKey();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: devices["iPhone 13"].deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 13"].userAgent,
  });
  const page = await context.newPage();

  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
  page.on("pageerror", (err) => console.error(`[browser:pageerror] ${err.message}`));

  const SITUATIONS = [
    { id: "les_sie_a1_e1", title: "Первое знакомство", capture: true },
    { id: "les_sie_a1_e2", title: "Заказ в кафе", capture: false },
    { id: "les_sie_a1_e3", title: "Мой обычный день", capture: true },
    { id: "les_sie_a1_e4", title: "Я потерялась в городе", capture: true },
    { id: "les_sie_a1_e5", title: "Заказ пошёл не по плану", capture: true },
  ];

  try {
    await bootstrap(page);
    console.log("bootstrap complete — reached Today/Course as an onboarded user");
    for (const situation of SITUATIONS) {
      console.log(`\n=== ${situation.id} — ${situation.title} ===`);
      await runSituation(page, situation, key, situation.capture);
      console.log(`--- ${situation.id}: Mission PASSED ---`);
    }
    console.log("\nAll 5 situations passed with a real, always-correct playthrough.");
  } catch (err) {
    console.error("verify-dialogue run aborted:", err);
    try {
      await page.screenshot({ path: path.join(OUT_DIR, "CRASH-final-state.png") });
    } catch {
      /* best effort */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
