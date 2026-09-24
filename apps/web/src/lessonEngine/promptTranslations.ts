/**
 * The lesson engine (apps/api/src/lessonEngine/lessonSessionBuilder.ts)
 * generates a small, fixed set of English instruction templates for
 * activity prompts — never learning content itself, just the instruction
 * wrapping it (see that file's `prompt:` literals). Per the localization
 * rule (system UI/instructions -> Russian, learning content -> English),
 * these need translating for display. Doing it here, presentation-side,
 * avoids a backend change for a UI-only concern — the underlying prompt
 * string is untouched (still used for logic-free display purposes only,
 * never sent back to the server).
 *
 * Quoted content inside a template (an English word/example) is preserved
 * as-is — only the instructional wrapper is translated. An unrecognized
 * prompt (future backend template) falls back to the original string
 * rather than showing nothing.
 */
const TEMPLATES: Array<{
  pattern: RegExp;
  translate: (m: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^What's the rule here\?$/,
    translate: () => "Какое здесь правило?",
  },
  {
    pattern: /^What does "(.+)" mean\?$/,
    translate: (m) => `Что означает "${m[1]}"?`,
  },
  {
    pattern: /^In this sentence, what does "(.+)" mean\?$/,
    translate: (m) => `Что означает "${m[1]}" в этом предложении?`,
  },
  {
    pattern: /^Complete the sentence\.$/,
    translate: () => "Заполни пропуск.",
  },
  {
    pattern: /^Type the English word for "(.+)"\.$/,
    translate: (m) => `Напиши это слово по-английски: «${m[1]}»`,
  },
  {
    pattern: /^Put the words in the correct order\.$/,
    translate: () => "Собери предложение в правильном порядке.",
  },
];

export function translatePrompt(prompt: string): string {
  for (const { pattern, translate } of TEMPLATES) {
    const match = prompt.match(pattern);
    if (match) return translate(match);
  }
  return prompt;
}
