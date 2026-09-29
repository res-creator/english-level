# B1 Batch 3 — production QA (preview only)

Authored B1.7 `sit_b1_travel_02`, B1.8 `sit_b1_daily_01`, and B1.9 `sit_b1_daily_02` in frozen V2 order. Frozen curriculum, A1/A2 and production were left unchanged.

## References consulted before authoring

- British Council, [An email giving holiday advice (B1)](https://learnenglish.britishcouncil.org/free-resources/writing/b1/email-giving-holiday-advice?page=8): natural `worth + -ing` recommendation followed by a reason.
- British Council, [B1 Intermediate descriptor](https://learnenglish.britishcouncil.org/level/understand-your-level/b1-intermediate) and [B1 speaking resources](https://learnenglish.britishcouncil.org/free-resources/speaking/b1): connected personal accounts and relevant conversational follow-up.
- ELLLO, [Life in the 80s (B1)](https://www.elllo.org/english/1501/1525-RachelTodd-PastNow-Teens.htm): past-versus-now framing.
- Cambridge English, [B1 Preliminary Speaking format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/preliminary/format/): expectations for familiar-topic experience, narrative and opinion.

Sources informed turn order, register and vocabulary/level only. All Speak in English dialogue is original.

## Authored conversation flows

### B1.7 — Спросить совет о маршруте на день

**Rosa opener:** “You've got some time before your train. What would make the stop worthwhile for you?”

1. **Learner:** “What would you suggest seeing first? I'm interested in local history, but I don't want to spend the whole day indoors.” **Rosa:** Recommends the city museum followed by the nearby canal path.
2. **Learner:** “The museum is closer than the riverside path, but is the riverside walk worth doing this afternoon?” **Rosa:** Explains the walk takes about 35 minutes and offers a practical turn-back point.
3. **Learner:** “Then I'll walk along the canal first and visit the museum afterwards if I have time. How long does it take to get back to the station?” **Rosa:** Gives return times from two points on the route.

v1 transfers the recommendation to a quick local lunch. v2 adds a two-hour limit and asks the learner to decide whether to combine or select activities. Targets: `gr_b1_worth_ing_recommendations` and recycled `gr_a2_comparatives`. Reviews: Near B1.6, Far A2.6/A2.7.

### B1.8 — Рассказать историю из жизни

**Alex opener:** “Have you ever had a trip that didn't go quite as planned?”

1. **Learner:** “I've had one trip I'll never forget. I went to York on my own for a weekend when I was at college.” **Alex:** Asks what happened on the first day.
2. **Learner:** “I took the wrong bus and ended up outside the city. It started to rain, so I went into a small café and asked for directions.” **Alex:** Reacts to the difficulty and asks whether anyone helped.
3. **Learner:** “The owner drew me a map, and I got back just in time for a walking tour. I was late, but the guide waited for me. I'll never forget how kind they were.” **Alex:** Responds to the resolution.

v1 retells a travel mistake, then explains how it was resolved. v2 links two setbacks at a street festival and explains the solution. Present Perfect experience is the first genuine target for this facet; Past Simple is recycled from A2.8. “I'll never forget…” is an explicit chunk. Reviews: Near A2.8, Far A1 daily-routine vocabulary.

### B1.9 — Обсудить изменение в жизни

**Alex opener:** “Last year brought a big change for you. What's different about your everyday life now?”

1. **Learner:** “I used to live near the old market, but now I rent a flat beside my office. I moved because the bus ride took nearly an hour each way.” **Alex:** Recognises the commute change and asks what else changed.
2. **Learner:** “I used to spend most evenings at home, but now I walk along the river on my way back. It helps me relax after work.” **Alex:** Responds to the new habit and asks about consistency.
3. **Learner:** “The change happened slowly. At first I walked once a week, then twice, and now I go almost every day. I realised I sleep better when I get some fresh air.” **Alex:** Responds to the gradual progress and benefit.

v1 changes the domain to a bus reading/listening habit. v2 transfers to commuting and explains several stages in a gradual change. `used to + base verb` is the target; no higher-level grammar is introduced. Reviews: Near B1.8, Far A2.8.

## Gates and verification

- **Gate A — PASS.** Stable IDs, seed schemas, course/module/lesson order, references, contiguous lesson items, grammar attachments, and Near/Far references validate. Practice Variations remain outside Missions. Full suite verifies idempotent reseed.
- **Gate B — PASS.** Manual review confirms every NPC continuation answers its immediately preceding learner line; scenes/cast match Rosa/street and Alex/meeting; variations transfer function; openers fit the core and practice contexts. No generic NPC reply, role mismatch, repeated opener/context, duplicate learner turn, Russian text in English lines, unclassified above-level grammar, or B1+ preview.
- **Gate C — PASS.** Chromium completed all nine authored B1 situations in order. All nine Missions passed at 100% (`can_do`); B1 course progress reached 9/9. Separate B1.1 Mission FAIL scored 0% (`learning`) and did not unlock the situation. The final run verified **269 transcript snapshots** and created **39 preview screenshots** for B1.7–B1.9 under ignored `artifacts/qa/session-dialogue/`.

Grammar lint: **0 errors / 0 advisory notes** across 37 worksheet situations. Structural/schema/reference and seed-idempotency checks: PASS. Full workspace suite: **407/407** (API 321, web 80, shared 6). API/web typechecks: PASS.
