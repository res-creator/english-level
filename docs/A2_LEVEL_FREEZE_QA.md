# A2 Level Freeze QA — preview only

## Result

**A2 CONTENT FROZEN / PRODUCTION READY.** All 17 frozen V2 A2 situations are `done`; blocking findings: **0**. This is a content and preview-QA freeze, with no production deployment. The audit did not alter the frozen curriculum, A1, schema, or engine architecture.

## Full-level audit

The full A2 course was reviewed and exercised after Batch 6. Batch-level dialogue, classification, and gate evidence is preserved in [Batch 1](A2_BATCH1_PRODUCTION_QA.md), [Batch 2](A2_BATCH2_PRODUCTION_QA.md), [Batch 3](A2_BATCH3_PRODUCTION_QA.md), [Batch 4](A2_BATCH4_PRODUCTION_QA.md), [Batch 5](A2_BATCH5_PRODUCTION_QA.md), and [Batch 6](A2_BATCH6_PRODUCTION_QA.md).

| Frozen situation | Capability/function and principal language check |
|---|---|
| A2.1 — `sit_a2_people_01` | Connected personal account: job, family/life, interests; Present Simple target. “I've lived here for…” remains a lexical chunk. |
| A2.2 — `sit_a2_people_02` | Informal Daniel's-party small talk and showing interest; recycled Present Simple/Wh-questions; no question tags. |
| A2.3 — `sit_a2_cafe_01` | Change an existing café order; polite change request is a lexical chunk; transaction differs from the A1 order. |
| A2.4 — `sit_a2_restaurant_01` | Book a table with polite booking language; phone variation changes modality and includes phone clarification/repetition. |
| A2.5 — `sit_a2_restaurant_02` | Make a concrete food request and adjust group quantity; no medical framing. |
| A2.6 — `sit_a2_travel_01` | Explain lateness with Past Simple and negotiate next steps using the classified `should` target. |
| A2.7 — `sit_a2_travel_02` | Clarify and reformulate a route; learner confirms the heard route instead of repeating A1 directions. |
| A2.8 — `sit_a2_daily_01` | Connected weekend story with multiple learner Past Simple clauses. |
| A2.9 — `sit_a2_daily_02` | Discuss and adjust future plans; both `going to` and Present Continuous arrangements are evidenced. |
| A2.10 — `sit_a2_shop_01` | Resolve a return/exchange using Past Simple explanation; no Present Perfect target. |
| A2.11 — `sit_a2_shop_02` | Compare products and establish discount conditions; comparatives are present in learner language. |
| A2.12 — `sit_a2_work_01` | Connected work/study description and frequency; no `used to` or early B1 preview. |
| A2.13 — `sit_a2_work_02` | Ask for help with a concrete work task; recycled `Could you...?`; `need to` is explicitly a lexical chunk. |
| A2.14 — `sit_a2_social_01` | Invite, then genuinely reschedule an agreed plan; not a repetition of A1.9. |
| A2.15 — `sit_a2_problems_01` | Report a lost object and its last known place; “I've lost…” remains a lexical chunk, with Past Simple for events. |
| A2.16 — `sit_a2_problems_02` | Identify an unordered bill item and request a check; `didn't order` is a Past Simple negative target. |
| H.A2 — `sit_a2_health_01` | Ask a shop assistant for a simple OTC product; symptom language is recycled A1; no diagnosis, treatment, dosage, or medical advice. |

Across the level, authored learner turns and NPC continuations were read for dialogue coherence, role/cast consistency, immediate relevance, duplicate information, natural continuation, and A2 complexity. Every grammar target has learner-language evidence; over-level formulas are explicitly classified as lexical chunks or recycled targets. Variation pairs change situation details and require transfer of the same capability. Near/Far links and prerequisites are wired without changing the Leitner/SRS model.

## Engine, Mission, and product QA

The complete A2 Chromium run exercised onboarding/course entry, all 17 situations in course order, Practice and Review, Mission completion, progression/unlocks, and transcript behavior. All 17 Mission PASS paths reached 100% / `can_do`, and progress reached 17/17. An independent H.A2 Mission FAIL reached 0% / `learning` and did not complete the situation. The run checked **884 transcript snapshots**, including first-session opener versus later-session continuity, semantic spoken turns (activities do not create duplicate dialogue turns), authored NPC continuation exactly once, English-only transcript, and Mission turn coherence. A2.4 phone variation was included. Chromium generated 36 representative screenshots for A2.16/H.A2; artifacts and `results.json` are local ignored preview output under `artifacts/qa/session-dialogue/`.

Automated full-level checks:

- Grammar lint: **0 errors / 0 advisory notes** across 28 V2 situations with classified grammar worksheets.
- Workspace test suite: **404/404** (API 319/319, web 79/79, shared 6/6).
- API and web typecheck: **PASS**.
- Seed idempotency, lesson-item contiguity, unique IDs, schema/content validation, and invalid-reference checks: **PASS**.
- Full-level Chromium: **PASS**, all 17 situations and both Mission outcomes as above.
- Gates A/B/C: **PASS** for every A2 situation.

## Findings

Blocking findings: **0**.

Non-blocking release/UI backlog remains separate from content freeze: persistent `Ситуация: …` overlay should become intro-only/fade; beginner-facing grammar UX needs improvement; safe-area/CTA layout needs device review; final visual polish. No global redesign was started during content QA.
