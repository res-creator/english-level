# English Level

Telegram Mini App for structured English learning (A1 → B2): curriculum, daily
lessons, spaced repetition, mastery tracking, streaks, and a "Study Duo"
social feature. Full product brief lives in project history; this file
covers what a contributor/agent needs to work in the repo day to day.

## Tech stack

- Frontend: React + TypeScript + Vite (`apps/web`)
- Backend: Cloudflare Workers + TypeScript + Hono (`apps/api`)
- Database: Cloudflare D1 / SQLite, via `migrations/`
- Storage: Cloudflare R2 (later, for audio/assets)
- Validation: Zod, shared via `packages/contracts`
- Package manager: pnpm workspaces (this machine has no global pnpm —
  use `corepack pnpm <cmd>`, not a bare `pnpm` binary)

## Repo layout

```
apps/
  web/                 React Mini App frontend
  api/                 Cloudflare Worker backend (Hono)
packages/
  contracts/           Zod schemas shared between web and api
  shared/               Cross-cutting types/constants (e.g. CEFR levels)
  learning-engine/      Curriculum/mastery/SRS domain logic (stub for now)
migrations/            D1 schema migrations
seeds/                 Seed data for local/dev D1
docs/                  Design notes
```

## Architecture principles

1. **Backend is the source of truth.** The frontend must never calculate
   mastery, streaks, SRS scheduling, level progress, or Duo progress —
   it only renders what the API returns.
2. **Telegram auth is validated server-side.** Never trust a `user_id` sent
   by the frontend for authorization.
3. Core learning entities (word/phrase/collocation/phrasal verb/pattern/
   contrast) are reusable across lessons, review, My Words, checkpoints,
   and readings.
4. Curriculum progress and actual knowledge mastery are different concepts
   — do not conflate them in the data model.
5. Published content IDs must stay stable once released.
6. Schema changes go through migrations in `migrations/`, never ad hoc.
7. Entities referenced by user progress are soft-deleted/archived, not
   hard-deleted.
8. Important mutations (e.g. review submission, streak updates) must be
   idempotent.
9. Backend product logic lives in services (`AuthService`, `UserService`,
   `PlacementService`, `CurriculumService`, `LessonService`,
   `ExerciseService`, `TodayService`, `MasteryService`, `SRSService`,
   `ReviewService`, `ProgressService`, `StreakService`, `DuoService`,
   `GardenService`, `NotificationService`, `AnalyticsService`) rather than
   one large backend file. Not all of these exist yet — add them as the
   corresponding phase is built.

## Development process

This project is built in **phases**. For every task:

1. Inspect the existing project before making architectural changes.
2. Explain briefly what will change.
3. Implement only the requested phase — no scope expansion, no
   unrequested features.
4. Run relevant checks/tests.
5. Summarize what changed and list files touched.
6. Stop. Do not start the next phase automatically.

Prefer simple, maintainable solutions over premature abstraction.
No AI API is required for the core V1 learning flow — content is
authored/stored in our own database, not generated at request time.
Do not copy copyrighted textbook content; original content only.
