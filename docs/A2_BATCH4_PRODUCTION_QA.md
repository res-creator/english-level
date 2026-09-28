# A2 Batch 4 — production QA (preview only)

## Authored dialogue flows

### A2.10 — Возврат или обмен товара (`sit_a2_shop_01`, Emma)

Emma opens with an offer to help. The learner explains, “I bought this shirt yesterday, but it doesn't fit.” Emma asks whether they want a return or exchange; the learner chooses an exchange and asks for a smaller size. Emma checks for the receipt, the learner presents it and confirms the exchange can happen today, and Emma confirms the replacement costs the same and is available immediately.

Grammar Target: Past Simple positive (`gr_a2_past_simple_positive`), evidenced by `I bought … yesterday` and the Saturday purchase in v1. Present Perfect is not a target. Polite return/exchange requests are lexical chunks. v1 changes the purchase to trousers bought in the wrong size and asks for a larger size; v2 changes the product/problem to a kettle that does not work and negotiates another kettle with the receipt. Near/Far review: Far A1.7 (`itm_sie_a17_how_much`). Prerequisite: A1.7.

### A2.11 — Спросить про скидку (`sit_a2_shop_02`, Emma)

Emma mentions current offers. The learner asks about two jackets; Emma explains that both receive 20% off when buying two. The learner clarifies whether the offer applies to both, compares blue and green jackets using `cheaper than`, and checks the discounted total. Emma confirms £88 and a £22 saving; the blue/green prices are stated before comparison.

Grammar Target: comparative adjectives (`gr_a2_comparatives`), explicitly present in learner speech. Offer conditions, price questions and till details are classified as lexical chunks. v1 transfers the function to trainers with a weekend offer on one pair and checks how/when it is applied; prices are stated before the learner compares them. v2 transfers to two priced bags and a buy-one/get-second-half-price condition. Near/Far review: Far A1.7 (`itm_sie_a17_how_much`). Prerequisite: A1.7.

### A2.12 — Чем ты занимаешься подробнее (`sit_a2_work_01`, Daniel)

Daniel asks about the learner’s work before a meeting. The learner gives a connected full-time office description, explains the usual order-handling tasks with `usually`, then adds planning responsibilities with `often`, without repeating the customer-support detail. Daniel’s follow-ups use the stated customer-order work and teamwork.

Grammar Targets: Present Simple in connected descriptions (`gr_a2_present_simple_connected_descriptions`) and the recycled Present Simple frequency pattern (`gr_sie_frequency`). v1 transfers the response to a primary-school teacher’s daily preparation and classroom routines; v2 uses a part-time bookshop schedule and current duties in A2 language, without `used to` or another B1 preview. Near review: A2.1 (`itm_a2_a21_job_linked`); no Far review. Prerequisites: A2.1 and A2.2.

All core and practice learner turns have authored NPC continuations. Practice turns stay out of Missions. Course progression uses the existing lesson/module order and unlocks only after a passed Mission.

## Reference workflow

Before writing, British Council LearnEnglish Teens [Shopping for clothes (A2)](https://learnenglishteens.britishcouncil.org/skills/listening/a2-listening/shopping-clothes) informed the concise shop exchange and availability/transaction order; ELLLO [A2 Comparatives](https://elllo.org/book/A2/A2-09-Comparatives.html) informed how to make the comparison explicit with `than`; British Council [Talking about your job (A2)](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/talking-about-your-job) informed the role → explanation → relevant follow-up sequence. References informed register, turn order and CEFR complexity only; all Speak in English dialogue is original.

## Gates and verification

- **Gate A — PASS:** seed schemas and cross-references load; IDs are unique; module, lesson and lesson-item order is contiguous; lesson plans are valid; practice items are excluded from Missions; Near/Far links and course progression match V2. Reseeding is idempotent (automated regression test passes).
- **Gate B — PASS:** dialogue turn read-through, NPC/cast roles, response relevance, non-duplicated information, A2 complexity, Grammar Target/Lexical Chunk classification and transfer variations reviewed. Grammar lint: **0 errors, 0 advisory notes** across 23 situations with worksheet entries.
- **Gate C — PASS:** Chromium traversed all **12 A2 situations in order** and verified **12/12 Mission PASS** paths (100%, `can_do`) and course progress **12/12**. Transcript assertions passed in **354 snapshots**, including semantic learner-turn count, authored continuation placement, first-session opener, English-only transcript and progression. A separate A2.10 **Mission FAIL** path returned 0%, `learning` (five transcript snapshots).
- Targeted API content/course tests: **34/34**. Full workspace suite: **400/400** (API 317, web 77, shared 6). Recursive API/web/workspace typecheck: **PASS**. Seed validation, duplicate/reference checks, contiguity and idempotent reseed: **PASS**.
- No production content, A1 content, frozen curriculum document, schema or migration was changed.

## Chromium preview screenshots

Screenshots and JSON evidence are local ignored preview artifacts; no screenshots were committed.

- [A2.10 core dialogue](../artifacts/qa/session-dialogue/sit_a2_shop_01-pass-s1-itm_a2_a210_reason.png) · [variation](../artifacts/qa/session-dialogue/sit_a2_shop_01-pass-s2-itm_a2_a210_v1_reason.png) · [Mission result](../artifacts/qa/session-dialogue/sit_a2_shop_01-pass-s4-mission-result.png)
- [A2.11 core dialogue](../artifacts/qa/session-dialogue/sit_a2_shop_02-pass-s1-itm_a2_a211_offer.png) · [variation](../artifacts/qa/session-dialogue/sit_a2_shop_02-pass-s2-itm_a2_a211_v1_compare.png) · [Mission result](../artifacts/qa/session-dialogue/sit_a2_shop_02-pass-s4-mission-result.png)
- [A2.12 core dialogue](../artifacts/qa/session-dialogue/sit_a2_work_01-pass-s1-itm_a2_a212_role.png) · [v1](../artifacts/qa/session-dialogue/sit_a2_work_01-pass-s2-itm_a2_a212_v1_role.png) · [v2](../artifacts/qa/session-dialogue/sit_a2_work_01-pass-s3-itm_a2_a212_v2_role.png) · [Mission result](../artifacts/qa/session-dialogue/sit_a2_work_01-pass-s4-mission-result.png)
- [Completed A2 course](../artifacts/qa/session-dialogue/a2-course-complete.png) · [A2.10 Mission FAIL evidence](../artifacts/qa/session-dialogue/a2-batch4-fail-path.json)

No blocking findings. Existing UI/release polish remains in its separate backlog.
