# B1 Batch 1 — production QA (preview only)

Authored B1.1 `sit_b1_people_01`, B1.2 `sit_b1_people_02`, and B1.3 `sit_b1_cafe_01` from the approved frozen curriculum and production plan. A1 and A2 remain frozen and unchanged. No production content was touched or deployed.

## Reference workflow

- British Council, [Responding to news (B1)](https://learnenglish.britishcouncil.org/comment/154872): informed the conversational movement from a specific announcement to an emotional response, personal reaction, and relevant follow-up.
- British Council, [Agreeing and disagreeing (B1)](https://learnenglish.britishcouncil.org/free-resources/speaking/b1/agreeing-disagreeing?page=6): informed the register and sequence of acknowledging a concern, explaining a different view, and offering a constructive alternative.
- British Council, [An email giving holiday advice (B1)](https://learnenglish.britishcouncil.org/free-resources/writing/b1/email-giving-holiday-advice?page=8): informed the compact recommendation → reason structure.
- Cambridge English, [B1 Preliminary vocabulary list](https://www.cambridgeenglish.org/vn/Images/506887-b1-preliminary-vocabulary-list.pdf): checked familiar vocabulary for feelings, opinions, events, food, and service settings.
- British Council, [B1 level descriptor](https://learnenglish.britishcouncil.org/level/understand-your-level/b1-intermediate): checked that learner turns give connected opinions and brief reasons within familiar contexts.

Only conversation order, register, vocabulary coverage, and level were used as references. All Speak in English dialogue lines are original.

## Authored dialogues and variations

### B1.1 — Обсудить новости с Алексом

**NPC opener — Alex:** “I ran into Maya this morning. She had some exciting news about the bookshop.”

1. **Learner:** “Oh, that's fantastic! She cares a lot about books, so it sounds like a great fit.”
   **Alex:** “She was thrilled when she told me. The first event is meant to bring neighbours together.”
2. **Learner:** “Have you heard whether the library will take part too? Their readers might enjoy it.”
   **Alex:** “Maya said she invited the library team, but they haven't confirmed yet.”
3. **Learner:** “I hope they can come. I think hearing different readers talk about books would make the evening more interesting.”
   **Alex:** “Me too. I'll ask Maya when she's planning the first discussion.”

This is a conversation about a real update, not a news article: the learner reacts, shows enthusiasm, adds a view with a reason, and asks a follow-up tied to Alex's announcement. Variation v1 changes to a friend's move to Bristol and invites a supportive reaction. Variation v2 changes to a mildly negative change to library events and requires a gentler response before asking about an alternative venue.

**Grammar Target:** `gr_b1_present_perfect_news`, evidenced in learner language with `Have you heard whether/if…?` in core and v2. `Might enjoy`, emotional reactions, and opinion formulas are explicitly classified as chunks where they are not this target.

### B1.2 — Не согласиться вежливо

**NPC opener — Alex:** “I was at the evening market yesterday. I think the live music should end at seven.”

1. **Learner:** “I see what you mean, but the music makes the market feel welcoming. A lot of families arrive after work and stay to listen.”
   **Alex:** “That's fair, although the stalls say people stay longer when the music is on.”
2. **Learner:** “I'm not sure I agree that it needs to stop so early. We could lower the volume after seven; that might keep it comfortable for everyone.”
   **Alex:** “Maybe. But people who live beside the square still need a quiet evening.”
3. **Learner:** “That's true. Perhaps the music could stay near the main entrance, farther from the houses. Then the stalls can keep it, and residents get a quieter street.”
   **Alex:** “That sounds workable. I'll suggest trying it for one month and asking the neighbours what they think.”

The reasoning now supports the learner's view: many families arrive after work for the music. Variation v1 transfers disagreement to the start time of a local event. Variation v2 concerns an outdoor film: Alex pushes back first over the weather and then over equipment costs; the learner acknowledges each concern, keeps their view, and proposes waiting until Friday to decide with the hall held as backup.

**Grammar Target:** `gr_b1_modal_softeners`, backed by learner `could` and `might` proposals. `I see what you mean, but…`, `I don't think…`, and `I'm not sure I agree…` are classified as fixed softened-opinion chunks, not separate grammar targets. The frozen modal-softener function is preserved.

### B1.3 — Порекомендовать и обсудить выбор

**NPC opener — Maya:** “I'm putting together the café's drinks board. We have two new drinks—which one would you feature?”

1. **Learner:** “The ginger iced tea is lighter and less sweet than the vanilla cold brew, so it may suit more people on a warm day.”
   **Maya:** “That makes sense. The cold brew is popular with guests who like a richer drink.”
2. **Learner:** “I prefer the ginger tea for the board because it's refreshing but not too strong. If I were you, I'd recommend it with the lemon cake.”
   **Maya:** “Nice pairing. Would you mention who might prefer the cold brew?”
3. **Learner:** “Maybe add a note that the cold brew is for people who like a stronger taste. That gives customers a choice.”
   **Maya:** “Good idea. I'll put both options on the board with those notes.”

Variation v1 transfers the recommendation to lunch food (mushroom toast versus cheese scone). Variation v2 compares an oat bar with a fruit bowl, weighs price against freshness, then recommends one for a light afternoon snack. Both retain a supported preference/recommendation function.

**Grammar Target:** recycled `gr_a2_comparatives` is evidenced by comparisons in the core and both variations. `If I were you…` remains the frozen lexical chunk; the full Second Conditional paradigm is not taught. Preference, `it may suit…`, and recommendation formulas are classified as chunks.

## Gates and verification

- **Gate A — PASS.** B1 modules/lessons/items/patterns load through the existing seed schema. Stable IDs, references, grammar attachments, contiguous lesson-item order, lesson progression, and idempotent reseeding pass. Practice variations are excluded from Missions; each learner item creates one semantic spoken turn and carries its authored continuation.
- **Gate B — PASS.** Manual read-through verified the learner/NPC roles, cast/scene mapping, immediate relevance of every NPC continuation, natural dialogue sequence, no repeated information, English-only transcript, B1 fit, and no unclassified target/chunk constructions. Targeted QA checks B1.1 emotional reaction/opinion/follow-up, B1.2 second resistance, and B1.3 preference/reasoned recommendation.
- **Gate C — PASS.** Chromium ran onboarding/course entry and B1.1–B1.3 in order. The core and Practice sessions for all three situations passed transcript comparison; session transcripts included both authored Practice Variations, including the second Alex pushback and learner response in B1.2-v2. All three Missions scored 100% / `can_do`; the course reached 3/3. A separate B1.1 Mission FAIL scored 0% / `learning` and did not complete the capability. **106 transcript snapshots** passed, covering core, Practice, and Mission turns; preview generated **43 screenshots** under ignored `artifacts/qa/session-dialogue/`. Results are in ignored `artifacts/qa/session-dialogue/results.json`.

Automated results: grammar lint **0 errors / 0 advisory notes** across 31 worksheet situations; targeted content/course/scene tests **52/52**; engine activity-plan QA **17/17**; final combined targeted rerun **69/69**; full workspace suite **407/407** (API 321, web 80, shared 6); API/web typecheck **PASS**. Seed-twice idempotency, structural/reference validation, and contiguity **PASS**. The QA runner's “Next” button selector was tightened to exact matching after a recommendation beginning with the same word exposed an ambiguous match; the final Chromium run passed.

Prerequisites and review links follow V2: B1.1 after A2.1; B1.2 after B1.1; B1.3 after A2.3. Course order and unlock progression were verified in preview. Near/Far reviews are wired where specified: B1.1 reviews A2.1; B1.2 reviews B1.1; B1.3 reviews café language from A2.3 and A1.2. No new SRS or data-model behavior was introduced.
