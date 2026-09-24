import { Hono } from "hono";
import { createTelegramSender } from "../services/notificationService.ts";
import {
  handleTelegramUpdate,
  type TelegramUpdate,
} from "../services/telegramWebhookService.ts";
import type { AppEnv } from "../types/appEnv.ts";

const telegram = new Hono<AppEnv>();

/**
 * Receives every update Telegram delivers once `setWebhook` is
 * registered (a one-time, manual step against the real bot — see
 * `docs/deployment.md`). Not gated by `requireAuth`: Telegram itself
 * is the caller, there is no learner session yet.
 *
 * `X-Telegram-Bot-Api-Secret-Token` is the only thing standing between
 * this URL and anyone on the internet who finds it and starts sending
 * fake updates — Telegram includes the exact value `setWebhook` was
 * registered with on every real delivery.
 */
telegram.post("/webhook", async (c) => {
  const expected = c.env.TELEGRAM_WEBHOOK_SECRET;
  const provided = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (!expected || provided !== expected) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const update = (await c.req
    .json()
    .catch(() => null)) as TelegramUpdate | null;
  if (update) {
    const sender = createTelegramSender(c.env.TELEGRAM_BOT_TOKEN);
    await handleTelegramUpdate(update, sender, c.env.WEB_APP_URL ?? "");
  }
  // Telegram only cares about a 2xx; a malformed body is simply nothing
  // to act on, never an error worth it retrying delivery for.
  return c.json({ ok: true });
});

export default telegram;
