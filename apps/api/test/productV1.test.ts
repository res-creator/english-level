import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { getMyEnglish } from "../src/services/myEnglishService.ts";
import { getMySpace, selectCompanion } from "../src/services/spaceService.ts";
import {
  WEEKLY_GOAL_TARGET,
  acceptInvite,
  createInvite,
  getFriendState,
  weekStart,
} from "../src/services/friendService.ts";
import { getToday } from "../src/services/todayService.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";

const EPISODE_1 = "les_sie_a1_e1";
const EPISODE_2 = "les_sie_a1_e2";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

// --- my english ------------------------------------------------------------

test("a new learner's English is honestly empty — no projected or estimated numbers", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 501, "A1");
  const mine = await getMyEnglish(db, user.id, "A1");
  assert.deepEqual(mine.capabilities, []);
  assert.deepEqual(mine.phrases, []);
  assert.equal(mine.stats.phrasesMet, 0);
  assert.equal(mine.stats.episodesDone, 0);
});

test("only a proven capability is listed — a half-finished episode claims nothing", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 502, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);

  const midway = await getMyEnglish(db, user.id, "A1");
  assert.deepEqual(midway.capabilities, []);
  assert.ok(midway.phrases.length > 0, "met phrases are still listed");

  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  const after = await getMyEnglish(db, user.id, "A1");
  assert.equal(after.capabilities.length, 1);
  assert.equal(after.capabilities[0]?.episodeId, EPISODE_1);
  assert.equal(after.capabilities[0]?.state, "can_do");
  assert.ok(after.capabilities[0]?.capability.startsWith("Я могу"));
});

test("a phrase is only called consolidated once it has genuinely held", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 503, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);

  const fresh = await getMyEnglish(db, user.id, "A1");
  assert.equal(fresh.stats.phrasesConsolidated, 0);

  sqlite.prepare("UPDATE user_item_memory SET box = 5").run();
  const later = await getMyEnglish(db, user.id, "A1");
  assert.equal(later.stats.phrasesConsolidated, later.phrases.length);
});

// --- companion -------------------------------------------------------------

test("a companion is a choice, not a default assigned behind the learner's back", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 504, "A1");
  const space = await getMySpace(db, user.id);
  assert.equal(space.companion, null);
  assert.equal(space.companionChoices.length, 3);
});

test("choosing a companion persists, and choosing again simply replaces it", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 505, "A1");
  const first = await selectCompanion(db, user.id, "cmp_fox");
  assert.equal(first.ok, true);
  assert.equal((await getMySpace(db, user.id)).companion?.id, "cmp_fox");

  await selectCompanion(db, user.id, "cmp_owl");
  assert.equal((await getMySpace(db, user.id)).companion?.id, "cmp_owl");

  const unknown = await selectCompanion(db, user.id, "cmp_dragon");
  assert.equal(unknown.ok, false);
});

test("the companion has nothing to feed, heal or lose", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 506, "A1");
  await selectCompanion(db, user.id, "cmp_cat");
  const space = await getMySpace(db, user.id);
  const companion = space.companion!;
  assert.deepEqual(Object.keys(companion).sort(), [
    "id",
    "name",
    "tagline",
    "tone",
  ]);
});

// --- rewards and the space -------------------------------------------------

test("the space starts empty and shows what is still to come, with no price on it", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 507, "A1");
  const space = await getMySpace(db, user.id);
  assert.equal(space.unlockedCount, 0);
  assert.ok(space.totalCount > 0);
  for (const item of space.items) {
    assert.equal(item.unlocked, false);
    assert.equal(item.memory, null);
    assert.ok(!Object.prototype.hasOwnProperty.call(item, "price"));
    assert.ok(!Object.prototype.hasOwnProperty.call(item, "cost"));
  }
});

test("a passed Mission leaves behind one object, and it remembers the language it came from", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 508, "A1");
  const mission = await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  assert.ok(mission.rewards.some((r) => r.id === "rw_frame"));

  const space = await getMySpace(db, user.id);
  const frame = space.items.find((i) => i.id === "rw_frame");
  assert.equal(frame?.unlocked, true);
  assert.ok(frame?.memory, "a memory object must remember something");
  assert.ok(frame?.memory?.capability?.startsWith("Я могу"));
  assert.ok((frame?.memory?.phrases.length ?? 0) > 0);
});

test("replaying an episode never unlocks its object a second time", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 509, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  const replay = await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  assert.deepEqual(
    replay.rewards.filter((r) => r.id === "rw_frame"),
    [],
    "an already-earned object must not be celebrated again",
  );

  const rows = sqlite
    .prepare(
      "SELECT COUNT(*) n FROM user_rewards WHERE user_id = ? AND reward_id = 'rw_frame'",
    )
    .get(user.id) as { n: number };
  assert.equal(rows.n, 1);
});

test("finishing a whole chapter leaves a chapter object", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 510, "A1");
  const episodes = [
    EPISODE_1,
    EPISODE_2,
    "les_sie_a1_e3",
    "les_sie_a1_e4",
    "les_sie_a1_e5",
  ];
  let sawChapterReward = false;
  for (const episode of episodes) {
    const mission = await driveEpisodeToCanDo(db, sqlite, user.id, episode);
    if (mission.rewards.some((r) => r.id === "rw_shelf"))
      sawChapterReward = true;
  }
  assert.ok(sawChapterReward, "the chapter object must appear exactly once");

  const space = await getMySpace(db, user.id);
  assert.equal(space.items.find((i) => i.id === "rw_shelf")?.unlocked, true);
});

// --- friend and the shared weekly goal -------------------------------------

test("a learner without a friend still has a private weekly count, and no goal to fail", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 511, "A1");
  const state = await getFriendState(db, user.id);
  assert.equal(state.friend, null);
  assert.equal(state.goal.friendDone, null);
  assert.equal(state.goal.completed, false);
});

test("an invite is stable — tapping invite twice shares the same code", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 512, "A1");
  const first = await createInvite(db, user.id);
  const second = await createInvite(db, user.id);
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.code, second.code);
});

test("accepting an invite links exactly two people, both ways", async () => {
  const { db } = await seeded();
  const a = await makeVerifiedUser(db, 513, "A1");
  const b = await makeVerifiedUser(db, 514, "A1");
  const invite = await createInvite(db, a.id);
  assert.equal(invite.ok, true);
  if (!invite.ok) return;

  const accepted = await acceptInvite(db, b.id, invite.code);
  assert.equal(accepted.ok, true);
  assert.equal((await getFriendState(db, a.id)).friend?.id, b.id);
  assert.equal((await getFriendState(db, b.id)).friend?.id, a.id);
});

test("an invite cannot be accepted by its own author, reused, or invented", async () => {
  const { db } = await seeded();
  const a = await makeVerifiedUser(db, 515, "A1");
  const b = await makeVerifiedUser(db, 516, "A1");
  const c = await makeVerifiedUser(db, 517, "A1");
  const invite = await createInvite(db, a.id);
  if (!invite.ok) return;

  const self = await acceptInvite(db, a.id, invite.code);
  assert.equal(self.ok, false);
  if (!self.ok) assert.equal(self.error.code, "own_invite");

  assert.equal((await acceptInvite(db, b.id, invite.code)).ok, true);
  const reused = await acceptInvite(db, c.id, invite.code);
  assert.equal(reused.ok, false);

  const bogus = await acceptInvite(db, c.id, "ZZZZZZ");
  assert.equal(bogus.ok, false);
});

test("the weekly goal counts both people's real sessions and nothing else", async () => {
  const { db, sqlite } = await seeded();
  const a = await makeVerifiedUser(db, 518, "A1");
  const b = await makeVerifiedUser(db, 519, "A1");
  const invite = await createInvite(db, a.id);
  if (!invite.ok) return;
  await acceptInvite(db, b.id, invite.code);

  await driveLessonToCompletion(db, sqlite, a.id, EPISODE_1);
  await driveLessonToCompletion(db, sqlite, b.id, EPISODE_1);
  await driveLessonToCompletion(db, sqlite, b.id, EPISODE_2);

  const state = await getFriendState(db, a.id);
  assert.equal(state.goal.mine, 1);
  assert.equal(state.goal.friendDone, 2);
  assert.equal(state.goal.total, 3);
  assert.equal(state.goal.target, WEEKLY_GOAL_TARGET);
  assert.equal(state.goal.completed, false);
});

test("reaching the shared goal leaves one shared object, and never a ranking", async () => {
  const { db, sqlite } = await seeded();
  const a = await makeVerifiedUser(db, 520, "A1");
  const b = await makeVerifiedUser(db, 521, "A1");
  const invite = await createInvite(db, a.id);
  if (!invite.ok) return;
  await acceptInvite(db, b.id, invite.code);

  // Both practised plenty this week.
  const thisWeek = new Date(weekStart().getTime() + 3600_000).toISOString();
  for (let i = 0; i < WEEKLY_GOAL_TARGET; i++) {
    sqlite
      .prepare(
        `INSERT INTO learning_sessions
           (id, user_id, lesson_id, session_type, session_kind, session_index,
            status, started_at, completed_at, current_position, correct_count,
            wrong_count, activities_json, created_at, updated_at)
         VALUES (?, ?, ?, 'lesson', 'lesson', 1, 'completed', ?, ?, 0, 0, 0, '[]', ?, ?)`,
      )
      .run(
        `lsn_fake_${i}`,
        i % 2 === 0 ? a.id : b.id,
        EPISODE_1,
        thisWeek,
        thisWeek,
        thisWeek,
        thisWeek,
      );
  }

  const state = await getFriendState(db, a.id);
  assert.equal(state.goal.completed, true);
  assert.equal(state.sharedRewardUnlocked, true);

  const space = await getMySpace(db, a.id);
  assert.equal(
    space.items.find((i) => i.id === "rw_shared_plant")?.unlocked,
    true,
  );
  // Nothing in the shared state ranks the two people against each other.
  assert.ok(!Object.prototype.hasOwnProperty.call(state.goal, "rank"));
  assert.ok(!Object.prototype.hasOwnProperty.call(state.goal, "winner"));
});

test("Today shows the shared goal as a joint total, not a comparison", async () => {
  const { db } = await seeded();
  const a = await makeVerifiedUser(db, 522, "A1");
  const b = await makeVerifiedUser(db, 523, "A1");
  const invite = await createInvite(db, a.id);
  if (!invite.ok) return;
  await acceptInvite(db, b.id, invite.code);

  const today = await getToday(db, a.id, "A1");
  assert.ok(today.weeklyGoal);
  assert.equal(today.weeklyGoal?.target, WEEKLY_GOAL_TARGET);
  assert.equal(today.weeklyGoal?.friendName, "Test");
});

// --- persistence -----------------------------------------------------------

test("everything the learner earns survives a fresh read from the database", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 524, "A1");
  await selectCompanion(db, user.id, "cmp_fox");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);

  // Nothing is held in memory between requests: read it all back cold.
  const english = await getMyEnglish(db, user.id, "A1");
  const space = await getMySpace(db, user.id);
  const today = await getToday(db, user.id, "A1");

  assert.equal(english.capabilities.length, 1);
  assert.equal(space.companion?.id, "cmp_fox");
  assert.equal(space.unlockedCount >= 1, true);
  assert.equal(today.capabilities.canDo, 1);
  assert.equal(today.companionId, "cmp_fox");
});

test("no currency, shop or league leaked into any V1 response", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 525, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);

  const payload = JSON.stringify({
    english: await getMyEnglish(db, user.id, "A1"),
    space: await getMySpace(db, user.id),
    today: await getToday(db, user.id, "A1"),
    friend: await getFriendState(db, user.id),
  });
  for (const forbidden of [
    "coins",
    "gems",
    "currency",
    "shop",
    "purchase",
    "lootBox",
    "leaderboard",
    "league",
    "rank",
    "xp",
  ]) {
    assert.ok(
      !payload.includes(forbidden),
      `V1 response leaked "${forbidden}"`,
    );
  }
});
