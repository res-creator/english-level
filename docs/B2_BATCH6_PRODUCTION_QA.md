# B2 Batch 6 — production QA (preview only)

Authored B2.16 `sit_b2_work_05`, B2.17 `sit_b2_people_04`, and B2.18 `sit_b2_social_02` in frozen V2 order. A1/A2/B1, frozen curriculum, engine/schema, and production were not changed.

## Reference workflow

British Council [B2 speaking](https://learnenglish.britishcouncil.org/free-resources/speaking/b2) and [Modals: probability](https://learnenglish.britishcouncil.org/comment/218909) informed calibrated predictions, uncertainty, and responses to reservations in B2.16. ELLLO [Technology](https://elllo.org/english/1501/1531-Patricia-Technology.htm), [Robots and AI](https://elllo.org/english/1501/1532-Patricia-AI-Robots.htm), and [The Cause of Crime](https://elllo.org/english/1101/1135-Rebecca-Cause.htm) informed natural movement from a concrete observation to benefits, risks, and competing explanations. British Council [Keeping a conversation going](https://learnenglish.britishcouncil.org/free-resources/speaking/b1/keeping-conversation-going?page=2) and Cambridge [B2 discourse management](https://www.cambridgeenglish.org/images/168619-assessing-speaking-performance-at-level-b2.pdf) informed related topic shifts, cohesive devices, relevant extended contributions, and return after a tangent. All dialogue is original.

## Content

- **B2.16:** Daniel asks about an AI meeting-summary tool. The learner explains its limited role, predicts a possible benefit, responds to skepticism with measurable evidence, and defines privacy and stop conditions. Targets: recycled `gr_b2_might_could_tradeoff` and `gr_b2_hard_to_say_effect`. Variations transfer to an archive-search tool, a delay dashboard challenged by Daniel, and an email assistant with a specific confidentiality risk. Far review: B2.5.
- **B2.17:** an unexpectedly crowded language exchange leads to three revised explanations and a weighted conclusion. Target: genuine new `gr_b2_wonder_if_reason`; `maybe it's because` and `that would explain why` remain classified chunks. Variations transfer to a mutual acquaintance's behaviour, two competing explanations for low attendance, and a planned film shoot revealed after an apparent closure. Near review: B2.16.
- **B2.18:** a market conversation moves coherently through music, weather, photography, and a shared camera thread. Targets: `gr_b2_speaking_of_which` and `gr_b2_that_reminds_me`; `anyway` and explicit return frames are classified chunks. Variations use a cooking-class anchor, three linked shifts, and steering the conversation back from a tangent. Far review: B1.1.

To preserve frozen situation order, each situation uses a small published extension module at B2 module orders 10–12. This is content mapping only; reward behavior still uses the existing chapter reward and no runtime architecture changed.

## Verification

Gate A/B/C PASS. Grammar lint: **0 errors / 0 advisory notes** across 65 worksheet situations. Targeted API/content/course/engine **74/74**; scene/opener **20/20**. Full suite **419/419** (API 327, web 86, shared 6); API/web typechecks PASS; seed idempotency, schema/reference validation and lesson/module contiguity PASS.

Chromium completed all eighteen authored B2 situations in order and reached course progress 18/18. Every Mission passed with `can_do`; a separate B2.1 FAIL path returned `learning` without completion. The run checked **829 transcript snapshots** for opener/session continuity, one spoken learner turn per semantic item, one authored continuation in the correct place, non-spoken review activities, and English-only transcript. It generated **60 Batch 6 screenshots** under ignored `artifacts/qa/session-dialogue/`.

Blocking findings: **0**. Existing non-blocking UI/release backlog unchanged. Stop before B2 Batch 7.
