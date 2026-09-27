# Content Production Plan — Speak in English, A1 → B2

Planning document only. **No content was generated, no seeds/migrations/frontend/backend code was changed while writing this.** Everything below is grounded in the actual code (read directly, not assumed) as of this commit — file paths and function names are real and current.

---

## 1. Current content pipeline — what the code actually does

**Seed files** (`seeds/content/*.json`), one set per track/level:

| Concept | File(s) | Loaded by |
|---|---|---|
| Chapters (= modules) | `sie-a1-modules.json`, `a1-modules.json` (archived), `a2-modules.json` | `loadSeedContent.ts` |
| Situations (= lessons) | `sie-a1-lessons.json`, `a1-lessons.json`, `a2-lessons.json` | same |
| Vocabulary/phrases (= learning items) | `sie-a1-items.json`, `a1-learning-items.json`, `a2-learning-items.json` | same |
| Grammar patterns | `sie-a1-grammar.json`, `a1-grammar.json`, `a2-grammar.json` | same |
| Item ↔ lesson wiring (= lesson_items) | `sie-a1-lesson-items.json`, `a1-lesson-items.json`, `a2-lesson-items.json` | same |
| Item relations (synonym/antonym/etc.) | `a1-item-relations.json`, `a2-item-relations.json` | same |
| Grammar relations (prerequisite/confused_with/related) | `grammar-relations.json` | same |

**Missions**, **NPC replies**, **review/prerequisite relationships**, **variations** — see the mapping table in §2; most of these are not separate files, they're fields or roles inside the tables above (or, for Missions/review, not content at all — they're computed at runtime).

**Pipeline**: `apps/api/src/content/loadSeedContent.ts` reads every JSON file, validates each row against the Zod schemas in `apps/api/src/content/schemas.ts`, and cross-validates references (lesson→module, lesson_item→lesson/content, relation→item/pattern) plus uniqueness and order-contiguity — throwing loudly with a specific file/row/reason on the first problem, never importing broken content silently. `apps/api/src/content/buildSeedStatements.ts` turns the validated bundle into an ordered list of idempotent `INSERT ... ON CONFLICT DO UPDATE` statements (parents before children; a two-phase negative-order-index trick makes reordering safe). `apps/api/scripts/generateSeedSql.ts` (referenced in `docs/content-authoring.md`) turns that into a `.sql` file applied via `wrangler d1 execute`.

**Validation that already exists and runs today** (`apps/api/test/contentSeed.test.ts`, `apps/api/test/contentQA.test.ts`, per `docs/content-authoring.md` §6) — loads and cross-checks every seed file, and separately re-checks the seeded DB itself (duplicate IDs, missing Russian localization, missing primary example, invalid levels/types, broken relations, duplicate ordering). **This is already a real Gate A** — nothing new needs to be built for basic structural validation, only extended (see §7).

**Engine** (`apps/api/src/lessonEngine/`):
- `lessonSessionBuilder.ts` — `buildActivityPlan()` walks a lesson's `lesson_items` in order and deterministically generates the activity sequence (no randomness, same content → same plan always). An `introduce` learning item gets `info_card → recognition MC → fill_gap_choice (or context MC fallback) → optional typed_recall/sentence_build`; any other role gets one lighter MC; a `grammar_pattern` gets `grammar_card → "what's the rule" MC` (card only on `target`/`introduce`). Exactly one NPC turn is attached to the *last* activity generated per item, from `npcReplyCorrect`/`npcReplyIncorrect`.
- `episodePlan.ts` — cuts that flat activity list into 5–8-minute sessions (`sliceIntoSessions`, never splitting one item's activities across two sessions), and separately builds the **Mission** (`buildMissionPlan`) — production-only activities, built ONLY from `lesson_items` with `role: "introduce"` or `role: "target"`. Anything with role `practice` or `review` is automatically excluded from the Mission — this matters directly for variations (§2).
- `activityTypes.ts` / `activityDto.ts` — the answer-key-bearing internal shape vs. the stripped public DTO sent to the client.
- **`reviewService.ts` is a separate, already-built spaced-repetition engine** — `user_item_memory` (Leitner boxes per individual learning_item/grammar_pattern, not per lesson), fully independent of the lesson/Mission flow. This is real, live infrastructure, distinct from V2's curriculum-design-time "Near/Far review" concept (see §2).

**No prerequisite/unlock system exists at all.** Direct quote from `apps/api/src/services/lessonSessionService.ts:177`: *"No prerequisite/unlock system: an episode is eligible if it's published and its chapter belongs to the user's currently verified CEFR level."* Sequencing today is purely `order_index` (contiguity-checked at load time for modules-per-level and lessons-per-module).

**Cast and scene are NOT in the database at all.** `apps/web/src/brand/cast.tsx` (`CAST: Record<CastId, CastLook>`) and `apps/web/src/brand/situationScenes.ts` (`EPISODE_SCENE: Record<lessonId, {scene, cast, openingLine?}>`) are hardcoded frontend TypeScript maps, keyed by lesson ID. **Every new situation therefore needs a frontend edit, not just a seed-content edit** — this is a real cross-cutting step, folded into the Definition of Done in §3.

**QA that already exists**: `contentSeed.test.ts`/`contentQA.test.ts` (structural, above); `apps/web/qa/run.ts` (unauth, deployed preview, layout/regression checks); `apps/web/qa/run-authenticated.ts` (full real curriculum flow against local dev, incl. an `INTERNAL_LABEL_RE` heuristic that catches a leaked internal `snake_case` label in any bubble/prompt); `apps/web/qa/audit-a1.ts` (full manual-answer content audit across all 5 A1 situations); `apps/web/qa/verify-dialogue.ts` (fast, always-correct playthrough — answer key computed directly from the seed JSON, never hand-copied — with real dialogue-transcript screenshots). These four are the direct ancestors of the QA pipeline proposed in §10.

---

## 2. V2 concepts mapped onto the existing architecture

Per instruction: **no new entity where the existing model already expresses the concept.**

| V2 concept | Verdict | How it's realized |
|---|---|---|
| **Core situation** | Already supported | A `lessons` row (`situationTitle`/`scene`/`capability`/`teaser` fields added in migration 0007) inside a `modules` row (= Chapter). Zero change. |
| **Practice variation** | **Small extension needed** | No existing representation (`grep -rn "variation"` across the whole repo returns nothing). Modeled as **additional `learning_items`** (new IDs, swapped `displayForm`/example/`npcReplyCorrect`) attached to the *same* lesson via `lesson_items` with `role: "practice"`. That role already exists in the schema and DB but, for `learning_item` content, currently falls into the same single-MC path as `role: "review"` (confirmed by reading `buildLearningItemActivities`) — it's only ever been used so far for `grammar_pattern` mixed-practice (`a2-lesson-items.json`), never for a learning item. **One targeted extension** to that function (give `practice`-role learning items the fuller set — skip `info_card`, keep MC + fill_gap/context-MC + NPC reply — instead of the bare single MC) makes a variation feel like a real, lighter re-run of the scene rather than a flashcard. `buildMissionPlan`'s existing filter (`introduce`/`target` only) *already* excludes `practice` automatically — no change needed there, variations correctly never enter the Mission. |
| **Mission** | Already supported | `learning_sessions` with `session_kind = 'mission'`, built by `buildMissionPlan()`. Zero change. |
| **Near review** | Already supported | A `role: "review"` `lesson_item` in a *nearby* lesson, pointing at a `learning_item` from a recent situation — the exact mechanism review already uses. Zero change. |
| **Far transfer review** | Already supported | The *same* mechanism, pointing at an item from a much earlier situation/level instead. Near vs. Far is a property of *which item you link*, not a different schema shape — zero change needed. (An optional authoring-time label for traceability is proposed in §12's tracker, not the DB.) |
| **Grammar target** | Already supported | `grammar_patterns` + a `lesson_item` with `content_type: "grammar_pattern"`, `role: "target"`/`"introduce"`. Zero change. |
| **Lexical chunk** | Already supported, no new field | A chunk is simply a `learning_item` (`itemType: "phrase"`/`"functional_phrase"`/`"collocation"`) that happens to contain an above-level construction. The schema never claims a grammatical decomposition for learning items — only `grammar_patterns` do — so "chunk vs. target" has **zero runtime meaning** and needs no DB field. It's purely an authoring/audit-time classification, tracked in the production tracker (§12), not the schema. |
| **NPC authored continuation** | Already supported | `npcReplyCorrect`/`npcReplyIncorrect` on `learning_items` (migration 0010), mandatory via `SieLearningItemSeedSchema`. This is exactly what it was built for. Zero change. |
| **Prerequisites** | Already supported, by convention | Expressed today purely via `order_index` (module-in-level, lesson-in-module) — there is no runtime gate, and the product's current behavior is explicitly "eligible if published." Recommendation: **keep it this way** — a hard unlock/gating system would be new architecture the curriculum doesn't actually need yet (nothing in V2 requires blocking access, only *sensible authored order*, which `order_index` already gives). Flagged, not built. |
| **Chapters (recurring across levels)** | Already supported, by convention | `modules` belong to exactly one `level_id`, so a "chapter" that recurs across 4 levels is **one module row per (chapter × level)**, tied together only by a shared naming/slug convention (`sie-<level>-<chapter-slug>`) — exactly what the 0007 migration's own comment already says (`Chapter = modules (unchanged)`). No relational "this chapter continues across levels" field needed. |
| **Cast / scene assignment** | Frontend-only today, small extension needed | Not content at all — hardcoded in `cast.tsx`/`situationScenes.ts`. Needs: (a) one new `CAST` entry (Dr. Kim, the single approved V2 cast exception), (b) two new `SceneId` values (`office`, `clinic`) + their `SCENE_LABEL` entries, (c) one `EPISODE_SCENE` entry per new situation going forward — routine, repetitive, but not architecture. |

**Net effect**: one real engine change (practice-role learning items), one small frontend cast/scene addition, and a lot of routine per-situation `EPISODE_SCENE` entries. Nothing else in V2's vocabulary requires new tables, new columns, or new relations.

---

## 3. Production unit — Definition of Done for one situation

A situation is **not done** until every line below is true. The user's own list is kept in full; four lines were added where the codebase revealed a real gap the list didn't cover.

| # | Item | Where it lives | Source |
|---|---|---|---|
| 1 | Situation metadata (title, module/chapter, order) | `lessons` + `modules` seed JSON | user's list |
| 2 | Capability ("Я могу...") | `lessons.capability` | user's list |
| 3 | Coherent dialogue flow (opener → learner → NPC → …) | `situationScenes.ts` opener + `npcReplyCorrect` chain | user's list |
| 4 | NPC opener | `situationScenes.ts` `EPISODE_SCENE[id].openingLine` | user's list |
| 5 | Learner targets (ordered) | `lesson_items` (`introduce`/`target`) | user's list |
| 6 | `npcReplyCorrect` (+ optional `npcReplyIncorrect`) | per `learning_item`, mandatory for sie track | user's list |
| 7 | Vocabulary/learning items (RU localization + ≥1 primary example) | `learning_items` seed JSON | user's list |
| 8 | Grammar target(s), only where genuinely new | `grammar_patterns` + `lesson_items(role:"target")` | user's list |
| 9 | Lexical chunks kept OUT of `grammar_patterns` (plain items only) | `learning_items`, tracked in §12 | user's list |
| 10 | Activities | auto-generated by `buildActivityPlan` | user's list — no separate authoring |
| 11 | Mission | auto-generated by `buildMissionPlan` | user's list — no separate authoring |
| 12 | Variation(s) — 1–3, `role: "practice"` items, concrete detail-swap + named transfer skill | `learning_items` + `lesson_items` | user's list |
| 13 | Near/Far review link(s) — this item reviewed in a later lesson, or reviewing an earlier one | cross-lesson `lesson_items(role:"review")` | user's list |
| 14 | Prerequisite satisfied (its own prerequisite situations already `done`) | authored order, no DB field | user's list |
| 15 | Preview/UI metadata: scene + cast wired | `situationScenes.ts` (+ `cast.tsx` if a new NPC/scene) | user's list |
| 16 | Automated QA passing (all 3 gates, §11) | CI + local scripts | user's list |
| 17 | **Speaker-role consistency verified** (no NPC-voiced line assigned to the learner, or vice versa) | manual/semi-automated, Gate B | *added — V2's own core rule, deserves its own line, not buried in "QA" generally* |
| 18 | **Grammar classification recorded**: every construction in the situation's key phrases tagged Target or Chunk, no unlabeled construction | tracker (§12) + lint (§7) | *added — this is the exact failure mode the V2 audit spent a full pass fixing; it needs to be checked per-situation from now on, not rediscovered later* |
| 19 | **No RU/UA geography, neutral setting/names confirmed** | manual, Gate B | *added — standing content rule, worth its own explicit checkbox rather than assumed* |
| 20 | **Seed re-import is a clean no-op the second time** (idempotency spot-check: run the seed import twice locally, diff the DB — nothing changes on the second run) | local check before commit | *added — the whole seeding model's safety guarantee is idempotency; worth actually verifying once per batch, not just trusting the upsert logic in the abstract* |

---

## 4. Content generation order

Checked dependencies directly against V2's own Prerequisite fields (§4–§7 of `CONTENT_MASTER_PLAN_A1_B2_V2.md`) — **no cross-level prerequisite ever points forward** (B1 situations only ever prerequisite A1/A2 content, B2 only ever A1/A2/B1). This confirms the user's proposed order is not just reasonable but the *only* correct one — a B2 situation authored before its A2/B1 review targets exist would have nothing real to review.

**Order**: finish remaining A1 → full A1 QA → A2 → full A2 QA → B1 → full B1 QA → B2 → full B2 QA → full-course regression.

**Remaining A1 work** (e1–e5 already shipped): A1.6, A1.7, A1.8, A1.9, A1.10, H.A1 — **6 core situations**. Checked each one's prerequisite against V2 §7: all six list only e1–e5 (already live) as prerequisites, so **there is no internal ordering constraint among them** — any grouping is safe. This means Batch 1/2 can be chosen for authoring efficiency (NPC/chapter grouping) rather than dependency order — see §5.

---

## 5. Batch size — recommendation: **3 core situations per batch** (within the requested 2–4 range)

Reasoning:
- **Too small (1–2)**: the fixed overhead per batch — full local D1 rebuild, both dev servers, a targeted Playwright run — is not tiny (the existing `qa-verify-dialogue.yml` full-5-situation run already takes 80–150 minutes in CI). Batching 1–2 situations pays that fixed cost far too often for too little content per cycle.
- **Too large (5+)**: exactly the risk the user is naming — a big commit with an error buried in the middle of it, and a much larger diff to review before commit. It also stops matching real Chapter/NPC groupings cleanly (most V2 chapters have 1–3 situations per level).
- **3** lets almost every batch align with either one full chapter-at-a-level or one NPC's full slice, keeps the commit small enough to review line-by-line, and still amortizes the rebuild+QA cost across meaningful content.

**One batch = one full production unit per §3, for each of its 3 situations**, in this fixed sequence:
1. Conversation authoring (§6) for all 3 — dialogue-first, no learning items yet.
2. Derive learner targets, grammar, vocabulary, variations from the finished dialogues.
3. Author seed JSON (items, lesson-items, grammar if new, variations) + `situationScenes.ts`/`cast.tsx` entries.
4. Local validation: `contentSeed.test.ts`/`contentQA.test.ts` + the new grammar-classification lint (§7) + idempotency spot-check (DoD #20).
5. Targeted QA (Gate C, §11) — a Playwright run scoped to just this batch's 3 situations.
6. Content review (Gate B, §11) against the checklist in §3.
7. Update the tracker (§12).
8. Commit.
9. Next batch.

---

## 6. Conversation authoring pipeline

Per instruction, work on a situation **never starts with learning items.**

**Step 1 — dialogue first.** NPC opener → learner turn → authored NPC reply → learner turn → … through the situation's full turn count (per the Turns field already specified in V1/V2's tables), ending at the Mission-worthy exchange. Written as plain dialogue, no IDs, no schema yet — exactly how e1–e5 were originally designed in this session, and exactly the standard V1/V2 already committed to (see V2 §9's conversation-first rule, which itself codifies the fix already shipped for e1–e5 in commit `3f38062`).

**Step 2 — only then**, derive from the finished dialogue: learner targets (which lines become `learning_items`), grammar target vs. lexical chunk classification (§7), vocabulary, activities (auto-generated, no authoring), Mission (auto-generated), variations (§9), review links (§8's Near/Far).

**Automated/semi-automated checks on the dialogue itself, before it becomes seed content:**

| Check | How |
|---|---|
| Speaker-role consistency (NPC line never assigned as a learner target, and vice versa) | Semi-automated: a small authoring worksheet tags each line `npc` or `learner` before it's split into items; a lint script (§7) cross-checks that every `learning_item` derived from a `learner`-tagged line, and every `npcReplyCorrect` came from an `npc`-tagged line. This is the exact bug class found and fixed in e1/e3 during Phase 3 (`itm_sie_anything_else`, `itm_sie_no_problem`) — worth automating now that the failure mode is known. |
| No duplicate information | Automated: a script diffs all `learner`-tagged lines (and all `npc`-tagged lines) within one situation for near-duplicate text (normalized, punctuation/case-insensitive) — catches exact repeats like e1's original "What's your name?" collision. Genuine semantic duplicates (same idea, different wording) still need a human read, same as the master-plan's own risk audit in §E. |
| No unnatural textbook line | Manual, Gate B — this is a judgment call, not automatable. |
| NPC continuation semantically answers the prior learner line | Manual, Gate B, one read-through per situation. |
| Variation doesn't copy core dialogue verbatim | Automated: a script diffs each variation's authored lines against its core situation's lines — flags any exact string match. |

---

## 7. Grammar safeguards

V2's rule, restated as a build-time policy: **every construction in a situation's key phrases is either a Grammar Target (a real `grammar_patterns` row, matched by an actually-evidenced phrase) or a Lexical Chunk (a plain `learning_item`, explicitly logged as such in the tracker) — never an unclassified "light intro."**

Since chunk-vs-target has no DB representation (§2), the check can't live in the Zod schema. Proposed: a new, small **lint script** (`apps/api/scripts/lintGrammarClassification.ts`, run locally and in CI alongside `contentSeed.test.ts`) that:
1. Reads the tracker's per-situation grammar classification (§12) — every construction the situation's key phrases contain, tagged `target:<grammarPatternId>` or `chunk:<free-text label>`.
2. Cross-checks every `grammar_patterns` row actually attached to the situation (`lesson_items` with `content_type: "grammar_pattern"`) has at least one tagged phrase pointing at it — catches exactly the "grammar tag with no matching key phrase" failure mode found 15 times in the V2 audit (§2.2 of `CONTENT_MASTER_PLAN_A1_B2_V2.md`).
3. Flags any phrase containing a small heuristic set of above-A1/A2 construction signatures (regex-based: `have|has|had` + past participle, `used to`, `going to`/`will` combined with `if`, modal + `have` + past participle, question tags, cleft `what ... was`) that is **not** already tagged `chunk` or backed by an existing `target` at or below that situation's level — this is exactly the check that manually caught A1.6, A1.5, B1.5, B1.6, B2.1, etc. Heuristic, not exhaustive — it narrows what a human reviewer has to re-check, it doesn't replace Gate B.

This is real, buildable tooling — not new curriculum architecture — and directly operationalizes the audit process already done by hand for V2.

---

## 8. Source/reference workflow (unchanged from V1/V2, restated as a step)

For each new situation: consult the already-vetted sources (British Council, ELLLO, Cambridge/CEFR, ALTE — the exact list in V2's own Sources section) for conversation order, typical phrases, register, and CEFR complexity **before** drafting original dialogue. Never copy or closely paraphrase a source dialogue — this is already the project's standing content policy (`docs/curriculum.md`'s "Original-content policy", referenced directly in `docs/content-authoring.md` §3). Cite the source per situation in the tracker (§12), matching the `Source`/`Source URL` fields V1/V2 already used per situation.

---

## 9. Variations — technical model (proposed, not implemented)

**Storage**: each variation is 1 (occasionally 2, for a multi-line detail swap) new `learning_items` row(s) with:
- a new stable ID (`itm_sie_<situation>_v<n>`),
- `displayForm`/`examples`/`npcReplyCorrect` reflecting the swapped detail,
- attached to the **same lesson** as its core situation via a new `lesson_items` row, `role: "practice"`, ordered immediately after the core situation's `target`/`introduce` items.

**What actually gets swapped**, per the user's own instruction that a variation must test transfer, not just vocabulary — the swap dimension should escalate by level, matching V2's own variation table (§6 of the V2 doc) design:

| Level | What varies (in addition to nouns/numbers) |
|---|---|
| A1 | detail only (item, time, place) — confidence-building, not stress-testing |
| A2 | detail + one added step (a correction, a second question) |
| B1 | resistance (NPC pushes back once), added constraint, or a reordering of the same steps |
| B2 | NPC initiative (NPC proposes first), emotional/social pressure, modality (phone — §4 of V2), partial/different outcome (compromise instead of a clean win) |

**Engine change required**: the one extension noted in §2 — `practice`-role learning items need the fuller activity set, not the bare single MC `review` gets today. Without this change, a variation would technically "exist" but would only ever produce a translation-recognition question, not a real re-run of the production task — which would silently fail to test transfer at all. This is flagged as a **prerequisite technical change**, not deferred (see §14).

**Not proposed**: a new `variations` table, a new content-type, or a new relation type. The existing `lesson_items.role` enum already has the needed slot (`practice`) sitting unused for this exact purpose.

---

## 10. QA pipeline

Directly extends the four scripts already in the repo (§1) rather than inventing a new framework.

**Per-situation / per-batch checks** (adapting `verify-dialogue.ts`'s proven pattern — answer key derived straight from the batch's own seed JSON, never hand-copied):

| Check | Existing precedent |
|---|---|
| Solvability (every activity has a real, constructible correct answer) | `verify-dialogue.ts`'s answer-key builder |
| All answers constructible from the shown token bank (`sentence_build`) | `run-authenticated.ts`'s word-bank collectability check |
| Grammar question correctness | `verify-dialogue.ts`'s `titleByFormula` disambiguation logic |
| Transcript coherence (NPC before learner, no stale/duplicate bubble) | `run-authenticated.ts` + `verify-dialogue.ts` |
| Authored NPC continuation actually renders after each scored answer | `verify-dialogue.ts`'s core purpose |
| No Russian text in the English transcript line | new, small addition — a regex Cyrillic-character check on any `.en`/transcript-tagged DOM node, symmetrical to `INTERNAL_LABEL_RE`'s existing snake_case check |
| Mission pass (real correct answers) | `verify-dialogue.ts` |
| Mission fail (deliberately wrong answers, confirms failure path renders sanely) | `run-authenticated.ts`'s "whatever answer is fastest" mode, retargeted |
| Progression unlock (capability state transitions) | none yet — new, small: assert `user_capabilities.state` advances `learning → can_do` after a passed Mission |
| Variation completion | new — once §9 ships, extend the answer-key builder to also solve `role:"practice"` activities |
| Review correctness (Near/Far links actually resolvable) | new, small — assert every `lesson_items(role:"review")` row's `content_id` exists and is reachable, reusing `loadSeedContent.ts`'s existing reference-integrity check pattern |

**Three tiers**:
1. **Targeted QA** (per batch, §5 step 5) — the 3 situations just authored only. Fast, runs every batch.
2. **Full level QA** (per §4, after the last batch of a level) — every situation in that level, adapting `audit-a1.ts`'s full-manual-answer-audit pattern to the level's full situation set.
3. **Full regression** (once, after B2) — every situation across all 4 levels, the existing `qa-authenticated.yml`/`qa-verify-dialogue.yml` pattern scaled up. Given the CI runtime already observed for 5 situations (80–150 min), the full-course version will need either a longer timeout, sharding across multiple jobs, or both — flagged as a real operational concern to size once B1 is reached, not solved now.

---

## 11. Content review gates

| Gate | What it checks | Tooling |
|---|---|---|
| **A — Structural** | Schemas, build, existing + new automated tests pass | `contentSeed.test.ts`, `contentQA.test.ts`, the new grammar-classification lint (§7), the extended `assertContiguousOrder` (also covering `lesson_items`-per-lesson, currently unchecked — small gap found while reading `loadSeedContent.ts`), a clean idempotent re-seed (DoD #20) |
| **B — Learning/content** | Dialogue coherence, CEFR fit, grammar target-vs-chunk correctness, speaker-role consistency, no duplicate info, geography/cast rules | Checklist in §3 + §6's semi-automated lints, human read-through per situation |
| **C — Visual/product** | Real preview screenshots, real transcript, real Mission pass/fail | Targeted Playwright run (§10 tier 1), screenshots attached to the batch's commit/PR the same way `verify-dialogue.ts` already does |

A situation is not `done` (§12) until it has passed all three — no partial credit, matching the user's own instruction.

---

## 12. Production tracking

One markdown table, one row per core situation (69 total: 5 shipped + 6 remaining-A1 + 17 A2 + 19 B1 + 22 B2, per V2's frozen counts), status values exactly as specified by the user: `planned → dialogue authored → learning items authored → mission authored → variations authored → review wired → structural QA passed → content QA passed → visual QA passed → done`.

Recommendation: keep this as its own file, **`CONTENT_PRODUCTION_TRACKER.md`**, updated at the end of every batch (§5 step 7) — not folded into this planning document, so the plan itself doesn't need editing every batch. Initial state (to be created once this plan is approved):

| Situation | Chapter | Status |
|---|---|---|
| e1–e5 (`les_sie_a1_e1`–`e5`) | (5 chapters) | **done** — shipped, verified (`36286655459`) |
| A1.6–A1.10, H.A1 | People & Connections / Shopping & Services (A1 slice) / Getting Around / Social Life / Daily Life / Problems & Solutions | planned |
| 17 A2 situations (incl. H.A2) | all 9 chapters | planned |
| 19 B1 situations (incl. H.B1) | all 9 chapters | planned |
| 22 B2 situations (incl. H.B2) | all 9 chapters | planned |

The tracker also carries, per row (not shown above for space): its 1–3 variation IDs once authored, its Near/Far review links (cross-referencing V2 §7), and its grammar classification (target IDs + chunk labels) — this is where §7's lint script reads from.

---

## 13. Explicitly NOT part of content generation — separate release backlog

Recorded, not scheduled, not touched by any of the above:
- Grammar UX redesign (per-pattern friendly rewrites + the proposed `grammarPresentation.ts` architecture) — reported to the user earlier this session, **still awaiting approval**, independent of curriculum content volume.
- Visual polish generally.
- The "Ситуация: ..." banner currently overlapping the dialogue — needs to become intro-only/dismissing, not persistent.
- Preview safe-area / CTA layout issues.
- Final onboarding/placement/progression QA pass.

---

## 14. Deliverable summary

- **Current content architecture** — §1.
- **Gaps between V2 and the engine** — §2 (one real gap: variations; everything else already fits).
- **Production unit** — §3 (20-line Definition of Done, 4 lines added beyond the user's own list).
- **Recommended batch size** — 3 core situations (§5).
- **Exact production order** — remaining A1 (6 situations, no internal ordering constraint) → full A1 QA → A2 → full A2 QA → B1 → full B1 QA → B2 → full B2 QA → full regression (§4).
- **QA gates** — A/B/C, §11.
- **Tracker structure** — §12.
- **Technical changes needed BEFORE mass authoring**:
  1. Extend `buildLearningItemActivities`'s `practice`-role branch for `learning_item` content (§2, §9) — the one change variations actually depend on.
  2. Add Dr. Kim to `cast.tsx`; add `office`/`clinic` to `SceneId` + `SCENE_LABEL` in `situationScenes.ts` (§2).
  3. Extend `loadSeedContent.ts`'s `assertContiguousOrder` to also cover `lesson_items`-per-lesson (§11, Gate A).
  4. Write the grammar-classification lint script (§7).
  5. Create `CONTENT_PRODUCTION_TRACKER.md` (§12).
- **What can be deferred**:
  - A hard prerequisite/unlock system — current soft (order-only) behavior is sufficient; don't build gating that isn't needed (§2).
  - Sharding/timeout strategy for full-course regression QA — real, but only becomes urgent once B1 is reached (§10).
  - Actual `office`/`clinic` background art — needed before those specific situations ship, not before A1/A2 batches start.
- **First concrete batch to start with**: **Batch 1 = A1.6, A1.7, A1.8** (People & Connections/Rosa, Shopping & Services/Emma, Getting Around/Rosa) — all three have their prerequisites already satisfied by the live e1–e5, none depend on each other, and two share Rosa as NPC for authoring efficiency. Batch 2 would then be A1.9, A1.10, H.A1 (Alex ×2, Maya ×1), completing remaining A1 core situations before A1's variations pass and full-level QA.

---

*End of plan. No content, seeds, migrations, or product code were generated or changed. Awaiting approval before Batch 1 begins.*
