# A2 Batch 2 — production QA (preview only)

## Authored situations

- **A2.4 — Booking a table (`sit_a2_restaurant_01`, Leo).** The in-person flow goes from Friday booking request to party size/time, then booking name and confirmation. Variation 1 changes day, time options and party size. The phone variation makes the remote channel explicit: the learner is calling, says the line cut out, asks for the times again, then completes the booking by phone. `would like` is the Grammar Target (`gr_a2_would_like_booking`); clarification, availability, spelling and booking formulas are recorded as lexical chunks. Near review: A1.8.
- **A2.5 — Special food request (`sit_a2_restaurant_02`, Leo).** The core is a concrete soup request: ask whether it contains onions, order two bowls without them, then add bread. Variation 1 checks cream in tomato pasta and asks for it without cream; variation 2 changes the order to four bowls and bread for everyone. Targets are `with/without` (`gr_a2_without_food`) and `some/any` (`gr_a2_some_any_food`); “Could we have…” is a lexical request chunk, not an added grammar target. Near review: A2.4; Far review: A1.2.
- **A2.6 — Late and changing plans (`sit_a2_travel_01`, Rosa).** The core explains a missed bus in Past Simple and asks what to do next; Rosa suggests taking a taxi to the station and says where she will wait. Variation 1 changes the cause/context to going to the wrong building and missing a meeting. Variation 2 changes it to oversleeping, a missed early train and a later plan. Past Simple positive/negative and `should` are explicit targets; apology/transport/suggestion frames are classified as chunks. Near/Far review: A1.4 and A1.8.

All three reuse the approved cast and scene; each semantic learner phrase appears once as a spoken turn, while supporting activities remain exercises. Variations are authored Practice items and are excluded from the Mission. Prerequisites/progression are inherited from the frozen V2 plan and the existing unlock model.

## Reference workflow

British Council [Booking a table](https://learnenglish.britishcouncil.org/comment/210215) informed A2.4's date/time → party-size → name → confirmation sequence. ELLLO [A2 Can requests](https://www.elllo.org/book/A2/A2-20-Can-Requests.html) informed the compact request/response register for A2.5. British Council [A2 Apologising](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/apologising?page=1) informed the brief apology/response rhythm in A2.6; Cambridge's [A2 Key vocabulary list](https://www.cambridgeenglish.org/latinamerica/Images/506886-a2-key-2020-vocabulary-list.pdf) informed familiar transport vocabulary. These are functional and level references; none of the authored dialogue is copied.

## QA results

- **Gate A — PASS:** seed schemas/references, unique IDs, contiguous lesson-item ordering, generated lesson plans, grammar worksheet references and idempotent seed all pass the automated API content tests.
- **Gate B — PASS:** manual dialogue read-through verified each NPC continuation responds to the immediately preceding learner turn, no generic continuation or speaker mismatch, no repeated content, and the A2.6 Past Simple explanation/advice request. Grammar lint reports **0 errors / 0 advisory notes** across 17 situations with worksheet entries. Dietary content stays at restaurant service, not medical advice; no “light intro” targets were added.
- **Gate C — PASS:** Chromium used the local product UI and disposable test database. It completed all six published A2 situations in Course order, checked 280 transcript snapshots for authored turn order, first-session opener placement, exactly-once continuation and English-only transcript, verified chapter progress reached 6/6, and exercised all six Mission PASS paths (100%, `can_do`). A separate run exercised A2.4 Mission FAIL (0%, `learning`).
- **Automated:** full suite **394/394** (API 313, web 75, shared 6); API and web typechecks PASS; grammar lint PASS; seed idempotency/contiguity/reference checks PASS.

## Representative preview screenshots

Artifacts are ignored local preview output, not production files:

- [A2 course start](../artifacts/qa/session-dialogue/a2-course-start.png)
- [A2.4 phone variation](../artifacts/qa/session-dialogue/sit_a2_restaurant_01-pass-s3-itm_a2_a24_vphone_repeat.png)
- [A2.4 Mission PASS](../artifacts/qa/session-dialogue/sit_a2_restaurant_01-pass-s4-mission-result.png)
- [A2.5 dietary variation](../artifacts/qa/session-dialogue/sit_a2_restaurant_02-pass-s2-itm_a2_a25_v1_without_cream.png)
- [A2.6 change-plan variation](../artifacts/qa/session-dialogue/sit_a2_travel_01-pass-s3-itm_a2_a26_v2_change_plan.png)
- [A2 course complete](../artifacts/qa/session-dialogue/a2-course-complete.png)
- [A2.4 Mission FAIL](../artifacts/qa/session-dialogue/sit_a2_restaurant_01-fail-s4-mission-result.png)

No blocking findings. A2.7 onward remains untouched; stop here before Batch 3.
