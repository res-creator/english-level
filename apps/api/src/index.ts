import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  HealthResponseSchema,
  MeResponseSchema,
} from "@english-level/contracts";
import { APP_NAME } from "@english-level/shared";
import type { AppEnv } from "./types/appEnv.ts";
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

const app = new Hono<AppEnv>();

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

app.route("/api/v1", v1);

app.get("/", (c) => c.text(`${APP_NAME} API`));

export default app;
