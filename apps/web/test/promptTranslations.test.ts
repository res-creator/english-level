import test from "node:test";
import assert from "node:assert/strict";
import { translatePrompt } from "../src/lessonEngine/promptTranslations.ts";

/**
 * The lesson engine generates its instruction prompts in English
 * (apps/api/src/lessonEngine/lessonSessionBuilder.ts). The product UI is
 * Russian, so every template it can emit must have a translation — these
 * are the exact literals that file produces.
 */
const ENGINE_TEMPLATES = [
  'What does "opportunity" mean?',
  'In this sentence, what does "opportunity" mean?',
  "Complete the sentence.",
  "What's the rule here?",
  'Type the English word for "возможность".',
  "Put the words in the correct order.",
];

test("no instruction prompt the engine emits is shown in English", () => {
  for (const prompt of ENGINE_TEMPLATES) {
    const translated = translatePrompt(prompt);
    assert.notEqual(
      translated,
      prompt,
      `untranslated engine prompt: ${prompt}`,
    );
    assert.ok(
      /[А-Яа-яЁё]/.test(translated),
      `translation is not Russian: ${translated}`,
    );
  }
});

test("the English learning content inside a prompt is preserved, not translated away", () => {
  assert.equal(
    translatePrompt('What does "opportunity" mean?'),
    'Что означает "opportunity"?',
  );
  assert.equal(
    translatePrompt('In this sentence, what does "run" mean?'),
    'Что означает "run" в этом предложении?',
  );
});

test("an unrecognised prompt is passed through rather than dropped", () => {
  assert.equal(translatePrompt("Some future prompt"), "Some future prompt");
});
