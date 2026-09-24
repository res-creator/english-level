import type { Db } from "../db/types.ts";
import {
  listReminderCandidates,
  type ReminderCandidateRow,
} from "../repositories/usersRepository.ts";
import { updateUserSettings } from "../repositories/userSettingsRepository.ts";
import { countCompletedSessionsBetween } from "../repositories/friendsRepository.ts";
import { hasEventBetween } from "../repositories/analyticsRepository.ts";
import { eventStatement } from "./analyticsService.ts";
import { getToday } from "./todayService.ts";

/**
 * The daily "come back" nudge.
 *
 * Deliberately not personalized by timezone: nothing in the product
 * collects a learner's timezone today (`users.timezone` exists in the
 * schema but nothing writes it), so a per-user local-hour scheduler would
 * be fiction dressed as precision. One fixed UTC hour, set in
 * `wrangler.toml`'s `[env.*.triggers]`, is the honest version of this
 * for a pilot whose testers are assumed to be roughly co-located. Real
 * per-timezone scheduling is real future work, not something to fake now.
 *
 * A reminder is sent at most once per calendar day per learner (UTC day,
 * same caveat), and never sent to someone who already has something
 * finished today — the point is to invite someone back, not to nag
 * someone already there.
 */

export interface TelegramSendResult {
  ok: boolean;
  /** The bot was blocked, or the chat otherwise can't be messaged — a
   * permanent condition, not a transient failure worth retrying. */
  blocked: boolean;
}

export interface TelegramSender {
  send(
    chatId: number,
    text: string,
    webAppUrl: string,
    /** Defaults to "Открыть" — the reminder's own label. The /start
     * reply (`telegramWebhookService.ts`) sends a longer one instead. */
    buttonLabel?: string,
  ): Promise<TelegramSendResult>;
}

/** The real sender, talking to the Bot API. Kept separate from the
 * selection/message logic below so that logic can be unit tested without
 * a network call — see `test/notificationService.test.ts`. */
export function createTelegramSender(botToken: string): TelegramSender {
  return {
    async send(chatId, text, webAppUrl, buttonLabel = "Открыть") {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: {
              inline_keyboard: [
                [{ text: buttonLabel, web_app: { url: webAppUrl } }],
              ],
            },
          }),
        },
      );
      if (res.ok) return { ok: true, blocked: false };
      // 403 here means the person blocked the bot or never started a
      // chat with it — permanent for our purposes, not a glitch to
      // retry tomorrow.
      return { ok: false, blocked: res.status === 403 };
    },
  };
}

/** One line, in the learner's own words for what's waiting — never a
 * generic "come back", because a specific reason is the only kind of
 * reminder that isn't just noise. Returns null when there's genuinely
 * nothing to invite them back to. */
export function buildReminderText(
  today: Awaited<ReturnType<typeof getToday>>,
): string | null {
  const episode = today.episode;
  switch (today.action) {
    case "session":
      return episode
        ? `Сегодняшняя ситуация — «${episode.situationTitle ?? episode.title}». Пять минут, и она твоя.`
        : null;
    case "mission":
      return episode
        ? `«${episode.situationTitle ?? episode.title}» ждёт миссии — последний шаг, чтобы сказать «я могу».`
        : null;
    case "review":
      return today.reviewDue > 0
        ? `${today.reviewDue} ${today.reviewDue === 1 ? "фраза ждёт" : "фраз ждут"} повторения — минута, чтобы они остались с тобой.`
        : null;
    case "none":
      return null;
    // Nudging someone back to content that doesn't exist for their level
    // would be exactly the kind of noise this function exists to avoid.
    case "unavailable":
      return null;
  }
}

/** UTC calendar-day boundaries for `now` — see the module note on why
 * this is UTC, not the learner's own day. */
function utcDayBounds(now: Date): { start: string; end: string } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start.getTime() + 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export interface ReminderRunSummary {
  candidates: number;
  sent: number;
  alreadyActiveToday: number;
  alreadyRemindedToday: number;
  nothingToOffer: number;
  blocked: number;
}

/**
 * One full pass: every opted-in, onboarded learner, filtered down to the
 * ones actually worth messaging today, each sent at most one message.
 * Safe to call more than once in the same day — everyone it already
 * reached is skipped the second time, not re-sent to.
 */
export async function runDailyReminders(
  db: Db,
  sender: TelegramSender,
  webAppUrl: string,
  now: Date = new Date(),
): Promise<ReminderRunSummary> {
  const { start, end } = utcDayBounds(now);
  const candidates = await listReminderCandidates(db);

  const summary: ReminderRunSummary = {
    candidates: candidates.length,
    sent: 0,
    alreadyActiveToday: 0,
    alreadyRemindedToday: 0,
    nothingToOffer: 0,
    blocked: 0,
  };

  for (const candidate of candidates) {
    if (await hasEventBetween(db, candidate.id, "reminder_sent", start, end)) {
      summary.alreadyRemindedToday += 1;
      continue;
    }

    const doneToday = await countCompletedSessionsBetween(
      db,
      candidate.id,
      start,
      end,
    );
    if ((doneToday?.n ?? 0) > 0) {
      summary.alreadyActiveToday += 1;
      continue;
    }

    const text = await messageFor(db, candidate);
    if (!text) {
      summary.nothingToOffer += 1;
      continue;
    }

    const result = await sender.send(
      candidate.telegram_user_id,
      text,
      webAppUrl,
    );
    if (result.ok) {
      await db.batch([
        eventStatement(
          "reminder_sent",
          { userId: candidate.id },
          now.toISOString(),
        ),
      ]);
      summary.sent += 1;
    } else if (result.blocked) {
      // A permanent condition — stop trying every day for someone who
      // can't be reached, rather than quietly failing forever.
      await updateUserSettings(db, candidate.id, {
        dailyReminderEnabled: false,
      });
      summary.blocked += 1;
    }
    // A non-blocked failure (network hiccup, Telegram briefly down) is
    // simply not counted as sent — tomorrow's run picks it up again.
  }

  return summary;
}

async function messageFor(
  db: Db,
  candidate: ReminderCandidateRow,
): Promise<string | null> {
  const today = await getToday(db, candidate.id, candidate.current_cefr_level);
  return buildReminderText(today);
}
