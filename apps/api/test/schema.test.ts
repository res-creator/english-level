import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";

test("migration creates the expected tables and columns", () => {
  const { sqlite } = createTestDb();

  const tables = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((row) => (row as { name: string }).name);

  assert.deepEqual(tables, [
    "levels",
    "user_acquisition",
    "user_settings",
    "users",
  ]);

  const usersColumns = sqlite
    .prepare("PRAGMA table_info(users)")
    .all()
    .map((row) => (row as { name: string }).name);

  assert.deepEqual(usersColumns.sort(), [
    "created_at",
    "current_cefr_level",
    "first_name",
    "id",
    "interface_language",
    "last_active_at",
    "last_name",
    "onboarding_completed",
    "status",
    "telegram_user_id",
    "timezone",
    "updated_at",
    "username",
  ]);
});

test("levels.code has a unique constraint", () => {
  const { sqlite } = createTestDb();

  assert.throws(() => {
    sqlite
      .prepare(
        "INSERT INTO levels (id, code, name, order_index) VALUES (?, ?, ?, ?)",
      )
      .run("lvl_a1_dupe", "A1", "Duplicate Beginner", 99);
  }, /UNIQUE constraint failed/);
});
