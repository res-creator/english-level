# B1 Batch 2 — production QA (preview only)

Authored B1.4 `sit_b1_restaurant_01`, B1.5 `sit_b1_restaurant_02`, and B1.6 `sit_b1_travel_01` in frozen V2 order. A1/A2 and production were left unchanged.

## References consulted before authoring

- British Council, [B1 Intermediate descriptor](https://learnenglish.britishcouncil.org/level/understand-your-level/b1-intermediate): connected explanations, independent service communication and travel problems.
- British Council, [Episode 06: complaining about bad service](https://learnenglish.britishcouncil.org/free-resources/general/audio-series/podcasts/s2/episode-06?page=2): register and movement from describing a service problem to deciding on a complaint.
- British Council, [Transport and Travel Scene 2](https://learnenglish.britishcouncil.org/free-resources/general/video-series/wots/transport-travel/transport-travel-scene-2): transport-service exchange and travel context.
- Cambridge English, [B1 Preliminary vocabulary list](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf): checked ingredient, restaurant-service, delay and transport vocabulary.

Sources informed original dialogue flow, register and vocabulary only; no source dialogue was copied.

## Authored conversation flows

### B1.4 — Особые диетические потребности

**Leo opener:** “I can see you're checking the menu carefully. Would you like me to check an ingredient with the kitchen?”

1. **Learner:** “I have a serious nut allergy. Does the lentil pie contain any nuts?” **Leo:** The menu lists no nuts, but he will check the full ingredient sheet before promising it is safe.
2. **Learner:** “Could you make sure they use a clean pan as well? Even a small amount could be a problem for me.” **Leo:** He marks the order, speaks directly to the chef and promises to return after checking.
3. **Learner:** “Thanks. Could you confirm that the chef checked the sauce too, not just the pie?” **Leo:** He confirms both the sauce and clean pan were checked.

v1 changes the restriction to vegetarian preference and explicitly distinguishes it from allergy. v2 makes the learner check two components for sesame. Grammar target is recycled Present Simple ingredient questions (`gr_a1_present_simple_questions`); polite assurance and `could you make sure` remain chunks. Reviews: Near A2.5, Far A1.7.

### B1.5 — Серьёзная жалоба на обслуживание

**Leo opener:** “I'm sorry to keep you waiting. Your main course should be here already; what seems to be the problem?”

1. **Learner:** “We've been waiting for the main course for almost an hour, and nobody has told us what's happening.” **Leo:** Apologises, acknowledges the delay and commits to checking.
2. **Learner:** “When it arrived, it was the wrong dish, so this isn't what I expected after such a long wait.” **Leo:** Checks the ticket, confirms fish was ordered instead of chicken pasta, and offers to prepare the correct dish.
3. **Learner:** “I appreciate that, but the delay has affected our evening. What can you do about the bill?” **Leo:** Says he should have checked earlier, removes the drinks from the bill and brings the correct meal.

v1 transfers to a wrong order and asks for replacement plus bill correction. v2 is a two-step transfer: learner reports a cold dish and long wait; Leo initially says the kitchen was busy and the server brought it when ready; learner acknowledges this, restates the wait and cold food, and asks for the meal to be removed from the bill; Leo agrees. Present Perfect Continuous and `should have` are explicit lexical chunks, not grammar targets. Reviews: Near A2.16, Far A1.5. Prerequisites: A2.16 and B1.4.

### B1.6 — Проблема в поездке

**Rosa opener:** “I see you're checking the Northbridge trains. Is something wrong with your service?”

1. **Learner:** “My train has been cancelled, and I need to get to Northbridge before six. What are my options?” **Rosa:** Gives a replacement bus time and a train via Central.
2. **Learner:** “The bus is direct, but it may be slow in traffic. I'll take the train via Central because it gets me there earlier.” **Rosa:** Gives platform and ticket instructions.
3. **Learner:** “Thanks. Is platform five the one beside the coffee shop, and do I need to change at Central?” **Rosa:** Confirms the platform location and that no transfer is needed.

v1 changes the disruption to a delay that makes the learner miss a connection. v2 requires choosing between a direct but slower bus and faster train with a transfer, with heavy luggage affecting the decision. `My train has been cancelled` is a lexical chunk, not a Present Perfect Passive target. Reviews: Near A2.6, Far A2.7.

## Gates and verification

- **Gate A — PASS.** IDs, schemas, references, four-module order, six-lesson order, contiguous lesson items and review links validated. Practice Variations stay out of Missions. Idempotent seed test passes.
- **Gate B — PASS.** Read-through confirms each continuation answers the immediately preceding learner line; cast and scene match Leo/restaurant and Rosa/street; no generic NPC replies, role mismatches, repeated facts or non-English transcript phrases. Grammar constructions follow frozen V2 classification; variations transfer the function.
- **Gate C — PASS.** Chromium completed B1.1–B1.6 in course order. All six Missions passed at 100% (`can_do`); course progress reached 6/6. Separate B1.1 Mission FAIL scored 0% (`learning`) and did not complete. Transcript assertions passed across the run. The run produced 183 transcript snapshots and 37 preview screenshots for B1.4–B1.6 under ignored `artifacts/qa/session-dialogue/`.

Grammar lint: 0 errors / 0 advisory notes across 34 worksheet situations. Full workspace suite: 407/407 (API 321, web 80, shared 6). API and web typechecks: PASS. Structural seed/reference validation, contiguity and seed idempotency: PASS.
