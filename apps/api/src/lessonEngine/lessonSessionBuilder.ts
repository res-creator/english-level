import type {
  Db,
  ItemExampleRow,
  LearningItemRow,
  LessonItemRow,
} from "../db/types.ts";
import {
  findLearningItemLocalization,
  findPrimaryExample,
  findPrimaryPattern,
  findPublishedLearningItemById,
  listOtherPublishedItemIds,
  listRelatedItemIds,
} from "../repositories/learningItemRepository.ts";
import {
  findGrammarPatternLocalization,
  findPublishedGrammarPatternById,
  listOtherPublishedGrammarPatterns,
} from "../repositories/grammarRepository.ts";
import type {
  ScoredActivity,
  StoredActivity,
  StoredActivityOption,
  StoredFillGapChoice,
  StoredMultipleChoice,
  StoredSentenceBuild,
  StoredTypedRecall,
} from "./activityTypes.ts";

/** Only Russian is seeded for V1 — matches curriculumService. */
const CONTENT_LANGUAGE = "ru";

/**
 * Deterministic plan generation. See docs/lesson-engine.md for the full
 * rationale — summary:
 *  - `introduce` learning items get the full new-item sequence:
 *    info_card -> recognition multiple_choice -> fill_gap_choice (or a
 *    context multiple_choice fallback when the target word can't be
 *    masked cleanly out of its example) -> optionally one typed_recall
 *    (single words) or sentence_build (phrases with a long enough
 *    example). A new item never opens with typed recall.
 *  - `practice` learning items (a Practice Variation, see
 *    CONTENT_PRODUCTION_PLAN.md §2/§9) get the same sequence minus
 *    info_card — the learner already knows the underlying item, but the
 *    check must still be production-capable, not just recognition.
 *  - `review` (and `target`, for a learning item — grammar_pattern is the
 *    only current user of `target`) get one lighter-touch multiple_choice
 *    only.
 *  - grammar_pattern items get grammar_card -> a "what's the rule here?"
 *    recognition multiple_choice built from title/formula (Phase 5's
 *    schema has no correct/incorrect example pair to build a scored
 *    check from directly — a documented V1 simplification).
 * No randomness anywhere: same lesson content -> same exact plan, always.
 */
export async function buildActivityPlan(
  db: Db,
  levelId: string,
  lessonItems: LessonItemRow[],
): Promise<StoredActivity[]> {
  const activities: StoredActivity[] = [];
  for (const link of lessonItems) {
    if (link.content_type === "grammar_pattern") {
      activities.push(...(await buildGrammarActivities(db, levelId, link)));
    } else {
      activities.push(
        ...(await buildLearningItemActivities(db, levelId, link)),
      );
    }
  }
  return activities.map((activity, index) => ({
    ...activity,
    id: activityId(index),
  }));
}

/**
 * A single activity for one content item, at a chosen difficulty. Used by
 * the Mission (production only — the learner has to generate language
 * rather than recognise it) and by spaced review, where the format gets
 * harder as an item's memory box grows. Returns null when the item can't
 * support the requested format (e.g. no example to build a sentence from),
 * so callers can fall back a rung.
 */
export type ActivityMode = "recognition" | "context" | "production";

export async function buildItemActivity(
  db: Db,
  levelId: string,
  link: LessonItemRow,
  mode: ActivityMode,
): Promise<ScoredActivity | null> {
  if (link.content_type === "grammar_pattern") {
    const activities = await buildGrammarActivities(db, levelId, {
      ...link,
      role: "practice",
    });
    const scored = activities.find((a) => a.kind === "multiple_choice");
    return (scored as ScoredActivity | undefined) ?? null;
  }

  const item = await findPublishedLearningItemById(db, link.content_id);
  if (!item) return null;
  const localization = await findLearningItemLocalization(
    db,
    item.id,
    CONTENT_LANGUAGE,
  );
  const translation = localization?.translation ?? "";
  const example = await findPrimaryExample(db, item.id);
  const explanation = localization?.usage_note ?? example?.example_text ?? null;

  if (mode === "production") {
    const recall = buildExtraRecall(item, translation, example, explanation);
    if (recall) return recall;
    const gap = await buildFillGap(db, levelId, item, example, explanation);
    if (gap) return gap;
  }
  if (mode === "context") {
    const gap = await buildFillGap(db, levelId, item, example, explanation);
    if (gap) return gap;
  }
  try {
    return await buildRecognitionMC(
      db,
      levelId,
      item,
      translation,
      explanation,
    );
  } catch {
    // Not enough distractors at this level to build an honest question.
    return null;
  }
}

/** One deterministic alternate-question retry, inserted a few activities
 * after a wrong answer. V1 simplification: re-asks the SAME activity
 * (same kind/content) rather than synthesizing a different kind, so it
 * needs no extra content generation at answer time — documented in
 * docs/lesson-engine.md. `isRetry` stops a wrong retry from retrying
 * again. */
export function cloneForRetry(
  activity: ScoredActivity,
  newId: string,
): ScoredActivity {
  return { ...activity, id: newId, isRetry: true };
}

function activityId(index: number): string {
  return `act_${String(index + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Option / distractor generation — deterministic, never random.
// ---------------------------------------------------------------------------

function buildOptions(
  correctText: string,
  distractorTexts: string[],
  maxOptions = 4,
): { options: StoredActivityOption[]; correctOptionId: string } {
  const seen = new Set([correctText]);
  const distractors: string[] = [];
  for (const text of distractorTexts) {
    if (!text || seen.has(text)) continue;
    seen.add(text);
    distractors.push(text);
    if (distractors.length >= maxOptions - 1) break;
  }
  const letters = ["a", "b", "c", "d", "e"];
  const all = [correctText, ...distractors].sort((a, b) => a.localeCompare(b));
  const options = all.map((text, i) => ({ id: letters[i] ?? `opt${i}`, text }));
  const correctOptionId = options.find((o) => o.text === correctText)?.id;
  if (!correctOptionId) {
    throw new Error(
      "buildOptions: correct option missing after dedupe — unreachable",
    );
  }
  return { options, correctOptionId };
}

async function collectDistractorTexts(
  db: Db,
  itemId: string,
  levelId: string,
  count: number,
  fieldOf: (item: LearningItemRow) => Promise<string | null>,
): Promise<string[]> {
  const texts: string[] = [];
  const relatedIds = await listRelatedItemIds(db, itemId);
  for (const id of relatedIds) {
    if (texts.length >= count) break;
    const related = await findPublishedLearningItemById(db, id);
    if (!related) continue;
    const text = await fieldOf(related);
    if (text) texts.push(text);
  }
  if (texts.length < count) {
    const fallback = await listOtherPublishedItemIds(
      db,
      levelId,
      itemId,
      count * 3,
    );
    for (const other of fallback) {
      if (texts.length >= count) break;
      const text = await fieldOf(other);
      if (text) texts.push(text);
    }
  }
  return texts;
}

function translationOf(db: Db) {
  return async (item: LearningItemRow): Promise<string | null> => {
    const loc = await findLearningItemLocalization(
      db,
      item.id,
      CONTENT_LANGUAGE,
    );
    return loc?.translation ?? null;
  };
}

function displayFormOf(item: LearningItemRow): Promise<string | null> {
  return Promise.resolve(item.display_form);
}

// ---------------------------------------------------------------------------
// Grammar patterns
// ---------------------------------------------------------------------------

async function buildGrammarActivities(
  db: Db,
  levelId: string,
  link: LessonItemRow,
): Promise<StoredActivity[]> {
  const pattern = await findPublishedGrammarPatternById(db, link.content_id);
  if (!pattern) {
    throw new Error(
      `Lesson item ${link.id} references a missing/unpublished grammar pattern (${link.content_id})`,
    );
  }
  const localization = await findGrammarPatternLocalization(
    db,
    pattern.id,
    CONTENT_LANGUAGE,
  );
  const explanation = localization?.explanation ?? pattern.explanation_en;

  // Only the first ("target"/introduce) appearance of a pattern shows the
  // full card — a later review/practice appearance (e.g. a mixed-practice
  // lesson reusing the same pattern) goes straight to the recognition
  // check, mirroring the learning_item introduce-vs-other-roles rule.
  const showCard = link.role === "target" || link.role === "introduce";
  const grammarCard: StoredActivity | null = showCard
    ? {
        id: "",
        kind: "grammar_card",
        targetType: "grammar_pattern",
        targetId: pattern.id,
        content: {
          title: pattern.title,
          formula: pattern.formula,
          explanation,
        },
      }
    : null;

  const distractorPatterns = await listOtherPublishedGrammarPatterns(
    db,
    levelId,
    pattern.id,
    6,
  );
  const distractorTitles = distractorPatterns.map((p) => p.title);
  if (distractorTitles.length === 0) {
    throw new Error(
      `No distractor grammar patterns available at level ${levelId} to build a check for ${pattern.id}`,
    );
  }
  const { options, correctOptionId } = buildOptions(
    pattern.title,
    distractorTitles,
  );

  const mc: StoredMultipleChoice = {
    id: "",
    kind: "multiple_choice",
    targetType: "grammar_pattern",
    targetId: pattern.id,
    // "Which pattern is this?" read as a floating, disconnected quiz
    // question when the example it's actually about ("this") was never
    // shown anywhere on screen — see ActivityPanel.tsx, which now
    // renders `content.text` for exactly this reason. "What's the rule
    // here?" only makes sense once there's a visible "here" to point at.
    prompt: "What's the rule here?",
    content: { text: pattern.formula ?? pattern.title },
    options,
    correctOptionId,
    explanation,
  };

  return grammarCard ? [grammarCard, mc] : [mc];
}

// ---------------------------------------------------------------------------
// Learning items
// ---------------------------------------------------------------------------

async function buildLearningItemActivities(
  db: Db,
  levelId: string,
  link: LessonItemRow,
): Promise<StoredActivity[]> {
  const item = await findPublishedLearningItemById(db, link.content_id);
  if (!item) {
    throw new Error(
      `Lesson item ${link.id} references a missing/unpublished learning item (${link.content_id})`,
    );
  }
  const localization = await findLearningItemLocalization(
    db,
    item.id,
    CONTENT_LANGUAGE,
  );
  const translation = localization?.translation ?? "";
  const example = await findPrimaryExample(db, item.id);
  const pattern = await findPrimaryPattern(db, item.id);
  const explanation = localization?.usage_note ?? example?.example_text ?? null;

  const npcReply = item.npc_reply_correct
    ? { correct: item.npc_reply_correct, incorrect: item.npc_reply_incorrect }
    : undefined;

  // "review": one lighter-touch recognition check only — unchanged from
  // before. "target" (grammar-pattern-only today, but falls through here
  // if ever used for a learning_item) gets the same single-MC treatment
  // it always has. Neither is affected by the practice-role change below.
  if (link.role !== "introduce" && link.role !== "practice") {
    const mc = await buildRecognitionMC(db, levelId, item, translation, explanation);
    return [npcReply ? { ...mc, npcReply } : mc];
  }

  // "practice": a Practice Variation (CONTENT_PRODUCTION_PLAN.md §2/§9) —
  // the learner already knows this item's underlying capability, so it
  // skips info_card, but must still get a real production-capable check
  // (MC + fill_gap/context-MC + optional recall + its own NPC reply), not
  // the bare single MC "review" gets. A variation that only re-tested
  // recognition would not actually exercise transfer — see V2's own
  // "не должна превращаться в обычный review-MC" requirement.
  const activities: StoredActivity[] = [];

  if (link.role === "introduce") {
    activities.push({
      id: "",
      kind: "info_card",
      targetType: "learning_item",
      targetId: item.id,
      content: {
        displayForm: item.display_form,
        translation,
        ipa: item.pronunciation_ipa,
        example: example?.example_text ?? null,
        pattern: pattern?.pattern_text ?? null,
      },
    });
  }

  activities.push(
    await buildRecognitionMC(db, levelId, item, translation, explanation),
  );

  const fillGap = await buildFillGap(db, levelId, item, example, explanation);
  activities.push(
    fillGap ??
      (await buildContextMC(
        db,
        levelId,
        item,
        translation,
        example,
        explanation,
      )),
  );

  const extra = buildExtraRecall(item, translation, example, explanation);
  if (extra) activities.push(extra);

  // Exactly one NPC turn per item, on whichever activity actually ends
  // up last (info_card never gets it — it's index 0, never last, and
  // isn't a conversational turn anyway).
  if (npcReply) {
    const last = activities[activities.length - 1]!;
    activities[activities.length - 1] = { ...last, npcReply };
  }

  return activities;
}

async function buildRecognitionMC(
  db: Db,
  levelId: string,
  item: LearningItemRow,
  translation: string,
  explanation: string | null,
): Promise<StoredMultipleChoice> {
  const distractors = await collectDistractorTexts(
    db,
    item.id,
    levelId,
    3,
    translationOf(db),
  );
  if (distractors.length === 0) {
    throw new Error(
      `No distractor translations available at level ${levelId} to build a check for ${item.id}`,
    );
  }
  const { options, correctOptionId } = buildOptions(translation, distractors);
  return {
    id: "",
    kind: "multiple_choice",
    targetType: "learning_item",
    targetId: item.id,
    prompt: `What does "${item.display_form}" mean?`,
    content: { text: item.display_form },
    options,
    correctOptionId,
    explanation,
  };
}

async function buildFillGap(
  db: Db,
  levelId: string,
  item: LearningItemRow,
  example: ItemExampleRow | null,
  explanation: string | null,
): Promise<StoredFillGapChoice | null> {
  if (!example) return null;
  const masked = maskExample(item.display_form, example.example_text);
  if (!masked) return null;

  const distractors = await collectDistractorTexts(
    db,
    item.id,
    levelId,
    3,
    displayFormOf,
  );
  if (distractors.length === 0) return null;
  const { options, correctOptionId } = buildOptions(
    item.display_form,
    distractors,
  );
  return {
    id: "",
    kind: "fill_gap_choice",
    targetType: "learning_item",
    targetId: item.id,
    prompt: "Complete the sentence.",
    content: { sentence: masked },
    options,
    correctOptionId,
    explanation,
  };
}

/** Fallback recognition check used when the target word can't be cleanly
 * masked out of its example (e.g. an inflected form) — a second
 * multiple_choice, framed with the sentence as context, instead of
 * fill_gap_choice. */
async function buildContextMC(
  db: Db,
  levelId: string,
  item: LearningItemRow,
  translation: string,
  example: ItemExampleRow | null,
  explanation: string | null,
): Promise<StoredMultipleChoice> {
  const distractors = await collectDistractorTexts(
    db,
    item.id,
    levelId,
    3,
    translationOf(db),
  );
  if (distractors.length === 0) {
    throw new Error(
      `No distractor translations available at level ${levelId} to build a fallback check for ${item.id}`,
    );
  }
  const { options, correctOptionId } = buildOptions(translation, distractors);
  return {
    id: "",
    kind: "multiple_choice",
    targetType: "learning_item",
    targetId: item.id,
    prompt: example
      ? `In this sentence, what does "${item.display_form}" mean?`
      : `What does "${item.display_form}" mean?`,
    content: { text: example?.example_text ?? item.display_form },
    options,
    correctOptionId,
    explanation,
  };
}

function buildExtraRecall(
  item: LearningItemRow,
  translation: string,
  example: ItemExampleRow | null,
  explanation: string | null,
): StoredTypedRecall | StoredSentenceBuild | null {
  if (item.item_type === "word") {
    const acceptedAnswers = Array.from(
      new Set([item.display_form, item.lemma]),
    );
    const activity: StoredTypedRecall = {
      id: "",
      kind: "typed_recall",
      targetType: "learning_item",
      targetId: item.id,
      prompt: `Type the English word for "${translation}".`,
      content: { text: translation },
      acceptedAnswers,
      explanation,
    };
    return activity;
  }

  if (example) {
    const tokens = tokenize(example.example_text);
    if (tokens.length >= 3) {
      const activity: StoredSentenceBuild = {
        id: "",
        kind: "sentence_build",
        targetType: "learning_item",
        targetId: item.id,
        prompt: "Put the words in the correct order.",
        content: { tokens: seededShuffle(tokens, item.id) },
        correctAnswer: example.example_text,
        explanation,
      };
      return activity;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function maskExample(displayForm: string, exampleText: string): string | null {
  const idx = exampleText.toLowerCase().indexOf(displayForm.toLowerCase());
  if (idx === -1) return null;
  return (
    exampleText.slice(0, idx) +
    "___" +
    exampleText.slice(idx + displayForm.length)
  );
}

function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

/** FNV-1a string hash -> 32-bit seed. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, dependency-free seeded PRNG. Same seed always
 * produces the same sequence, which is exactly what a deterministic
 * shuffle needs (no external randomization library required). */
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A genuine (Fisher-Yates) shuffle, seeded deterministically from
 * `seed` — the same seed always produces the same permutation, but it is
 * not alphabetical/sorted, so it looks and behaves like a real shuffle.
 * For a short sentence, a fair shuffle can still land back on the
 * original order by chance; when that happens, one deterministic swap
 * (first/last) guarantees a different order without giving up
 * determinism.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rng = mulberry32(hashSeed(seed));
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }
  if (shuffled.length > 1 && shuffled.every((t, i) => t === items[i])) {
    const last = shuffled.length - 1;
    const tmp = shuffled[0]!;
    shuffled[0] = shuffled[last]!;
    shuffled[last] = tmp;
  }
  return shuffled;
}
