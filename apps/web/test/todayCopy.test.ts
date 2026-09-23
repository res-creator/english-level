import test from "node:test";
import assert from "node:assert/strict";
import type { EpisodeDTO } from "@english-level/contracts";
import {
  plural,
  resolveTodayCta,
  resolveTodayEyebrow,
} from "../src/routes/todayCopy.ts";

function episode(overrides: Partial<EpisodeDTO> = {}): EpisodeDTO {
  return {
    id: "les_x",
    title: "Situation",
    situationTitle: "Первое знакомство",
    scene: null,
    capability: "Я могу поздороваться",
    teaser: null,
    type: "mixed",
    order: 1,
    estimatedMinutes: 6,
    state: null,
    sessionsDone: 0,
    sessionsTotal: 3,
    missionReady: false,
    ...overrides,
  };
}

test("an untouched situation invites the learner to start it", () => {
  assert.equal(resolveTodayCta("session", episode()), "Начать");
  assert.equal(
    resolveTodayEyebrow("session", episode()),
    "Сегодняшняя ситуация",
  );
});

test("a situation already underway is continued, never restarted", () => {
  const started = episode({ sessionsDone: 2, state: "learning" });
  assert.equal(resolveTodayCta("session", started), "Продолжить");
  assert.equal(resolveTodayEyebrow("session", started), "Продолжаем ситуацию");
});

test("the Mission is named as a Mission, not as another session", () => {
  const ready = episode({
    sessionsDone: 3,
    sessionsTotal: 3,
    state: "learning",
    missionReady: true,
  });
  assert.equal(resolveTodayCta("mission", ready), "Пройти миссию");
  assert.equal(resolveTodayEyebrow("mission", ready), "Проверим на деле");
});

test("with nothing left to learn today, review is offered plainly", () => {
  assert.equal(resolveTodayCta("review", null), "Повторить");
});

test("with no episode at all the learner is sent to the course, not a dead end", () => {
  assert.equal(resolveTodayCta("none", null), "Открыть курс");
});

test("counts the learner sees agree in Russian", () => {
  assert.equal(plural(1, "фраза", "фразы", "фраз"), "фраза");
  assert.equal(plural(3, "фраза", "фразы", "фраз"), "фразы");
  assert.equal(plural(5, "фраза", "фразы", "фраз"), "фраз");
  assert.equal(plural(11, "фраза", "фразы", "фраз"), "фраз");
  assert.equal(plural(21, "фраза", "фразы", "фраз"), "фраза");
});
