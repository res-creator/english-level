import test from "node:test";
import assert from "node:assert/strict";
import { ActivityDTOSchema } from "@english-level/contracts";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { listLessonItemsByLesson } from "../src/repositories/curriculumRepository.ts";
import {
  buildActivityPlan,
  buildItemActivity,
  cloneForRetry,
} from "../src/lessonEngine/lessonSessionBuilder.ts";
import { buildMissionPlan } from "../src/lessonEngine/episodePlan.ts";
import { toActivityDTO } from "../src/lessonEngine/activityDto.ts";
import { restoreDialogueTurns } from "../src/lessonEngine/dialogueTurns.ts";
import type { StoredActivity } from "../src/lessonEngine/activityTypes.ts";
import {
  appendCompletedTurn,
  initialSessionDialogue,
} from "../../web/src/lessonEngine/sessionDialogue.ts";
import type { DialogueLine } from "../../web/src/scene/dialogueTypes.ts";
import {
  makeVerifiedUser,
  driveEpisodeToCanDo,
  driveLessonToCompletion,
} from "./helpers/lessonFixtures.ts";
import { startLessonSession } from "../src/services/lessonSessionService.ts";

function answer(activity: StoredActivity): string {
  switch (activity.kind) {
    case "multiple_choice":
    case "fill_gap_choice":
      return activity.correctOptionId;
    case "typed_recall":
      return activity.acceptedAnswers[0]!;
    case "sentence_build":
      return activity.correctAnswer;
    default:
      return "";
  }
}

for (const episode of [
  "les_sie_a1_e1",
  "les_sie_a1_e2",
  "les_sie_a1_e3",
  "les_sie_a1_e4",
  "les_sie_a1_e5",
]) {
  test(`${episode}: engine -> validated DTO -> transcript speaks once per core item`, async () => {
    const { db } = createTestDb();
    await seedContent(db);
    const links = await listLessonItemsByLesson(db, episode);
    const plan = await buildActivityPlan(db, "lvl_a1", links);
    let lines: DialogueLine[] = [];
    for (const [i, activity] of plan.entries()) {
      const dto = ActivityDTOSchema.parse(
        toActivityDTO(activity, i, plan.length),
      );
      const previous = lines;
      lines = appendCompletedTurn(lines, dto, answer(activity), {
        correct: true,
      });
      if (!activity.dialogueTurnId) assert.deepEqual(lines, previous);
      else {
        assert.equal(
          lines.length,
          previous.length + 2,
          "one learner followed by its authored NPC",
        );
        assert.equal(lines.at(-2)?.from, "you");
        assert.equal(lines.at(-1)?.text, activity.npcReply?.correct);
      }
    }
    const spokenItems = links.filter(
      (l) =>
        l.content_type === "learning_item" &&
        (l.role === "introduce" || l.role === "practice"),
    );
    assert.equal(
      lines.filter((l) => l.from === "you").length,
      spokenItems.length,
    );
    assert.equal(new Set(lines.map((l) => l.id)).size, lines.length);
    assert.ok(lines.every((l) => !/[\u0400-\u04ff]/.test(l.text)));
  });
}

test("Mission keeps the same exercises and keys, while its production checks form coherent turns", async () => {
  const { db } = createTestDb();
  await seedContent(db);
  const links = await listLessonItemsByLesson(db, "les_sie_a1_e4");
  const mission = await buildMissionPlan(db, "lvl_a1", links);
  const targets = links.filter(
    (l) => l.role === "introduce" || l.role === "target",
  );
  let lines: DialogueLine[] = [];
  for (const [i, activity] of mission.entries()) {
    const original = await buildItemActivity(
      db,
      "lvl_a1",
      targets[i]!,
      "production",
    );
    const { dialogueTurnId, npcReply, id, ...exercise } = activity;
    assert.ok(original);
    const { id: originalId, ...originalExercise } = original;
    assert.deepEqual(exercise, originalExercise);
    lines = appendCompletedTurn(
      lines,
      toActivityDTO(activity, i, mission.length),
      answer(activity),
      { correct: true },
    );
  }
  assert.equal(mission.length, 8);
  assert.equal(lines.filter((l) => l.from === "you").length, 7);
  assert.equal(lines.filter((l) => l.from === "them").length, 7);
});

test("stored pre-marker plans and retries preserve one semantic turn; review remains non-spoken", async () => {
  const { db } = createTestDb();
  await seedContent(db);
  const links = await listLessonItemsByLesson(db, "les_sie_a1_e4");
  const plan = await buildActivityPlan(db, "lvl_a1", links);
  const oldPlan = plan.map(({ dialogueTurnId, ...rest }) => rest);
  const restored = restoreDialogueTurns(oldPlan, "lesson");
  assert.equal(restored.filter((a) => a.dialogueTurnId).length, 8);
  const final = restored.find(
    (a) => a.dialogueTurnId && a.kind === "sentence_build",
  )!;
  assert.ok(final.kind !== "info_card" && final.kind !== "grammar_card");
  const retry = cloneForRetry(final, `${final.id}_retry`);
  assert.equal(retry.dialogueTurnId, final.dialogueTurnId);
  const lines = appendCompletedTurn(
    [],
    toActivityDTO(final, 0, 2),
    answer(final),
    { correct: true },
  );
  assert.deepEqual(
    appendCompletedTurn(lines, toActivityDTO(retry, 1, 2), answer(retry), {
      correct: true,
    }),
    lines,
  );
  for (const mode of ["recognition", "context", "production"] as const) {
    const review = await buildItemActivity(db, "lvl_a1", links[0]!, mode);
    assert.ok(review);
    assert.equal(review.dialogueTurnId, undefined);
    assert.equal(review.npcReply, undefined);
    assert.deepEqual(
      appendCompletedTurn([], toActivityDTO(review, 0, 1), answer(review), {
        correct: true,
      }),
      [],
    );
  }
});

test("real successive A1.4 sessions open once, then Mission pass/fail still sets the correct capability", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  const user = await makeVerifiedUser(db, 7401, "A1");
  const first = await startLessonSession(db, user.id, "les_sie_a1_e4");
  assert.ok(first.ok);
  assert.equal(
    initialSessionDialogue(first.session, "les_sie_a1_e4").length,
    1,
  );
  await driveLessonToCompletion(db, sqlite, user.id, "les_sie_a1_e4");
  const second = await startLessonSession(db, user.id, "les_sie_a1_e4");
  assert.ok(second.ok);
  assert.equal(second.session.sessionIndex, 2);
  assert.deepEqual(initialSessionDialogue(second.session, "les_sie_a1_e4"), []);
  const passed = await driveEpisodeToCanDo(
    db,
    sqlite,
    user.id,
    "les_sie_a1_e4",
  );
  assert.equal(passed.missionPassed, true);
  assert.equal(passed.capabilityState, "can_do");
  const failing = await makeVerifiedUser(db, 7402, "A1");
  for (let i = 0; i < 8; i++) {
    const start = await startLessonSession(db, failing.id, "les_sie_a1_e4");
    assert.ok(start.ok);
    const mission = start.session.kind === "mission";
    const run = await driveLessonToCompletion(
      db,
      sqlite,
      failing.id,
      "les_sie_a1_e4",
      { correct: !mission },
    );
    if (!mission) continue;
    assert.equal(run.result.missionPassed, false);
    assert.equal(run.result.capabilityState, "learning");
    assert.deepEqual(run.result.rewards, []);
    return;
  }
  assert.fail("Mission not reached");
});
