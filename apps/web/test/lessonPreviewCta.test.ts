import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveStartCtaKicker,
  resolveStartCtaLabel,
} from "../src/routes/lessonPreviewCta.ts";

test('an episode with a persisted in-progress session offers "Продолжить"', () => {
  assert.equal(resolveStartCtaLabel("in_progress"), "Продолжить");
});

test('an untouched situation offers "Начать"', () => {
  assert.equal(resolveStartCtaLabel("not_started"), "Начать");
});

test("a situation whose Mission is passed offers a replay, not a fresh start", () => {
  assert.equal(resolveStartCtaLabel("completed"), "Пройти ещё раз");
});

test('unknown status (data not loaded yet) falls back to "Начать"', () => {
  assert.equal(resolveStartCtaLabel(undefined), "Начать");
});

test("only a resumable situation explains that it continues where it stopped", () => {
  assert.equal(
    resolveStartCtaKicker("in_progress"),
    "Продолжим с того места, где остановились",
  );
  assert.equal(resolveStartCtaKicker("not_started"), null);
});
