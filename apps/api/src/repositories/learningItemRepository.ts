import type {
  Db,
  ItemExampleRow,
  ItemPatternRow,
  LearningItemLocalizationRow,
  LearningItemRow,
} from "../db/types.ts";

export function findPublishedLearningItemById(
  db: Db,
  itemId: string,
): Promise<LearningItemRow | null> {
  return db.first<LearningItemRow>(
    "SELECT * FROM learning_items WHERE id = ? AND status = 'published'",
    [itemId],
  );
}

export function findLearningItemLocalization(
  db: Db,
  itemId: string,
  language: string,
): Promise<LearningItemLocalizationRow | null> {
  return db.first<LearningItemLocalizationRow>(
    "SELECT * FROM learning_item_localizations WHERE item_id = ? AND language = ? AND status = 'published'",
    [itemId, language],
  );
}

export function findPrimaryExample(
  db: Db,
  itemId: string,
): Promise<ItemExampleRow | null> {
  return db.first<ItemExampleRow>(
    "SELECT * FROM item_examples WHERE item_id = ? AND is_primary = 1 AND status = 'published'",
    [itemId],
  );
}

/** Not every item has a usage pattern — used to enrich an info_card when
 * one exists (e.g. "avoid + verb-ing"), never required. */
export function findPrimaryPattern(
  db: Db,
  itemId: string,
): Promise<ItemPatternRow | null> {
  return db.first<ItemPatternRow>(
    "SELECT * FROM item_patterns WHERE item_id = ? ORDER BY order_index ASC LIMIT 1",
    [itemId],
  );
}

/**
 * IDs of items related to `itemId` (either direction — relations are
 * stored as one directed row per pair, e.g. "single" -> "married"). Used
 * as the first, highest-quality source of multiple-choice distractors.
 */
export async function listRelatedItemIds(
  db: Db,
  itemId: string,
): Promise<string[]> {
  const rows = await db.all<{ related_id: string }>(
    `SELECT to_item_id as related_id FROM item_relations WHERE from_item_id = ?
     UNION
     SELECT from_item_id as related_id FROM item_relations WHERE to_item_id = ?
     ORDER BY related_id ASC`,
    [itemId, itemId],
  );
  return rows.map((r) => r.related_id);
}

/**
 * Fallback distractor source: other published items at the same level,
 * deterministically ordered (never random) so generation is stable.
 */
export function listOtherPublishedItemIds(
  db: Db,
  levelId: string,
  excludeItemId: string,
  limit: number,
): Promise<LearningItemRow[]> {
  return db.all<LearningItemRow>(
    `SELECT * FROM learning_items
     WHERE level_id = ? AND status = 'published' AND id != ?
     ORDER BY id ASC LIMIT ?`,
    [levelId, excludeItemId, limit],
  );
}
