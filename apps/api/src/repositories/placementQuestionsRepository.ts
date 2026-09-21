import type {
  Db,
  PlacementPassageRow,
  PlacementQuestionRow,
  PlacementSkillRow,
  CefrLevelRow,
} from "../db/types.ts";

export function findQuestionById(
  db: Db,
  id: string,
): Promise<PlacementQuestionRow | null> {
  return db.first<PlacementQuestionRow>(
    "SELECT * FROM placement_questions WHERE id = ?",
    [id],
  );
}

export function findPassageById(
  db: Db,
  id: string,
): Promise<PlacementPassageRow | null> {
  return db.first<PlacementPassageRow>(
    "SELECT * FROM placement_passages WHERE id = ?",
    [id],
  );
}

/**
 * Active questions for a given skill/level in this test version, excluding
 * any already used in the current attempt. Order is stable (by id) so
 * question selection is deterministic for a given exclusion set.
 */
export function findCandidateQuestions(
  db: Db,
  options: {
    testVersion: string;
    skill: PlacementSkillRow;
    cefrLevel: CefrLevelRow;
    excludeIds: string[];
  },
): Promise<PlacementQuestionRow[]> {
  const placeholders = options.excludeIds.map(() => "?").join(", ");
  const excludeClause = options.excludeIds.length
    ? `AND id NOT IN (${placeholders})`
    : "";
  return db.all<PlacementQuestionRow>(
    `SELECT * FROM placement_questions
     WHERE test_version = ? AND skill = ? AND cefr_level = ? AND status = 'active'
     ${excludeClause}
     ORDER BY id ASC`,
    [
      options.testVersion,
      options.skill,
      options.cefrLevel,
      ...options.excludeIds,
    ],
  );
}

export function listAllQuestions(
  db: Db,
  testVersion: string,
): Promise<PlacementQuestionRow[]> {
  return db.all<PlacementQuestionRow>(
    "SELECT * FROM placement_questions WHERE test_version = ? ORDER BY id ASC",
    [testVersion],
  );
}
