import type { DbStatement } from "../db/types.ts";
import type { ContentBundle } from "./contentBundle.ts";

function levelId(code: string): string {
  return `lvl_${code.toLowerCase()}`;
}

function bool(v: boolean | undefined, fallback: 0 | 1): 0 | 1 {
  if (v === undefined) return fallback;
  return v ? 1 : 0;
}

/**
 * `INSERT ... ON CONFLICT(...) DO UPDATE SET ...` for every column except
 * the conflict key(s) and `created_at` (which should only ever be set once,
 * at first insert — re-seeding must not reset it). This is what makes
 * seeding idempotent: running it twice updates existing rows in place
 * instead of erroring or duplicating them.
 */
function upsert(
  table: string,
  columns: string[],
  conflictColumns: string[],
  values: unknown[],
): DbStatement {
  const updateColumns = columns.filter(
    (c) => !conflictColumns.includes(c) && c !== "created_at",
  );
  const placeholders = columns.map(() => "?").join(", ");
  // A pure relation row (e.g. item_relations) has no columns besides the
  // conflict key — nothing to update, so re-inserting the same key is a
  // genuine no-op rather than an (invalid) empty SET clause.
  const conflictAction = updateColumns.length
    ? `DO UPDATE SET ${updateColumns.map((c) => `${c} = excluded.${c}`).join(", ")}`
    : "DO NOTHING";
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
    ON CONFLICT(${conflictColumns.join(", ")}) ${conflictAction}`;
  return { sql, params: values };
}

/**
 * Builds the full, ordered set of upsert statements for a validated
 * content bundle. Order matters: parents (modules, lessons, learning
 * items, grammar patterns) must be upserted before anything that
 * references them, since foreign keys are checked per-statement, not
 * deferred to the end of the transaction.
 */
export function buildSeedStatements(
  bundle: ContentBundle,
  now: string,
): DbStatement[] {
  const statements: DbStatement[] = [];

  // `(level_id, order_index)` and `(module_id, order_index)` are unique, so
  // re-ordering existing content would collide with rows that haven't been
  // rewritten yet. Parking every seeded row on a negative order first makes
  // the upserts below order-independent — and re-seeding stays idempotent,
  // because the real order is written right after.
  for (const m of bundle.modules) {
    statements.push({
      sql: "UPDATE modules SET order_index = ? WHERE id = ?",
      params: [-1000 - m.order, m.id],
    });
  }
  for (const l of bundle.lessons) {
    statements.push({
      sql: "UPDATE lessons SET order_index = ? WHERE id = ?",
      params: [-1000 - l.order, l.id],
    });
  }

  for (const m of bundle.modules) {
    statements.push(
      upsert(
        "modules",
        [
          "id",
          "level_id",
          "title",
          "slug",
          "description",
          "order_index",
          "status",
          "content_version",
          "created_at",
          "updated_at",
        ],
        ["id"],
        [
          m.id,
          levelId(m.levelCode),
          m.title,
          m.slug,
          m.description ?? null,
          m.order,
          m.status ?? "published",
          1,
          now,
          now,
        ],
      ),
    );
  }

  for (const l of bundle.lessons) {
    statements.push(
      upsert(
        "lessons",
        [
          "id",
          "module_id",
          "title",
          "lesson_type",
          "order_index",
          "estimated_minutes",
          "status",
          "situation_title",
          "scene",
          "capability",
          "teaser",
          "content_version",
          "created_at",
          "updated_at",
        ],
        ["id"],
        [
          l.id,
          l.moduleId,
          l.title,
          l.lessonType,
          l.order,
          l.estimatedMinutes ?? null,
          l.status ?? "published",
          l.situationTitle ?? null,
          l.scene ?? null,
          l.capability ?? null,
          l.teaser ?? null,
          1,
          now,
          now,
        ],
      ),
    );
  }

  for (const it of bundle.learningItems) {
    statements.push(
      upsert(
        "learning_items",
        [
          "id",
          "item_type",
          "lemma",
          "display_form",
          "part_of_speech",
          "level_id",
          "frequency_band",
          "difficulty",
          "is_core",
          "topic",
          "subtopic",
          "pronunciation_ipa",
          "audio_key",
          "provenance",
          "status",
          "content_version",
          "npc_reply_correct",
          "npc_reply_incorrect",
          "created_at",
          "updated_at",
        ],
        ["id"],
        [
          it.id,
          it.itemType,
          it.lemma,
          it.displayForm,
          it.partOfSpeech ?? null,
          levelId(it.levelCode),
          it.frequencyBand ?? null,
          it.difficulty ?? null,
          bool(it.isCore, 1),
          it.topic ?? null,
          it.subtopic ?? null,
          it.pronunciationIpa ?? null,
          it.audioKey ?? null,
          "original",
          "published",
          1,
          it.npcReplyCorrect ?? null,
          it.npcReplyIncorrect ?? null,
          now,
          now,
        ],
      ),
    );

    statements.push(
      upsert(
        "learning_item_localizations",
        [
          "item_id",
          "language",
          "translation",
          "simple_explanation",
          "usage_note",
          "common_error_explanation",
          "status",
          "content_version",
        ],
        ["item_id", "language"],
        [
          it.id,
          "ru",
          it.ru.translation,
          it.ru.simpleExplanation ?? null,
          it.ru.usageNote ?? null,
          it.ru.commonErrorExplanation ?? null,
          "published",
          1,
        ],
      ),
    );

    for (const ex of it.examples) {
      statements.push(
        upsert(
          "item_examples",
          [
            "id",
            "item_id",
            "example_text",
            "level_id",
            "is_primary",
            "status",
            "content_version",
          ],
          ["id"],
          [
            ex.id,
            it.id,
            ex.text,
            ex.levelCode ? levelId(ex.levelCode) : levelId(it.levelCode),
            ex.isPrimary ? 1 : 0,
            "published",
            1,
          ],
        ),
      );
    }

    for (const p of it.patterns ?? []) {
      statements.push(
        upsert(
          "item_patterns",
          [
            "id",
            "item_id",
            "pattern_text",
            "correct_example",
            "incorrect_example",
            "order_index",
          ],
          ["id"],
          [
            p.id,
            it.id,
            p.patternText,
            p.correctExample ?? null,
            p.incorrectExample ?? null,
            p.order,
          ],
        ),
      );
    }
  }

  for (const rel of bundle.itemRelations) {
    statements.push(
      upsert(
        "item_relations",
        ["from_item_id", "to_item_id", "relation_type"],
        ["from_item_id", "to_item_id", "relation_type"],
        [rel.fromItemId, rel.toItemId, rel.relationType],
      ),
    );
  }

  for (const g of bundle.grammarPatterns) {
    statements.push(
      upsert(
        "grammar_patterns",
        [
          "id",
          "level_id",
          "title",
          "pattern_key",
          "formula",
          "explanation_en",
          "difficulty",
          "order_index",
          "status",
          "content_version",
          "created_at",
          "updated_at",
        ],
        ["id"],
        [
          g.id,
          levelId(g.levelCode),
          g.title,
          g.patternKey,
          g.formula ?? null,
          g.explanationEn,
          g.difficulty ?? null,
          g.order,
          "published",
          1,
          now,
          now,
        ],
      ),
    );

    statements.push(
      upsert(
        "grammar_pattern_localizations",
        [
          "grammar_pattern_id",
          "language",
          "explanation",
          "usage_note",
          "common_mistake",
        ],
        ["grammar_pattern_id", "language"],
        [
          g.id,
          "ru",
          g.ru.explanation,
          g.ru.usageNote ?? null,
          g.ru.commonMistake ?? null,
        ],
      ),
    );
  }

  for (const rel of bundle.grammarRelations) {
    statements.push(
      upsert(
        "grammar_relations",
        ["from_pattern_id", "to_pattern_id", "relation_type"],
        ["from_pattern_id", "to_pattern_id", "relation_type"],
        [rel.fromPatternId, rel.toPatternId, rel.relationType],
      ),
    );
  }

  for (const link of bundle.lessonItems) {
    statements.push(
      upsert(
        "lesson_items",
        [
          "id",
          "lesson_id",
          "content_type",
          "content_id",
          "role",
          "order_index",
          "required",
        ],
        ["id"],
        [
          link.id,
          link.lessonId,
          link.contentType,
          link.contentId,
          link.role,
          link.order,
          bool(link.required, 1),
        ],
      ),
    );
  }

  return statements;
}
