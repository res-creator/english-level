import { Hono } from "hono";
import { cors } from "hono/cors";
import { HealthResponseSchema } from "@english-level/contracts";
import { APP_NAME } from "@english-level/shared";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

// Phase 0: permissive CORS so the local Vite dev server can call the API.
// Tighten this once real endpoints carry user data (see CLAUDE.md principle 2).
app.use("*", cors());

const v1 = new Hono<{ Bindings: Env }>();

v1.get("/health", (c) => {
  const body = HealthResponseSchema.parse({ status: "ok" });
  return c.json(body);
});

app.route("/api/v1", v1);

app.get("/", (c) => c.text(`${APP_NAME} API`));

export default app;
