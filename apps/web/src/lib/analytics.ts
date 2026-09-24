import {
  TrackEventResponseSchema,
  type EventName,
  type EventProperties,
} from "@english-level/contracts";
import { API_BASE_URL } from "./apiBaseUrl.ts";

/**
 * The small set of moments the server has no other way to see: a screen
 * was opened, a demo was skipped, a companion was picked at a screen that
 * offers "later" as a real answer. Everything else the pilot needs to
 * read a funnel — a session finished, a Mission passed or failed, a
 * review closed — is emitted by the backend itself, in the same
 * transaction as the thing it describes, and never touches this file.
 *
 * `track` never throws and never blocks a screen: a dropped event costs
 * the pilot a data point, not the learner a broken tap.
 */
const ANONYMOUS_ID_KEY = "sie.anonymousId";

function anonymousId(): string {
  try {
    const existing = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, fresh);
    return fresh;
  } catch {
    // Private mode or blocked storage: a per-call id still lets this one
    // event record, it just won't join up with the next one.
    return crypto.randomUUID();
  }
}

export function track(event: EventName, properties?: EventProperties): void {
  const body = JSON.stringify({
    event,
    anonymousId: anonymousId(),
    properties,
  });

  fetch(`${API_BASE_URL}/api/v1/events`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body,
    // Not on the critical path of anything the learner is waiting on.
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) return;
      return res.json();
    })
    .then((json) => {
      if (json) TrackEventResponseSchema.safeParse(json);
    })
    .catch(() => {
      // Analytics is instrumentation, not a feature — a failed send is
      // simply lost, never surfaced.
    });
}
