# A2 Batch 3 — production QA (preview only)

## Authored dialogue flows

### A2.7 — Уточнить маршрут (`sit_a2_travel_02`, Rosa)

- **Opener:** “The museum? Go straight along King Street and turn left at the bridge.”
- **Learner:** “Sorry, did you say turn right at the bridge?”
- **Rosa:** “No, turn left at the bridge. After the library, turn right at the traffic lights.”
- **Learner:** “So you said to turn left at the bridge, go past the library, then turn right at the lights. Is that right?”
- **Rosa:** “That's right. The museum is just across the next crossing, on your left.”
- **Learner:** “So I go straight across at the next crossing, and the museum is on my left?”
- **Rosa:** “Exactly. You can't miss it.”

The learner checks a misheard turn, reconstructs the route and confirms the destination. The target is `gr_a2_reported_confirmation`; “Sorry, did you say…?”, “So I go…” and “Is that right?” are explicitly logged as reusable chunks. Variation 1 adds a third turn to the route. Variation 2 changes the error to hearing bus sixty instead of sixteen. Far review/prerequisite: A1.4; an additional Far review refreshes the A1.8 ticket/directions phrase.

### A2.8 — Рассказать о выходных (`sit_a2_daily_01`, Alex)

- **Opener:** “How was your weekend? Did you do anything fun?”
- **Learner:** “On Saturday, Maya and I watched a new film downtown.”
- **Alex:** “Did you enjoy it?”
- **Learner:** “Yes, it was funny, and we talked about it over dinner.”
- **Alex:** “Where did you have dinner?”
- **Learner:** “We had a lovely dinner at the little Italian café beside the cinema.”
- **Alex:** “That sounds like a lovely evening. Thanks for telling me.”

The core learner story is exactly three connected sentences; Past Simple positive is a real Grammar Target, backed by watched/talked/had. Variation 1 changes the event to a day trip. Variation 2 adds rain and a change from a picnic to a museum café. Far review/prerequisite: A1.3 daily routine.

### A2.9 — Планы на следующую неделю (`sit_a2_daily_02`, Alex)

- **Opener:** “Are you free next week? I could use a day out.”
- **Learner:** “I'm going to visit the art market after work next week.”
- **Alex:** “Oh, nice. Which day? I finish early on Thursday.”
- **Learner:** “Thursday works. I'm meeting you at the station at six, and we're walking over together.”
- **Alex:** “Perfect. What would you like to do after the market?”
- **Learner:** “I'm going to get dinner nearby. We're meeting at the noodle place at eight.”
- **Alex:** “Sounds good. I'll look up the menu tonight.”

`going to` states intentions and Present Continuous phrases show arrangements with a person, time and place. Variations keep Alex and the scene: v1 changes the person to Maya and arranges a river walk; v2 changes the book fair's opening day, so the learner moves that plan from Thursday to Friday and keeps the Saturday dinner plan. Near review/prerequisite: A2.8.

## Reference workflow

British Council [An invitation to a party (A2)](https://learnenglish.britishcouncil.org/free-resources/listening/a2/invitation-party?page=1) and ELLLO's [A2 directions exercise](https://www.elllo.org/book/A2/A2-Worksheets4x/A2-17-2-Imperatives-Scramble.pdf) informed ordered route landmarks and confirming directions in one's own words. ELLLO [A2 Past Tense — Weekend Talk](https://elllo.org/book/A2/A2-07-Past-Tense-Irregular.html) informed short event-story pacing and follow-up questions. British Council [Messaging to make plans (A2)](https://learnenglish.britishcouncil.org/free-resources/writing/a2/messaging-make-plans) informed checking availability, proposing plans and changing a day; [Making arrangements (A2)](https://learnenglish.britishcouncil.org/comment/119333) informed the distinction between `going to` intention and a confirmed Present Continuous arrangement. The sources informed function, register and CEFR complexity only; authored dialogue is original.

## QA results

- **Gate A — PASS:** all seeds parse and cross-reference; IDs are unique; lesson-item order is contiguous; review links resolve; all new core turns have continuations; Mission plans include only core targets; repeated seed remains idempotent.
- **Gate B — PASS:** manual read-through confirmed every NPC continuation answers the prior learner turn, no speaker-role mismatch, no generic continuation and no duplicated information. A2.7 requires a full route paraphrase. A2.8 has exactly three connected learner sentences. A2.9 uses both future forms to share real intentions and arrangements; the mid-conversation variation changes only one plan in response to a new condition. Grammar targets are backed by learner phrases; all relevant clarification and social follow-up phrases are classified as chunks. No geography or cast issue found.
- **Gate C — PASS:** Chromium exercised onboarding/placement, Course and all nine A2 situations in progression using a disposable local DB. The course reached 9/9; all nine unique Missions passed at 100% (`can_do`). A separate A2.7 Mission failed at 0% (`learning`). **456 transcript snapshots** passed assertions for opener placement, semantic learner turns, authored continuation exactly once and English-only transcript.
- **Automated:** full test suite **397/397** (API 315, web 76, shared 6); API/web typecheck PASS; grammar lint **0 errors / 0 advisory notes** across 20 worksheet situations; seed/schema/reference/contiguity/idempotency PASS.

## Representative preview screenshots

These are ignored local artifacts, not production files:

- [A2 Course start](../artifacts/qa/session-dialogue/a2-course-start.png)
- [A2.7 route restatement](../artifacts/qa/session-dialogue/sit_a2_travel_02-pass-s1-itm_a2_a27_restate_route.png)
- [A2.7 Mission PASS](../artifacts/qa/session-dialogue/sit_a2_travel_02-pass-s3-mission-result.png)
- [A2.7 Mission FAIL](../artifacts/qa/session-dialogue/sit_a2_travel_02-fail-s3-mission-result.png)
- [A2.8 weekend story](../artifacts/qa/session-dialogue/sit_a2_daily_01-pass-s1-itm_a2_a28_film.png)
- [A2.8 Mission PASS](../artifacts/qa/session-dialogue/sit_a2_daily_01-pass-s4-mission-result.png)
- [A2.9 arrangement](../artifacts/qa/session-dialogue/sit_a2_daily_02-pass-s1-itm_a2_a29_arrangement.png)
- [A2.9 Mission PASS](../artifacts/qa/session-dialogue/sit_a2_daily_02-pass-s4-mission-result.png)
- [A2 Course complete (9/9)](../artifacts/qa/session-dialogue/a2-course-complete.png)

No blocking findings. The previously recorded situation-label overlay remains a non-blocking release/UI backlog item; no visual redesign was started for this content batch. Stop before A2 Batch 4.
