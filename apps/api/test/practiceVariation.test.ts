import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { buildSeedStatements } from "../src/content/buildSeedStatements.ts";
import type { ContentBundle } from "../src/content/contentBundle.ts";
import { buildActivityPlan } from "../src/lessonEngine/lessonSessionBuilder.ts";
import { buildMissionPlan } from "../src/lessonEngine/episodePlan.ts";
import { listLessonItemsByLesson } from "../src/repositories/curriculumRepository.ts";
import type { Db } from "../src/db/types.ts";

/**
 * Proves the Practice Variation model end to end — core situation ->
 * practice variation -> Mission — on a minimal, hand-built fixture.
 * NOT production content: nothing here touches seeds/content/. See
 * CONTENT_PRODUCTION_PLAN.md §2/§9 for the model this verifies, and
 * lessonSessionBuilder.ts's buildLearningItemActivities for the actual
 * behavior under test.
 *
 * Fixture shape: one lesson with three lesson_items —
 *   - itm_fixture_core       role "introduce" (the core situation's target)
 *   - itm_fixture_variation  role "practice"  (the Practice Variation)
 *   - itm_fixture_distractor_1 role "review"  (regression control: proves
 *     the practice-role change didn't accidentally loosen "review" too)
 * plus two more distractor-only items so recognition/fill-gap checks have
 * enough distractors to build from (collectDistractorTexts needs 3).
 */
function fixtureBundle(): ContentBundle {
  return {
    modules: [
      {
        id: "mod_fixture_practice",
        levelCode: "A1",
        title: "Fixture module",
        slug: "fixture-practice-module",
        order: 900,
      },
    ],
    lessons: [
      {
        id: "les_fixture_practice",
        moduleId: "mod_fixture_practice",
        title: "Fixture situation",
        lessonType: "mixed",
        order: 1,
      },
    ],
    learningItems: [
      {
        id: "itm_fixture_core",
        itemType: "phrase",
        lemma: "a coffee",
        displayForm: "a coffee",
        levelCode: "A1",
        ru: { translation: "кофе" },
        examples: [
          {
            id: "ex_fixture_core_01",
            text: "Can I have a coffee, please?",
            isPrimary: true,
          },
        ],
        npcReplyCorrect: "Sure! Anything else?",
      },
      {
        id: "itm_fixture_variation",
        itemType: "phrase",
        lemma: "a tea",
        displayForm: "a tea",
        levelCode: "A1",
        ru: { translation: "чай" },
        examples: [
          {
            id: "ex_fixture_variation_01",
            text: "Can I have a tea, please?",
            isPrimary: true,
          },
        ],
        npcReplyCorrect: "Of course! One tea coming up.",
      },
      {
        id: "itm_fixture_distractor_1",
        itemType: "phrase",
        npcReplyCorrect: "One juice coming up.",
        lemma: "a juice",
        displayForm: "a juice",
        levelCode: "A1",
        ru: { translation: "сок" },
        examples: [
          {
            id: "ex_fixture_d1_01",
            text: "Can I have a juice, please?",
            isPrimary: true,
          },
        ],
      },
      {
        id: "itm_fixture_distractor_2",
        itemType: "phrase",
        lemma: "a water",
        displayForm: "a water",
        levelCode: "A1",
        ru: { translation: "вода" },
        examples: [
          {
            id: "ex_fixture_d2_01",
            text: "Can I have a water, please?",
            isPrimary: true,
          },
        ],
      },
      {
        id: "itm_fixture_distractor_3",
        itemType: "phrase",
        lemma: "a sandwich",
        displayForm: "a sandwich",
        levelCode: "A1",
        ru: { translation: "бутерброд" },
        examples: [
          {
            id: "ex_fixture_d3_01",
            text: "Can I have a sandwich, please?",
            isPrimary: true,
          },
        ],
      },
    ],
    itemRelations: [],
    grammarPatterns: [],
    grammarRelations: [],
    lessonItems: [
      {
        id: "li_fixture_01",
        lessonId: "les_fixture_practice",
        contentType: "learning_item",
        contentId: "itm_fixture_core",
        role: "introduce",
        order: 1,
      },
      {
        id: "li_fixture_02",
        lessonId: "les_fixture_practice",
        contentType: "learning_item",
        contentId: "itm_fixture_variation",
        role: "practice",
        order: 2,
      },
      {
        id: "li_fixture_03",
        lessonId: "les_fixture_practice",
        contentType: "learning_item",
        contentId: "itm_fixture_distractor_1",
        role: "review",
        order: 3,
      },
    ],
  };
}

async function seededFixture(): Promise<Db> {
  const { db } = createTestDb();
  const statements = buildSeedStatements(
    fixtureBundle(),
    "2026-01-01T00:00:00.000Z",
  );
  await db.batch(statements);
  return db;
}

test("practice-role item skips info_card but is NOT a bare single MC (unlike review)", async () => {
  const db = await seededFixture();
  const items = await listLessonItemsByLesson(db, "les_fixture_practice");
  const plan = await buildActivityPlan(db, "lvl_a1", items);

  const core = plan.filter((a) => a.targetId === "itm_fixture_core");
  const variation = plan.filter((a) => a.targetId === "itm_fixture_variation");
  const review = plan.filter((a) => a.targetId === "itm_fixture_distractor_1");

  assert.ok(
    core.some((a) => a.kind === "info_card"),
    "core (introduce) should still get an info_card",
  );
  assert.ok(
    variation.every((a) => a.kind !== "info_card"),
    "a practice variation must not get an info_card — the learner already knows the item",
  );
  assert.ok(
    variation.length > 1,
    `a practice variation must be more than a single bare MC (that's what "review" is for) — got ${variation.length} activities`,
  );
  assert.deepEqual(
    review.map((a) => a.kind),
    ["multiple_choice"],
    "review must remain exactly the unchanged single bare MC",
  );
});

test("practice-role activities are production-capable, not recognition-only", async () => {
  const db = await seededFixture();
  const items = await listLessonItemsByLesson(db, "les_fixture_practice");
  const plan = await buildActivityPlan(db, "lvl_a1", items);
  const variation = plan.filter((a) => a.targetId === "itm_fixture_variation");
  const kinds = new Set(variation.map((a) => a.kind));
  assert.ok(
    kinds.has("fill_gap_choice") ||
      kinds.has("sentence_build") ||
      kinds.has("typed_recall"),
    `expected at least one production-capable kind, got: ${[...kinds].join(", ")}`,
  );
});

test("the variation's own authored NPC reply is preserved, attached to its last activity", async () => {
  const db = await seededFixture();
  const items = await listLessonItemsByLesson(db, "les_fixture_practice");
  const plan = await buildActivityPlan(db, "lvl_a1", items);
  const variation = plan.filter((a) => a.targetId === "itm_fixture_variation");
  const last = variation[variation.length - 1];
  assert.ok(last, "expected at least one variation activity");
  assert.equal(last?.npcReply?.correct, "Of course! One tea coming up.");
  assert.equal(last?.dialogueTurnId, "li_fixture_02");
  // Only the last activity carries it — mirrors the "exactly one NPC turn
  // per item" rule that already applies to `introduce`.
  for (const a of variation.slice(0, -1)) {
    assert.equal(a.npcReply, undefined);
    assert.equal(a.dialogueTurnId, undefined);
  }
});

test("a practice variation is excluded from the Mission — only the core target is tested", async () => {
  const db = await seededFixture();
  const items = await listLessonItemsByLesson(db, "les_fixture_practice");
  const mission = await buildMissionPlan(db, "lvl_a1", items);
  const targetIds = mission.map((a) => a.targetId);
  assert.ok(
    targetIds.includes("itm_fixture_core"),
    "Mission should test the core target",
  );
  assert.ok(
    !targetIds.includes("itm_fixture_variation"),
    "Mission must not test the practice variation directly — it only feeds readiness for the core target",
  );
  assert.ok(
    !targetIds.includes("itm_fixture_distractor_1"),
    "Mission must not test a review-role item either",
  );
});

test("review recognition is not a spoken turn even when the item has NPC copy", async () => {
  const db = await seededFixture();
  const items = await listLessonItemsByLesson(db, "les_fixture_practice");
  const plan = await buildActivityPlan(db, "lvl_a1", items);
  const review = plan.filter((a) => a.targetId === "itm_fixture_distractor_1");
  assert.equal(review.length, 1);
  assert.equal(review[0]?.npcReply, undefined);
  assert.equal(review[0]?.dialogueTurnId, undefined);
});
