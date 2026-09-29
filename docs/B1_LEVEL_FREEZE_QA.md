# B1 Level Freeze QA — preview only

## Result

**B1 CONTENT FROZEN / PRODUCTION READY.** All 19 frozen V2 B1 situations are `done`; blocking findings: **0**. This is a content and preview-QA freeze. Production was not touched, and the audit did not change A1, A2, the frozen curriculum, the schema, or the engine architecture.

## Full-level audit

The full B1 course was reviewed and exercised after H.B1. Batch-level dialogue, classification, reference, and gate evidence remains in [Batch 1](B1_BATCH1_PRODUCTION_QA.md), [Batch 2](B1_BATCH2_PRODUCTION_QA.md), [Batch 3](B1_BATCH3_PRODUCTION_QA.md), [Batch 4](B1_BATCH4_PRODUCTION_QA.md), [Batch 5](B1_BATCH5_PRODUCTION_QA.md), [Batch 6](B1_BATCH6_PRODUCTION_QA.md), and [H.B1](B1_HEALTH_PRODUCTION_QA.md).

| Frozen situation | Capability/function and principal language check |
|---|---|
| B1.1 — `sit_b1_people_01` | React to news, express a feeling and opinion, then sustain the exchange; Present Perfect news question is classified as planned. |
| B1.2 — `sit_b1_people_02` | Disagree softly, explain why, and maintain the position after pushback; modal softeners remain within B1. |
| B1.3 — `sit_b1_cafe_01` | Compare options, state a preference, and justify a recommendation; “If I were you…” remains a lexical chunk. |
| B1.4 — `sit_b1_restaurant_01` | Explain a dietary restriction and obtain specific confirmation without turning the scene into medical advice. |
| B1.5 — `sit_b1_restaurant_02` | Describe a serious service problem and negotiate a concrete remedy through approved chunks. |
| B1.6 — `sit_b1_travel_01` | Explain a travel disruption, compare alternatives, and choose the next step through approved chunks. |
| B1.7 — `sit_b1_travel_02` | Ask for route advice, compare recommendations, and build a realistic day plan. |
| B1.8 — `sit_b1_daily_01` | Tell a connected personal-experience story using Present Perfect experience and Past Simple events. |
| B1.9 — `sit_b1_daily_02` | Compare former and current routines with the frozen `used to` target and explain the change. |
| B1.10 — `sit_b1_shop_01` | Reconstruct a billing/subscription problem, establish the cause, and request a specific correction. |
| B1.11 — `sit_b1_shop_02` | Compare several product features, state a preference, and justify the final choice. |
| B1.12 — `sit_b1_work_01` | Explain a work task, concrete requirements, and a deadline in a coherent handover. |
| B1.13 — `sit_b1_work_02` | Request a specific workplace favour and negotiate scope and timing politely. |
| B1.14 — `sit_b1_work_03` | Give a connected interview answer about experience, a strength with evidence, and motivation. |
| B1.15 — `sit_b1_social_01` | Coordinate several people's constraints and confirm time, place, and participants. |
| B1.16 — `sit_b1_social_02` | Decline warmly, give a reason, and preserve the relationship with a concrete alternative. |
| B1.17 — `sit_b1_problems_01` | Explain a multi-step service problem, confirm understanding, and agree an ordered solution. |
| B1.18 — `sit_b1_problems_02` | Remain polite and persistent through resistance; both variations keep Leo and the same scene model. |
| H.B1 — `sit_b1_health_01` | Explain symptoms, duration, aggravating factors, and prior attempts; Present Perfect duration is the new target, while result/history forms remain chunks. |

Across the level, every core and variation learner line and authored NPC continuation was audited for coherence, speaker role, immediate response to the preceding turn, duplicate information, natural register, and B1 difficulty. Every attached grammar target has direct learner-language evidence. Lexical chunks remain classified as chunks, and no early B2 grammar was introduced. Each situation has two variations that change context and require transfer, plus wired Near/Far review where specified by V2. Review remains separate from the Leitner/SRS schedule.

## Engine, Mission, and product QA

The complete B1 Chromium run exercised Course entry, all 19 situations in published progression order, Practice, Review, Mission completion, and unlocks. Every Mission PASS reached 100% / `can_do`, and course progress reached 19/19. A separate B1.1 Mission FAIL reached 0% / `learning` and did not complete the situation.

The run checked **580 transcript snapshots** and 20 Mission results. It covered the first-session opener and later-session continuity, one spoken learner utterance per semantic turn, recognition/retrieval/review activities that do not create false utterances, authored NPC continuation exactly once, English-only transcript, and coherent Mission turns. H.B1 produced 15 representative preview screenshots. Screenshots and `results.json` are ignored local artifacts under `artifacts/qa/session-dialogue/`.

Automated full-level checks:

- Grammar lint: **0 errors / 0 advisory notes** across 47 worksheet situations.
- Workspace suite: **407/407** (API 321/321, web 80/80, shared 6/6).
- API and web typecheck: **PASS**.
- Seed idempotency, schema/content validation, unique IDs, lesson/item/module contiguity, course order, prerequisites, Near/Far references, and invalid-reference checks: **PASS**.
- Static B1 audit: **19/19 PASS** for core turns, two transfer variations, reviews, target coverage, authored continuations, English-only transcript, and no exact variation copy of a core line.
- Full-level Chromium: **PASS**, all 19 situations and both Mission outcomes as above.
- Gates A/B/C: **PASS** for every B1 situation.

## Findings

Blocking findings: **0**.

The non-blocking release/UI backlog remains separate from content freeze: make the persistent `Ситуация: …` overlay intro-only or fading; improve beginner-facing grammar UX; review safe-area and CTA layout on devices; complete final visual polish. No global visual redesign was started during content QA.
