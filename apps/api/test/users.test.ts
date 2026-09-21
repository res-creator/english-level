import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import {
  createUser,
  findUserById,
  findUserByTelegramUserId,
} from "../src/repositories/usersRepository.ts";

test("creating and retrieving a user works", async () => {
  const { db } = createTestDb();

  const created = await createUser(db, {
    telegramUserId: 123456,
    firstName: "Tanya",
    username: "tanya",
  });

  assert.match(created.id, /^usr_[0-9a-f]{32}$/);
  assert.equal(created.telegram_user_id, 123456);
  assert.equal(created.first_name, "Tanya");
  assert.equal(created.onboarding_completed, 0);
  assert.equal(created.status, "active");

  const byId = await findUserById(db, created.id);
  assert.deepEqual(byId, created);

  const byTelegramId = await findUserByTelegramUserId(db, 123456);
  assert.deepEqual(byTelegramId, created);
});

test("duplicate telegram_user_id is rejected", async () => {
  const { db } = createTestDb();

  await createUser(db, { telegramUserId: 42, firstName: "Anna" });

  await assert.rejects(
    createUser(db, { telegramUserId: 42, firstName: "Someone Else" }),
    /UNIQUE constraint failed/,
  );
});

test("createUser rejects invalid input", async () => {
  const { db } = createTestDb();

  await assert.rejects(
    // @ts-expect-error missing required firstName
    createUser(db, { telegramUserId: 1 }),
  );
});
