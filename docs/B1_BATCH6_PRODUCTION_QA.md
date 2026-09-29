# B1 Batch 6 Production QA

Дата: 2026-09-29. Scope: preview seed/content only. Production, A1 и A2 не изменялись.

## Локальная frozen V2 correction

Изменена только строка `B1.18-v1` в `CONTENT_MASTER_PLAN_A1_B2_V2.md`. Исходное требование заменить Leo на Emma противоречило общему правилу §1 о том, что Practice Variation сохраняет NPC и scene core situation. После авторизации variation сохраняет Leo/restaurant, но меняет проблему: ресторану нужен стол для следующей брони, предложенные bar seats не подходят дедушке learner, поэтому learner спокойно предлагает covered terrace. Общая architecture variations и engine не менялись.

## Reference workflow

- British Council, [Requests, offers and invitations](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/requests-offers-invitations) и [will and would](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/will-and-would): invitation register, polite distance and softened response.
- British Council, [Dealing with a problem](https://learnenglish.britishcouncil.org/free-resources/speaking/b2/dealing-problem?page=1): только функциональный порядок problem → clarification → options → action; authored language deliberately kept at frozen B1 complexity.
- Cambridge English, [B1 Preliminary vocabulary list](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf) и [B1 Preliminary for Schools vocabulary booklet](https://www.cambridgeenglish.org/Images/648172-b1-preliminary-for-schools-vocabulary-booklet.pdf): familiar service/social vocabulary, suggestions, alternatives and negotiated agreement.

Источники использованы как reference; все Speak in English dialogues оригинальные.

## Dialogue и variations

### B1.16 — Вежливо отказаться

Alex передаёт приглашение Maya на housewarming dinner. Learner показывает желание прийти, называет настоящую причину, отклоняет второй вариант, предлагает coffee вместо picnic и доводит альтернативу до подтверждения.

- Targets: `gr_b1_would_love_but_refusal`, `gr_b1_instead_of_alternative`.
- Chunks/recycled: `maybe another time`, polite `could/should`.
- v1: studio talk, work register, другая обязанность и professional coffee alternative.
- v2: concert refusal; Alex спрашивает причину, learner даёт более длинное объяснение и новый общий план.
- Near review/prerequisite: B1.15.

### B1.17 — Решить проблему через несколько шагов

Learner восстанавливает историю desk-lamp order, проверяет объяснение Emma через `So what you're saying is...`, выбирает один из вариантов и упорядочивает действия.

- Targets: `gr_b1_sequencing_problem_steps`, `gr_b1_reported_confirmation_problem`.
- Chunks: `Let me explain from the start`, `That should work`.
- v1: wrong-address delivery, подтверждение нового факта и условная последовательность действий.
- v-voicemail: имя, order reference, конкретная проблема и callback request без визуальных подсказок и live back-and-forth.
- Far review/prerequisite: B1.10.

### B1.18 — Вежливо, но настойчиво добиться решения

Learner признаёт deposit policy, приводит email timestamp, просит другой способ проверки и добивается конкретного manager follow-up до закрытия card charge.

- Target: `gr_b1_concessive_persistence`.
- Chunks: `Could we find another way?`, `I'd really like this resolved`.
- v1: Leo/restaurant; table/accessibility constraint и практический компромисс с covered terrace.
- v2: unexpected cake service fee; два раунда pushback перед полным исправлением bill.
- Near review: B1.17; Far: B1.5. Prerequisites: B1.5/B1.17.

## Gates

### Gate A — structural

PASS: schemas, unique IDs, references, contiguous module/lesson/item ordering, course progression, two transfer variations per situation, Near/Far references, Mission core-only composition, seed import and idempotent reseed. Grammar lint: **0 errors / 0 advisory notes** across 46 worksheet situations.

### Gate B — content

PASS: coherent original dialogue, speaker-role consistency, relevant authored NPC continuations, English-only transcript, no generic reply, duplicate information or repeated learner utterance. Targets/chunks match frozen B1; no light intro or early B2 grammar. Variations change register, problem shape, modality, constraint or resistance.

### Gate C — Chromium/product

PASS. Chromium completed all 18 authored B1 situations in order, verified first-session opener and subsequent-session continuity, semantic spoken turns, Practice/Review behavior, progression and Mission transcript.

- B1.16 Mission: PASS, 100%, `can_do`.
- B1.17 Mission: PASS, 100%, `can_do`.
- B1.18 Mission: PASS, 100%, `can_do`.
- Separate B1.1 FAIL path: 0%, `learning`, no completion/capability.
- Chromium assertions: **549 transcript snapshots**. Создано **44 screenshots** B1.16–B1.18 плюс course/onboarding/placement и FAIL-path artifacts under ignored `artifacts/qa/session-dialogue/`. Representative Mission screens визуально проверены.

## Automated verification

- Targeted API/content/course tests: **51/51 PASS**.
- Targeted web scene/opener tests: **14/14 PASS**.
- Full suite: **407/407 PASS** — API 321, web 80, shared 6.
- API typecheck: PASS.
- Web typecheck: PASS.
- Seed idempotency, contiguity and invalid-reference checks: PASS.

Blocking findings: 0. Existing non-blocking release/UI backlog unchanged.
