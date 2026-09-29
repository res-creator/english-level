# B2 Batch 3 — production QA (preview only)

Authored B2.7 `sit_b2_shop_01`, B2.8 `sit_b2_work_01`, and B2.9 `sit_b2_work_02` in frozen V2 order. A1, A2, B1, frozen curriculum documents, engine/schema, and production were not changed.

## Reference workflow

- British Council, [Challenging someone's ideas](https://learnenglish.britishcouncil.org/sites/podcasts/files/LearnEnglish-Speaking-B2-Challenging-someones-ideas.pdf): informed the movement from acknowledging a concern to testing its basis, answering it, and keeping a proposal workable.
- British Council, [How to get your English to B2 level](https://learnenglish.britishcouncil.org/comment/202666): informed the expectation that a learner develops a viewpoint, supports it, and responds to the other speaker instead of delivering an isolated monologue.
- Cambridge English, [B2 First handbook](https://www.cambridgeenglish.org/Images/167791-b2-first-handbook.pdf), [B2 First speaking format](https://www.cambridgeenglish.org/exams-and-tests/qualifications/first/format/?skill=speaking), and [Workplace English exams](https://www.cambridgeenglish.org/educators-organisations/accept-verify-exams/employers/workplace-english-exams/): set the standard for linked contributions, justified opinions, constructive disagreement, negotiation towards an outcome, and active participation in meetings.
- ELLLO, [B2 Sound Grammar](https://www.elllo.org/act/freebooks/B2-Book-Sound-Grammar.pdf), was checked for conversational pacing and the balance between extended turns and interaction; no source dialogue was copied.

Only flow, register, function, and CEFR difficulty were used. All Speak in English lines are original.

## Dialogue flows and variations

### B2.7 — Оспорить условия услуги

Emma identifies a new six-month minimum term on a renewed subscription. The learner distinguishes the price summary from the hidden commitment, asks to renegotiate, rejects two options that transfer the cost of unclear information, states the real consequence if the issue remains unresolved, and accepts a bounded flexible settlement with written confirmation.

- **Targets:** `gr_b2_passive_terms`; `gr_b2_conditional_service_consequence`.
- **Chunks:** `I'd like to renegotiate`, `What are my options here?`, and bounded settlement/read-back frames.
- **v1:** an automatically converted gym trial; relocation makes a membership freeze irrelevant, so the learner supplies sign-up evidence and requests a fee waiver.
- **v-call:** phone-only dispute; the contract is not visible, Emma reads the clause aloud, and the learner verbally confirms price, exit rights, timing, and the selected plan.
- **v2:** the provider removes a paid feature; Emma offers modified terms rather than cancellation, and the learner evaluates the third option against price and commitment constraints.
- **Review/prerequisite:** Far B1.10; prerequisite B1.10.

### B2.8 — Высказать мнение на рабочей встрече

Daniel asks for one testable response to late project updates. The learner links the delay to scattered email threads, proposes a shared status page and short review, answers the administration concern with three limited fields, adds ownership and a two-week pilot, then defines observable success criteria.

- **Targets:** `gr_b2_perspective_proposal`; `gr_b2_would_like_propose`.
- **Chunks:** reason-giving, bounded pilot, evidence and evaluation frames.
- **v1:** transfers the function to invoice approval and adds an urgent-request exception.
- **v2:** differentiates a live decision log from Maya's existing weekly summary, then integrates both without duplicate work.
- **v3:** Daniel is immediately sceptical about capacity; the learner narrows the trial, takes ownership, and defines a stop condition.
- **Review/prerequisite:** Far B1.12; prerequisite B1.12.

### B2.9 — Конструктивно не согласиться с коллегой

Daniel proposes that designers write full client notes immediately. The learner acknowledges the speed problem, explains the accuracy risk, responds to Daniel's delay evidence with shared responsibility, answers his context objection through required fields, and closes with explicit ownership plus a one-month review.

- **Targets:** `gr_b2_would_help_if`; `gr_b2_lets_constructive_action`.
- **Chunks:** `I see it differently`, constructive refinement and evidence-based reopening of an agreement.
- **v1:** disagreement concerns priority between launch materials and accessibility testing; the compromise allocates people to both critical outcomes.
- **v2:** Daniel proposes the middle ground first; the learner refines report scope around decision-critical risks.
- **v3:** a prior schedule agreement is reopened only because the client added a payment step; phased delivery preserves the original commitment where possible.
- **Review/prerequisite:** Near B2.8; prerequisite B2.8.

## Gates and verification

- **Gate A — PASS.** Seed schemas, IDs, references, module/lesson/item contiguity, frozen order, progression, reward mapping, Mission composition, and seed-twice idempotency pass. No engine or schema change was required.
- **Gate B — PASS.** Each situation has four connected core learner turns, six practice turns across three transfer variations, and ten unique immediately relevant NPC replies. Manual/static review found no generic continuation, role mismatch, duplicate information, repeated opener, Russian inside English transcript, or unclassified grammar. Near/Far curriculum review remains separate from Leitner/SRS.
- **Gate C — PASS.** Chromium completed all nine available B2 situations in order. B2.7, B2.8, and B2.9 each passed at 6/6, 100% / `can_do`. A separate B2.1 FAIL produced 0/5 / `learning`, remained incomplete, and awarded no reward. The run checked 431 transcript snapshots and generated 60 Batch 3 screenshots under ignored `artifacts/qa/session-dialogue/`.

Automated results: grammar lint **0 errors / 0 advisory notes** across 56 worksheet situations; targeted API/content/course/engine **71/71**; web scene/opener **17/17**; full workspace suite **413/413** (API 324, web 83, shared 6); API/web typechecks PASS; seed/schema/reference/contiguity/idempotency PASS.

Blocking findings: **0**. The existing non-blocking UI/release backlog remains unchanged.
