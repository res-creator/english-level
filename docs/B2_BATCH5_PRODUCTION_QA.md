# B2 Batch 5 — production QA (preview only)

Authored B2.13 `sit_b2_problems_01`, B2.14 `sit_b2_problems_02`, and B2.15 `sit_b2_people_03` in frozen V2 order. A1/A2/B1, engine/schema, and production were not changed.

## Frozen V2 correction

With explicit curriculum-owner approval, the frozen document changed in exactly one place: the B2.14-v1 row. It now keeps Leo and the restaurant scene, as required by the general Practice Variation rule, while transferring polite firmness to a dispute about an undisclosed outside-cake fee. No other frozen V2 row, variation rule, engine behavior, or schema changed.

## Reference workflow

British Council [B2 speaking](https://learnenglish.britishcouncil.org/free-resources/speaking/b2), [Challenging someone's ideas](https://learnenglish.britishcouncil.org/free-resources/speaking/b2/challenging-someones-ideas?page=10), and [Dealing with a problem](https://learnenglish.britishcouncil.org/free-resources/speaking/b2/dealing-problem?page=1) informed acknowledgement, evidence, polite resistance, and movement towards a bounded outcome. Cambridge [B2 interactive communication](https://www.cambridgeenglish.org/images/168619-assessing-speaking-performance-at-level-b2.pdf) informed linked contributions, justification, comparison, and negotiated decisions. ELLLO B2 material informed conversational pacing. All Speak in English dialogue is original.

## Content

- **B2.13:** a verified tablet fault develops from repair risk to two possible compromises and a written store-credit settlement. Targets: `gr_b2_willing_compromise`, `gr_b2_solution_works_both`. Variations transfer the function to a cancelled service, store credit with collection/expiry constraints, and a history of two failed attempts. Near/Far review: B1.17 and B2.3.
- **B2.14:** an eight-versus-six set-menu charge requires evidence, a respectful boundary, a limited concession, and a proportionate resolution. Targets: `gr_b2_have_to_insist`, `gr_b2_respectful_firmness`. Variations cover the corrected outside-cake dispute with Leo, conceding a late confirmation while holding the main point, and an agree-to-disagree outcome. Near/Far review: B2.9, B1.18, and B2.13.
- **B2.15:** the learner gives a connected evaluation of a fictitious adaptation, compares it with the novel, responds to Alex's view, and gives a qualified recommendation. Targets: `gr_b2_compared_viewpoints`, `gr_b2_qualified_opinion`. Variations transfer to TV-series pacing, sustained disagreement about an ending, and comparison with an earlier work. Far review: B1.3.

## Verification

Gate A/B/C PASS. Grammar lint: **0 errors / 0 advisory notes** across 62 worksheet situations. Targeted API/content/course/engine **73/73**; scene/opener **19/19**. Full suite **417/417** (API 326, web 85, shared 6); API/web typechecks PASS; seed idempotency, references and contiguity PASS. Chromium completed all fifteen authored B2 situations in order, checked **699 transcript snapshots**, and verified every Mission PASS with `can_do`; a separate B2.1 FAIL path returned `learning` without completion. B2.13–B2.15 each passed Mission and transcript assertions; **60 Batch 5 screenshots** were generated under ignored `artifacts/qa/session-dialogue/`.

Blocking findings: **0**. Existing non-blocking UI/release backlog unchanged. Stop before B2 Batch 6.
