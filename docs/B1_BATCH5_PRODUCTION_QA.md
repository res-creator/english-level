# B1 Batch 5 Production QA

Дата: 2026-09-29. Scope: preview seed/content only. Production не изменялся. Frozen curriculum, A1 и A2 не изменялись.

## Reference workflow

Перед authoring использованы:

- British Council LearnEnglish, [Asking a favour (B1)](https://learnenglish.britishcouncil.org/free-resources/speaking/b1/asking-favour?page=3): последовательность context → specific request → availability/constraint → agreement и вежливый register.
- British Council LearnEnglish, [Job interviews](https://learnenglish.britishcouncil.org/comment/161517) и [Prepare for a job interview](https://learnenglish.britishcouncil.org/comment/197370): связать опыт и сильную сторону с конкретным примером и требованиями роли.
- Cambridge English, [B1 Preliminary vocabulary list](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf): scope рабочей, interview и planning лексики.
- Cambridge English, [B1 Preliminary exam format](https://www.cambridgeenglish.org/exams-and-tests/preliminary/exam-format/?level=basic&skill=reading): предложения, альтернативы, обсуждение вариантов и согласование решения на B1.

Источники использованы только для natural turn order, register, phrase choice и B1 difficulty. Все Speak in English dialogues оригинальные.

## Authored dialogue и transfer

### B1.13 — Попросить об услуге на работе

Daniel заканчивает event schedule. Learner просит проверить room bookings, уточняет имена комнат и время, затем договаривается о сроке, смягчая просьбу без давления. Каждый NPC reply отвечает на предыдущую learner line и продвигает переговоры.

- Target: `gr_b1_would_mind_favour` — `Would you mind + -ing`.
- Chunks/recycled: `I'd really appreciate it`, `only if it's not too much trouble`, recycled `Could you...?`.
- v1: learner просит Daniel подменить его на reception и предлагает взаимную помощь на следующий день.
- v2: learner просит превратить meeting notes в team update, принимает условие Daniel и уточняет длину/срок.
- Reviews: Near B1.12; Far A2.13. Prerequisite: B1.12.

### B1.14 — Простое собеседование

Daniel проводит внутреннее собеседование на team coordinator. Learner даёт связный ответ: три года релевантного опыта → сильная сторона с реальным примером → причина интереса к роли.

- Targets: recycled `gr_b1_present_perfect_experience`; `gr_b1_because_interview_reasons`.
- V2 phrase сохранена: `I've worked in this field for three years` присутствует дословно и естественно продолжается конкретными деталями о customer support и morning shift.
- Chunks/recycled: interview strength frame и recycled `should` в harder follow-up.
- v1: другая support role, другой опыт, сильная сторона и мотивация.
- v2: learner отвечает на более сложный вопрос “why should we hire you?” через релевантный опыт.
- Reviews: Near B1.8; Far A2.12. Prerequisites: B1.8/A2.12.

### B1.15 — Организовать групповую встречу

Learner собирает разные ограничения Maya, Daniel и Emma, предлагает время и место, проверяет участников и подтверждает arrangement. Это multi-party coordination, а не двустороннее приглашение из A2.14.

- Targets: `gr_b1_what_if_coordination`, `gr_b1_will_coordination`, recycled `gr_a2_present_continuous_arrangements`.
- Chunk: `Let's find a time that works for everyone`; ограничительное `if they agree` классифицировано как practical coordination chunk.
- v1: group day trip с train/time/meeting point и проверкой участников до покупки билетов.
- v2: один участник не может прийти в первое время; learner реально переносит встречу и повторно проверяет группу.
- Review/prerequisite: A2.14.

## Gate A — structural

PASS.

- JSON schema, unique stable IDs и cross-references: PASS.
- Module/lesson/lesson-item contiguous ordering: PASS.
- B1 course order: 15 authored situations в frozen progression order.
- Две transfer Practice Variations для каждой ситуации: PASS.
- Near/Far review references и prerequisites: PASS.
- Mission строится только из core introduce/target content; Practice/Review не входят в Mission: PASS.
- Seed import и повторный reseed без дублей: PASS.
- Grammar lint: **0 errors / 0 advisory notes** по 43 worksheet situations.

## Gate B — content

PASS.

- Dialogue coherence и speaker-role consistency: PASS.
- Authored NPC continuations отвечают непосредственно на предыдущую semantic learner line: PASS.
- Generic replies, повтор информации и дубли learner utterances: не найдены.
- English transcript не содержит русского текста: PASS.
- Grammar Target / Lexical Chunk classification соответствует frozen V2; ранних grammar jumps выше B1 нет.
- Variations требуют переноса функции и меняют условия/роль/ограничение, а не одно существительное.
- Scene/cast: B1.13 и B1.14 — Daniel/office; B1.15 — Alex/café.

## Gate C — Chromium/product

PASS. Chromium прошёл B1 end-to-end от onboarding/placement и Course через все 15 опубликованных B1 situations в frozen order.

- B1.13 Mission: PASS, 100%, `can_do`.
- B1.14 Mission: PASS, 100%, `can_do`.
- B1.15 Mission: PASS, 100%, `can_do`.
- Отдельный B1.1 FAIL path: 0%, `learning`, capability и completion не выданы.
- Course progression: 15/15 в QA run.
- Opener только в первой session; следующие sessions и Mission не повторяют opener.
- Activity ≠ spoken turn: transcript показывает один learner utterance на завершённый semantic turn; NPC continuation появляется ровно один раз.
- Practice и Review transcript behavior: PASS.
- Chromium assertions: **454 transcript snapshots**.
- Representative artifacts: **42 screenshots** B1.13–B1.15 плюс `b1-course-start.png`, `b1-course-complete.png`, onboarding/placement и FAIL-path screenshots в ignored `artifacts/qa/session-dialogue/`.

## Automated verification

- Targeted API/content/course tests: 51/51 PASS.
- Targeted web scene/opener tests: 14/14 PASS.
- Full suite: **407/407 PASS** — API 321, web 80, shared 6.
- API typecheck: PASS.
- Web typecheck: PASS.
- Seed idempotency, contiguity и invalid-reference checks входят в зелёный full suite.

Blocking findings: 0. Новых non-blocking UI findings не обнаружено; существующий release/UI backlog не менялся.
