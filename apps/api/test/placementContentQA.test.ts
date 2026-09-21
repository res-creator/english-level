import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";

const LEVELS = new Set(["A1", "A2", "B1", "B2"]);
const SKILLS = new Set(["vocabulary", "grammar", "reading", "active_english"]);
const TYPES = new Set([
  "multiple_choice",
  "fill_gap_choice",
  "reading_multiple_choice",
  "typed_short_answer",
]);

function loadQuestions(sqlite: import("node:sqlite").DatabaseSync) {
  return sqlite
    .prepare(
      "SELECT * FROM placement_questions WHERE test_version = 'placement_v1'",
    )
    .all() as Array<{
    id: string;
    skill: string;
    cefr_level: string;
    question_type: string;
    prompt: string;
    passage_id: string | null;
    options_json: string | null;
    accepted_answers_json: string;
  }>;
}

test("every seeded question has a valid CEFR level", () => {
  const { sqlite } = createTestDb();
  for (const q of loadQuestions(sqlite)) {
    assert.ok(
      LEVELS.has(q.cefr_level),
      `${q.id}: invalid cefr_level "${q.cefr_level}"`,
    );
  }
});

test("every seeded question has a valid skill", () => {
  const { sqlite } = createTestDb();
  for (const q of loadQuestions(sqlite)) {
    assert.ok(SKILLS.has(q.skill), `${q.id}: invalid skill "${q.skill}"`);
  }
});

test("every seeded question has a supported question type", () => {
  const { sqlite } = createTestDb();
  for (const q of loadQuestions(sqlite)) {
    assert.ok(
      TYPES.has(q.question_type),
      `${q.id}: invalid question_type "${q.question_type}"`,
    );
  }
});

test("every seeded question has a non-empty prompt", () => {
  const { sqlite } = createTestDb();
  for (const q of loadQuestions(sqlite)) {
    assert.ok(q.prompt && q.prompt.trim().length > 0, `${q.id}: empty prompt`);
  }
});

test("every seeded question has at least one accepted answer", () => {
  const { sqlite } = createTestDb();
  for (const q of loadQuestions(sqlite)) {
    const accepted = JSON.parse(q.accepted_answers_json);
    assert.ok(
      Array.isArray(accepted) && accepted.length > 0,
      `${q.id}: no accepted answers`,
    );
  }
});

test("every choice-type question's correct answer is among its options, with no duplicate options", () => {
  const { sqlite } = createTestDb();
  for (const q of loadQuestions(sqlite)) {
    if (q.question_type === "typed_short_answer") continue;
    assert.ok(q.options_json, `${q.id}: choice question missing options`);
    const options: string[] = JSON.parse(q.options_json!);
    const accepted: string[] = JSON.parse(q.accepted_answers_json);

    assert.equal(
      new Set(options).size,
      options.length,
      `${q.id}: duplicate option values`,
    );
    assert.ok(
      accepted.every((a) => options.includes(a)),
      `${q.id}: correct answer not among options`,
    );
  }
});

test("every reading_multiple_choice question references an existing passage", () => {
  const { sqlite } = createTestDb();
  const passageIds = new Set(
    (
      sqlite.prepare("SELECT id FROM placement_passages").all() as Array<{
        id: string;
      }>
    ).map((p) => p.id),
  );
  for (const q of loadQuestions(sqlite)) {
    if (q.question_type !== "reading_multiple_choice") continue;
    assert.ok(q.passage_id, `${q.id}: reading question missing passage_id`);
    assert.ok(
      passageIds.has(q.passage_id!),
      `${q.id}: passage_id "${q.passage_id}" not found`,
    );
  }
});

test("the bank has at least 15 questions per CEFR level and covers all 4 skills at each level", () => {
  const { sqlite } = createTestDb();
  const questions = loadQuestions(sqlite);
  for (const level of LEVELS) {
    const atLevel = questions.filter((q) => q.cefr_level === level);
    assert.ok(
      atLevel.length >= 15,
      `expected >=15 questions at ${level}, got ${atLevel.length}`,
    );
    for (const skill of SKILLS) {
      assert.ok(
        atLevel.some((q) => q.skill === skill),
        `no ${skill} question at ${level}`,
      );
    }
  }
});

test("question ids are unique", () => {
  const { sqlite } = createTestDb();
  const questions = loadQuestions(sqlite);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate question ids found");
});

test("at least some typed_short_answer questions exist (active recall, not recognition-only)", () => {
  const { sqlite } = createTestDb();
  const typed = loadQuestions(sqlite).filter(
    (q) => q.question_type === "typed_short_answer",
  );
  assert.ok(
    typed.length > 0,
    "expected at least one typed_short_answer question",
  );
});
