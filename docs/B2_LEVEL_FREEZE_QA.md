# B2 Level Freeze QA

**Status: B2 CONTENT FROZEN / PRODUCTION READY.** All 22 frozen B2 situations are authored and passed Gates A/B/C. Blocking findings: **0**. Production was not touched.

## Final situation: H.B2

H.B2 `sit_b2_health_01` returns to the same clinic and Dr. Kim after H.B1. The opener establishes a follow-up appointment about a recommendation already discussed. The learner asks about practical side effects, requests an alternative linked to the need to drive, clarifies when the alternative will work, and weighs it against the original option before asking when to contact the clinic.

The genuine target is predictive `will` (`gr_b2_will_health_prediction`). Risk questions, `Is there an alternative?`, warning-sign language, and comparison frames are classified as lexical chunks or recycled B1.11 language. No additional tense or medical grammar is introduced implicitly.

The three frozen variations require transfer:

- v1 asks about a different treatment format and its time frame rather than repeating the side-effects question;
- v2 requires the learner to weigh a tablet and spray against speed, convenience, and driving;
- v3 asks whether specific exposure-reduction changes can be an alternative, then defines a review period and reconsideration criteria.

Near review is H.B1 through the previous symptom/treatment-history turn. Far review is B1.11 through a reasoned comparison and choice. The final module remains inside the existing B2 progression and chapter-reward evaluation; no schema or engine change was needed.

## Reference workflow

British Council [B2 speaking](https://learnenglish.britishcouncil.org/free-resources/speaking/b2) informed the functional sequence of clarifying advice, responding to an explanation and evaluating options. Cambridge [B2 First handbook](https://www.cambridgeenglish.org/images/167791-b2-first-handbook.pdf) informed relevant extended turns, interaction and discourse management. The sources were used for function, register and B2 complexity; all Speak in English dialogue is original.

## Full B2 content audit

All 22 situations and 66 Practice Variations were reviewed across the seven production batch records plus H.B2. The final audit found:

- coherent dialogue progression and connected learner turns rather than phrase lists;
- authored NPC continuations after every semantic learner turn, with no generic reply, duplicate information, Cyrillic in English transcript fields or speaker-role mismatch;
- B2 complexity expressed through nuance, evidence, trade-offs, revision, negotiation and discourse management rather than artificial sentence length;
- every grammar attachment backed by learner language and every notable non-target construction recorded as a Lexical Chunk or recycled structure;
- three transfer variations per situation, including phone modality where frozen V2 requires it;
- valid Near/Far review links, prerequisites, scenes, cast, module order, progression and existing reward evaluation;
- one spoken learner turn per semantic item, one continuation at the correct boundary, and no repeated opener in later sessions.

## Automated and product QA

Gate A/B/C: **PASS**.

- grammar lint: **0 errors / 0 advisory notes** across 69 worksheet situations and 67 authored situations with attached grammar targets;
- H.B2 targeted content/course tests: **46/46**;
- scene/cast/opener tests: **22/22**;
- full suite: **423/423** — API 329, web 88, shared 6;
- API typecheck: PASS;
- web and QA typecheck: PASS;
- fresh seed, idempotent reseed, schemas, invalid-reference checks, lesson/module contiguity and frozen course order: PASS;
- tracker consistency: **22/22 B2 done**, **69/69 total done**.

Chromium completed B2 end to end in frozen order and reached Course progress **22/22**. All 22 Missions passed at 100% with capability state `can_do`. A separate B2.1 FAIL path scored 0%, remained `learning`, granted no completion and preserved a coherent transcript. The run checked **1001 transcript snapshots** and produced 444 situation screenshots plus four course/onboarding screenshots under ignored `artifacts/qa/session-dialogue/`; 20 screenshots cover H.B2.

## Remaining findings

Blocking findings: **0**.

The existing non-blocking release/UI backlog remains separate: make the persistent `Ситуация: …` overlay intro-only or fading; improve grammar UX; review safe-area/CTA layout on target devices; complete final visual polish. No release or UI work was started during the content freeze.
