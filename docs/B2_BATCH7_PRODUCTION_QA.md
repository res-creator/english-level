# B2 Batch 7 — production QA (preview only)

Authored B2.19 `sit_b2_daily_02`, B2.20 `sit_b2_people_05`, and B2.21 `sit_b2_work_06` in frozen V2 order. A1/A2/B1, frozen curriculum, engine/schema, and production were not changed.

## Reference workflow

British Council [Persuading someone to do something](https://learnenglish.britishcouncil.org/free-resources/speaking/b2/persuading-someone-do-something?page=0) informed B2.19's natural move from a concrete proposal through a real objection to a tailored reason and bounded agreement. ELLLO [Business Gone Bad](https://www.elllo.org/english/0301/350KevinBroke02.htm) and [Success and Failure](https://www.elllo.org/english/1201/1226-Julia-Success.htm) informed causal personal and professional accounts with evaluation rather than a list of events. Cambridge [B2 First handbook](https://www.cambridgeenglish.org/images/167791-b2-first-handbook.pdf) informed relevant extended turns, interaction, discourse management, and B2 complexity. All dialogue is original.

## Content

- **B2.19:** Alex hesitates over Maya's beginner pottery workshop because mistakes will be visible. The learner reframes the risk, answers objections about time, cost, and the group, and reaches a no-pressure agreement. `gr_a2_should` is a recycled persuasion target; `think about it this way`, `what have you got to lose?`, and no-pressure language remain lexical chunks. Variations transfer to a meal-planning habit, a choir with a real schedule objection, and partial agreement on a shorter cycling route. Far review: B1.13.
- **B2.20:** the learner recounts how an old photograph appeared in Maya's exhibition, explains mixed pride and unease, adds Daniel's unexpected response, and qualifies the event in retrospect. `gr_b2_what_made_strange_was` is the genuine cleft target; uncertainty and reflection frames remain chunks. Variations transfer to a stranger returning a notebook, a lost wallet that causes a missed train, and a thank-you speech that Alex's follow-up makes the learner reconsider. Far review: B1.8.
- **B2.21:** Daniel proposes scaling a successful meeting-summary pilot. The learner traces benefits and downstream risks, discusses accountability and consent, then recommends a staged rollout with safeguards. Targets are `gr_b2_conditional_consequences` and recycled `gr_b2_might_could_tradeoff`; `on balance` and uncertainty/revision frames remain chunks. Variations transfer to a training/event budget, Daniel's confidence about removing a meeting, and a hidden contractual downside that emerges mid-discussion. Near review: B2.16; Far review: B2.6.

To preserve frozen situation order, each situation uses a small published extension module at B2 module orders 13–15. This is content mapping only; progression and chapter rewards use the existing engine behavior.

## Verification

Gate A/B/C PASS. Grammar lint: **0 errors / 0 advisory notes** across 68 worksheet situations. Targeted API/content/course/engine **75/75**; scene/opener **21/21**. Full suite **421/421** (API 328, web 87, shared 6); API/web typechecks PASS. Seed idempotency, schema/reference validation and lesson/module contiguity PASS.

Chromium completed all 21 authored B2 situations in order and reached course progress 21/21. Every Mission passed with `can_do`; a separate B2.1 FAIL path returned `learning` without completion. The run checked **958 transcript snapshots** for opener/session continuity, one spoken learner turn per semantic item, one authored continuation in the correct place, non-spoken review activities, and English-only transcript. It generated **60 Batch 7 screenshots** under ignored `artifacts/qa/session-dialogue/`.

Blocking findings: **0**. Existing non-blocking UI/release backlog unchanged. Stop before final B2 situation H.B2.
