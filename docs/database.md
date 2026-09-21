# Database — Phase 1

This describes only what's actually implemented so far: the database
foundation and a basic user data model. It intentionally does **not**
cover curriculum, lessons, mastery, SRS, streaks, or Duo — those tables
don't exist yet and will get their own migrations and docs when they're
built.

## Why these four tables

**`levels`** — a small, mostly-static lookup table for CEFR levels
(A1–C1). It exists now because `users.current_cefr_level` needs something
stable to reference, and because "list the levels a user can be at" is a
query later phases (placement, curriculum) will need regardless of how
curriculum content ends up modeled. It is deliberately just a lookup
table — no modules, lessons, or curriculum content live here yet (see
`CLAUDE.md` principle 4: curriculum progress and knowledge mastery are
different concepts, and neither belongs in this table).

**`users`** — the core identity record. `id` (`usr_...`) is the internal,
stable application ID; `telegram_user_id` is unique but deliberately
_not_ the primary key, so nothing else in the schema has to change if the
identity/auth strategy around Telegram ever changes. `current_cefr_level`
and `onboarding_completed` exist as placeholders for the placement-test
and onboarding phases — this phase only creates the columns and their
defaults, not the flows that set them.

**`user_settings`** — split from `users` because settings are mutated
far more often than identity, have a different shape of "who reads/writes
them" (mostly the owning user), and will grow independently (new
notification types, new preferences) without touching the core user
record. One row per user, enforced by using `user_id` as the primary key.

**`user_acquisition`** — a first-touch attribution record, separated from
`users` because it's write-once/read-rarely and has nothing to do with
the user's ongoing state. One row per user (`user_id` is the primary
key), so re-recording acquisition data for a returning user is a no-op —
first touch stays first touch.

## Schema

```
levels
  id              TEXT PRIMARY KEY      -- e.g. "lvl_a1"
  code            TEXT NOT NULL UNIQUE  -- e.g. "A1"
  name            TEXT NOT NULL
  order_index     INTEGER NOT NULL
  description     TEXT
  is_active       INTEGER NOT NULL DEFAULT 1

users
  id                    TEXT PRIMARY KEY      -- e.g. "usr_<hex>"
  telegram_user_id      INTEGER NOT NULL UNIQUE
  username              TEXT
  first_name            TEXT NOT NULL
  last_name             TEXT
  interface_language    TEXT NOT NULL DEFAULT 'en'
  timezone              TEXT
  current_cefr_level    TEXT REFERENCES levels(code)
  onboarding_completed  INTEGER NOT NULL DEFAULT 0
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived'))
  created_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  updated_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  last_active_at        TEXT

user_settings
  user_id                       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
  daily_minutes                 INTEGER NOT NULL DEFAULT 10 CHECK (daily_minutes IN (5,10,15))
  learning_goals_json           TEXT NOT NULL DEFAULT '[]'
  preferred_accent              TEXT NOT NULL DEFAULT 'us'
  interface_language            TEXT NOT NULL DEFAULT 'en'
  daily_reminder_enabled        INTEGER NOT NULL DEFAULT 1
  daily_reminder_period         TEXT
  review_notifications          INTEGER NOT NULL DEFAULT 1
  streak_notifications          INTEGER NOT NULL DEFAULT 1
  duo_notifications             INTEGER NOT NULL DEFAULT 1
  weekly_report_notifications   INTEGER NOT NULL DEFAULT 1
  quiet_hours_enabled           INTEGER NOT NULL DEFAULT 0
  quiet_start                   TEXT
  quiet_end                     TEXT
  show_level_to_duo             INTEGER NOT NULL DEFAULT 1
  created_at                    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  updated_at                    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

user_acquisition
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
  source            TEXT
  campaign          TEXT
  content           TEXT
  referrer_user_id  TEXT REFERENCES users(id)
  first_touch_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Booleans are stored as `INTEGER` (`0`/`1`) — plain SQLite/D1 has no native
boolean type. `learning_goals_json` is a JSON-encoded text column for now;
it can become a normalized table once goal-taxonomy needs are clearer.

## IDs

Internal IDs are prefixed strings generated at insert time
(`usr_<32 hex chars>`), not auto-increment integers — see
`apps/api/src/db/ids.ts`. `levels` uses fixed, hand-assigned IDs
(`lvl_a1`, `lvl_a2`, ...) since it's a small seeded lookup table, not
user-generated data.

## Data access

`apps/api/src/repositories/` has one file per table
(`usersRepository.ts`, `userSettingsRepository.ts`,
`userAcquisitionRepository.ts`, `levelsRepository.ts`). Each repository
function takes a `Db` (`apps/api/src/db/types.ts`) — a tiny interface with
`run`/`all`/`first` — rather than a `D1Database` directly, so the same
repository code runs against a real D1 binding (`apps/api/src/db/d1Adapter.ts`)
or an in-memory `node:sqlite` database in tests
(`apps/api/test/helpers/sqliteAdapter.ts`). Repository return types
(`UserRow`, `UserSettingsRow`, ...) are raw database rows — they are not
public API response shapes, and nothing outside `apps/api` should depend
on their exact column layout.
