# A1 Batch 2 and level audit

Preview-only content and browser QA. No frozen curriculum document was edited and no production deploy or data write was made.

## Batch 2 authored dialogue

### A1.9 — «Что ты любишь делать?» (Alex, café)

Alex: “It’s nice to see you again. What do you like doing in your free time?”  
Learner: “I like reading in cafés.”  
Alex: “Me too. That little café by the park is quiet.”  
Learner: “Do you want to meet at the café on Saturday?”  
Alex: “Sure. What time works for you?”  
Learner: “How about two?”  
Alex: “Two is good. See you there!”

The exchange moves from interests to shared interest, then makes and confirms a concrete plan. `like + -ing` is the Grammar Target. “Do you want to…?” and “How about…?” are recorded as functional lexical chunks. Near review links to A1.3 routine language. The Practice Variation asks Alex to walk in the park on Sunday, requiring a new activity/day suggestion rather than a noun swap.

### A1.10 — «Где ты живёшь?» (Maya, café)

Maya: “What is your apartment like?”  
Learner: “I live in a small apartment near the station.”  
Maya: “What rooms are in your apartment?”  
Learner: “There are two bedrooms and a small kitchen.”  
Maya: “Where is the kitchen?”  
Learner: “The kitchen is next to the living room.”  
Maya: “That sounds convenient.”

The learner describes the actual home and its location. `There are…` is a learner-authored example for the Grammar Target `gr_a1_there_is_are`; “I live…” and “next to” are explicitly classified as chunks. Near review links to A1.2 café talk and A1.4 directions vocabulary. The variation describes a house with a garden near the kitchen and retains the same Maya/café context.

### H.A1 — «Мне нехорошо» (Alex, friend)

Alex: “You don’t look well. Are you okay?”  
Learner: “I don’t feel well.”  
Alex: “Oh no. What’s wrong?”  
Learner: “I have a headache. I need to rest.”  
Alex: “Of course. Let’s sit on that bench for a minute.”

Alex behaves as a concerned friend, not a clinician. The sole Grammar Target is `have + symptom noun` (`gr_a1_have`). “I need to rest” is explicitly a lexical chunk as directed by frozen V2, not a grammar/exposure target. There is no Near/Far review. The variation changes headache to stomach ache and keeps the simple supportive exchange.

## A1 full-level audit

### A1.1 variation correction

The authorized one-row V2 correction keeps Alex and the café. The learner says: “Hi, I’m Anna from Warsaw, and I’m a teacher.” Alex naturally responds: “Warsaw sounds lovely. My design studio is near here.” This changes the learner's origin/job and adds a compatible personal detail about Alex without contradicting his core designer/London details. It retains `be-positive` and familiar A1 introduction vocabulary and does not copy a core learner sentence. The variation is attached as `role: practice`; no cast override or engine change is involved.

- A1.1–A1.10 and H.A1 are present in the published A1 path in contiguous order. The new situations retain V2 prerequisites and Near reviews; Health has no review link per V2.
- Added V2 Practice Variations for A1.2–A1.5; A1.6–A1.10 and H.A1 also have practice items. Practice activities stay separate from the Mission target set and are spoken only at their authored semantic-turn boundary.
- Transcript review across all 11 situations found no generic NPC continuation, repeated NPC information, speaker-role mismatch, or Cyrillic in English dialogue. Session QA asserts one situation opener only on the first session, then authored learner/NPC turns; each continuation is emitted once. Mission uses its own transcript.
- Grammar lint now includes both `les_sie_*` and `sit_a1_*` authored situations. All attached targets have backing phrases; all worksheet item IDs resolve; above-level targets: 0 errors and 0 advisory notes. `need to rest` is a named chunk and only `gr_a1_have` is attached to H.A1.
- Seed schema/reference checks, stable-ID uniqueness, lesson and lesson-item contiguity, activity-plan validity, and repeated seed import/idempotency pass. Course API test and UI show all 11 situations.
- Progression path reached 11/11 completed in the browser after each Mission PASS. Existing API product tests also exercise the whole chapter and chapter reward.
- Chromium used the real React UI, Hono routes, disposable SQLite, and signed local dev auth. It drove Welcome → Demo → onboarding → A1 placement → Course; before each situation it checked Course's current/unlocked node and opened it through the Course button, then completed that situation's sessions and Mission. The final Course showed 11/11. Mission PASS was 100% on every situation. A separate Mission FAIL was 0%, remained `learning`, and did not pass. There were 333 transcript snapshots with no assertion failures or page errors.
- Final automated checks before the A1.1 correction: 387/387 tests; after the correction and regression assertions, 389/389; API/web typecheck PASS; grammar lint PASS (0 errors, 0 advisories).

## Gates and findings

**Batch 2 Gate A: PASS. Gate B: PASS. Gate C: PASS.** All three new situations passed structural, content, and Chromium/product checks.

**Full A1 Gate A: PASS. Gate B: PASS. Gate C: PASS.** The A1.1 variation contradiction is resolved by the curriculum owner's authorized one-row V2 correction. No blocking findings remain. **A1 CONTENT FROZEN / PRODUCTION READY.**

Known non-blocking release/UI backlog stays separate: persistent `Ситуация: …` overlay should become intro-only/fade; grammar UX needs beginner-facing labels/options; safe-area/CTA layout needs device review; final visual polish. No global visual redesign was started.

## Screenshots

Ignored local preview artifacts in `artifacts/qa/session-dialogue/`:

- `a1-onboarding-ready.png`, `a1-placement-result.png`
- `a1-course-start.png`, `a1-course-complete.png`
- A1.9: `sit_a1_social_01-pass-s1-itm_sie_a19_like_reading.png`, `sit_a1_social_01-pass-s2-itm_sie_a19_practice_park.png`, `sit_a1_social_01-pass-s3-mission-result.png`
- A1.1 variation: `les_sie_a1_e1-pass-s3-itm_sie_a11_practice_intro.png`
- A1.10: `sit_a1_daily_02-pass-s1-itm_sie_a110_live_apartment.png`, `sit_a1_daily_02-pass-s1-itm_sie_a110_there_are_rooms.png`, `sit_a1_daily_02-pass-s2-itm_sie_a110_practice_house.png`, `sit_a1_daily_02-pass-s3-mission-result.png`
- H.A1: `sit_a1_health_01-pass-s1-itm_sie_ha1_unwell.png`, `sit_a1_health_01-pass-s1-itm_sie_ha1_headache_rest.png`, `sit_a1_health_01-pass-s2-itm_sie_ha1_practice_stomach.png`, `sit_a1_health_01-pass-s3-mission-result.png`
- Mission FAIL: `les_sie_a1_e1-fail-s3-mission-result.png`
