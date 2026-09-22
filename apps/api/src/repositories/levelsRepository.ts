import type { Db, LevelRow } from "../db/types.ts";

export function listActiveLevels(db: Db): Promise<LevelRow[]> {
  return db.all<LevelRow>(
    "SELECT * FROM levels WHERE is_active = 1 ORDER BY order_index ASC",
  );
}

export function findLevelById(db: Db, id: string): Promise<LevelRow | null> {
  return db.first<LevelRow>("SELECT * FROM levels WHERE id = ?", [id]);
}
