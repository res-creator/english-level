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
| `les_sie_a1_e1` | Первое знакомство | People & Connections | Alex | **done** | — (pre-V2) | target: `gr_a1_be_positive` (backed) | shipped, verified `36286655459` |
| `les_sie_a1_e2` | Заказ в кафе | Café & Casual Food | Maya | **done** | — (pre-V2) | target: `gr_a1_can` (backed) | shipped |
| `les_sie_a1_e3` | Мой обычный день | Daily Life & Home | Alex | **done** | — (pre-V2) | target: `gr_a1_present_simple_positive`, `gr_sie_frequency` (both backed) | shipped |
| `les_sie_a1_e4` | Я потерялась в городе | Getting Around | Rosa | **done** | — (pre-V2) | target: `gr_a1_there_is_are` — backed by Rosa's authored reply | shipped status retained; grammar finding resolved locally 2026-09-27; transcript QA blocked by finding #2 below |
| `les_sie_a1_e5` | Заказ пошёл не по плану | Problems & Solutions | Maya | **done** | — (pre-V2) | target: `gr_sie_could_polite` (backed); chunk: "There's been a mistake" (Present Perfect) | shipped |
| `sit_a1_people_02` | Знакомство с соседкой | People & Connections | Rosa | planned | 1 | be-verbs/question formation (recycled) | Batch 1 |
| `sit_a1_shop_01` | Покупка в магазине | Shopping & Services | Emma | planned | 1 | this/that, can (recycled) | Batch 1 |
| `sit_a1_travel_02` | Покупка билета | Getting Around | Rosa | planned | 1 | there is/are, question words (recycled) | Batch 1 |
| `sit_a1_social_01` | Что ты любишь делать? | Social Life & Leisure | Alex | planned | 1 | like + -ing (recycled) | Batch 2 |
| `sit_a1_daily_02` | Где ты живёшь? | Daily Life & Home | Maya | planned | 1 | there is/are (recycled) | Batch 2 |
| `sit_a1_health_01` (H.A1) | Мне нехорошо | Problems & Solutions | Alex | planned | 1 | have + symptom noun (recycled) | Batch 2 |

## A2 — 17 core situations

| ID | Title | Chapter | NPC | Status | Variations | Grammar | Notes |
|---|---|---|---|---|---|---|---|
| `sit_a2_people_01` | Рассказать о себе подробнее | People & Connections | Alex | planned | 2 | Present Simple extended, for/since (chunk) | |
| `sit_a2_people_02` | Знакомство на вечеринке у Дэниела | People & Connections | Daniel | planned | 2 | Present Simple, Wh-questions (recycled) | grammar target corrected in V2 §11 (question tags removed) |
| `sit_a2_cafe_01` | Изменить заказ | Café & Casual Food | Maya | planned | 2 | can (recycled); "could" chunk | |
| `sit_a2_restaurant_01` | Бронирование столика | Restaurant & Dining | Leo | planned | 2 (+phone variation) | would like | |
| `sit_a2_restaurant_02` | Заказ с особыми пожеланиями | Restaurant & Dining | Leo | planned | 2 | without/with, some/any | |
| `sit_a2_travel_01` | Опоздание, смена планов | Getting Around | Rosa | planned | 2 | Past Simple (reason), should | |
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

## Totals

| Level | Core situations | Done | Planned |
|---|---|---|---|
| A1 | 11 | 5 | 6 |
| A2 | 17 | 0 | 17 |
| B1 | 19 | 0 | 19 |
| B2 | 22 | 0 | 22 |
| **Total** | **69** | **5** | **64** |

---

## Findings — актуальное состояние на 2026-09-27

1. **RESOLVED (локально, без deploy): A1.4 — `gr_a1_there_is_are` без опорной реплики.** Минимально изменён только `npcReplyCorrect` у `itm_sie_where_is_the`: «Go straight, then turn left. There's a bank next to the station.» Роза естественно отвечает на вопрос о вокзале и указывает прежний ориентир. Grammar target, learner phrases, примеры, порядок, Mission и frozen curriculum не изменены. В worksheet добавлена классификация NPC-реплики как target. Grammar lint: 0 ошибок / 0 замечаний; targeted QA: 76/76; полный suite: 371/371; typecheck API/web: PASS. Mission: PASS 8/8 (100%, `can_do`), FAIL 0/8 (0%, `learning`, без наград). Успешный Mission подтверждён и в браузере. [Полный отчёт](docs/A1_4_REPAIR_QA.md).

2. **RESOLVED (engine-level, preview-only): transcript turns и повтор opener.** Причина была в том, что UI считал любое activity с `spokenAnswer` новой репликой, а lesson session неизменно добавляла situation opener. Engine теперь помечает только завершающее spoken activity одного semantic learner turn через необязательный `dialogueTurnId`; recognition/build/retrieval вокруг неё остаются учебными activity, но не создают дубли в transcript. NPC continuation привязана к завершённому turn, а opener показывается только первой session ситуации. Старые сохранённые планы получают turn markers при чтении; Mission scoring/ответы, Near/Far и Leitner/SRS не менялись. Regression tests охватывают реальные e1–e5, Mission pass/fail, retries, review/practice, старые планы и первую/последующие sessions. Browser QA A1.4: PASS/Mission 8/8 `can_do`; FAIL/Mission 0/8 `learning`; transcript и continuation проверены. Targeted tests 89/89; полный suite 386/386; API и web typecheck — PASS; grammar lint — 0 ошибок. Скриншоты: `apps/web/artifacts/qa/session-dialogue/pass.png`, `fail.png` (локальные preview артефакты). Batch 1 начинает следующий этап после отдельного engine commit.
