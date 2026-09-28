# Content Production Tracker — Speak in English V2

Single source of truth for "how much is done, how much is left, where exactly we stopped." Updated at the end of every batch (`CONTENT_PRODUCTION_PLAN.md` §5, step 7) — never mid-batch.

---

## Status values (fixed, in order)

```
planned → dialogue authored → learning items authored → mission authored
→ variations authored → review wired → structural QA passed
→ content QA passed → visual QA passed → done
```

A situation is `done` only after all three QA gates below have passed — no partial credit.

## Definition of Done (full 20-line list — `CONTENT_PRODUCTION_PLAN.md` §3)

Situation metadata · capability · coherent dialogue flow · NPC opener · learner targets · `npcReplyCorrect` (+optional incorrect) · vocabulary/learning items · grammar target(s) · lexical chunks kept out of `grammar_patterns` · activities (auto) · Mission (auto) · variation(s) · Near/Far review link(s) · prerequisite satisfied · scene+cast wired · automated QA passing · speaker-role consistency verified · grammar classification recorded · no RU/UA geography confirmed · idempotent re-seed confirmed.

## Gates (`CONTENT_PRODUCTION_PLAN.md` §11)

| Gate | Checks | Tooling |
|---|---|---|
| **A — Structural** | schemas/build/tests | `contentSeed.test.ts`, `contentQA.test.ts`, `lintGrammarClassification.ts`, `assertContiguousOrder` (incl. `lesson_items`), clean idempotent re-seed |
| **B — Learning/content** | dialogue coherence, CEFR fit, grammar target-vs-chunk, speaker-role consistency, no duplicate info, geography/cast rules | checklist above + semi-automated lints, human read-through |
| **C — Visual/product** | real preview screenshots, real transcript, real Mission pass/fail | targeted Playwright run per batch |

---

## A1 — 11 core situations

| ID | Title | Chapter | NPC | Status | Variations | Grammar | Notes |
|---|---|---|---|---|---|---|---|
| `les_sie_a1_e1` | Первое знакомство | People & Connections | Alex | **done** | 1 — same café/Alex; learner introduces themself from Warsaw as a teacher; Alex mentions his nearby design studio | target: `gr_a1_be_positive` (backed in core and variation) | Gate A/B/C PASS; V2 A1.1-v1 row minimally corrected with curriculum-owner approval |
| `les_sie_a1_e2` | Заказ в кафе | Café & Casual Food | Maya | **done** | 1 — large tea; request frame transferred to a different drink | target: `gr_a1_can` (backed) | Gate A/B/C PASS; added V2 variation in Batch 2 |
| `les_sie_a1_e3` | Мой обычный день | Daily Life & Home | Alex | **done** | 1 — evening reading routine | target: `gr_a1_present_simple_positive`, `gr_sie_frequency` (both backed) | Gate A/B/C PASS; added V2 variation in Batch 2 |
| `les_sie_a1_e4` | Я потерялась в городе | Getting Around | Rosa | **done** | 1 — directions to the pharmacy | target: `gr_a1_there_is_are` — backed by Rosa's authored reply | grammar + transcript/session findings resolved locally; Gate A/B/C PASS for variation |
| `les_sie_a1_e5` | Заказ пошёл не по плану | Problems & Solutions | Maya | **done** | 1 — wrong pastry instead of drink | target: `gr_sie_could_polite` (backed); chunk: "There's been a mistake" (Present Perfect) | Gate A/B/C PASS; added V2 variation in Batch 2 |
| `sit_a1_people_02` | Знакомство с соседкой | People & Connections | Rosa | **done** | 1 — elevator introduction (new setting/details) | be-positive/questions (recycled); NPC-only chunk: “How long have you lived here?” | Near: A1.1 greeting/self-intro; Gate A/B/C PASS |
| `sit_a1_shop_01` | Покупка в магазине | Shopping & Services | Emma | **done** | 1 — notebook, green colour, new price | this/that; Can I get…? (availability) | Near: A1.2 price exchange; Gate A/B/C PASS |
| `sit_a1_travel_02` | Покупка билета | Getting Around | Rosa | **done** | 1 — Brighton at 11:15 | there is/are; present-simple WH question (recycled) | Near: A1.4 directions; Gate A/B/C PASS |
| `sit_a1_social_01` | Что ты любишь делать? | Social Life & Leisure | Alex | **done** | 1 — suggest a park walk on Sunday instead of café on Saturday | target: `gr_a1_like_ing`; suggestion formulas are lexical chunks | Near: A1.3 routine; Gate A/B/C PASS |
| `sit_a1_daily_02` | Где ты живёшь? | Daily Life & Home | Maya | **done** | 1 — house + garden near kitchen instead of apartment | target: `gr_a1_there_is_are`; `I live…` and `next to` are chunks | Near: A1.2 café + A1.4 directions; Gate A/B/C PASS |
| `sit_a1_health_01` (H.A1) | Мне нехорошо | Problems & Solutions | Alex | **done** | 1 — stomach ache instead of headache | sole target: `gr_a1_have`; `I need to rest` explicitly lexical chunk | Near/Far: —; Gate A/B/C PASS |

## A2 — 17 core situations

| ID | Title | Chapter | NPC | Status | Variations | Grammar | Notes |
|---|---|---|---|---|---|---|---|
| `sit_a2_people_01` | Рассказать о себе подробнее | People & Connections | Alex | **done** | 2 — new job/family profile; new duration detail | target: Present Simple in connected descriptions; “I've lived here for…” is a lexical chunk, no Present Perfect target | Gate A/B/C PASS; near/far reviews wired; references: BC A2 job talk, ELLLO A2 Present Simple |
| `sit_a2_people_02` | Знакомство на вечеринке у Дэниела | People & Connections | Daniel | **done** | 2 — running-group connection; English-class connection to Maya | Present Simple + Wh-questions (recycled); social reactions are lexical chunks; question tags absent | Gate A/B/C PASS; reviews wired; variation keeps same NPC/scene per V2 §1 and transfers the mutual connection; reference: BC A2 showing interest |
| `sit_a2_cafe_01` | Изменить заказ | Café & Casual Food | Maya | **done** | 2 — change item to tea; change quantity after payment starts | `can` recycled; “Could I change this to … instead?” and transaction phrases are lexical chunks | Gate A/B/C PASS; near A1.2 review wired; reference: Cambridge A2 Key vocabulary |
| `sit_a2_restaurant_01` | Бронирование столика | Restaurant & Dining | Leo | **done** | 2 (+phone variation with an explicit call/line interruption, choices repeated by phone) | target: `gr_a2_would_like_booking`; polite clarification/time/name formulas classified as chunks | Gate A/B/C PASS; Near A1.8; BC booking sequence reference |
| `sit_a2_restaurant_02` | Заказ с особыми пожеланиями | Restaurant & Dining | Leo | **done** | 2 — no cream instead of onions; four bowls instead of two | targets: `gr_a2_without_food`, `gr_a2_some_any_food`; “Could we have…” is a lexical chunk | Gate A/B/C PASS; Near A2.4, Far A1.2; ELLLO A2 request pattern reference |
| `sit_a2_travel_01` | Опоздание, смена планов | Getting Around | Rosa | **done** | 2 — wrong building/missed meeting; overslept/missed early train and rearranged trip | targets: Past Simple positive/negative (`gr_a2_past_simple_positive`, `gr_a2_past_simple_negative`) and `gr_a2_should`; fixed apology/plan phrases classified as chunks | Gate A/B/C PASS; Near A1.4/A1.8; BC A2 apology rhythm + Cambridge A2 travel vocabulary |
| `sit_a2_travel_02` | Уточнить маршрут | Getting Around | Rosa | planned | 2 | reported confirmation | |
| `sit_a2_daily_01` | Рассказать о выходных | Daily Life & Home | Alex | planned | 2 | Past Simple | |
| `sit_a2_daily_02` | Планы на следующую неделю | Daily Life & Home | Alex | planned | 2 (v2 corrected, no "used to" preview) | going to, Present Continuous | |
| `sit_a2_shop_01` | Возврат или обмен товара | Shopping & Services | Emma | planned | 2 | Past Simple (corrected from Present Perfect in V2 §2.2) | |
| `sit_a2_shop_02` | Спросить про скидку | Shopping & Services | Emma | planned | 2 | comparatives | |
| `sit_a2_work_01` | Чем ты занимаешься подробнее | Work & Study | Daniel | planned | 2 | Present Simple + frequency (recycled) | |
| `sit_a2_work_02` | Попросить о помощи с задачей | Work & Study | Daniel | planned | 2 (+phone variation) | Could you...? (recycled), need to | |
| `sit_a2_social_01` | Пригласить и изменить планы | Social Life & Leisure | Alex | planned | 2 | going to, could we...instead | |
| `sit_a2_problems_01` | Потерял(а) вещь | Problems & Solutions | Rosa | planned | 2 | Present Perfect (chunk), Past Simple | |
| `sit_a2_problems_02` | Ошибка в счёте | Problems & Solutions | Leo | planned | 2 | Past Simple, could you check | |
| `sit_a2_health_01` (H.A2) | Нужно средство от простуды | Shopping & Services | Emma | planned | 2 | have+symptom, do you have (recycled) | reframed in V2 §11 fix #4b — Emma stays shop assistant, not a pharmacist |

## B1 — 19 core situations

| ID | Title | Chapter | NPC | Status | Variations | Grammar | Notes |
|---|---|---|---|---|---|---|---|
| `sit_b1_people_01` | Обсудить новости с Алексом | People & Connections | Alex | planned | 2 | Present Perfect (news), "Have you heard" (corrected in V2 §2.2) | |
| `sit_b1_people_02` | Не согласиться вежливо | People & Connections | Alex | planned | 2 | modal softeners | |
| `sit_b1_cafe_01` | Порекомендовать и обсудить выбор | Café & Casual Food | Maya | planned | 2 | "if I were you" (chunk) | |
| `sit_b1_restaurant_01` | Особые диетические потребности | Restaurant & Dining | Leo | planned | 2 | Present Simple, could you make sure | |
| `sit_b1_restaurant_02` | Серьёзная жалоба на обслуживание | Restaurant & Dining | Leo | planned | 2 | Present Perfect Continuous (chunk), should have (chunk) | |
| `sit_b1_travel_01` | Проблема в поездке | Getting Around | Rosa | planned | 2 | Present Perfect Passive (chunk) | |
| `sit_b1_travel_02` | Спросить совет о маршруте на день | Getting Around | Rosa | planned | 2 | worth + -ing, comparatives | |
| `sit_b1_daily_01` | Рассказать историю из жизни | Daily Life & Home | Alex | planned | 2 | Present Perfect (experience) + Past Simple | first REAL target for this facet |
| `sit_b1_daily_02` | Обсудить изменение в жизни | Daily Life & Home | Alex | planned | 2 | used to | |
| `sit_b1_shop_01` | Проблема с подпиской/счётом | Shopping & Services | Emma | planned | 2 | Passive | |
| `sit_b1_shop_02` | Сравнить варианты перед покупкой | Shopping & Services | Emma | planned | 2 | comparatives/superlatives, would rather | |
| `sit_b1_work_01` | Объяснить задачу коллеге | Work & Study | Daniel | planned | 2 (+phone variation) | need+noun/infinitive, time expressions | |
| `sit_b1_work_02` | Попросить об услуге на работе | Work & Study | Daniel | planned | 2 | Would you mind + -ing | |
| `sit_b1_work_03` | Простое собеседование | Work & Study | Daniel | planned | 2 | Present Perfect (experience, recycled) | |
| `sit_b1_social_01` | Организовать групповую встречу | Social Life & Leisure | Alex | planned | 2 | conditionals (what if) | |
| `sit_b1_social_02` | Вежливо отказаться | Social Life & Leisure | Alex | planned | 2 | would love to (but) | |
| `sit_b1_problems_01` | Решить проблему через несколько шагов | Problems & Solutions | Emma | planned | 2 (+voicemail variation) | sequencing language | |
| `sit_b1_problems_02` | Настоять на своём вежливо | Problems & Solutions | Leo | planned | 2 | I understand, but... | |
| `sit_b1_health_01` (H.B1) | У врача | Shopping & Services | Dr. Kim | planned | 2 | **Present Perfect with duration** (real new target) | new NPC — see cast.tsx |

## B2 — 22 core situations

| ID | Title | Chapter | NPC | Status | Variations | Grammar | Notes |
|---|---|---|---|---|---|---|---|
| `sit_b2_people_01` | Обсудить спорную тему с другом | People & Connections | Alex | planned | 3 | concession clauses (although/even though) — corrected from "mixed conditionals" in V2 §2.1/§11 | |
| `sit_b2_restaurant_01` | Организовать сложный групповой заказ | Restaurant & Dining | Leo | planned | 3 | reported speech, summarising | |
| `sit_b2_restaurant_02` | Оспорить счёт и добиться компенсации | Restaurant & Dining | Leo | planned | 3 | I don't think it's fair that | |
| `sit_b2_travel_01` | Переговоры о компенсации за поездку | Getting Around | Rosa | planned | 3 | given that, conditionals | |
| `sit_b2_travel_02` | Сложный маршрут с ограничениями | Getting Around | Rosa | planned | 3 | taking into account, might/could | |
| `sit_b2_daily_01` | Плюсы и минусы образа жизни | Daily Life & Home | Alex | planned | 3 | however/nevertheless | |
| `sit_b2_shop_01` | Оспорить условия услуги | Shopping & Services | Emma | planned | 3 (+call variation) | Passive, conditionals | |
| `sit_b2_work_01` | Высказать мнение на рабочей встрече | Work & Study | Daniel | planned | 3 | I'd like to propose | |
| `sit_b2_work_02` | Конструктивно не согласиться с коллегой | Work & Study | Daniel | planned | 3 | would it help if | |
| `sit_b2_work_03` | Договориться о новом дедлайне | Work & Study | Daniel | planned | 3 (+call variation) | would it be possible to | |
| `sit_b2_work_04` | Дать сложную обратную связь | Work & Study | Daniel | planned | 3 | it might be worth + -ing | |
| `sit_b2_social_01` | Уладить недопонимание с другом | Social Life & Leisure | Alex | planned | 3 | what I meant was | |
| `sit_b2_problems_01` | Сложные переговоры о возврате денег | Problems & Solutions | Emma | planned | 3 | I'm willing to | |
| `sit_b2_problems_02` | Отстоять свою позицию в споре | Problems & Solutions | Leo | planned | 3 | I have to insist | capstone |
| `sit_b2_people_03` (B2.15) | Обсудить фильм или книгу глубже | People & Connections | Alex | planned | 3 | comparing-viewpoints language | new in V2 |
| `sit_b2_work_05` (B2.16) | Обсудить новую технологию на работе | Work & Study | Daniel | planned | 3 | speculation modals | new in V2 |
| `sit_b2_people_04` (B2.17) | Предположить, почему что-то произошло | People & Connections | Alex | planned | 3 | **I wonder if/whether** (real new target) | new in V2 |
| `sit_b2_social_02` (B2.18) | Свободный разговор без определённой темы | Social Life & Leisure | Alex | planned | 3 | **discourse markers** (real new target) | new in V2 |
| `sit_b2_daily_02` (B2.19) | Убедить друга попробовать что-то новое | Daily Life & Home | Alex | planned | 3 | should (persuasion, recycled) | new in V2 |
| `sit_b2_people_05` (B2.20) | Рассказать сложную историю с нюансами | People & Connections | Alex | planned | 3 | **cleft sentences** (real new target) | new in V2 |
| `sit_b2_work_06` (B2.21) | Обсудить последствия решения | Work & Study | Daniel | planned | 3 | conditional for consequences | new in V2 |
| `sit_b2_health_01` (H.B2) | Уточнить рекомендации врача | Shopping & Services | Dr. Kim | planned | 3 | will-future | |

---

## A2 Batch 1 reference and QA record

The authoring workflow used the approved references as models for turn order, register, A2 complexity and functional vocabulary; all Speak in English lines are original. British Council's [A2 job conversation](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/talking-about-your-job) informed A2.1's job answer followed by a relevant personal follow-up; [A2 showing interest](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/showing-interest) informed A2.2's open question, reaction and follow-up rhythm. ELLLO's [A2 Present Simple lesson](https://elllo.org/class/A2/A2-01-Present-Simple.html) and Cambridge English's [A2 Key vocabulary list](https://www.cambridgeenglish.org/latinamerica/Images/506886-a2-key-2020-vocabulary-list.pdf) informed the compact grammar and café vocabulary range. See [A2 Batch 1 production QA](docs/A2_BATCH1_PRODUCTION_QA.md).

## A2 Batch 2 reference and QA record

Before authoring, the reference workflow consulted British Council [Booking a table](https://learnenglish.britishcouncil.org/comment/210215) for the booking sequence (date/time → party size → name → confirmation), ELLLO [A2 Can requests](https://www.elllo.org/book/A2/A2-20-Can-Requests.html) for concise restaurant request/response register, British Council [A2 Apologising](https://learnenglish.britishcouncil.org/free-resources/speaking/a2/apologising?page=1) for short apology and response turns, and the [Cambridge A2 Key vocabulary list](https://www.cambridgeenglish.org/latinamerica/Images/506886-a2-key-2020-vocabulary-list.pdf) for familiar travel terms. These informed function, register and level only; all authored dialogue is original.

Gate A/B/C PASS for A2.4–A2.6. Grammar lint: 0 errors / 0 advisory notes; full suite 394/394; API and web typechecks PASS; seed/schema/reference/contiguity/idempotency PASS. Chromium ran all six A2 course situations in progression, checked 280 transcript snapshots (including first-session openers, continuation once per semantic turn, no Cyrillic in English transcript), verified all six Mission PASS paths at 100% (`can_do`) and an A2.4 Mission FAIL at 0% (`learning`); course progress reached 6/6. Preview screenshots and detailed report: [A2 Batch 2 production QA](docs/A2_BATCH2_PRODUCTION_QA.md).

All three situations pass Gates A/B/C. Grammar lint: 0 errors / 0 advisory notes; API and web suites, typechecks, contiguous ordering, seed references and idempotent reseed pass. Chromium verified all three Mission PASS paths (100%, `can_do`), one Mission FAIL path (0%, `learning`), English-only transcripts, opener placement and progression. Screenshots/results are ignored preview artifacts under `artifacts/qa/session-dialogue/`.

## Totals

| Level | Core situations | Done | Planned | Blocked |
|---|---|---|---|---|
| A1 | 11 | 11 | 0 | 0 |
| A2 | 17 | 6 | 11 | 0 |
| B1 | 19 | 0 | 19 | 0 |
| B2 | 22 | 0 | 22 | 0 |
| **Total** | **69** | **17** | **52** | **0** |

---

## Findings — актуальное состояние на 2026-09-27

1. **RESOLVED (локально, без deploy): A1.4 — `gr_a1_there_is_are` без опорной реплики.** Минимально изменён только `npcReplyCorrect` у `itm_sie_where_is_the`: «Go straight, then turn left. There's a bank next to the station.» Роза естественно отвечает на вопрос о вокзале и указывает прежний ориентир. Grammar target, learner phrases, примеры, порядок, Mission и frozen curriculum не изменены. В worksheet добавлена классификация NPC-реплики как target. Grammar lint: 0 ошибок / 0 замечаний; targeted QA: 76/76; полный suite: 371/371; typecheck API/web: PASS. Mission: PASS 8/8 (100%, `can_do`), FAIL 0/8 (0%, `learning`, без наград). Успешный Mission подтверждён и в браузере. [Полный отчёт](docs/A1_4_REPAIR_QA.md).

2. **RESOLVED (engine-level, preview-only; commit `6de5818`): transcript turns и повтор opener.** Причина была в том, что UI считал любое activity с `spokenAnswer` новой репликой, а lesson session неизменно добавляла situation opener. Engine теперь помечает только завершающее spoken activity одного semantic learner turn через необязательный `dialogueTurnId`; recognition/build/retrieval вокруг неё остаются учебными activity, но не создают дубли в transcript. NPC continuation привязана к завершённому turn, а opener показывается только первой session ситуации. Старые сохранённые планы получают turn markers при чтении; Mission scoring/ответы, Near/Far и Leitner/SRS не менялись. Regression tests охватывают e1–e5, Mission pass/fail, retries, review/practice, старые планы и первую/последующие sessions. Browser QA A1.4: Mission PASS 8/8 `can_do`; Mission FAIL 0/8 `learning`; transcript и continuation проверены. Targeted tests 89/89; suite до Batch 1 — 386/386; API/web typecheck — PASS; grammar lint — 0 ошибок.

3. **Batch 1 завершён (preview-only).** A1.6–A1.8 имеют authored openers/continuations, learner targets, grammar/chunk classification, variations и Near review links. Grammar lint: 0 ошибок / 0 advisory notes; Gate A: PASS (schemas, IDs, cross-references, contiguous ordering, plans, idempotent seed); Gate B: PASS (dialogue read-through, role match, no repeated replies, CEFR/grammar checks); Gate C: PASS (Chromium transcript QA на A1.4 и Batch 1, Mission pass/fail на A1.4 и pass на трёх новых ситуациях). Полный suite 387/387 и API/web typecheck — PASS после финального запуска. Диалоги и QA: [A1_BATCH1_PRODUCTION_QA.md](docs/A1_BATCH1_PRODUCTION_QA.md). Артефакты скриншотов: `artifacts/qa/session-dialogue/` (локальный ignored output).

4. **RESOLVED — A1.1 Practice Variation contradiction.** The curriculum owner confirmed V2 §1's same-NPC rule takes precedence and authorized a one-row correction to V2 §6. A1.1-v1 keeps Alex in the café; the learner self-introduces with different familiar origin/job details, and Alex adds a compatible detail about his design studio. The preview seed uses the existing `practice` role and situation-level Alex scene mapping; no engine or architecture override was added. Targeted structural, transcript, variation, Mission, lint, and full-level QA passed.

5. **A1 CONTENT FROZEN / PRODUCTION READY.** All 11 A1 situations and their V2 practice variations are done. Batch 2 and the final A1.1 correction passed Gates A/B/C. Grammar lint covers both `les_sie_*` and `sit_a1_*`, with 0 errors/0 advisory notes. Full automated suite: 389/389; API/web typecheck: PASS; seed idempotency, contiguous ordering and references: PASS. Chromium drove Course (0/11 → 11/11), all 11 situations, all Mission PASS paths at 100%, and a Mission FAIL at 0%/`learning`; 333 full-level snapshots plus 64 targeted A1.1 snapshots passed, including no repeated opener and correct Practice turns. Full details: [A1_LEVEL_FREEZE_QA.md](docs/A1_LEVEL_FREEZE_QA.md). Screenshots and JSON are ignored preview artifacts under `artifacts/qa/session-dialogue/`.

6. **Known non-blocking UI/release backlog (kept separate from content findings):** persistent `Ситуация: …` overlay should be intro-only/fade; grammar UX needs beginner-facing labels/options; safe-area/CTA layout needs device review; final visual polish. No global redesign started during content QA.
