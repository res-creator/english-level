# B2 Batch 1 — production QA (preview only)

Authored B2.1 `sit_b2_people_01`, B2.2 `sit_b2_restaurant_01`, and B2.3 `sit_b2_restaurant_02` from frozen V2. A1, A2, B1, and production were not changed.

## Reference workflow

- British Council, [Challenging someone's ideas](https://learnenglish.britishcouncil.org/sites/podcasts/files/LearnEnglish-Speaking-B2-Challenging-someones-ideas.pdf): informed the B2.1 movement from acknowledging a viewpoint to questioning its basis and defending a reasoned alternative.
- British Council, [B2 speaking](https://learnenglish.britishcouncil.org/free-resources/speaking/b2), and Cambridge English, [B2 First exam format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/first/format/?skill=speaking): set the level standard for coherent extended contributions, justification, evaluation, and negotiated decisions.
- British Council, [Starting Out 6 — I'll pay](https://learnenglish.britishcouncil.org/sites/podcasts/files/LearnEnglish-Starting-Out-episode-06-transcript.pdf), and ELLLO, [Burger Barn](https://www.elllo.org/english/1401/1449-Todd-BurgerBarn.htm): informed only the natural restaurant sequence of collecting choices, confirming them, correcting an unavailable item, and checking payment. B2.2 adds multiple speakers, dietary constraints, reported choices, correction, summary, and uneven allocation.
- British Council, [A letter of complaint](https://learnenglish.britishcouncil.org/free-resources/writing/b2/letter-complaint): informed B2.3's focus on material facts and a specific desired remedy, adapted into an original spoken negotiation.

Only flow, register, function, and CEFR difficulty were used. All Speak in English lines are original.

## Dialogue flows and variations

### B2.1 — Обсудить спорную тему с другом

Alex supports a car-free town centre. The learner acknowledges the benefit, introduces an accessibility concern, proposes a shuttle, asks Alex to justify an immediate permanent ban, and supports a time-limited trial with review criteria. The resolution is qualified common ground rather than one speaker winning.

- **Target:** `gr_b2_concession_clauses`, evidenced repeatedly through `although` and `even though`.
- **Chunks/recycled:** `I can see why...`, `on the other hand`, `What makes you think...?`, and the conditional compromise frame.
- **v1:** workplace register; collaboration space versus quiet rooms, supported with booking evidence.
- **v2:** Alex argues strongly against any car access; learner protects clinic access through timed permits without dropping the safety aim.
- **v3:** learner concedes the market-delivery constraint and reaches partial agreement on a ten o'clock closure.
- **Review/prerequisite:** Far B1.2; prerequisite B1.2.

### B2.2 — Организовать сложный групповой заказ

Leo invites the group order. The learner relays three choices, handles an unavailable dish and dairy-free condition, adds a shared starter with a nut constraint, gives a complete summary, then separates one starter while splitting the rest of the food and grouping drinks.

- **Targets:** `gr_b2_reported_speech_orders` and `gr_b2_summarising_order`.
- **Chunks/recycled:** polite service requests and bill-splitting instructions.
- **v1:** a shared menu gains a gluten constraint and fryer conflict, requiring the whole table order to be rebuilt.
- **v2:** one diner changes the main course after it has been relayed; learner confirms precisely what changes and what stays.
- **v3:** four diners consumed different amounts; learner negotiates itemised bills and allocates shared water in quarters.
- **Review/prerequisites:** Far B1.4/B1.5; prerequisites B1.4/B1.5.

### B2.3 — Оспорить счёт и добиться компенсации

Leo presents a revised bill after a disrupted meal. The learner identifies both charged mains, connects the delay to eating separately, rejects a dessert/half-price offer as disproportionate, states a bounded expectation, and settles on removing the two mains while paying for correctly served items.

- **Targets:** `gr_b2_fair_that` and `gr_b2_expect_compensation`.
- **Chunks/recycled:** evidence narration and `Could we agree on...?`.
- **v1:** a missing dessert requires removal and recalculation of the service fee.
- **v2:** Leo's initial discount is insufficient; learner counters with a reasoned 25% compromise.
- **v3:** learner references a successful prior visit to contextualise a lost booking, then requests removal of the service fee while paying for received food and drink.
- **Review/prerequisites:** Far B1.5/B1.18; prerequisites B1.5/B1.18.

## Gates and verification

- **Gate A — PASS.** New B2 seed files validate through the existing schemas. IDs, references, module/lesson/item contiguity, course order, Mission composition, and seed-twice idempotency pass. No schema or engine extension was needed.
- **Gate B — PASS.** Manual and static read-through verified coherent connected learner turns, immediate authored NPC responses, correct cast/scene roles, no duplicate information, no generic continuation, English-only transcript, three transfer variations per situation, B2-level reasoning/constraints, and target/chunk consistency. Grammar lint: 0 errors / 0 advisory notes across 50 worksheet situations.
- **Gate C — PASS.** Chromium completed the three situations in course order, including all Practice turns and reviews. All Missions passed at 100% / `can_do`: B2.1 5/5, B2.2 6/6, B2.3 6/6. A separate B2.1 FAIL produced 0/5 / `learning` without completion. Course progression reached 3/3; the People chapter awarded the existing `rw_shelf` once. The run checked 166 transcript snapshots and generated 68 preview screenshots under ignored `artifacts/qa/session-dialogue/`.

Automated results: targeted API/content/course/engine **56/56**, web scene/opener **15/15**, static B2 dialogue audit PASS, full workspace suite **409/409** (API 322, web 81, shared 6), API/web typecheck PASS, grammar lint PASS, seed/schema/reference/contiguity/idempotency PASS.

Blocking findings: **0**. The existing non-blocking UI/release backlog remains unchanged.
