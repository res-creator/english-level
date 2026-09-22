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
    "exercise_attempts",
    "grammar_pattern_localizations",
    "grammar_patterns",
    "grammar_relations",
    "item_examples",
    "item_patterns",
    "item_relations",
    "learning_item_localizations",
    "learning_items",
    "learning_sessions",
    "lesson_items",
    "lessons",
    "levels",
    "modules",
    "placement_answers",
    "placement_attempts",
    "placement_passages",
    "placement_questions",
    "sessions",
    "user_acquisition",
    "user_lesson_progress",
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
    "onboarding_stage",
    "self_reported_cefr_level",
    "status",
    "telegram_user_id",
    "timezone",
    "updated_at",
    "username",
  ]);
});

test("onboarding_stage defaults to goals and rejects unknown values", () => {
  const { sqlite } = createTestDb();

  sqlite
    .prepare(
      "INSERT INTO users (id, telegram_user_id, first_name) VALUES (?, ?, ?)",
    )
    .run("usr_stage_default", 999001, "Test");
  const row = sqlite
    .prepare(
      "SELECT onboarding_stage, self_reported_cefr_level FROM users WHERE id = ?",
    )
    .get("usr_stage_default") as {
    onboarding_stage: string;
    self_reported_cefr_level: string | null;
  };
  assert.equal(row.onboarding_stage, "goals");
  assert.equal(row.self_reported_cefr_level, null);

  assert.throws(() => {
    sqlite
      .prepare("UPDATE users SET onboarding_stage = ? WHERE id = ?")
      .run("bogus_stage", "usr_stage_default");
  }, /CHECK constraint failed/);

  assert.throws(() => {
    sqlite
      .prepare("UPDATE users SET self_reported_cefr_level = ? WHERE id = ?")
      .run("C1", "usr_stage_default");
  }, /CHECK constraint failed/);
});

test("sessions table has the expected columns and a unique token_hash", () => {
  const { sqlite } = createTestDb();

  const sessionsColumns = sqlite
    .prepare("PRAGMA table_info(sessions)")
    .all()
    .map((row) => (row as { name: string }).name);

  assert.deepEqual(sessionsColumns.sort(), [
    "created_at",
    "expires_at",
    "id",
    "last_used_at",
    "token_hash",
    "user_id",
  ]);

  sqlite
    .prepare(
      "INSERT INTO users (id, telegram_user_id, first_name) VALUES ('usr_1', 1, 'Test')",
    )
    .run();
  sqlite
    .prepare(
      "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
    .run("ses_1", "usr_1", "hash-a", "2999-01-01T00:00:00.000Z");

  assert.throws(() => {
    sqlite
      .prepare(
        "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      )
      .run("ses_2", "usr_1", "hash-a", "2999-01-01T00:00:00.000Z");
  }, /UNIQUE constraint failed/);
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
