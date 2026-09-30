import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowSituationIntro } from "../src/scene/sessionPresentation.ts";

test("the situation chip is an intro-only cue", () => {
  assert.equal(shouldShowSituationIntro("lesson", 1, 1), true);
  assert.equal(shouldShowSituationIntro("lesson", 1, 2), false);
  assert.equal(shouldShowSituationIntro("lesson", 2, 1), false);
  assert.equal(shouldShowSituationIntro("mission", 4, 1), false);
});
