/**
 * Turning a bare invite code into something a learner can actually hand
 * to someone, rather than reading six characters out loud. Pure string
 * building only — no API calls, no Telegram-specific code — so the
 * actual sharing mechanism (`FriendPanel`) can pick whichever channel is
 * available and this stays testable without a DOM or a WebApp mock.
 */

export const INVITE_SHARE_TEXT =
  "Пойдём учить английский вместе в Speak in English 👋";

/** The Mini App's own URL with the code attached — opening it is what
 * `pendingInvite.ts` picks back up on the other end. Works regardless of
 * whether a Telegram Mini App short name (`t.me/bot/app`) exists, since
 * it only ever uses the origin this app is already running on. */
export function buildInviteShareUrl(origin: string, code: string): string {
  const url = new URL(origin);
  url.searchParams.set("invite", code);
  return url.toString();
}

/** Telegram's own share picker for any link — the same "choose a chat"
 * UI every native share in Telegram already uses, not a custom one. */
export function buildTelegramShareLink(url: string, text: string): string {
  const params = new URLSearchParams({ url, text });
  return `https://t.me/share/url?${params.toString()}`;
}
