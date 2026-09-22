# Content authoring — Phase 5

How to add curriculum content today. **There is no admin CMS** — content
is authored as JSON files under `seeds/content/`, validated, and imported
via a script. This describes the actual current process, not a future
tool.

See [`docs/curriculum.md`](./curriculum.md) for the schema and rationale
behind each entity referenced below.

## 1. Add a learning item

Add an entry to the appropriate level's file
(`seeds/content/a1-learning-items.json` or `a2-learning-items.json`;
create `b1-learning-items.json` etc. for a future level and wire it into
`loadSeedContent.ts`'s `parseArray` calls). Shape (validated by
`LearningItemSeedSchema` in `apps/api/src/content/schemas.ts`):

```json
{
  "id": "itm_a1_example",
  "itemType": "collocation",
  "lemma": "take a break",
  "displayForm": "take a break",
  "levelCode": "A1",
  "topic": "daily_life",
  "ru": { "translation": "сделать перерыв" },
  "examples": [
    {
      "id": "ex_itm_a1_example_01",
      "text": "Let's take a break.",
      "isPrimary": true
    }
  ]
}
```

- `id` must be globally unique and stable — see the `itm_<level>_<slug>`
  convention already in use. Never reuse or renumber an existing ID.
- `itemType` is one of `word` / `phrase` / `collocation` / `phrasal_verb`
  / `functional_phrase` / `contrast`.
- Prefer a teachable chunk or sense over a bare word-to-word translation
  — `take a break`, not `break = перерыв`. See `docs/curriculum.md`'s
  "current sample coverage" for the pattern the existing 84 items follow.
- Exactly one example must have `isPrimary: true`.

## 2. Add the Russian localization

Localization is inline on the item itself (`ru: { translation, ... }`),
not a separate file — there's only one language today, so splitting it
out would be premature. `simpleExplanation`, `usageNote`, and
`commonErrorExplanation` are all optional; add them when they'd actually
help (e.g. a note on a commonly-confused phrase).

## 3. Add an example

Add another entry to the item's `examples` array (only one may have
`isPrimary: true`; extras are just additional original examples):

```json
{
  "id": "ex_itm_a1_example_02",
  "text": "You look tired — take a break.",
  "isPrimary": false
}
```

Write original sentences — do not copy or closely paraphrase examples
from Cambridge, Oxford, or any commercial course. See
`docs/curriculum.md`'s "Original-content policy".

## 4. Add an optional pattern or relation

**Pattern** (only when the item has a genuinely useful structural form —
most items don't need one), inside the item's `patterns` array:

```json
{
  "id": "pat_itm_a2_example_01",
  "patternText": "put off + verb-ing",
  "correctExample": "...",
  "incorrectExample": "...",
  "order": 1
}
```

**Relation** to another item, in the level's `*-item-relations.json`
file:

```json
{
  "fromItemId": "itm_a1_single",
  "toItemId": "itm_a1_married",
  "relationType": "antonym"
}
```

`relationType` is one of `confused_with` / `word_family` / `synonym` /
`antonym` / `related`. Both IDs must already exist — the loader rejects
a relation pointing at a missing item.

## 5. Attach an item (or grammar pattern) to a lesson

Add an entry to the level's `*-lesson-items.json` file:

```json
{
  "id": "li_les_a1_01_01_08",
  "lessonId": "les_a1_01_01",
  "contentType": "learning_item",
  "contentId": "itm_a1_example",
  "role": "introduce",
  "order": 8,
  "required": true
}
```

- `contentType` is `learning_item` or `grammar_pattern`; `contentId`
  must exist in the matching table.
- `role` is `introduce` / `practice` / `review` / `target`. The same
  item can be attached to more than one lesson (e.g. `introduce` in one
  lesson, `review` in a later one) — that's the reuse the whole content
  model exists for; never duplicate the item's content into a lesson.
- `order` must be unique within the lesson (`lesson_items` has a unique
  index on `(lesson_id, order_index)`).

To add a new module or lesson, add entries to the level's
`*-modules.json` / `*-lessons.json` files following the existing
`mod_<level>_<NN>` / `les_<module>_<NN>` ID conventions, keeping
`order` contiguous and unique within its parent (a level for modules, a
module for lessons).

## 6. Validate seeds

```
cd apps/api
node --test test/contentSeed.test.ts test/contentQA.test.ts
```

`contentSeed.test.ts` loads and cross-validates every seed file (fails
loudly with a specific file/row/reason on any problem: bad shape, a
missing referenced ID, a duplicate stable ID or `order_index`) and checks
the sample still falls within the target size ranges.
`contentQA.test.ts` re-checks the same kinds of problems directly against
the seeded database (duplicate IDs, missing Russian localization, missing
primary example, invalid levels/types, broken relations/references,
duplicate ordering) — useful as a second, DB-level confirmation that
nothing was lost between the JSON files and the actual upserts.

You can also just try loading the bundle directly, which throws
immediately with a precise error on the first problem:

```
node --experimental-strip-types -e "require('./apps/api/src/content/loadSeedContent.ts').loadSeedContent()"
```

## 7. Import/seed content

Against the in-memory test database, this already happens automatically
via `seedContent(db)` (called by the tests above and by
`curriculumService.test.ts`). To apply the same content to a real D1
database (once this machine — or CI — can run `wrangler d1`):

```
node --experimental-strip-types apps/api/scripts/generateSeedSql.ts > /tmp/curriculum_seed.sql
wrangler d1 execute DB --local --file=/tmp/curriculum_seed.sql
wrangler d1 execute DB --remote --file=/tmp/curriculum_seed.sql   # preview/production
```

Every statement is an upsert (`INSERT ... ON CONFLICT(id) DO UPDATE`),
so this is safe to re-run after editing content — existing rows update in
place, nothing is duplicated, and rows for content you _removed_ from the
JSON files are simply left alone (not deleted — see `docs/curriculum.md`
on why content is archived via `status`, never hard-deleted).
