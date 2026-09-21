import type { Db, LevelRow } from "../db/types.ts";

export function listActiveLevels(db: Db): Promise<LevelRow[]> {
  return db.all<LevelRow>(
    "SELECT * FROM levels WHERE is_active = 1 ORDER BY order_index ASC",
  );
}
