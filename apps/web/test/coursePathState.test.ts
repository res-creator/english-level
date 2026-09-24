import test from "node:test";
import assert from "node:assert/strict";
import type { EpisodeDTO } from "@english-level/contracts";
import { resolvePathNodeState } from "../src/routes/coursePathState.ts";

function episode(state: EpisodeDTO["state"]): EpisodeDTO {
  return {
    id: "les_x",
    title: "x",
    situationTitle: null,
    scene: null,
    capability: null,
    teaser: null,
    type: "practice",
    order: 1,
    estimatedMinutes: null,
    state,
    sessionsDone: 0,
    sessionsTotal: 3,
    missionReady: false,
  };
}

test("a passed episode is done, regardless of whether it's the current pointer", () => {
  assert.equal(resolvePathNodeState(episode("can_do"), false), "done");
  assert.equal(resolvePathNodeState(episode("consolidated"), true), "done");
});

test("the server's own current pointer is open, even with no capability yet", () => {
  assert.equal(resolvePathNodeState(episode(null), true), "current");
});

test("a situation in progress that somehow isn't the pointer is 'started', not locked", () => {
  assert.equal(resolvePathNodeState(episode("learning"), false), "started");
});

test("anything else — never touched, not the pointer — is locked", () => {
  assert.equal(resolvePathNodeState(episode(null), false), "locked");
});
