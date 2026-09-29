import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import {
  listPublishedLessonsByModule,
  listPublishedModulesByLevel,
} from "../src/repositories/curriculumRepository.ts";
import {
  buildActivityPlan,
  seededShuffle,
} from "../src/lessonEngine/lessonSessionBuilder.ts";
import { listLessonItemsByLesson } from "../src/repositories/curriculumRepository.ts";
import type { StoredActivity } from "../src/lessonEngine/activityTypes.ts";
import type { Db } from "../src/db/types.ts";

async function seeded() {
  const { db } = createTestDb();
  await seedContent(db);
  return db;
}

async function allPublishedLessons(
  db: Db,
): Promise<{ lessonId: string; levelId: string }[]> {
  const out: { lessonId: string; levelId: string }[] = [];
  for (const levelId of ["lvl_a1", "lvl_a2", "lvl_b1", "lvl_b2"]) {
    const modules = await listPublishedModulesByLevel(db, levelId);
    for (const module_ of modules) {
      const lessons = await listPublishedLessonsByModule(db, module_.id);
      for (const lesson of lessons) out.push({ lessonId: lesson.id, levelId });
    }
  }
  return out;
}

async function planFor(
  db: Db,
  lessonId: string,
  levelId: string,
): Promise<StoredActivity[]> {
  const items = await listLessonItemsByLesson(db, lessonId);
  return buildActivityPlan(db, levelId, items);
}

// --- every seeded lesson converts cleanly -------------------------------------

test("every seeded A1/A2/B1/B2 lesson can be converted into a valid activity plan", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  assert.ok(lessons.length > 0, "expected at least one seeded lesson");

  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    assert.ok(plan.length > 0, `${lessonId}: produced an empty plan`);
  }
});

test("activity plan generation is deterministic (same lesson -> identical plan)", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons.slice(0, 6)) {
    const first = await planFor(db, lessonId, levelId);
    const second = await planFor(db, lessonId, levelId);
    assert.deepEqual(
      first,
      second,
      `${lessonId}: plan generation is not deterministic`,
    );
  }
});

test("every generated activity has a unique, sequential id within its plan", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    const ids = plan.map((a) => a.id);
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${lessonId}: duplicate activity ids`,
    );
  }
});

// --- exercise quality ----------------------------------------------------------

test("every multiple_choice/fill_gap_choice has exactly one correct option, no duplicate option text", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    for (const activity of plan) {
      if (
        activity.kind !== "multiple_choice" &&
        activity.kind !== "fill_gap_choice"
      )
        continue;

      const texts = activity.options.map((o) => o.text);
      assert.equal(
        new Set(texts).size,
        texts.length,
        `${lessonId}/${activity.id}: duplicate option text`,
      );

      const correctOptions = activity.options.filter(
        (o) => o.id === activity.correctOptionId,
      );
      assert.equal(
        correctOptions.length,
        1,
        `${lessonId}/${activity.id}: expected exactly one correct option`,
      );
      assert.ok(
        activity.options.length >= 2,
        `${lessonId}/${activity.id}: fewer than 2 options`,
      );
    }
  }
});

test("every fill_gap_choice has a usable prompt/sentence containing a blank", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    for (const activity of plan) {
      if (activity.kind !== "fill_gap_choice") continue;
      assert.ok(
        activity.prompt.trim().length > 0,
        `${lessonId}/${activity.id}: empty prompt`,
      );
      assert.ok(
        activity.content.sentence.includes("___"),
        `${lessonId}/${activity.id}: sentence has no blank`,
      );
    }
  }
});

test("every typed_recall has at least one non-empty accepted answer", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    for (const activity of plan) {
      if (activity.kind !== "typed_recall") continue;
      assert.ok(
        activity.acceptedAnswers.length > 0 &&
          activity.acceptedAnswers.every((a) => a.trim().length > 0),
        `${lessonId}/${activity.id}: no usable accepted answer`,
      );
    }
  }
});

test("every sentence_build has a deterministic correct order matching its own tokens", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    for (const activity of plan) {
      if (activity.kind !== "sentence_build") continue;
      assert.ok(
        activity.content.tokens.length >= 3,
        `${lessonId}/${activity.id}: too few tokens`,
      );
      assert.ok(
        activity.correctAnswer.trim().length > 0,
        `${lessonId}/${activity.id}: empty correct answer`,
      );
      const tokenMultiset = [...activity.content.tokens].sort();
      const correctTokens = activity.correctAnswer.trim().split(/\s+/).sort();
      assert.deepEqual(
        tokenMultiset,
        correctTokens,
        `${lessonId}/${activity.id}: tokens don't match the correct sentence`,
      );
    }
  }
});

test("no activity leaks an answer key through the public ActivityDTO mapping", async () => {
  const { toActivityDTO } = await import("../src/lessonEngine/activityDto.ts");
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  for (const { lessonId, levelId } of lessons.slice(0, 6)) {
    const plan = await planFor(db, lessonId, levelId);
    plan.forEach((activity, i) => {
      // Check top-level keys only — grammar_card legitimately has a
      // `content.explanation` (the grammar explanation itself, always
      // public); it's a *top-level* `explanation` (the wrong-answer hint
      // on scored kinds) that must never leak before answering.
      const dto = toActivityDTO(activity, i, plan.length) as Record<
        string,
        unknown
      >;
      for (const forbidden of [
        "correctOptionId",
        "acceptedAnswers",
        "correctAnswer",
        "isRetry",
        "targetId",
        "explanation",
      ]) {
        assert.equal(
          Object.prototype.hasOwnProperty.call(dto, forbidden),
          false,
          `${lessonId}/${activity.id}: leaked "${forbidden}"`,
        );
      }
      // `targetType` is the one deliberate exception: not an answer key,
      // just "learning_item" vs "grammar_pattern" so ActivityPanel.tsx
      // knows whether content.text is redundant with the prompt.
      if (dto.kind === "multiple_choice") {
        assert.ok(
          dto.targetType === "learning_item" ||
            dto.targetType === "grammar_pattern",
          `${lessonId}/${activity.id}: multiple_choice must carry a valid targetType`,
        );
      } else {
        assert.equal(
          Object.prototype.hasOwnProperty.call(dto, "targetType"),
          false,
          `${lessonId}/${activity.id}: leaked "targetType" on a ${String(dto.kind)}`,
        );
      }
    });
  }
});

test("not every learning item uses every activity kind (review/practice roles are lighter-touch)", async () => {
  const db = await seeded();
  const plan = await planFor(db, "les_a1_01_04", "lvl_a1"); // Mixed Practice: review/practice roles
  const kinds = new Set(plan.map((a) => a.kind));
  assert.equal(
    kinds.has("info_card"),
    false,
    "review/practice items should not get an info_card",
  );
  assert.equal(
    kinds.has("typed_recall"),
    false,
    "review/practice items should not get typed_recall",
  );
});

test("all six activity kinds are exercised somewhere across the seeded A1 curriculum", async () => {
  const db = await seeded();
  const lessons = (await allPublishedLessons(db)).filter(
    (l) => l.levelId === "lvl_a1",
  );
  const seenKinds = new Set<string>();
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    for (const activity of plan) seenKinds.add(activity.kind);
  }
  for (const kind of [
    "info_card",
    "grammar_card",
    "multiple_choice",
    "fill_gap_choice",
    "typed_recall",
    "sentence_build",
  ]) {
    assert.ok(
      seenKinds.has(kind),
      `no ${kind} activity generated anywhere in A1`,
    );
  }
});

// --- sentence_build shuffle (a genuine seeded shuffle, not alphabetical) ------

test("seededShuffle is deterministic for the same seed", () => {
  const tokens = ["I", "try", "to", "avoid", "eating", "late", "."];
  const first = seededShuffle(tokens, "itm_a1_avoid");
  const second = seededShuffle(tokens, "itm_a1_avoid");
  assert.deepEqual(first, second);
});

test("seededShuffle produces different orders for different seeds", () => {
  const tokens = ["I", "try", "to", "avoid", "eating", "late", "."];
  const a = seededShuffle(tokens, "seed-a");
  const b = seededShuffle(tokens, "seed-b");
  assert.notDeepEqual(a, b);
});

test("seededShuffle preserves every original token, including duplicates", () => {
  const tokens = ["do", "you", "do", "it", "again"];
  const shuffled = seededShuffle(tokens, "dup-seed");
  assert.deepEqual([...shuffled].sort(), [...tokens].sort());
  assert.equal(shuffled.length, tokens.length);
});

test("seededShuffle is not a sorted/alphabetical reordering", () => {
  const tokens = ["zebra", "apple", "mango", "banana", "cherry"];
  const shuffled = seededShuffle(tokens, "not-sorted-seed");
  const alphabetical = [...tokens].sort((a, b) => a.localeCompare(b));
  assert.notDeepEqual(shuffled, alphabetical);
});

test("seededShuffle normally differs from the original order, across many real seeds", async () => {
  const db = await seeded();
  const lessons = await allPublishedLessons(db);
  let total = 0;
  let unchanged = 0;
  for (const { lessonId, levelId } of lessons) {
    const plan = await planFor(db, lessonId, levelId);
    for (const activity of plan) {
      if (activity.kind !== "sentence_build") continue;
      total++;
      const canonical = activity.correctAnswer.trim().split(/\s+/);
      if (activity.content.tokens.join(" ") === canonical.join(" "))
        unchanged++;
    }
  }
  assert.ok(total > 0, "expected at least one sentence_build activity");
  // A single-swap fallback guarantees a difference for length > 1, so in
  // practice this should be 0 — assert "mostly differs" rather than
  // "always" to stay robust to future content additions.
  assert.ok(
    unchanged / total < 0.2,
    `expected most sentence_build activities to be shuffled; ${unchanged}/${total} matched the original order`,
  );
});

test("a real seeded example with a repeated word ('do you do') shuffles without losing or duplicating tokens", async () => {
  const db = await seeded();
  // itm_a1_free_time's example is "What do you do in your free time?" —
  // "do" appears twice.
  const plan = await planFor(db, "les_a1_02_01", "lvl_a1");
  const activity = plan.find(
    (a) => a.kind === "sentence_build" && a.targetId === "itm_a1_free_time",
  );
  assert.ok(activity, "expected a sentence_build for itm_a1_free_time");
  if (!activity || activity.kind !== "sentence_build") return;

  const canonical = activity.correctAnswer.trim().split(/\s+/);
  assert.deepEqual([...activity.content.tokens].sort(), [...canonical].sort());
  assert.equal(
    activity.content.tokens.filter((t) => t.toLowerCase() === "do").length,
    2,
  );
});

test("no correct-order metadata leaks through the sentence_build ActivityDTO", async () => {
  const { toActivityDTO } = await import("../src/lessonEngine/activityDto.ts");
  const db = await seeded();
  const plan = await planFor(db, "les_a1_01_02", "lvl_a1");
  const index = plan.findIndex((a) => a.kind === "sentence_build");
  assert.notEqual(index, -1);
  const activity = plan[index]!;
  const dto = toActivityDTO(activity, index, plan.length);
  assert.equal(dto.kind, "sentence_build");
  if (dto.kind !== "sentence_build") return;
  assert.deepEqual(Object.keys(dto.content), ["tokens"]);
  assert.deepEqual(Object.keys(dto).sort(), [
    "content",
    "dialogueTurnId",
    "id",
    "kind",
    "npcReply",
    "progress",
    "prompt",
  ]);
});
