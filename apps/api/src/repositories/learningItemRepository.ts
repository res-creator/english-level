import type {
  Db,
  ItemExampleRow,
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
