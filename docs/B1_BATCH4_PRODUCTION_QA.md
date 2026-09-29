# B1 Batch 4 — production QA (preview only)

Authored B1.10 `sit_b1_shop_01`, B1.11 `sit_b1_shop_02`, and B1.12 `sit_b1_work_01` in frozen V2 order. Frozen curriculum, A1/A2 and production were left unchanged.

## References consulted before authoring

- Cambridge English, [B1 Preliminary vocabulary list](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf): B1 services and shopping vocabulary, including bill, customer, complain, cost, choose, reasonable and return.
- British Council, [B1 speaking resources](https://learnenglish.britishcouncil.org/free-resources/speaking/b1) and [Meeting face-to-face](https://learnenglish.britishcouncil.org/free-resources/speaking/b1/meeting-face-face): natural workplace question/response order and checking what a colleague needs.
- British Council, [Managing meetings](https://learnenglish.britishcouncil.org/comment/221157): clarify, check understanding, record tasks and action points.

The sources informed register, sequence and CEFR scope only. All Speak in English dialogue is original.

## Authored conversation flows

### B1.10 — Проблема с подпиской/счётом

**Emma opener:** “Hello. I can help with your account today. What seems to be wrong with the bill?”

1. The learner identifies two same-month charges and says “I was charged twice for my music subscription.” Emma checks whether they share a date.
2. The learner confirms both dates and the once-a-month plan. Emma identifies the duplicate and offers to investigate.
3. The learner asks Emma to look into the cause and prevent another bad bill. Emma finds the duplicated renewal and offers a refund/account correction.
4. The learner chooses both remedies. Emma confirms the refund time and single renewal.

v1 transfers the passive complaint to the wrong subscription tier. v2 adds persistence after an earlier call did not complete the refund. Target: `gr_b1_past_passive_billing`; `Can you look into this?` and `I'd like this fixed` are lexical chunks. Present Perfect is not a target. Review: A2.10.

### B1.11 — Сравнить варианты перед покупкой

**Emma opener:** “These two tablets are our most popular models. What matters most to you?”

1. The learner states two criteria: low weight for travel and a workable screen size. Emma gives the first feature contrast.
2. The learner reformulates the weight/screen comparison. Emma adds price and battery information.
3. The learner weighs cheaper price against the best battery life and states a preference with `would rather`. Emma adds the guarantee and asks for a decision.
4. The learner chooses the grey tablet and links the decision to long work trips.

v1 transfers comparison from physical goods to monthly/yearly service terms. v2 raises the choice to three bags and two practical constraints. Targets: recycled `gr_a2_comparatives`, `gr_b1_superlatives_choice`, `gr_b1_would_rather_preference`. Review: A2.11.

### B1.12 — Объяснить задачу коллеге

**Daniel opener:** “Thanks for meeting me. Which part of the event project do you want me to handle?”

1. The learner specifies the final guest-list deliverable and fields to check. Daniel asks for the source.
2. The learner names the registration file and email updates. Daniel asks for the deadline.
3. The learner gives the Thursday deadline and downstream reason. Daniel asks how to handle missing data.
4. The learner gives the exception rule and checks understanding. Daniel accurately summarises the deliverable, sources, exception and deadline.

v1 transfers the hand-off to a two-page survey summary with content requirements. v-phone removes visual context and verbalises the folder, file, three sources, output and deadline. Targets: `gr_b1_need_task_requirements`, `gr_b1_by_end_deadline`; `Does that make sense?` is a lexical chunk. Review: A2.13.

## Gates and verification

- **Gate A — PASS.** Stable IDs, schemas, seven-module/twelve-lesson B1 order, lesson-item contiguity, references, grammar attachments and reviews validate. Practice Variations stay outside Missions. Reseeding twice is idempotent.
- **Gate B — PASS.** Every NPC continuation answers the preceding semantic learner turn; Emma/shop and Daniel/office roles match; all variations transfer the function. No generic continuation, duplicate information, repeated opener, duplicate spoken turn, Russian in English transcript, unclassified construction or early grammar jump.
- **Gate C — PASS.** Chromium completed all 12 authored B1 situations in order. B1.10 Mission PASS: 5/5, B1.11: 7/7, B1.12: 6/6; all 100% and `can_do`. Separate B1.1 Mission FAIL: 0/4, 0%, `learning`, no completion. The new batch produced 93 transcript snapshots and 45 representative screenshots under ignored `artifacts/qa/session-dialogue/`.

Grammar lint: **0 errors / 0 advisory notes** across 40 worksheet situations. Full workspace suite: **407/407** (API 321, web 80, shared 6). API and web typechecks: PASS.

The only visual observation is the existing non-blocking release backlog: on some narrow screenshots the cast art overlaps the upper transcript area. No global visual redesign was started during content QA.
