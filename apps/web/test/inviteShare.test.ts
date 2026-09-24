import test from "node:test";
import assert from "node:assert/strict";
import {
  INVITE_SHARE_TEXT,
  buildInviteShareUrl,
  buildTelegramShareLink,
} from "../src/friend/inviteShare.ts";

test("the invite text names the product and reads like an invitation, not a code dump", () => {
  assert.match(INVITE_SHARE_TEXT, /Speak in English/);
});

test("the share URL is the app's own origin with the code attached", () => {
  // Backend-generated codes (friendService.ts's newInviteCode) are
  // always uppercase already — this only carries it through as-is.
  const url = buildInviteShareUrl(
    "https://english-level-web-preview.res-creator.workers.dev",
    "AB12CD",
  );
  assert.equal(
    url,
    "https://english-level-web-preview.res-creator.workers.dev/?invite=AB12CD",
  );
});

test("the Telegram share link opens t.me's own picker, carrying both the url and the text", () => {
  const link = buildTelegramShareLink(
    "https://example.com/?invite=AB12CD",
    INVITE_SHARE_TEXT,
  );
  assert.ok(link.startsWith("https://t.me/share/url?"));
  const params = new URL(link).searchParams;
  assert.equal(params.get("url"), "https://example.com/?invite=AB12CD");
  assert.equal(params.get("text"), INVITE_SHARE_TEXT);
});
