import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { resolveCurrentUser } from "../src/services/authService.ts";
import {
  getCurriculumPath,
  getModuleDetail,
  getLessonContent,
} from "../src/services/curriculumService.ts";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

// --- auth gate -----------------------------------------------------------

test("unauthenticated curriculum access is rejected (same requireAuth gate the routes use)", async () => {
  const { db } = createTestDb();
  assert.equal(await resolveCurrentUser(db, undefined), null);
});

// --- GET /path -------------------------------------------------------------

test("A1 path returns the 3 seeded A1 modules", async () => {
  const { db } = await seeded();
  const path = await getCurriculumPath(db, "A1");
  assert.equal(path.currentLevel, "A1");
  assert.equal(path.modules.length, 3);
  assert.deepEqual(
    path.modules.map((m) => m.title),
    ["Me & Introductions", "Daily Life", "Family & People"],
  );
  for (const m of path.modules) {
    assert.equal(m.lessons, 4);
  }
});

test("A2 path returns the 3 seeded A2 modules", async () => {
  const { db } = await seeded();
  const path = await getCurriculumPath(db, "A2");
  assert.equal(path.currentLevel, "A2");
  assert.equal(path.modules.length, 3);
  assert.deepEqual(
    path.modules.map((m) => m.title),
    ["Life & Routines", "Travel & Transport", "Communication"],
  );
});

test("B1/B2 with no seeded curriculum returns a safe empty result, not an error", async () => {
  const { db } = await seeded();
  const b1 = await getCurriculumPath(db, "B1");
  const b2 = await getCurriculumPath(db, "B2");
  assert.deepEqual(b1, { currentLevel: "B1", modules: [] });
  assert.deepEqual(b2, { currentLevel: "B2", modules: [] });
});

test("no current level yet returns a safe empty result", async () => {
  const { db } = await seeded();
  const path = await getCurriculumPath(db, null);
  assert.deepEqual(path, { currentLevel: null, modules: [] });
});

test("path never invents progress/completion data", async () => {
  const { db } = await seeded();
  const path = await getCurriculumPath(db, "A1");
  for (const m of path.modules) {
    assert.deepEqual(Object.keys(m).sort(), [
      "id",
      "lessons",
      "order",
      "title",
    ]);
  }
});

// --- GET /modules/:id --------------------------------------------------

test("module detail returns metadata and an ordered lesson list", async () => {
  const { db } = await seeded();
  const result = await getModuleDetail(db, "mod_a1_01");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.detail.title, "Me & Introductions");
  assert.equal(result.detail.level, "A1");
  assert.equal(result.detail.lessons.length, 4);
  assert.deepEqual(
    result.detail.lessons.map((l) => l.order),
    [1, 2, 3, 4],
  );
});

test("module lesson order is deterministic across repeated calls", async () => {
  const { db } = await seeded();
  const first = await getModuleDetail(db, "mod_a2_02");
  const second = await getModuleDetail(db, "mod_a2_02");
  assert.deepEqual(first, second);
});

test("an unknown module id returns not_found", async () => {
  const { db } = await seeded();
  const result = await getModuleDetail(db, "mod_does_not_exist");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("an archived module is not returned", async () => {
  const { db, sqlite } = await seeded();
  sqlite
    .prepare("UPDATE modules SET status = 'archived' WHERE id = ?")
    .run("mod_a1_02");
  const result = await getModuleDetail(db, "mod_a1_02");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

// --- GET /lessons/:id --------------------------------------------------

test("lesson content returns ordered target learning items and grammar patterns", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, "les_a1_01_03"); // the grammar lesson
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.content.type, "grammar");
  assert.ok(result.content.content.length > 0);
  assert.ok(
    result.content.content.every(
      (entry) => entry.contentType === "grammar_pattern",
    ),
  );
});

test("lesson content order is deterministic across repeated calls", async () => {
  const { db } = await seeded();
  const first = await getLessonContent(db, "les_a1_01_01");
  const second = await getLessonContent(db, "les_a1_01_01");
  assert.deepEqual(first, second);
});

test("a mixed lesson returns both learning items and grammar patterns", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, "les_a1_01_04"); // Mixed Practice
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const types = new Set(result.content.content.map((e) => e.contentType));
  assert.ok(types.has("learning_item"));
  assert.ok(types.has("grammar_pattern"));
});

test("an unknown lesson id returns not_found", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, "les_does_not_exist");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("an archived lesson is not returned", async () => {
  const { db, sqlite } = await seeded();
  sqlite
    .prepare("UPDATE lessons SET status = 'archived' WHERE id = ?")
    .run("les_a1_02_01");
  const result = await getLessonContent(db, "les_a1_02_01");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "not_found");
});

test("the lesson content DTO exposes no internal DB fields (frequency, difficulty, provenance, timestamps, status)", async () => {
  const { db } = await seeded();
  const result = await getLessonContent(db, "les_a1_01_01");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const itemEntry = result.content.content.find(
    (e) => e.contentType === "learning_item",
  );
  assert.ok(itemEntry && itemEntry.contentType === "learning_item");
  assert.deepEqual(Object.keys(itemEntry.item).sort(), [
    "displayForm",
    "id",
    "itemType",
    "primaryExample",
    "translation",
    "usageNote",
  ]);
  for (const forbidden of [
    "frequency_band",
    "difficulty",
    "provenance",
    "content_version",
    "status",
    "created_at",
    "updated_at",
    "topic",
    "audio_key",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(itemEntry.item, forbidden),
      false,
    );
  }
});

// --- read-only guarantees -------------------------------------------------

test("reading curriculum content does not mutate any table (no progress/completion is created)", async () => {
  const { db, sqlite } = await seeded();

  const snapshot = () =>
    [
      "modules",
      "lessons",
      "learning_items",
      "grammar_patterns",
      "lesson_items",
      "users",
      "user_settings",
    ]
      .map(
        (t) =>
          (
            sqlite.prepare(`SELECT COUNT(*) as n FROM ${t}`).get() as {
              n: number;
            }
          ).n,
      )
      .join(",");

  const before = snapshot();
  await getCurriculumPath(db, "A1");
  await getModuleDetail(db, "mod_a1_01");
  await getLessonContent(db, "les_a1_01_01");
  await getLessonContent(db, "les_a1_01_04");
  const after = snapshot();

  assert.equal(after, before);
});
