import test from "node:test";
import assert from "node:assert/strict";
import type {
  TelegramSendResult,
  TelegramSender,
} from "../src/services/notificationService.ts";
import {
  handleTelegramUpdate,
  START_BUTTON_LABEL,
  START_MESSAGE,
} from "../src/services/telegramWebhookService.ts";

const WEB_APP_URL = "https://example.workers.dev";

/** Records every call so a test can assert who was messaged, mirroring
 * `test/notificationService.test.ts`'s own fake sender. */
function fakeSender() {
  const calls: {
    chatId: number;
    text: string;
    webAppUrl: string;
    buttonLabel?: string;
  }[] = [];
  const sender: TelegramSender = {
    async send(chatId, text, webAppUrl, buttonLabel) {
      calls.push({ chatId, text, webAppUrl, buttonLabel });
      return { ok: true, blocked: false } as TelegramSendResult;
    },
  };
  return { sender, calls };
}

test("/start gets the welcome message with its own button label", async () => {
  const { sender, calls } = fakeSender();
  await handleTelegramUpdate(
    { message: { chat: { id: 555 }, text: "/start" } },
    sender,
    WEB_APP_URL,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.chatId, 555);
  assert.equal(calls[0]?.text, START_MESSAGE);
  assert.equal(calls[0]?.webAppUrl, WEB_APP_URL);
  assert.equal(calls[0]?.buttonLabel, START_BUTTON_LABEL);
});

test("/start with a deep-link payload still counts as a start", async () => {
  const { sender, calls } = fakeSender();
  await handleTelegramUpdate(
    { message: { chat: { id: 556 }, text: "/start ref_abc123" } },
    sender,
    WEB_APP_URL,
  );
  assert.equal(calls.length, 1);
});

test("anything that isn't /start is silently ignored", async () => {
  const { sender, calls } = fakeSender();
  await handleTelegramUpdate(
    { message: { chat: { id: 557 }, text: "hello" } },
    sender,
    WEB_APP_URL,
  );
  await handleTelegramUpdate(
    { message: { chat: { id: 558 }, text: "/started" } },
    sender,
    WEB_APP_URL,
  );
  assert.equal(calls.length, 0);
});

test("an update with no message (e.g. an edited_message) never crashes or sends", async () => {
  const { sender, calls } = fakeSender();
  await handleTelegramUpdate({}, sender, WEB_APP_URL);
  assert.equal(calls.length, 0);
});

test("a message with no chat is safely ignored", async () => {
  const { sender, calls } = fakeSender();
  await handleTelegramUpdate(
    { message: { text: "/start" } },
    sender,
    WEB_APP_URL,
  );
  assert.equal(calls.length, 0);
});
