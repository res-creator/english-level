import type {
  Db,
  GrammarPatternLocalizationRow,
  GrammarPatternRow,
} from "../db/types.ts";

export function findPublishedGrammarPatternById(
  db: Db,
  patternId: string,
): Promise<GrammarPatternRow | null> {
  return db.first<GrammarPatternRow>(
    "SELECT * FROM grammar_patterns WHERE id = ? AND status = 'published'",
    [patternId],
  );
}

export function findGrammarPatternLocalization(
  db: Db,
  patternId: string,
  language: string,
): Promise<GrammarPatternLocalizationRow | null> {
  return db.first<GrammarPatternLocalizationRow>(
    "SELECT * FROM grammar_pattern_localizations WHERE grammar_pattern_id = ? AND language = ?",
    [patternId, language],
  );
}

/** Fallback distractor source for the "which pattern is this?" check —
 * other published patterns at the same level, deterministically ordered. */
export function listOtherPublishedGrammarPatterns(
  db: Db,
  levelId: string,
  excludePatternId: string,
  limit: number,
): Promise<GrammarPatternRow[]> {
  return db.all<GrammarPatternRow>(
    `SELECT * FROM grammar_patterns
     WHERE level_id = ? AND status = 'published' AND id != ?
     ORDER BY id ASC LIMIT ?`,
    [levelId, excludePatternId, limit],
  );
}
