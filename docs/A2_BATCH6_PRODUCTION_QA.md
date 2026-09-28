# A2 Batch 6 — production QA (preview only)

Completed A2.16 `sit_a2_problems_02` and H.A2 `sit_a2_health_01` against the frozen V2 curriculum and approved production plan. No production content, A1 content, frozen curriculum, schema, or engine behavior was changed.

## Reference workflow

- British Council, [Elementary podcast: Support](https://learnenglish.britishcouncil.org/sites/podcasts/files/learnenglish-podcasts-elementary-02-05-support-pack-transcript_0.pdf), informed the sequence for identifying a purchase/bill problem, giving a concrete detail, requesting a check, and confirming the outcome.
- British Council, [Shopping vocabulary (A1–A2)](https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2/shopping?page=1), informed familiar transaction vocabulary and register.
- Cambridge English, [A2 Key vocabulary list](https://www.cambridgeenglish.org/vn/Images/506886-a2-key-2020-vocabulary-list.pdf), informed the receipt, food, price, and shop vocabulary range.
- British Council, [At the chemist](https://learnenglish.britishcouncil.org/comment/136011), was consulted as an upper-bound reference only: H.A2 stays a simple shop transaction and excludes diagnostic questions, treatment advice, dosage, and allergy discussion.
- British Council, [A2 level descriptor](https://learnenglish.britishcouncil.org/level/understand-your-level/a2-pre-intermediate), informed familiar-context complexity.

Only sequence, register, vocabulary range, and level were used as reference. Both dialogues and all continuations are original.

## A2.16 — Ошибка в счёте

Leo presents the itemised restaurant bill. The learner identifies the apple tart that they did not order, names the soup and tea they did order, asks Leo to check the bill against the order slip, and confirms the corrected amount before paying. Leo addresses the named item, checks the order, and reports the corrected total.

Grammar targets: Past Simple negative (`I didn't order…`, `gr_a2_past_simple_negative`) and positive (`We ordered…`, `gr_a2_past_simple_positive`). `Could you check…?` is classified as the recycled polite target `gr_sie_could_polite`.

Practice variations transfer the bill-checking capability. V1 changes the discrepancy to a missing soup and has the learner compare the bill with the order slip. V2 discovers the unrequested tart after payment and asks Leo to check the charge and refund it. The error type and discovery point differ while remaining a familiar A2 transaction. Near review: A2.4/A2.5; Far review: A1.5. Prerequisite/progression follows the frozen course ordering.

## H.A2 — Нужно средство от простуды

Emma is a shop assistant. The learner names a sore throat, asks whether the shop has a suitable simple product, chooses throat lozenges, and pays. Emma points to the shelf product, label, and price and completes the purchase; she gives no medical advice.

Grammar is recycled A1 language: `gr_a1_have` for the symptom and `gr_a1_present_simple_questions` for asking what is available. Comparatives from A2.11 recur only in v2 to compare shelf prices; they are not introduced as a new H.A2 grammar target.

V1 changes the symptom to a cough and the request to sugar-free cough sweets. V2 changes it to a headache and asks the learner to compare two labelled products by price before choosing. No diagnosis, treatment recommendation, dosage, or allergy discussion appears. Near review: A1.7; prerequisite H.A1/A1.7. Emma remains a shop assistant, not a pharmacist.

## Gates and verification

- **Gate A — PASS.** Seed/schema validation, IDs/references, contiguous ordering, progression and Near/Far wiring passed. Seeding twice is idempotent. Mission plans include the core learner targets and exclude Practice Variations.
- **Gate B — PASS.** Read-through confirms each NPC continuation responds to the immediately preceding learner turn; cast/role matches the scene; no repeated information, generic continuation, or Russian transcript text. Grammar lint reports no unclassified target forms or unattached targets.
- **Gate C — PASS.** Chromium exercised both situations in the A2 course flow and their real Mission pass paths; each scored 100% / `can_do`. A separate H.A2 Mission fail scored 0% / `learning`, with no completion reward. The broader full-level run is recorded in [A2 level-freeze QA](A2_LEVEL_FREEZE_QA.md).

Automated verification: workspace suite **404/404** (API 319, web 79, shared 6); API and web typecheck **PASS**; grammar lint **0 errors / 0 advisory notes** across 28 classified situations; seed idempotency, contiguity, and invalid-reference checks **PASS**. Full A2 Chromium QA checked 884 transcript snapshots and generated 36 preview screenshots for these two situations under ignored `artifacts/qa/session-dialogue/`. Machine-readable run results are in ignored `artifacts/qa/session-dialogue/results.json`.
