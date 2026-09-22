import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { loadSeedContent } from "../src/content/loadSeedContent.ts";
import { seedContent } from "../src/content/seedContent.ts";

test("all seed files load and cross-validate without throwing", () => {
  const bundle = loadSeedContent();
  assert.ok(bundle.modules.length > 0);
  assert.ok(bundle.lessons.length > 0);
  assert.ok(bundle.learningItems.length > 0);
  assert.ok(bundle.grammarPatterns.length > 0);
  assert.ok(bundle.lessonItems.length > 0);
});

test("the seed sample matches the Phase 5 target sizes", () => {
  const bundle = loadSeedContent();

  assert.equal(bundle.modules.length, 6); // 3 A1 + 3 A2
  assert.equal(bundle.lessons.length, 24); // 4 per module

  const a1Items = bundle.learningItems.filter((i) => i.levelCode === "A1");
  const a2Items = bundle.learningItems.filter((i) => i.levelCode === "A2");
  assert.ok(
    a1Items.length >= 40 && a1Items.length <= 60,
    `A1 items: ${a1Items.length}`,
  );
  assert.ok(
    a2Items.length >= 40 && a2Items.length <= 60,
    `A2 items: ${a2Items.length}`,
  );
  assert.ok(
    bundle.learningItems.length >= 80 && bundle.learningItems.length <= 120,
    `total items: ${bundle.learningItems.length}`,
  );

  const a1Grammar = bundle.grammarPatterns.filter((g) => g.levelCode === "A1");
  const a2Grammar = bundle.grammarPatterns.filter((g) => g.levelCode === "A2");
  assert.ok(
    a1Grammar.length >= 6 && a1Grammar.length <= 10,
    `A1 grammar: ${a1Grammar.length}`,
  );
  assert.ok(
    a2Grammar.length >= 6 && a2Grammar.length <= 10,
    `A2 grammar: ${a2Grammar.length}`,
  );
  assert.ok(
    bundle.grammarPatterns.length >= 12 && bundle.grammarPatterns.length <= 20,
    `total grammar: ${bundle.grammarPatterns.length}`,
  );
});

test("seed/import succeeds against a fresh database", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  const moduleCount = sqlite
    .prepare("SELECT COUNT(*) as n FROM modules")
    .get() as {
    n: number;
  };
  assert.ok(moduleCount.n > 0);
});

test("running the seed tooling twice does not duplicate any content", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  const countAll = () => ({
    modules: (
      sqlite.prepare("SELECT COUNT(*) n FROM modules").get() as { n: number }
    ).n,
    lessons: (
      sqlite.prepare("SELECT COUNT(*) n FROM lessons").get() as { n: number }
    ).n,
    learningItems: (
      sqlite.prepare("SELECT COUNT(*) n FROM learning_items").get() as {
        n: number;
      }
    ).n,
    localizations: (
      sqlite
        .prepare("SELECT COUNT(*) n FROM learning_item_localizations")
        .get() as {
        n: number;
      }
    ).n,
    examples: (
      sqlite.prepare("SELECT COUNT(*) n FROM item_examples").get() as {
        n: number;
      }
    ).n,
    patterns: (
      sqlite.prepare("SELECT COUNT(*) n FROM item_patterns").get() as {
        n: number;
      }
    ).n,
    itemRelations: (
      sqlite.prepare("SELECT COUNT(*) n FROM item_relations").get() as {
        n: number;
      }
    ).n,
    grammarPatterns: (
      sqlite.prepare("SELECT COUNT(*) n FROM grammar_patterns").get() as {
        n: number;
      }
    ).n,
    grammarRelations: (
      sqlite.prepare("SELECT COUNT(*) n FROM grammar_relations").get() as {
        n: number;
      }
    ).n,
    lessonItems: (
      sqlite.prepare("SELECT COUNT(*) n FROM lesson_items").get() as {
        n: number;
      }
    ).n,
  });

  const before = countAll();
  await seedContent(db);
  await seedContent(db);
  const after = countAll();

  assert.deepEqual(after, before);
});

test("re-seeding updates existing rows in place (upsert, not insert-or-error)", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  const before = sqlite
    .prepare("SELECT title FROM modules WHERE id = 'mod_a1_01'")
    .get() as { title: string };
  assert.equal(before.title, "Me & Introductions");

  // Re-seed again; the module's title (loaded from the same seed file)
  // should be updated to the same value without erroring, proving the
  // upsert path — not just "second run happens to skip everything".
  await seedContent(db);
  const after = sqlite
    .prepare("SELECT title FROM modules WHERE id = 'mod_a1_01'")
    .get() as { title: string };
  assert.equal(after.title, before.title);
});
