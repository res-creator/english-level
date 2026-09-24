# Speak in English V1 — how the product maps onto the schema

This is the contributor's map of V1. The product brief lives in
`docs/product/SPEAK_IN_ENGLISH_PRODUCT_BLUEPRINT_V1.md`; this file says
what actually exists in code, and why it is shaped that way.

## Frontstage ↔ backstage

The learner never sees the words "module", "lesson" or "activity plan".

| The learner sees | The database calls it                                   |
| ---------------- | ------------------------------------------------------- |
| Chapter          | `modules`                                               |
| Situation        | `lessons` (+ `situation_title`, `scene`, `capability`)  |
| Session (заход)  | a deterministic slice of that situation's activity plan |
| Mission          | `learning_sessions` with `session_kind = 'mission'`     |
| Повторение       | `review_sessions` + `user_item_memory`                  |
| Я могу …         | `user_capabilities.state`                               |
| Мой уголок       | `user_rewards` rendered through `content/rewardCatalog` |

No renaming migration was needed, and no released content id changed —
the original A1 chapters are `status = 'archived'` at orders 101–103, not
deleted, because user progress points at them. A2's three chapters are
archived too, for a different reason: public V1 is A1-only by product
decision — A2's content is real but still in the pre-pivot, non-
situational format, so it's held back rather than shipped inconsistent
with A1's polish. `todayService.getToday` returns `action: "unavailable"`
for a verified level with no published modules (any level, not just
A2), which the client renders as "we don't have this yet" — never as
"you finished everything", which would be a lie for someone who scored
above A1 and never touched any content at all.

## The session is a slice, not a lesson

`lessonEngine/episodePlan.ts` builds the situation's full plan with the
existing engine and then cuts it into sessions of at most
`MAX_ACTIVITIES_PER_SESSION` (12), never splitting one item's activities
across two days. Legacy content therefore shortened automatically: the
old ~28-activity lessons became 5–8 minute sessions with no rewriting.

`startLessonSession` serves `sessions[capability.sessions_done]`, and
once every session is done the same call starts the Mission instead. The
client never has to know which comes next.

## Mission is the only route to "могу"

A Mission is production-only (build it, type it — multiple choice would
prove nothing) and gives no retries: it is proof, not practice. Passing
it at `MISSION_PASS_ACCURACY` (80%) promotes `learning → can_do` and
unlocks that situation's memory object. Failing it changes nothing except
the attempt count, and unlocks nothing.

`user_lesson_progress.status` only becomes `completed` on a passed
Mission, so the preview screen's "Продолжить / Пройти ещё раз" stays
honest.

## Review owns forgetting, the course owns learning

Every target a session touches enters `user_item_memory` due **tomorrow**
— never the same day. Review then runs Leitner boxes 1–5 at 1/3/7/16/35
days, capped at `MAX_REVIEW_ITEMS` (12) per session so the queue is
always finite. A wrong answer drops one box, never back to the start.

`can_do → consolidated` happens only when a review of that situation's
language succeeds at least `CONSOLIDATION_MIN_DAYS` (7) after the
capability was earned. Nothing sooner is allowed to claim it, and a later
slip never demotes it.

After an absence of four days or more, `todayService` reschedules the
overdue pile so only one session's worth is waiting. Returning must never
look like debt.

## Rewards are memories, not currency

`content/rewardCatalog.ts` is content, not data: a reward exists because
a specific piece of English was learned, and tapping it in Мой уголок
shows that language back. Granting is idempotent by primary key, so a
replay can never re-unlock or re-celebrate an object. There is no
currency, shop, loot box, leaderboard or league anywhere in the codebase,
and `test/productV1.test.ts` asserts none leaks into a response.

## The companion has no needs

Three companions, identity and voice only (`content/companionCatalog.ts`).
Nothing to feed, heal or lose — a companion can never be used to guilt
someone into opening the app. It is offered once, after the first
session, not before.

## One friend, one shared goal

A single symmetric friendship, an invite code, and a weekly target of
`WEEKLY_GOAL_TARGET` (10) sessions counted **jointly**. Neither side can
see the other's mistakes, and nothing ranks them against each other.

## API surface

```
GET  /api/v1/today                      what to do right now
GET  /api/v1/course                     chapters → situations
GET  /api/v1/lessons/:id                one situation's content
POST /api/v1/lessons/:id/start          next session, or the Mission
GET  /api/v1/sessions/:id[/result]
POST /api/v1/sessions/:id/answer
GET  /api/v1/review                     what is due
POST /api/v1/review/start[?extra=1]     `extra` = "Хочу ещё"
POST /api/v1/review/sessions/:id/answer
GET  /api/v1/my/english                 capabilities + phrases
GET  /api/v1/my/space                   the companion's room
POST /api/v1/my/companion
GET  /api/v1/my/friend
POST /api/v1/my/friend/invite | /accept
```

## Deliberately absent

Audio, TTS, speech recognition, pronunciation scoring and AI conversation
are out of scope for V1, and so are room building, drag-and-drop, pet
care, currency and leaderboards. No infrastructure was added "for later"
for any of them.
