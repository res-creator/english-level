#!/usr/bin/env node
/**
 * Semi-automated grammar consistency check — CONTENT_PRODUCTION_PLAN.md §7.
 *
 * V2's rule: every construction in a situation's key phrases is either a
 * real Grammar Target (a `grammar_patterns` row, backed by an actually-
 * evidenced phrase) or an explicit Lexical Chunk — never an unclassified
 * "light intro". This script enforces that mechanically wherever it can,
 * and flags what it can't for a human (Gate B).
 *
 * Inputs:
 *  - the real, validated seed content (`loadSeedContent()` — the exact
 *    same bundle `generateSeedSql.ts` renders) for which grammar patterns
 *    are actually attached to which situations;
 *  - `seeds/content-notes/grammar-classification.json`, a small,
 *    hand-authored, NOT schema-validated, NOT loaded at runtime worksheet
 *    that records, per situation, which key phrases are which
 *    classification. This file has zero effect on the running app — it
 *    exists purely for this lint and for CONTENT_PRODUCTION_TRACKER.md.
 *
 * Checks:
 *  A. Every grammar_pattern attached to a situation via lesson_items
 *     (role "target" or "introduce") has at least one phrase in the
 *     worksheet classified "target" and pointing at it. This is exactly
 *     the "grammar tag with no matching key phrase" failure mode found
 *     15 times by hand in the V2 audit — mechanized here.
 *  B. Every worksheet phrase references a real learning_item id that
 *     actually exists in the seed content (catches stale entries).
 *  C. Every "target"-classified phrase is heuristically scanned for
 *     above-level construction signatures (Present Perfect, used to,
 *     question tags, cleft sentences, modal+have+participle) — a hit
 *     here doesn't fail the lint (it's advisory, Gate B still needs a
 *     human), it's printed as a note to double-check the classification.
 *
 * Usage:
 *   node --experimental-strip-types apps/api/scripts/lintGrammarClassification.ts
 * Exit code is non-zero iff check A or B failed. Run before every
 * content batch commit (Gate A, per CONTENT_PRODUCTION_PLAN.md §11).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadSeedContent } from "../src/content/loadSeedContent.ts";

const NOTES_PATH = fileURLToPath(
  new URL(
    "../../../seeds/content-notes/grammar-classification.json",
    import.meta.url,
  ),
);

type Classification = "target" | "chunk";

interface ClassifiedPhrase {
  text: string;
  itemId?: string;
  classification: Classification;
  grammarPatternId?: string;
  chunkLabel?: string;
}

interface SituationClassification {
  situationId: string;
  phrases: ClassifiedPhrase[];
}

/** Above-A1/A2-level construction signatures, heuristic only — a hit is a
 * prompt to double-check, not proof of anything. Deliberately coarse: it
 * exists to narrow what a human re-checks (Gate B), never to replace it. */
const ABOVE_LEVEL_SIGNATURES: { label: string; re: RegExp }[] = [
  {
    label: "Present Perfect (have/has/had + past participle)",
    re: /\b(have|has|had|'ve|'s|'d)\b[\s\S]{0,20}\b(been|done|gone|had|made|seen|taken|told|worked|lived|tried|bought|lost|heard|written|eaten|found|met|got|given|known|thought|kept|left|felt|held|read|sent|shown|spoken|stood|understood|won)\b/i,
  },
  { label: "used to (past habit)", re: /\bused to\b/i },
  {
    label: "question tag",
    re: /,\s*(isn't|aren't|wasn't|weren't|don't|doesn't|didn't|can't|won't|wouldn't|shouldn't|haven't|hasn't)\s+\w+\?/i,
  },
  {
    label: "cleft sentence (what ... was)",
    re: /\bwhat\s+\w[\s\S]{0,20}\bwas\b/i,
  },
  {
    label: "modal + have + past participle",
    re: /\b(should|would|could|might|must)\s+have\b/i,
  },
  {
    label: "mixed/unreal conditional",
    re: /\bif\s+\w[\s\S]{0,30}\bwould have\b/i,
  },
];

const B1_LEVEL_CONSTRUCTIONS = new Set([
  "Present Perfect (have/has/had + past participle)",
  "used to (past habit)",
  "question tag",
]);

function loadClassifications(): SituationClassification[] {
  const raw = readFileSync(NOTES_PATH, "utf-8");
  return JSON.parse(raw) as SituationClassification[];
}

async function main(): Promise<void> {
  const bundle = loadSeedContent();
  const notes = loadClassifications();
  const notesBySituation = new Map(notes.map((n) => [n.situationId, n]));

  const realItemIds = new Set(bundle.learningItems.map((i) => i.id));
  const moduleById = new Map(
    bundle.modules.map((module) => [module.id, module]),
  );
  const levelBySituation = new Map(
    bundle.lessons.map((lesson) => [
      lesson.id,
      moduleById.get(lesson.moduleId)?.levelCode,
    ]),
  );

  // Scope the continuous-situation curriculum (les_sie_*, sit_a1_*, and
  // the explicitly authored V2 A2/B1/B2 situation ids). Legacy mixed-practice
  // lessons remain out of scope.
  const isAuthoredSituation = (id: string) =>
    id.startsWith("les_sie_") ||
    id.startsWith("sit_a1_") ||
    /^(sit_a2_(people_01|people_02|cafe_01|restaurant_01|restaurant_02|travel_01|travel_02|daily_01|daily_02|shop_01|shop_02|health_01|work_01|work_02|social_01|problems_01|problems_02)|sit_b1_(people_01|people_02|cafe_01|restaurant_01|restaurant_02|travel_01|travel_02|daily_01|daily_02|shop_01|shop_02|health_01|work_01|work_02|work_03|social_01|social_02|problems_01|problems_02)|sit_b2_(people_01|restaurant_01|restaurant_02|travel_01|travel_02|daily_01|shop_01|work_01|work_02|work_03|work_04|social_01))$/.test(
      id,
    );

  // Which grammar_patterns are actually attached (as target/introduce) to
  // which situations, per the real seed content.
  const attachedPatterns = new Map<string, Set<string>>();
  let skippedOutOfScope = 0;
  for (const link of bundle.lessonItems) {
    if (link.contentType !== "grammar_pattern") continue;
    if (link.role !== "target" && link.role !== "introduce") continue;
    if (!isAuthoredSituation(link.lessonId)) {
      skippedOutOfScope++;
      continue;
    }
    const set = attachedPatterns.get(link.lessonId) ?? new Set<string>();
    set.add(link.contentId);
    attachedPatterns.set(link.lessonId, set);
  }

  let errors = 0;
  let advisories = 0;

  console.log(
    "=== Check A: every attached grammar target has a backing phrase ===",
  );
  for (const [situationId, patternIds] of attachedPatterns) {
    const note = notesBySituation.get(situationId);
    for (const patternId of patternIds) {
      const backed = note?.phrases.some(
        (p) =>
          p.classification === "target" && p.grammarPatternId === patternId,
      );
      if (backed) {
        console.log(`  OK    ${situationId} / ${patternId}`);
      } else {
        console.log(
          `  ERROR ${situationId} / ${patternId} — attached but no worksheet phrase classifies it as "target". ` +
            (note
              ? `(${situationId} has a worksheet entry, but none of its phrases point at this pattern.)`
              : `(${situationId} has no worksheet entry at all yet.)`),
        );
        errors++;
      }
    }
  }

  console.log(
    "\n=== Check B: every worksheet phrase references a real learning item ===",
  );
  for (const note of notes) {
    for (const phrase of note.phrases) {
      if (!phrase.itemId) continue;
      if (realItemIds.has(phrase.itemId)) {
        console.log(
          `  OK    ${note.situationId} / "${phrase.text}" -> ${phrase.itemId}`,
        );
      } else {
        console.log(
          `  ERROR ${note.situationId} / "${phrase.text}" -> ${phrase.itemId} does not exist in the seed content (stale worksheet entry?)`,
        );
        errors++;
      }
    }
  }

  console.log(
    '\n=== Check C (advisory): above-level construction heuristics on "target" phrases ===',
  );
  for (const note of notes) {
    for (const phrase of note.phrases) {
      if (phrase.classification !== "target") continue;
      for (const sig of ABOVE_LEVEL_SIGNATURES) {
        if (
          levelBySituation.get(note.situationId) === "B2" &&
          sig.label === "cleft sentence (what ... was)"
        ) {
          continue;
        }
        if (
          levelBySituation.get(note.situationId) === "B1" &&
          B1_LEVEL_CONSTRUCTIONS.has(sig.label)
        ) {
          continue;
        }
        if (sig.re.test(phrase.text)) {
          console.log(
            `  NOTE  ${note.situationId} / "${phrase.text}" matches "${sig.label}" but is classified "target" — double-check this isn't actually an above-level chunk.`,
          );
          advisories++;
        }
      }
    }
  }

  console.log("\n=== Chunks on record (informational) ===");
  for (const note of notes) {
    for (const phrase of note.phrases) {
      if (phrase.classification !== "chunk") continue;
      console.log(`  CHUNK ${note.situationId} / "${phrase.text}"`);
    }
  }

  console.log(
    `\n${errors} error(s), ${advisories} advisory note(s) across ${notes.length} situation(s) with a worksheet entry, ${attachedPatterns.size} authored situation(s) with an attached grammar target ` +
      `(${skippedOutOfScope} grammar attachment(s) in other tracks skipped as out of scope).`,
  );
  if (errors > 0) {
    process.exitCode = 1;
  }
}

main();
