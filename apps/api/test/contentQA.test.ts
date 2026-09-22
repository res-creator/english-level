import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";

const LEVEL_CODES = new Set(["A1", "A2", "B1", "B2", "C1"]);
const ITEM_TYPES = new Set([
  "word",
  "phrase",
  "collocation",
  "phrasal_verb",
  "functional_phrase",
  "contrast",
]);
const LESSON_TYPES = new Set([
  "vocabulary",
  "grammar",
  "mixed",
  "reading",
  "practice",
  "checkpoint",
]);

async function seededDb() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return sqlite;
}

test("no duplicate stable IDs across modules, lessons, items, grammar, or lesson_items", async () => {
  const sqlite = await seededDb();
  for (const table of [
    "modules",
    "lessons",
    "learning_items",
    "grammar_patterns",
    "lesson_items",
  ]) {
    const row = sqlite
      .prepare(
        `SELECT COUNT(*) as total, COUNT(DISTINCT id) as distinctIds FROM ${table}`,
      )
      .get() as { total: number; distinctIds: number };
    assert.equal(row.total, row.distinctIds, `duplicate id found in ${table}`);
  }
});

test("every published learning item has a Russian localization", async () => {
  const sqlite = await seededDb();
  const missing = sqlite
    .prepare(
      `SELECT li.id FROM learning_items li
       LEFT JOIN learning_item_localizations loc ON loc.item_id = li.id AND loc.language = 'ru'
       WHERE li.status = 'published' AND loc.item_id IS NULL`,
    )
    .all();
  assert.deepEqual(missing, []);
});

test("every published learning item has exactly one primary example", async () => {
  const sqlite = await seededDb();
  const rows = sqlite
    .prepare(
      `SELECT li.id, COUNT(ex.id) as primaryCount
       FROM learning_items li
       LEFT JOIN item_examples ex ON ex.item_id = li.id AND ex.is_primary = 1
       WHERE li.status = 'published'
       GROUP BY li.id
       HAVING primaryCount != 1`,
    )
    .all();
  assert.deepEqual(rows, []);
});

test("every module, learning item, and grammar pattern references a valid CEFR level", async () => {
  const sqlite = await seededDb();
  for (const [table, col] of [
    ["modules", "level_id"],
    ["learning_items", "level_id"],
    ["grammar_patterns", "level_id"],
  ] as const) {
    const rows = sqlite
      .prepare(
        `SELECT t.id FROM ${table} t LEFT JOIN levels l ON l.id = t.${col} WHERE l.id IS NULL`,
      )
      .all();
    assert.deepEqual(rows, [], `${table} has a row with an invalid ${col}`);
  }
});

test("every learning item has a supported item_type", async () => {
  const sqlite = await seededDb();
  const rows = sqlite
    .prepare("SELECT DISTINCT item_type FROM learning_items")
    .all() as {
    item_type: string;
  }[];
  for (const row of rows) {
    assert.ok(
      ITEM_TYPES.has(row.item_type),
      `unexpected item_type "${row.item_type}"`,
    );
  }
});

test("every lesson has a supported lesson_type", async () => {
  const sqlite = await seededDb();
  const rows = sqlite
    .prepare("SELECT DISTINCT lesson_type FROM lessons")
    .all() as {
    lesson_type: string;
  }[];
  for (const row of rows) {
    assert.ok(
      LESSON_TYPES.has(row.lesson_type),
      `unexpected lesson_type "${row.lesson_type}"`,
    );
  }
  // The sample is meant to exercise every supported type at least once.
  assert.equal(rows.length, LESSON_TYPES.size);
});

test("every seeded CEFR level code used is one of A1/A2/B1/B2/C1", async () => {
  const sqlite = await seededDb();
  const rows = sqlite.prepare("SELECT DISTINCT code FROM levels").all() as {
    code: string;
  }[];
  for (const row of rows) {
    assert.ok(LEVEL_CODES.has(row.code));
  }
});

test("every item_relations row references two existing learning items", async () => {
  const sqlite = await seededDb();
  const broken = sqlite
    .prepare(
      `SELECT r.from_item_id, r.to_item_id FROM item_relations r
       LEFT JOIN learning_items a ON a.id = r.from_item_id
       LEFT JOIN learning_items b ON b.id = r.to_item_id
       WHERE a.id IS NULL OR b.id IS NULL`,
    )
    .all();
  assert.deepEqual(broken, []);
});

test("every grammar_relations row references two existing grammar patterns", async () => {
  const sqlite = await seededDb();
  const broken = sqlite
    .prepare(
      `SELECT r.from_pattern_id, r.to_pattern_id FROM grammar_relations r
       LEFT JOIN grammar_patterns a ON a.id = r.from_pattern_id
       LEFT JOIN grammar_patterns b ON b.id = r.to_pattern_id
       WHERE a.id IS NULL OR b.id IS NULL`,
    )
    .all();
  assert.deepEqual(broken, []);
});

test("every lesson_items row references an existing lesson and an existing piece of content", async () => {
  const sqlite = await seededDb();

  const brokenLessons = sqlite
    .prepare(
      `SELECT li.id FROM lesson_items li
       LEFT JOIN lessons l ON l.id = li.lesson_id
       WHERE l.id IS NULL`,
    )
    .all();
  assert.deepEqual(brokenLessons, []);

  const brokenLearningItemLinks = sqlite
    .prepare(
      `SELECT li.id FROM lesson_items li
       LEFT JOIN learning_items it ON it.id = li.content_id
       WHERE li.content_type = 'learning_item' AND it.id IS NULL`,
    )
    .all();
  assert.deepEqual(brokenLearningItemLinks, []);

  const brokenGrammarLinks = sqlite
    .prepare(
      `SELECT li.id FROM lesson_items li
       LEFT JOIN grammar_patterns g ON g.id = li.content_id
       WHERE li.content_type = 'grammar_pattern' AND g.id IS NULL`,
    )
    .all();
  assert.deepEqual(brokenGrammarLinks, []);
});

test("modules have no duplicate order_index within the same level", async () => {
  const sqlite = await seededDb();
  const dupes = sqlite
    .prepare(
      `SELECT level_id, order_index, COUNT(*) as n
       FROM modules GROUP BY level_id, order_index HAVING n > 1`,
    )
    .all();
  assert.deepEqual(dupes, []);
});

test("lessons have no duplicate order_index within the same module", async () => {
  const sqlite = await seededDb();
  const dupes = sqlite
    .prepare(
      `SELECT module_id, order_index, COUNT(*) as n
       FROM lessons GROUP BY module_id, order_index HAVING n > 1`,
    )
    .all();
  assert.deepEqual(dupes, []);
});

test("lesson_items have no duplicate order_index within the same lesson", async () => {
  const sqlite = await seededDb();
  const dupes = sqlite
    .prepare(
      `SELECT lesson_id, order_index, COUNT(*) as n
       FROM lesson_items GROUP BY lesson_id, order_index HAVING n > 1`,
    )
    .all();
  assert.deepEqual(dupes, []);
});
