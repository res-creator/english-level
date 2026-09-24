import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  HealthResponseSchema,
  MeResponseSchema,
} from "@english-level/contracts";
import { APP_NAME } from "@english-level/shared";
import type { AppEnv } from "./types/appEnv.ts";
import type { Env } from "./env.ts";
import { createD1Db } from "./db/d1Adapter.ts";
import {
  createTelegramSender,
  runDailyReminders,
  type ReminderRunSummary,
} from "./services/notificationService.ts";
import { reportError } from "./services/errorReportingService.ts";
import { isPreviewEnvironment } from "./previewMode.ts";
import authRoutes from "./routes/auth.ts";
import onboardingRoutes from "./routes/onboarding.ts";
import placementRoutes from "./routes/placement.ts";
import curriculumRoutes from "./routes/curriculum.ts";
import lessonSessionRoutes from "./routes/lessonSessions.ts";
import reviewRoutes from "./routes/review.ts";
import eventRoutes from "./routes/events.ts";
import meRoutes from "./routes/me.ts";
import { requireAuth } from "./auth/middleware.ts";
import { toPublicUser } from "./dto/userDto.ts";

// Named, not just default-exported: the default export below has to be
// `{ fetch, scheduled }` for the Workers runtime, which no longer has
// Hono's own `.request()` test helper on it. `routingAuth.test.ts` needs
// the real Hono instance to call that directly, so it imports this name
// instead of the default.
export const app = new Hono<AppEnv>();

/** No `ALLOWED_ORIGINS` configured (local dev, see `.dev.vars`/`wrangler.toml`
 * `[vars]`) falls back to the local Vite dev server. Deployed environments
 * always set this explicitly — see `wrangler.toml`'s `[env.*.vars]` and
 * docs/deployment.md. */
function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return ["http://localhost:5173"];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Phase 2: auth uses cookies, so CORS must name explicit origins and allow
// credentials — `origin: "*"` is rejected by browsers for credentialed
// requests. The origin callback reads `c.env` per-request (env bindings
// aren't available at module scope in Workers), so the same build works
// unmodified across local/preview/production — only `ALLOWED_ORIGINS`
// changes per environment.
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
      return allowed.includes(origin) ? origin : undefined;
    },
    credentials: true,
  }),
);

const v1 = new Hono<AppEnv>();

v1.get("/health", (c) => {
  const body = HealthResponseSchema.parse({ status: "ok" });
  return c.json(body);
});

v1.route("/auth", authRoutes);
v1.route("/onboarding", onboardingRoutes);
v1.route("/placement", placementRoutes);
// Curriculum routes are top-level (/path, /modules/:id, /lessons/:id),
// not nested under a shared prefix — see docs/curriculum.md.
v1.route("/", curriculumRoutes);
// Lesson execution (Phase 6): /lessons/:id/start, /sessions/:id[/answer] —
// also top-level, alongside the read-only curriculum routes above. See
// docs/lesson-engine.md.
v1.route("/", lessonSessionRoutes);
// Spaced review spans episodes, so it has its own prefix rather than
// hanging off a lesson.
v1.route("/review", reviewRoutes);
// Everything the learner owns: capabilities, the companion's space, and
// the single friend connection.
v1.route("/my", meRoutes);
// Pilot analytics: not auth-gated, since the hook and the demo run
// before an account exists. See routes/events.ts.
v1.route("/events", eventRoutes);

v1.get("/me", requireAuth, (c) => {
  const body = MeResponseSchema.parse(toPublicUser(c.get("currentUser")));
  return c.json(body);
});

/**
 * Preview-only: fires the exact same reminder run the daily cron does,
 * on demand. Exists purely because `wrangler dev`/`--test-scheduled`
 * cannot run on the maintainer's machine (an unrelated macOS/workerd
 * version limitation, not a product constraint), so this is the one
 * reliable way to test delivery against a real preview deployment
 * without waiting for the schedule. Gated exactly like `/my/reset`:
 * outside preview it's a 404, not a 403, so it doesn't even announce
 * its own existence — and a body confirmation literal means no stray
 * or replayed POST can fire it by accident.
 */
v1.post("/debug/run-reminders", async (c) => {
  if (!isPreviewEnvironment(c.env)) {
    return c.json({ error: "not found" }, 404);
  }
  const body = await c.req.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    (body as { confirm?: unknown }).confirm !== "ЗАПУСТИТЬ"
  ) {
    return c.json({ error: "confirmation required" }, 400);
  }
  const summary = await runReminderPass(c.env);
  return c.json({ ok: true, summary });
});

app.route("/api/v1", v1);

app.get("/", (c) => c.text(`${APP_NAME} API`));

/**
 * The entire error-monitoring story for the pilot: no third-party
 * service, just this. Every exception a route handler throws (a bad
 * query, a bug in a service, anything not already turned into a proper
 * `c.json({ error }, code)` response) lands here instead of Hono's own
 * bare 500. It's recorded — never re-thrown, never left only in the
 * console where it's gone the moment nobody is tailing logs — and the
 * caller gets a safe, generic body. The real message and stack are for
 * `wrangler d1 execute ... SELECT * FROM error_logs`, never for the
 * response: a stack trace is exactly the kind of internal detail this
 * project's DTOs already take care never to leak.
 */
app.onError(async (err, c) => {
  const db = createD1Db(c.env.DB);
  let userId: string | null = null;
  try {
    userId = c.get("currentUser")?.id ?? null;
  } catch {
    // `requireAuth` never ran for this request — fine, it just means we
    // don't know who hit it.
  }
  await reportError(db, c.req.method, c.req.path, userId, err);
  return c.json({ error: "internal error" }, 500);
});

/**
 * Wires real bindings to `runDailyReminders` and makes sure a failure is
 * visible instead of silently eaten. Shared by the cron entry point
 * below and by `/debug/run-reminders` — both must behave identically,
 * since the whole point of that route is testing what the cron will do.
 */
async function runReminderPass(env: Env): Promise<ReminderRunSummary> {
  const db = createD1Db(env.DB);
  const sender = createTelegramSender(env.TELEGRAM_BOT_TOKEN);
  const webAppUrl =
    env.WEB_APP_URL ?? parseAllowedOrigins(env.ALLOWED_ORIGINS)[0] ?? "";
  try {
    const summary = await runDailyReminders(db, sender, webAppUrl);
    console.log(`[reminders] ${JSON.stringify(summary)}`);
    return summary;
  } catch (err) {
    // No caller to report to from the cron path — the error_logs row
    // (same store `app.onError` writes to) is the only visibility a
    // failed run gets, so it must not disappear into the console alone.
    await reportError(db, "cron", "reminders", null, err);
    throw err;
  }
}

/**
 * The daily reminder's cron entry point (`[env.*.triggers]` in
 * wrangler.toml). See `services/notificationService.ts` for what it
 * actually decides and sends.
 */
async function scheduled(
  _event: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  ctx.waitUntil(runReminderPass(env));
}

export default {
  fetch: app.fetch,
  scheduled,
};
