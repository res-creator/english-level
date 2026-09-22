# Curriculum & content — Phase 5

This describes only what's actually implemented: the curriculum/content
data model, a small original A1/A2 sample, and three read-only APIs. It
does **not** cover lesson execution, exercise answering, mastery, SRS,
review, or any kind of learning progress — those belong to future phases
and this schema deliberately has nothing that stores them yet.

## Structure: Level → Module → Lesson → content

```
levels (Phase 1)
  -> modules            (e.g. "Me & Introductions")
       -> lessons        (e.g. "Vocabulary", "Grammar", "Mixed Practice")
            -> lesson_items   (an ordered link, not a copy)
                 -> learning_items   OR   grammar_patterns
```

`modules` and `lessons` are pure **curriculum structure** — order,
grouping, metadata. `learning_items` and `grammar_patterns` are pure
**reusable content**, with no idea that lessons exist. `lesson_items` is
the only thing connecting them, and it stores a reference
(`content_type` + `content_id`), never a copy of the content itself. This
split is deliberate (see CLAUDE.md principle 4: curriculum progress and
knowledge are different concepts) — the same `learning_items` row is
meant to be reusable by a future Review/My Words/Reading feature without
any duplication, just another `lesson_items`-shaped reference from
whatever new feature needs it.

`lesson_items.content_id` is polymorphic (it points at either table
depending on `content_type`), so it has no single database-level foreign
key — SQLite can't conditionally FK across two tables. Referential
integrity for it is enforced by the seed validator
(`apps/api/src/content/loadSeedContent.ts`) and by dedicated content-QA
tests, not by the schema itself. This is a known, accepted limitation for
V1 (see "Known limitations").

## Reusable content: learning items

A `learning_items` row is one teachable English unit — the English core
only. It never contains a translation itself.

- `item_type`: `word` | `phrase` | `collocation` | `phrasal_verb` |
  `functional_phrase` | `contrast`.
- `learning_item_localizations` — one row per `(item_id, language)`. The
  English item is **never duplicated** to add a language; adding Ukrainian
  later is just a new row here, not a new item. V1 seeds `ru` only.
- `item_examples` — one or more original example sentences per item; at
  most one may have `is_primary = 1` (enforced by a partial unique index
  on `item_examples(item_id) WHERE is_primary = 1`).
- `item_patterns` — an optional structural pattern (e.g. "get used to +
  verb-ing"), with a correct/incorrect example pair. Not every item needs
  one; only added where genuinely useful.
- `item_relations` — `confused_with` / `word_family` / `synonym` /
  `antonym` / `related` links between two items (e.g. `single` ↔
  `married` as `antonym`).

## Grammar, modeled separately from vocabulary

`grammar_patterns` are small, single-topic patterns (`gr_a1_be_positive`,
`gr_a1_be_questions`, ...) rather than one large "Present Simple" page —
each pattern has its own `formula`, `explanation_en`, and Russian
localization (`grammar_pattern_localizations`). `grammar_relations`
supports a small prerequisite/confusion graph (e.g. "be — questions"
requires "be — positive" first; "must/have to" is commonly confused with
"should").

## Stable IDs

Every content entity uses a human-readable, stable, prefixed ID assigned
at authoring time — never a raw sequential integer exposed to import/
export: `mod_a1_01`, `les_a1_01_03`, `itm_a2_get_used_to`,
`gr_a1_present_simple_positive`, `ex_itm_a1_name_01`. These IDs are what
`lesson_items` and relations reference, and what a future phase (Review,
My Words) would reference too — they don't change even if a module is
reordered or re-described.

## Content versioning

A plain `content_version INTEGER DEFAULT 1` column on every content
table, plus `status` (`draft` / `published` / `archived`) instead of hard
deletes — content that user progress might reference in a future phase
can be archived, never deleted. This is intentionally not a full revision
system (no history table, no diffing) — just enough to let future content
updates replace or retire something safely. Read APIs only ever return
`status = 'published'` rows.

## Localization model

Russian is the only seeded language, but nothing in the schema assumes
that. `learning_item_localizations` and `grammar_pattern_localizations`
both key on `(content_id, language)`, so adding `uk` or `ro` later is
purely additive — new rows, no migration, no change to the English core
tables. The current read API always requests `language = 'ru'`
(`CONTENT_LANGUAGE` constant in `curriculumService.ts`) — there's no
per-user language negotiation yet; see "Known limitations".

## Original-content policy

**All seeded definitions, translations, examples, patterns, and module/
lesson descriptions were newly written for English Level.** Cambridge,
Oxford, _4000 Essential English Words_, _Vocabulary in Use_, _Grammar in
Use_, and similar resources were used only as inspiration for **topic
coverage** (e.g. "an A1 course should cover introductions, daily
routines, family") — no wording, example sentences, or exercises were
copied or closely paraphrased from any commercial source. Every seeded
`learning_items` row carries `provenance = 'original'`; the schema also
allows `'derived_open_data'` for future content sourced from genuinely
open datasets, but nothing currently uses it and no commercial book is
ever recorded as a source for an individual item.

## Seed/import process

Content lives as data, not as hardcoded migration SQL (unlike Phase 1's
`levels`, which is small and effectively permanent) — curriculum content
is expected to grow and change far more often than schema, so baking it
into an immutable migration would be wrong. `migrations/0005_curriculum.sql`
creates schema only, with **zero content rows**.

- **Source of truth**: `seeds/content/*.json` — one file per
  level × content-kind (`a1-modules.json`, `a2-learning-items.json`,
  `a1-grammar.json`, `a1-lesson-items.json`, ...). See
  `docs/content-authoring.md` for the exact file list and shape.
- **Validation**: `apps/api/src/content/schemas.ts` (Zod) validates every
  row's shape; `loadSeedContent.ts` additionally cross-validates
  references (a lesson's `moduleId` exists, a relation's item IDs exist,
  a `lesson_items` row's `content_id` exists in the right table, no
  duplicate stable IDs, no duplicate `order_index` within a level/module)
  and **throws immediately** with a specific message on the first problem
  found — seeding never silently imports something broken.
- **Import**: `apps/api/src/content/seedContent.ts` applies a validated
  bundle to a `Db` as **one atomic transaction** of
  `INSERT ... ON CONFLICT(id) DO UPDATE` statements
  (`buildSeedStatements.ts`), reusing the `Db.batch()` primitive Phase 4
  introduced. Every statement is an upsert keyed on the content's stable
  ID, so **running the seed tooling twice updates existing rows in place
  instead of duplicating anything** — verified directly by tests.
- **Applying it to a real database**: this dev machine still can't run
  `wrangler dev`/`wrangler d1` (see README's long-standing note). For a
  real D1 database, `apps/api/scripts/generateSeedSql.ts` renders the
  exact same statements as a plain, idempotent `.sql` file:
  ```
  node --experimental-strip-types apps/api/scripts/generateSeedSql.ts > /tmp/curriculum_seed.sql
  wrangler d1 execute DB --local --file=/tmp/curriculum_seed.sql
  wrangler d1 execute DB --remote --file=/tmp/curriculum_seed.sql   # preview/production
  ```
  This has been verified against `node:sqlite` (same engine family as
  D1) but not yet against a live D1 binding, for the same reason
  migrations haven't been either.

## Current A1/A2 sample coverage

- **6 modules**: A1 — _Me & Introductions_, _Daily Life_, _Family &
  People_; A2 — _Life & Routines_, _Travel & Transport_, _Communication_.
- **24 lessons** (4 per module: Vocabulary, Useful Phrases, Grammar, and
  a closing Mixed Practice/Reading/Checkpoint/Practice lesson — all 6
  `lesson_type` values are exercised at least once across the sample).
- **84 learning items** (42 A1, 42 A2) — a mix of `word`, `collocation`,
  `phrasal_verb`, `phrase`, and `functional_phrase`, favoring usable
  chunks (`take a break`, `I'm running late`, `get used to`) over
  isolated single-word translations.
- **16 grammar patterns** (8 A1, 8 A2), from `be` — positive/questions
  through Present Perfect (intro).
- **140 `lesson_items` links**, **8 item relations**, **6 grammar
  relations**.
- B1/B2/C1 rows already exist in `levels` (from Phase 1) but have **no**
  seeded modules — `GET /path` for those levels returns
  `{ currentLevel: "B1", modules: [] }`, not an error.

## APIs

All three require authentication (`requireAuth`, unchanged from Phase 2)
and are strictly read-only — none of them create, update, or touch any
row anywhere (verified by a dedicated test snapshotting row counts across
every relevant table before/after).

- **`GET /api/v1/path`** — the current user's `users.current_cefr_level`
  determines which level's modules come back (`{ currentLevel, modules:
[{ id, title, order, lessons }] }`). No progress percentages exist —
  `lessons` is a plain count, not a completion fraction. No current level
  yet, or a level with no seeded content, both return an empty
  `modules: []` rather than an error.
- **`GET /api/v1/modules/:moduleId`** — module metadata plus its ordered,
  published lesson list. `404` for an unknown or unpublished/archived
  module.
- **`GET /api/v1/lessons/:lessonId`** — the lesson's content **structure
  only**: ordered target learning items and grammar patterns, each with
  its `role` (`introduce`/`practice`/`review`/`target`). This does not
  start a session, does not process an answer, and does not mark
  anything started or completed — there's nothing in the schema yet that
  could record that. `404` for unknown/unpublished/archived.

DTOs never return raw database rows — `apps/api/src/services/curriculumService.ts`
is the only place a DB row becomes a response, and it explicitly picks
fields (no `frequency_band`, `difficulty`, `provenance`, `content_version`,
timestamps, or `status` ever reach the client).

## Known limitations

- `lesson_items.content_id` has no database-level FK (polymorphic
  reference) — integrity depends entirely on the seed validator and
  content-QA tests, not the schema itself.
- No language negotiation: the read API always requests Russian
  localization, regardless of `users.interface_language`. Fine while RU
  is the only seeded language; will need real logic once a second
  language is added.
- `seedContent`'s real-D1 path (via `generateSeedSql.ts` +
  `wrangler d1 execute`) is implemented and validated against
  `node:sqlite`, but not yet exercised against a live D1 binding — this
  machine can't run `wrangler dev`/`wrangler d1` at all (same constraint
  documented since Phase 1).
- The Learn frontend has no offline/empty-state design polish — a level
  with no seeded modules just shows a plain sentence, not a dedicated
  empty-state screen.
- Content is currently sized for exercising the model end-to-end (84
  items, 16 grammar patterns), not for a real product launch — see
  `docs/content-authoring.md` for how a future author would add more.
