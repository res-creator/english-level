/**
 * Carries a shared invite code from "someone opened the link" to
 * "FriendPanel has it ready to submit" — across whatever redirects
 * happen in between (RootRedirect drops query params on every
 * `<Navigate>`, so the code can't just be read from the URL wherever
 * FriendPanel happens to mount). localStorage is the same mechanism
 * `sie.welcomeSeen`/`sie.anonymousId` already use for exactly this kind
 * of "survive a redirect, per device" value.
 */
const PENDING_INVITE_KEY = "sie.pendingInvite";

/** Call once, as early as possible (before routing), so the code is
 * captured before RootRedirect's first `<Navigate>` would drop it. */
export function capturePendingInviteFromUrl(): void {
  try {
    const code = new URLSearchParams(window.location.search).get("invite");
    if (!code) return;
    localStorage.setItem(PENDING_INVITE_KEY, code.toUpperCase());
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    window.history.replaceState(null, "", url.toString());
  } catch {
    // Private mode or blocked storage: the code is simply not carried
    // forward — the learner can still type it in by hand.
  }
}

/** Reads and clears the pending code, so it's only ever offered once. */
export function consumePendingInvite(): string | null {
  try {
    const code = localStorage.getItem(PENDING_INVITE_KEY);
    if (code) localStorage.removeItem(PENDING_INVITE_KEY);
    return code;
  } catch {
    return null;
  }
}
