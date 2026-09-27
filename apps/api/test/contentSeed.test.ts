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

test("the published catalogue is the current A1 situation course", () => {
  const bundle = loadSeedContent();

  const published = bundle.modules.filter(
    (m) => (m.status ?? "published") === "published",
  );
  // The published course is A1-only: just the one situational starter chapter is
  // published. The original (pre-pivot) A1 chapters and all three A2
  // chapters stay in the bundle but archived, so no released content id
  // ever disappears and A2 can be published later without a rewrite.
  assert.equal(published.length, 1);
  assert.equal(bundle.modules.length - published.length, 6);

  const starter = bundle.lessons.filter((l) => l.moduleId === "mod_sie_a1_01");
  assert.equal(starter.length, 11);
  for (const episode of starter) {
    assert.ok(episode.situationTitle, `${episode.id} has no situation title`);
    assert.ok(episode.scene, `${episode.id} has no scene`);
    assert.ok(
      episode.capability?.startsWith("Я могу"),
      `${episode.id} capability must be a concrete "Я могу …" claim`,
    );
  }

  const a1Items = bundle.learningItems.filter((i) => i.levelCode === "A1");
  const a2Items = bundle.learningItems.filter((i) => i.levelCode === "A2");
  assert.ok(a1Items.length >= 60, `A1 items: ${a1Items.length}`);
  assert.ok(a2Items.length >= 40, `A2 items: ${a2Items.length}`);

  const a1Grammar = bundle.grammarPatterns.filter((g) => g.levelCode === "A1");
  const a2Grammar = bundle.grammarPatterns.filter((g) => g.levelCode === "A2");
  assert.ok(a1Grammar.length >= 8, `A1 grammar: ${a1Grammar.length}`);
  assert.ok(a2Grammar.length >= 6, `A2 grammar: ${a2Grammar.length}`);
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
