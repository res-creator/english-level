# B2 Batch 4 — production QA (preview only)

Authored B2.10 `sit_b2_work_03`, B2.11 `sit_b2_work_04`, and B2.12 `sit_b2_social_01` in frozen V2 order. A1/A2/B1, frozen curriculum, engine/schema, and production were not changed.

## Reference workflow

British Council [B2 speaking](https://learnenglish.britishcouncil.org/free-resources/speaking/b2), [Giving advice](https://learnenglish.britishcouncil.org/free-resources/speaking/b2/giving-advice?page=1), and [Dealing with a problem](https://learnenglish.britishcouncil.org/free-resources/speaking/b2/dealing-problem?page=1) informed face-saving feedback and the problem-to-solution sequence. Cambridge [B2 interactive communication](https://www.cambridgeenglish.org/images/168619-assessing-speaking-performance-at-level-b2.pdf) informed linked responses and negotiation towards an outcome. ELLLO B2 material informed pacing only. All dialogue is original.

## Content

- **B2.10:** delayed supplier figures lead to a staged delivery, review buffer, and two explicit milestones. Targets: `gr_b2_would_possible_deadline`, `gr_b2_realistically_estimate`. Variations transfer to budget/scope, a phone-only read-back, and an initial refusal followed by split deliverables. Far review: B1.12/B2.9.
- **B2.11:** specific positive evidence leads to one material concern, a face-saving revision, and a bounded positive close. Targets: `gr_b2_might_worth_feedback`, `gr_b2_one_thing_suggest`. Variations cover communication style, defensive response, and positive feedback with one caveat. Near review: B2.9.
- **B2.12:** the learner repairs the interpretation of a dinner comment, acknowledges their share, and restores a concrete plan. Targets: `gr_b2_what_meant_was`, `gr_b2_didnt_mean_to`. Variations cover schedule ambiguity, an upset Alex, and explicit self-correction. Far review: B1.16.

## Verification

Gate A/B/C PASS. Grammar lint: **0 errors / 0 advisory notes** across 59 worksheet situations. Targeted API/content/course/engine **72/72**; scene/opener **18/18**. Full suite **415/415** (API 325, web 84, shared 6); API/web typechecks PASS; seed idempotency, references and contiguity PASS. Chromium completed all twelve B2 situations; B2.10–B2.12 Missions passed 6/6, 100% / `can_do`, while a separate B2.1 FAIL scored 0/5 / `learning`. It checked 564 transcript snapshots and generated 60 Batch 4 screenshots.

Blocking findings: **0**. Existing non-blocking UI/release backlog unchanged.
