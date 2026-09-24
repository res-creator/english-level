import type { FriendStateResponse } from "@english-level/contracts";
import type { Db } from "../db/types.ts";
import {
  acceptInviteStatement,
  countCompletedSessionsBetween,
  createInviteStatement,
  findFriend,
  findInviteByCode,
  findOpenInviteByUser,
  linkFriendsStatements,
} from "../repositories/friendsRepository.ts";
import { findUserById } from "../repositories/usersRepository.ts";
import { addDays } from "../repositories/itemMemoryRepository.ts";
import { grantSharedGoalReward } from "./rewardService.ts";
import { eventStatement } from "./analyticsService.ts";

/**
 * One friend, one shared goal, nothing else. No leaderboard, no streak
 * comparison, no visibility into what the other person got wrong — the
 * only shared number is how many sessions the two of them did together.
 */
export const WEEKLY_GOAL_TARGET = 10;

export type FriendFailure =
  | { code: "not_found"; message: string }
  | { code: "already_linked"; message: string }
  | { code: "own_invite"; message: string };

export type FriendResult =
  | { ok: true; state: FriendStateResponse }
  | { ok: false; error: FriendFailure };

/** Monday 00:00 UTC. A fixed boundary means the goal resets for both
 * people at the same moment, whatever timezone they are in. */
export function weekStart(now: Date = new Date()): Date {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const weekday = (start.getUTCDay() + 6) % 7; // Monday = 0
  start.setUTCDate(start.getUTCDate() - weekday);
  return start;
}

/** Short, human-readable, unambiguous — no 0/O or 1/I. */
function newInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function sessionsThisWeek(
  db: Db,
  userId: string,
  now: Date,
): Promise<number> {
  const from = weekStart(now);
  const row = await countCompletedSessionsBetween(
    db,
    userId,
    from.toISOString(),
    addDays(from, 7),
  );
  return row?.n ?? 0;
}

export async function getFriendState(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<FriendStateResponse> {
  const friendship = await findFriend(db, userId);
  const mine = await sessionsThisWeek(db, userId, now);

  let friend: FriendStateResponse["friend"] = null;
  let friendDone: number | null = null;
  if (friendship) {
    const other = await findUserById(db, friendship.friend_user_id);
    if (other) {
      friend = { id: other.id, firstName: other.first_name };
      friendDone = await sessionsThisWeek(db, other.id, now);
    }
  }

  let inviteCode: string | null = null;
  if (!friendship) {
    const open = await findOpenInviteByUser(db, userId);
    inviteCode = open?.code ?? null;
  }

  const total = mine + (friendDone ?? 0);
  const completed = friendship !== null && total >= WEEKLY_GOAL_TARGET;

  let sharedRewardUnlocked = false;
  if (completed) {
    // Granting is idempotent, so checking here rather than on a schedule
    // costs nothing and means the reward can't be missed. A non-null
    // result means this call is the one that unlocked it, which is also
    // the only moment worth logging — not every later poll of this
    // already-completed state.
    const reward = await grantSharedGoalReward(db, userId);
    if (reward) {
      await db.batch([
        eventStatement(
          "shared_goal_completed",
          { userId, properties: { total } },
          now.toISOString(),
        ),
      ]);
    }
    sharedRewardUnlocked = true;
  }

  return {
    friend,
    inviteCode,
    goal: {
      target: WEEKLY_GOAL_TARGET,
      mine,
      friendDone,
      total,
      completed,
      weekStart: weekStart(now).toISOString(),
    },
    sharedRewardUnlocked,
  };
}

/** Returns the existing open invite rather than minting a second one, so
 * a re-tapped "Пригласить" always shares the same code. */
export async function createInvite(
  db: Db,
  userId: string,
): Promise<{ ok: true; code: string } | { ok: false; error: FriendFailure }> {
  const friendship = await findFriend(db, userId);
  if (friendship) {
    return {
      ok: false,
      error: { code: "already_linked", message: "you already have a friend" },
    };
  }
  const open = await findOpenInviteByUser(db, userId);
  if (open) return { ok: true, code: open.code };

  const code = newInviteCode();
  const now = new Date().toISOString();
  await db.batch([
    createInviteStatement(code, userId, now),
    eventStatement("friend_invited", { userId }, now),
  ]);
  return { ok: true, code };
}

export async function acceptInvite(
  db: Db,
  userId: string,
  code: string,
): Promise<FriendResult> {
  const invite = await findInviteByCode(db, code.trim().toUpperCase());
  if (!invite || invite.accepted_by_user_id) {
    return {
      ok: false,
      error: { code: "not_found", message: "invite not found" },
    };
  }
  if (invite.inviter_user_id === userId) {
    return {
      ok: false,
      error: { code: "own_invite", message: "this is your own invite" },
    };
  }
  const existing = await findFriend(db, userId);
  if (existing) {
    return {
      ok: false,
      error: { code: "already_linked", message: "you already have a friend" },
    };
  }

  const now = new Date().toISOString();
  await db.batch([
    acceptInviteStatement(code.trim().toUpperCase(), userId, now),
    ...linkFriendsStatements(invite.inviter_user_id, userId, now),
    eventStatement("friend_accepted", { userId }, now),
  ]);
  return { ok: true, state: await getFriendState(db, userId) };
}
