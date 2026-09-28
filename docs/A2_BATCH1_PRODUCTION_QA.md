# A2 Batch 1 Production and QA

Preview-only authoring for `sit_a2_people_01`, `sit_a2_people_02`, and `sit_a2_cafe_01`. Frozen curriculum architecture and production content were not changed. The dialogue was authored after reference review; the lines below are original and use the project's cast and turn mechanics.

## Reference workflow

- [British Council: Talking about your job (A2)](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/talking-about-your-job) informed the job answer and relevant personal follow-up in A2.1.
- [British Council: Showing interest (A2)](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/showing-interest) informed A2.2's open question → reaction → follow-up rhythm and informal register.
- [ELLLO: Present Simple (A2)](https://elllo.org/class/A2/A2-01-Present-Simple.html) informed compact, connected A2 responses and familiar Wh-question patterns.
- [Cambridge English: A2 Key vocabulary list](https://www.cambridgeenglish.org/latinamerica/Images/506886-a2-key-2020-vocabulary-list.pdf) informed the café, drink, family and work vocabulary range.
- [British Council: A2 level descriptor](https://learnenglish.britishcouncil.org/level/understand-your-level/a2-pre-intermediate) informed the short exchange about familiar work, family and local context.

No long dialogue or source sentence was copied. Reference influence is turn sequencing, register, level and vocabulary coverage only.

## A2.1 — Рассказать о себе подробнее

Alex's opener asks what the learner does for work. The learner says they work as a graphic designer and work from home; Alex asks about siblings; the learner mentions a sister and cooking together; Alex asks about free time; the learner says they play tennis at weekends and adds a local detail connected to having lived there for three years. Alex reacts and asks which courts they like best.

Grammar Target: Present Simple in connected personal descriptions (`I work as… and…`, `I have… and…`, `I play…`). `I've lived here for three years` and the NPC's duration question are documented lexical chunks; Present Perfect is not a target.

Variations transfer the short self-description: v1 changes profession, household/family and shared routine (teacher, cousin, cooking, swimming); v2 changes duration (six months) and adds a related local detail. Mission asks for connected personal information, not a list of isolated facts.

## A2.2 — Знакомство на вечеринке у Дэниела

Daniel welcomes the learner to the party and asks how they know Alex. The learner mentions meeting at a café near work; Daniel reacts (“Small world…”) and asks about work. The learner describes a design-office job and asks Daniel back; Daniel says he is an architect and draws plans. The learner shows interest and asks what Daniel enjoys; Daniel answers and asks what the learner likes outside work.

Grammar: recycled Present Simple statements and Wh-questions. Social reactions and “What about you?” are lexical chunks. No question tags are introduced.

Variations replace the mutual connection with a weekend running group and then an English class connection to Maya. The same Daniel/party scene and small-talk function remain; the shared social context changes rather than only a name.

## A2.3 — Изменить заказ

Maya confirms an existing small coffee order before payment. The learner changes it to a hot tea and requests a large size; Maya confirms and says she will update the order before payment.

Grammar: `can` is recycled from A1.2. `Could I change this to a tea instead?` is an explicit polite lexical chunk, not a new modal grammar target.

Variations transfer correction to a different transaction detail: v1 changes quantity to two teas; v2 catches the order after the learner has tapped the card and asks Maya to cancel/update it to three teas. Present Perfect in “I've just tapped my card” is recorded as a lexical chunk.

## Gates and verification

- **Gate A — PASS.** Seed schemas and cross-references pass; lesson-item ordering is contiguous; two Practice Variations are linked per situation; authored continuations are present; seed import is idempotent. Mission plan includes core targets and excludes Practice Variations; semantic turns remain one spoken turn per item.
- **Gate B — PASS.** Manual dialogue read-through confirms responses fit the preceding learner turn, role/cast mapping is correct, no repeated information or generic NPC continuation exists, and the language fits A2. Grammar lint reports 0 errors and 0 advisory notes; lexical chunks are classified.
- **Gate C — PASS.** Chromium used the real React UI, Hono handlers and disposable SQLite. It checked opener placement, English-only transcript, every Mission PASS and one FAIL path, and course progression. Mission PASS: A2.1/A2.2/A2.3 each 100%, `can_do`; FAIL: A2.1 0%, `learning`.

Chromium captured 105 transcript snapshots. Screenshots and `results.json` are local ignored preview artifacts at `artifacts/qa/session-dialogue/`; representative files include `a1-course-start.png` (the A2 QA run still uses the shared harness's legacy onboarding filename), `sit_a2_people_01-pass-s4-mission-result.png`, `sit_a2_people_02-pass-s3-mission-result.png`, `sit_a2_cafe_01-pass-s3-mission-result.png`, `sit_a2_people_01-fail-s4-mission-result.png`, and `a2-course-complete.png`.

The complete automated suites pass: shared 6/6, API 312/312, web 74/74 (392/392 total). API and web typechecks pass. A follow-up targeted API run passed 38/38 curriculum/content-seed/Today checks after the final A2.1 transcript refinement. Grammar lint is 0 errors / 0 advisory notes; cross-reference/schema validation, contiguous order, deterministic plan generation and seed idempotency all pass.
