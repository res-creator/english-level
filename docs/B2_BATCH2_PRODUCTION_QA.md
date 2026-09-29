# B2 Batch 2 — production QA (preview only)

Authored B2.4 `sit_b2_travel_01`, B2.5 `sit_b2_travel_02`, and B2.6 `sit_b2_daily_01` from frozen V2. A1, A2, B1, the frozen curriculum, and production were not changed.

## Reference workflow

- British Council, [Dealing with a problem](https://learnenglish.britishcouncil.org/sites/podcasts/files/LearnEnglish-Speaking-B2-Dealing-with-a-problem.pdf): informed the functional sequence for B2.4 — establish the disruption, explain its concrete impact, assess the first response, and negotiate a bounded remedy.
- British Council, [Discussing advantages and disadvantages](https://learnenglish.britishcouncil.org/comment/188444), and its [worksheet](https://learnenglish.britishcouncil.org/sites/podcasts/files/LearnEnglish-Speaking-B2-Discussing-advantages-and-disadvantages.pdf): informed B2.6's balanced movement between a benefit, a counterweight, a condition, and a qualified conclusion.
- Cambridge English, [B2 First](https://www.cambridgeenglish.org/exams-and-tests/first/index.aspx/?trk=profile_certification_title), [B2 speaking format](https://www.cambridgeenglish.org/exams-and-tests/first-for-schools/exam-format/?level=independent&skill=grammar), and the Cambridge research note on [reaching a decision through negotiation](https://www.cambridgeenglish.org/Images/561336-key-preliminary-revisions-speaking.pdf): set the level standard for sustained reasoning, comparison, response to constraints, and negotiated decisions.
- ELLLO, [B2 Sound Grammar](https://www.elllo.org/act/freebooks/B2-Book-Sound-Grammar.pdf): provided a reference for natural weather/travel constraints in B2.5.

Only flow, register, function, and CEFR difficulty were used. All Speak in English lines are original.

## Dialogue flows and variations

### B2.4 — Переговоры о компенсации за поездку

Rosa confirms that an overnight train was cancelled after the last bus. The learner links that disruption to an unavoidable hotel cost, states a proportionate expectation, responds to a £40 voucher with an £86 receipt, and negotiates a concrete settlement: £60 immediately, the remainder through a claim, and written confirmation.

- **Targets:** `gr_b2_given_that_reason` and `gr_b2_would_expect_compensation`.
- **Chunks/recycled:** `Given the circumstances...`, `Is there any flexibility on...?`, receipt/claim and settlement language.
- **v1:** an inaccessible hotel room forces a taxi transfer; the learner requests reimbursement and written accessibility confirmation.
- **v2:** an initial £20 offer is too low; the learner supports a bounded £60 counteroffer and reaches a supervisor-backed settlement.
- **v3:** the disruption causes a missed training day and a hotel change fee; the learner distinguishes a covered consequential cost from an excluded course fee.
- **Review/prerequisite:** Far B1.6; prerequisite B1.6.

### B2.5 — Сложный маршрут с ограничениями

Rosa helps compare routes to Hillview under time, budget, and heavy-rain constraints. The learner evaluates a direct coach against a coach/train combination, identifies the uncovered transfer and return-time risk, then chooses a mixed outbound/return plan and justifies how it satisfies the constraints.

- **Targets:** `gr_b2_taking_into_account` and `gr_b2_might_could_tradeoff`.
- **Chunks/recycled:** `the downside is...`, `it might be worth...`, route comparison and decision language.
- **v1:** the constraints shift to a £15 budget and a storm; frequency becomes material to the train/museum-shuttle choice.
- **v2:** Rosa proposes cycling; the learner pushes back because of a heavy suitcase and steep hill, then develops a tram/taxi alternative.
- **v3:** four constraints combine — wheelchair access, two suitcases, £25, and a 5 p.m. deadline — requiring a step-free train and a level final transfer.
- **Review/prerequisite:** Near B2.4; Far B1.7; prerequisite B1.7.

### B2.6 — Плюсы и минусы образа жизни

Alex raises a four-day week with slightly lower pay. The learner weighs an extra free day against salary pressure, fewer commutes against compressed workload, explains that the outcome depends on whether workload is reduced, and reaches a qualified conclusion that accounts for different personal circumstances.

- **Targets:** `gr_b2_contrast_connectors` and `gr_b2_depends_whether`.
- **Chunks/recycled:** `One advantage is...`, `the downside is...`, `on balance`, and evidence/conclusion language.
- **v1:** the decision transfers to a one-year training role versus a stable job, with career benefit and contract risk.
- **v2:** Alex presents a one-sided case for city life; the learner keeps a balanced position across jobs/events, rent/noise, and space.
- **v3:** a personal compressed-hours anecdote supplies evidence: a free Friday is weighed against a ten-hour Thursday and changing workload.
- **Review/prerequisite:** Far B1.9; prerequisite B1.9.

## Gates and verification

- **Gate A — PASS.** Seed schemas, stable IDs, references, module/lesson/item contiguity, course order, progression, reward mapping, Mission composition, and seed-twice idempotency pass. No schema or engine extension was required.
- **Gate B — PASS.** Manual and static review verified coherent semantic turns, immediately relevant authored NPC replies, correct cast/scene roles, no generic continuation, duplicate information, repeated opener, Russian inside English transcript, or unclassified grammar. Each situation has three transfer variations, connected B2-level reasoning, and explicit target/chunk classification. Near/Far curriculum review remains separate from Leitner/SRS.
- **Gate C — PASS.** Chromium completed all six available B2 situations in course order. B2.4, B2.5, and B2.6 Missions each passed at 6/6, 100% / `can_do`. A separate B2.1 FAIL produced 0/5 / `learning`, stayed incomplete, and awarded no reward. The run checked 299 transcript snapshots and generated 60 batch screenshots under ignored `artifacts/qa/session-dialogue/`.

Automated results: targeted API/content/course/engine **70/70**, web scene/opener **16/16**, static dialogue audit PASS, full workspace suite **411/411** (API 323, web 82, shared 6), API/web typechecks PASS, and grammar lint **0 errors / 0 advisory notes** across 53 worksheet situations. Seed/schema/reference/contiguity/idempotency PASS.

Blocking findings: **0**. The existing non-blocking UI/release backlog remains unchanged.
