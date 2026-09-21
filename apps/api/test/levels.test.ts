import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { listActiveLevels } from "../src/repositories/levelsRepository.ts";

test("A1/A2/B1/B2/C1 are seeded and returned in order", async () => {
  const { db } = createTestDb();

  const levels = await listActiveLevels(db);

  assert.deepEqual(
    levels.map((l) => l.code),
    ["A1", "A2", "B1", "B2", "C1"],
  );
  assert.ok(levels.every((l) => l.is_active === 1));
});
