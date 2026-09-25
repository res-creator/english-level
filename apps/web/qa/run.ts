/**
 * Automated visual + interaction QA for the deployed preview frontend.
 *
 * What this covers right now: everything reachable WITHOUT a real
 * Telegram session — Welcome, the pre-account Demo lesson flow (the
 * only "lesson flow" reachable without auth: dialogue bubbles,
 * word-bank activity, CTA, feedback), and Demo Result. It also visits
 * the four authenticated screens (Today, Course, My English, My
 * Space) to document — deliberately, not as a bug — that they fail
 * closed outside Telegram, per apps/web/src/auth/resolveInitData.ts.
 *
 * It does NOT drive the real curriculum Session/Mission flow or
 * SessionResult (success/failure) — those need a signed Telegram
 * initData, and there is currently no safe way to get one against a
 * deployed preview from this environment (see docs/authentication.md
 * and the QA report this script's run produces). No auth bypass is
 * attempted here; see README.md (in this folder) for what a minimal
 * harness would need.
 *
 * Run: `pnpm --filter @english-level/web run qa` (or `pnpm run qa`
 * from apps/web). Screenshots land in artifacts/qa/ at the repo root.
 */
import { chromium, devices, type Page } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO_ROOT, "artifacts", "qa");

const BASE_URL =
  process.env.QA_BASE_URL ??
  "https://english-level-web-preview.res-creator.workers.dev";

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

async function shoot(page: Page, name: string) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file });
  console.log(`saved ${path.relative(REPO_ROOT, file)}`);
}

/** No CTA hiding behind the viewport edge, no page wider than the
 * device — the two cheapest, most common mobile layout bugs. */
async function checkLayout(page: Page, screen: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflow > 1) {
    report(
      screen,
      "bug",
      `Horizontal overflow: content is ${overflow}px wider than the viewport.`,
    );
  }

  const buttons = page.locator("button:visible, .btn:visible");
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox();
    if (!box) continue;
    if (box.y + box.height > VIEWPORT.height) {
      const label = (
        await buttons
          .nth(i)
          .innerText()
          .catch(() => "")
      )
        .trim()
        .slice(0, 40);
      report(
        screen,
        "note",
        `A button ("${label}") extends past the viewport bottom at rest — may only matter if it's a primary CTA and nothing scrolls it into view.`,
      );
    }
  }
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

  // --- Welcome (public) ----------------------------------------------
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: "networkidle" });
  await shoot(page, "welcome.png");
  await checkLayout(page, "welcome");

  // --- Demo lesson flow (public — the only lesson flow reachable
  //     without a Telegram session) ------------------------------------
  await page.goto(`${BASE_URL}/demo`, { waitUntil: "networkidle" });
  await shoot(page, "lesson-step-01.png");
  await checkLayout(page, "demo-step-1-choice");

  // Regression guard for a fixed bug: the old flat-vector SceneBackdrop
  // (cup/lamp/window sketch) used to render behind the photoreal cast
  // art and visibly clash with it. It's been replaced with a neutral
  // gradient (.scene__backdrop-neutral) — this asserts the illustrated
  // fallback never comes back.
  const codedBackdropVisible = await page
    .locator(".scene svg.scene__backdrop")
    .count();
  if (codedBackdropVisible > 0) {
    report(
      "demo-step-1-choice",
      "bug",
      "The old coded flat-vector SceneBackdrop is rendering again behind the photoreal cast art (regression — this was fixed by replacing it with .scene__backdrop-neutral).",
    );
  }

  // Step 1: a multiple-choice answer. Pick the CORRECT option so the
  // "because" explanation renders (that copy only ever shows for the
  // right answer) and verify NPC/user bubble alternation afterwards.
  const correctOption = page.locator(".answer", {
    hasText: "Здесь или с собой?",
  });
  if ((await correctOption.count()) === 0) {
    report(
      "demo-step-1-choice",
      "bug",
      'Expected answer option "Здесь или с собой?" not found — Demo.tsx content may have changed.',
    );
  } else {
    await correctOption.click();
    await page.locator(".btn", { hasText: "Ответить" }).click();
    await page.waitForTimeout(300);
    await shoot(page, "lesson-step-01-feedback.png");

    const because = page.locator(".answer__because");
    if ((await because.count()) === 0) {
      report(
        "demo-step-1-choice",
        "bug",
        'No "because" explanation rendered after a correct answer.',
      );
    }

    await page.locator(".btn", { hasText: "Дальше" }).click();
  }

  // Step 2: the word-bank ("build") activity — verify the correct
  // token is present and actually clickable, then check the resulting
  // dialogue shows the NPC line first and the user's line second.
  await page.waitForTimeout(300);
  await shoot(page, "lesson-step-02.png");
  await checkLayout(page, "demo-step-2-wordbank");

  const bankWord = page.locator(".word", { hasText: "please." });
  if ((await bankWord.count()) === 0) {
    report(
      "demo-step-2-wordbank",
      "bug",
      "Expected word-bank token \"please.\" not found — the correct answer isn't assembleable from what's shown.",
    );
  } else {
    const disabled = await bankWord
      .first()
      .isDisabled()
      .catch(() => false);
    if (disabled) {
      report(
        "demo-step-2-wordbank",
        "bug",
        "The correct word-bank token is disabled — can't be collected.",
      );
    } else {
      await bankWord.first().click();
      await page.locator(".btn", { hasText: "Ответить" }).click();
      await page.waitForTimeout(300);
      await shoot(page, "lesson-step-02-feedback.png");

      const bubbles = page.locator(".bubble");
      const bubbleCount = await bubbles.count();
      const order: string[] = [];
      for (let i = 0; i < bubbleCount; i++) {
        const cls = await bubbles.nth(i).getAttribute("class");
        order.push(cls?.includes("bubble--you") ? "you" : "them");
      }
      // The scene keeps the last 3 turns, newest last — "them" (the
      // opening line) should still precede "you" (the learner's
      // answer) in that order.
      const themIdx = order.indexOf("them");
      const youIdx = order.indexOf("you");
      if (themIdx === -1 || youIdx === -1 || themIdx > youIdx) {
        report(
          "demo-step-2-wordbank",
          "bug",
          `Dialogue bubble order looks wrong: ${JSON.stringify(order)} (expected an NPC line before the user's line).`,
        );
      }

      await page.locator(".btn", { hasText: "Дальше" }).click();
    }
  }

  // Demo's own "done" screen, then the result screen.
  await page.waitForTimeout(300);
  await shoot(page, "lesson-step-03-done.png");
  const doneNext = page.locator(".btn", { hasText: "Дальше" });
  if ((await doneNext.count()) > 0) {
    await doneNext.click();
    await page.waitForLoadState("networkidle");
  } else {
    await page.goto(`${BASE_URL}/demo/result`, { waitUntil: "networkidle" });
  }
  await shoot(page, "mission-result.png");
  await checkLayout(page, "demo-result");
  report(
    "mission-result",
    "note",
    "This is Demo Result (the pre-account 48-second demo), not the real curriculum SessionResult — success/failure states of an actual Mission need an authenticated session and weren't reachable this run.",
  );

  // --- Authenticated screens ------------------------------------------
  // Today/Course/My English/My Space are NOT wrapped in
  // <RequireAuthenticated> in App.tsx (only /review, onboarding,
  // placement, Session and SessionResult are) — Layout renders them
  // directly, so visiting them outside Telegram doesn't hit the root
  // "Открой приложение через Telegram" gate (that only lives in
  // RootRedirect, at "/"). Each screen instead makes its own API call,
  // which 401s, and renders its own generic ErrorState ("Не удалось
  // открыть...", "Проверь связь и попробуй ещё раз.") — functionally
  // fails closed (no data leaks, nothing renders), but the message
  // doesn't distinguish "you're not signed in" from "the network is
  // down", which is worth a human look even though it's not a security
  // problem.
  const authedRoutes: Array<[string, string]> = [
    ["/today", "today"],
    ["/course", "course"],
    ["/my", "my-english"],
    ["/my/space", "my-space"],
  ];
  for (const [route, name] of authedRoutes) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await shoot(page, `${name}-unauthenticated.png`);
    const errorPill = page.locator("text=Ошибка");
    if ((await errorPill.count()) > 0) {
      report(
        name,
        "note",
        'Fails closed outside Telegram (no data renders) but via each screen\'s own generic network-error state, not an auth-specific message — a real user opening this link outside Telegram would see "Проверь связь" and not understand they need Telegram.',
      );
    } else {
      report(
        name,
        "bug",
        "Expected either the generic ErrorState or the root auth gate, found neither — investigate what actually rendered.",
      );
    }
  }

  await browser.close();

  await writeFile(
    path.join(OUT_DIR, "findings.json"),
    JSON.stringify(findings, null, 2),
  );
  console.log(
    `\n${findings.length} findings written to artifacts/qa/findings.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
