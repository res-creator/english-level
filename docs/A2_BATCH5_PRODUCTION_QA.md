# A2 Batch 5 — production QA (preview only)

## Scope and references

Authored A2.13 `sit_a2_work_02`, A2.14 `sit_a2_social_01`, and A2.15 `sit_a2_problems_01` under the frozen V2 curriculum and `CONTENT_PRODUCTION_PLAN.md`. No production deployment, A1 content, frozen curriculum document, schema, or engine behavior was changed.

Reference workflow consulted before drafting:

- British Council, [An email to ask a colleague to do something (A2)](https://learnenglish.britishcouncil.org/comment/210092), for a short reason → specific polite request → deadline sequence in a work context.
- British Council, [Requests, offers and invitations](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/requests-offers-invitations), for the register of recycled `Could you...?` requests.
- British Council, [Messaging to make plans (A2)](https://learnenglish.britishcouncil.org/free-resources/writing/a2/messaging-make-plans), for invitation → availability/constraint → alternative → confirmation order.
- Cambridge English, [A2 Key vocabulary list](https://www.cambridgeenglish.org/Images/506886-a2-key-2020-vocabulary-list.pdf), for familiar work, personal-item, and location vocabulary.

These references informed register, order, and level only. The Speak in English dialogue and continuations are original.

## Authored flows

### A2.13 — ask for help with a task

Daniel opens in the office by asking what the learner is working on. The learner explains that the handout for tomorrow's team meeting is hard to read, asks Daniel to check names and dates by a concrete deadline, and confirms the printing step. Daniel's replies address the handout, its missing date, and the time available. `Could you...?` is the recycled target (`gr_sie_could_polite`); `need to` is explicitly classified as the frozen V2 lexical chunk. Variation v1 requests an information favour (a room list) and clarifies exactly what is needed. Variation v2 asks Daniel to check a chart; Daniel is busy, offers half past two, and the learner agrees while identifying the rows to check. Near review: A2.12 work description. Far review: A1.5 `Could you...?` request.

### A2.14 — invite and change plans

Alex opens with a weekend-planning question. The learner invites him to a book fair, then changes the accepted Saturday arrangement to Sunday afternoon because of a family commitment, and confirms the new place and time. `Going to` is evidenced in learner speech and attached as `gr_a2_going_to_future`; `Could we... instead?` is recorded as a lexical chunk. Variation v1 invites Alex and Maya to a food market. Variation v2 first establishes a film plan, then includes two authored scheduling changes and a final confirmation; it never refers to an unestablished plan. Near review: A2.9 future plan. Far review: A1.9 social suggestion.

### A2.15 — report a lost item

Rosa sees the learner checking their pockets and asks whether something is missing. The learner reports a lost phone, says where they last used it and walked afterwards, identifies the likely bench, then asks Rosa to help check. Rosa responds to the stated location and proposes a practical search order. `I've lost...` and `Have you seen...?` remain lexical chunks; learner Past Simple forms (`used`, `walked`, `left`) evidence the `gr_a2_past_simple_positive` target. Variation v1 changes the phone to a bag and places it after a sports-centre class; v2 changes it to keys, adds two possible stops, and asks the learner to reconstruct the order. Far review: A1.4 location/directions vocabulary.

## QA results

**Gate A — PASS.** Seed/schema and cross-reference validation, unique IDs, contiguous lesson-item order, A2 course progression, Near/Far links, and idempotent reseeding passed. Practice items remain in the existing `practice` role and stay out of Mission generation. No data-model or runtime architecture changes were needed.

Grammar lint: **0 errors, 0 advisory notes** across 26 classified V2 situations. Every attached target has learner-language evidence. The new classifications keep A2.13 `need to` and A2.15 `I've lost...` out of grammar targets.

**Gate B — PASS.** Manual flow review confirmed each NPC continuation responds to the preceding learner turn, each speaker and situation cast match, and no line repeats information or puts Russian in the English transcript. The A2.14 v2 variation was strengthened with its own authored starting agreement before its two plan changes.

**Gate C — PASS.** Chromium preview exercised onboarding, Course, all 15 A2 situations in order, Missions, and final progress. All 15 Mission PASS paths returned 100% / `can_do`; a separate A2.13 Mission FAIL returned 0% / `learning` and did not award completion. The runner checked **838 transcript snapshots**, including semantic learner-turn boundaries, one NPC continuation per completed turn, opener placement, and English-only transcript content. Course progress reached 15/15. It generated **51 screenshots** for the three Batch 5 situations under ignored `artifacts/qa/session-dialogue/`; machine-readable outcomes are in `artifacts/qa/session-dialogue/results.json`.

Automated checks after the final seed and classification edits:

- Full workspace test suite: **402 passed, 0 failed** (API 318, web 78, shared 6).
- API typecheck: **PASS**.
- Web typecheck, including test and QA projects: **PASS**.
- Seed idempotency: **PASS** (the seed-twice regression test).
- `git diff --check`: **PASS**.

No blocking findings. Existing release/UI backlog is unchanged: persistent situation label overlay, grammar UX, safe-area/CTA review, and final visual polish.
