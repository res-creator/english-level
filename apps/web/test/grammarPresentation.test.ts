import test from "node:test";
import assert from "node:assert/strict";
import { grammarDisplayTitle } from "../src/lessonEngine/grammarPresentation.ts";

test("grammar cards present learner-facing Russian functions instead of author taxonomy", () => {
  assert.equal(
    grammarDisplayTitle("Be - positive"),
    "Говорим о людях, фактах и привычках",
  );
  assert.equal(
    grammarDisplayTitle("Present Perfect for duration"),
    "Говорим, как долго это длится",
  );
  assert.equal(
    grammarDisplayTitle("Concession clauses"),
    "Показываем две стороны мысли",
  );
  assert.equal(
    grammarDisplayTitle("Internal author label"),
    "Связываем мысль естественно",
  );
});
