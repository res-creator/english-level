import type { TelegramSender } from "./notificationService.ts";

/**
 * The bot's only command right now: `/start`. This is deliberately not a
 * general command handler — everything else Telegram sends this webhook
 * (edited messages, other text, stickers) is silently ignored. Adding
 * more commands later means adding more branches here, not touching the
 * route that receives them.
 */
export interface TelegramUpdate {
  message?: {
    chat?: { id: number };
    text?: string;
  };
}

export const START_MESSAGE = `Привет! Я — Speak in English.

Здесь английский учится через живые ситуации, а не зубрёжку: кафе, знакомство, дорога в незнакомом городе.

Начни с первой ситуации прямо сейчас.`;

export const START_BUTTON_LABEL = "Открыть Speak in English";

/** `/start` and `/start <payload>` (Telegram appends a deep-link payload
 * with a space) both count — anything else is not a start. */
function isStartCommand(text: string | undefined): boolean {
  return text === "/start" || (text?.startsWith("/start ") ?? false);
}

export async function handleTelegramUpdate(
  update: TelegramUpdate,
  sender: TelegramSender,
  webAppUrl: string,
): Promise<void> {
  const chatId = update.message?.chat?.id;
  if (!chatId || !isStartCommand(update.message?.text)) return;
  await sender.send(chatId, START_MESSAGE, webAppUrl, START_BUTTON_LABEL);
}
