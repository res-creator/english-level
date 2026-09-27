import test from "node:test";
import assert from "node:assert/strict";
import type { ActivityDTO } from "@english-level/contracts";
import {
  appendCompletedTurn,
  initialSessionDialogue,
} from "../src/lessonEngine/sessionDialogue.ts";

const build: ActivityDTO = {
  id: "build",
  kind: "sentence_build",
  progress: { current: 4, total: 4 },
  prompt: "Build",
  content: { tokens: ["understand.", "I", "don't"] },
  dialogueTurnId: "clarify",
  npcReply: { correct: "The station is on the left.", incorrect: null },
};
const gap: ActivityDTO = {
  id: "gap",
  kind: "fill_gap_choice",
  progress: { current: 3, total: 4 },
  prompt: "Complete",
  content: { sentence: "I ___ understand." },
  options: [{ id: "a", text: "don't" }],
};

test("scaffolding and final build produce exactly one learner/NPC exchange", () => {
  let lines = appendCompletedTurn([], gap, "a", { correct: true });
  assert.deepEqual(lines, []);
  lines = appendCompletedTurn(lines, build, "I don't understand.", {
    correct: true,
  });
  assert.deepEqual(
    lines.map((l) => [l.from, l.text]),
    [
      ["you", "I don't understand."],
      ["them", "The station is on the left."],
    ],
  );
  assert.deepEqual(
    appendCompletedTurn(lines, build, "I don't understand.", { correct: true }),
    lines,
  );
  assert.deepEqual(
    appendCompletedTurn(
      lines,
      { ...build, id: "build_retry" },
      "I don't understand.",
      { correct: true },
    ),
    lines,
  );
});

test("a final gap speaks the complete sentence, not its missing fragment", () => {
  const lines = appendCompletedTurn(
    [],
    { ...gap, dialogueTurnId: "gap-turn" },
    "a",
    { correct: true },
  );
  assert.equal(lines[0]?.text, "I don't understand.");
});

test("a wrong answer is feedback, not a claimed completed turn; a correct retry speaks once", () => {
  const lines = appendCompletedTurn([], build, "wrong", {
    correct: false,
    correctAnswer: "I don't understand.",
    explanation: null,
  });
  assert.deepEqual(lines, []);
  assert.equal(
    appendCompletedTurn(
      lines,
      { ...build, id: "retry" },
      "I don't understand.",
      { correct: true },
    ).length,
    2,
  );
});

test("recognition review never speaks or emits an orphan NPC response, even from an old DTO", () => {
  const review: ActivityDTO = {
    id: "review",
    kind: "multiple_choice",
    progress: { current: 1, total: 1 },
    targetType: "learning_item",
    prompt: "Meaning?",
    content: { text: "hello" },
    options: [{ id: "a", text: "привет" }],
    npcReply: { correct: "Hello!", incorrect: null },
    dialogueTurnId: "invalid-marker",
  };
  assert.deepEqual(appendCompletedTurn([], review, "a", { correct: true }), []);
});

test("first lesson session opens the situation; later sessions, resumes and Mission do not reopen it", () => {
  const first = {
    kind: "lesson" as const,
    sessionIndex: 1,
    currentActivity: { ...build, progress: { current: 1, total: 4 } },
  };
  const lines = initialSessionDialogue(first, "les_sie_a1_e4");
  assert.deepEqual(
    lines.map((l) => l.text),
    ["Are you looking for something?"],
  );
  assert.deepEqual(
    initialSessionDialogue({ ...first, sessionIndex: 2 }, "les_sie_a1_e4"),
    [],
  );
  assert.deepEqual(
    initialSessionDialogue(
      { ...first, currentActivity: build },
      "les_sie_a1_e4",
    ),
    lines,
  );
  assert.deepEqual(
    initialSessionDialogue({ ...first, kind: "mission" }, "les_sie_a1_e4"),
    [],
  );
});

test("Mission has its own transcript and one marked turn is shown without an opener", () => {
  const mission = {
    kind: "mission" as const,
    sessionIndex: 4,
    currentActivity: build,
  };
  const lines = appendCompletedTurn(
    initialSessionDialogue(mission, "les_sie_a1_e4"),
    build,
    "I don't understand.",
    { correct: true },
  );
  assert.deepEqual(
    lines.map((l) => l.from),
    ["you", "them"],
  );
});
