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
import { requireAuth } from "./auth/middleware.ts";
import { toPublicUser } from "./dto/userDto.ts";

const app = new Hono<AppEnv>();

// Phase 2: auth uses cookies, so CORS must name explicit origins and allow
// credentials — `origin: "*"` is rejected by browsers for credentialed
// requests. Add the deployed Mini App origin here once it exists.
const ALLOWED_ORIGINS = ["http://localhost:5173"];
app.use("*", cors({ origin: ALLOWED_ORIGINS, credentials: true }));

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

v1.get("/me", requireAuth, (c) => {
  const body = MeResponseSchema.parse(toPublicUser(c.get("currentUser")));
  return c.json(body);
});

app.route("/api/v1", v1);

app.get("/", (c) => c.text(`${APP_NAME} API`));

export default app;
