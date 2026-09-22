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
