# Content Master Plan — Speak in English, A1 → B2

Research-grounded curriculum architecture for the full app. **No code, seeds, or migrations were written or changed as part of this document** — planning only, per explicit instruction. Existing 5 A1 situations (`les_sie_a1_e1`–`e5`) are preserved and integrated, not rewritten.

---

## 0. Methodology & sources

Real web research was conducted (not from memory) across four independent lines of inquiry, cross-checked against each other:

1. **Official CEFR descriptors** — Council of Europe Global Scale (via the CEFR Wikipedia article, which reproduces the official English text verbatim), British Council's own per-level "can do" restatements, and ALTE (Association of Language Testers in Europe) Can Do statements.
2. **British Council LearnEnglish** — per-level can-do pages, and critically their **Speaking skills module list by level**, which is the clearest directly-stated per-level *function* progression found anywhere in this research.
3. **ELLLO.org** (English Listening Lesson Library Online) — CEFR-aligned real-conversation library; used for topic/complexity reference at A1 and B1/B2 specifically.
4. **Cambridge English exam topic lists** — the official A2 Key and B1 Preliminary vocabulary-list topic appendices (Cambridge Assessment English), which are exam-board-vetted, publicly published topic taxonomies per level. B2 First has no equivalent official fixed list (confirmed absent, not just unfound) — treated as lower-confidence/secondary for B2 topic grounding.
5. BBC Learning English was attempted but its pages were not fetchable in this environment; its flagship "6 Minute English" format reads as B1/B2-equivalent (news/opinion topics) from search snippets only — used as a single soft corroborating data point, not a primary source.

**Sources actually cited** (full list, deduplicated):
- [CEFR — Wikipedia (reproduces official Council of Europe Global Scale)](https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages)
- [British Council — Understand your English level (A1–B2 hub)](https://learnenglish.britishcouncil.org/level/understand-your-english-level)
- [British Council — A1 Elementary](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/a1-elementary)
- [British Council — A2 Pre-intermediate](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/a2-pre-intermediate)
- [British Council — B1 Intermediate](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/b1-intermediate)
- [British Council — B2 Upper-intermediate](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/b2-upper-intermediate)
- [British Council — Speaking skills, by level](https://learnenglish.britishcouncil.org/skills/speaking)
- [British Council — "Starting Out" video series (A1–A2)](https://learnenglish.britishcouncil.org/general-english/video-series/starting-out)
- [ELLLO — Levels overview](https://elllo.org/levels/)
- [ELLLO — A1 English Lessons](https://elllo.org/levels/A1-English-Lessons/index.html)
- [ELLLO — B1 English Lessons](https://elllo.org/levels/B1-English-Lessons/index.html)
- [ELLLO — B2 Views](https://elllo.org/levels/views/B2-views.html)
- [ALTE Can Do statements (PDF, via AMU mirror)](http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf)
- [Cambridge English — A2 Key 2020 vocabulary list (PDF)](https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf)
- [Cambridge English — B1 Preliminary vocabulary list (PDF)](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf)
- [Wikipedia — A2 Key](https://en.wikipedia.org/wiki/A2_Key)
- [Wikipedia — B1 Preliminary](https://en.wikipedia.org/wiki/B1_Preliminary)

No dialogue text was copied from any source. Sources inform **real-life situations, natural conversation order, typical language functions, level-appropriate complexity, and vocabulary/grammar targets** — exactly per instruction.

---

## 1. How many situations, and why

**Not forced to 100.** The research converges on a clear pattern that argues against a large flat number:

> Cambridge's own B1 Preliminary topic list (22 areas: Appliances, Buildings, Clothes, Education, Entertainment and Media, Environment, Food and Drink, Health, Hobbies and Leisure, House and Home, Language, Personal Feelings/Opinions/Experiences, Places, Services, Shopping, Sport, Technology, Travel, Weather, Work...) **is the same broad set of life domains Cambridge already uses at A2**, just tested with more depth and nuance. Cambridge does not invent new topic domains per level — it deepens the same ones. This is a real, citable finding, not a design assumption.

Combined with British Council's directly-stated per-level speaking *functions* (A1: meeting people, checking understanding, suggestions — A2: showing interest, origins, employment — B1: responding to news, meetings, requesting favours — B2: advice, problem-resolution, disagreement) and ELLLO's topic-complexity shift (A1 = self/identity → B1 = reflection/past/logistics → B2 = abstract/opinion/argument), the right model is:

**A small, fixed set of recurring life-domain "Chapters" that persist across all four levels. Each level adds situations to existing Chapters (deepening) rather than inventing disconnected new domains.** Two chapters (Restaurant, Work) don't start until A2, matching CEFR's own guidance that professional/formal-register communication isn't an A1 goal.

| Level | Situations | Rationale |
|---|---|---|
| **A1** | **10** | CEFR A1 = narrow, predictable, single-goal exchanges ("can interact in a simple way provided the other person talks slowly and clearly" — CEFR Global Scale). 5 already exist; 5 more complete coverage of the chapters that legitimately belong at A1 (no Work, no formal Restaurant — not CEFR A1 territory). |
| **A2** | **16** | CEFR A2 = "simple, everyday tasks... direct exchange of information on familiar topics" + BC's explicit A2 functions (origins, employment, showing interest). All 9 chapters open; each gets meaningful but still-concrete coverage. |
| **B1** | **18** | The level with the widest genuine breadth per every source consulted (Cambridge's own 22-topic list is published specifically at B1; ALTE Level 2 = "deal in a general way with non-routine information"). Work chapter grows heaviest here, matching BC's B1 functions (news, meetings, favours). |
| **B2** | **14** | CEFR B2 = fewer *new* topics, more *depth*: argumentation, negotiation, disagreement (BC's explicit B2 functions) layered onto chapters the learner already knows from A2/B1 — fewer situations, each harder, not broader. |
| **Total** | **58** | Fewer, better-built situations — each with real narrative continuity — beats padding toward a round number with near-duplicates (see §F, redundancy audit, for the explicit check against this). |

---

## 2. Chapters (life domains, recurring across levels)

Confirmed against `apps/web/src/brand/cast.tsx`'s own design comment ("The same six people come back across levels... by A2 you are not meeting a stranger, you are handling a harder moment with someone you know") — **the cast and scene system already assumes exactly this architecture.** Two cast members (Эмма, Дэниел) and one scene (`restaurant`, via Лео) are fully designed in code but **currently unused** — no new characters need inventing.

| Chapter | Scene | NPC | First appears | Grows toward (B2) |
|---|---|---|---|---|
| People & Connections | `meeting` | Алекс (+ Роза as neighbour) | A1 | Disagreeing respectfully, sustained opinion exchange |
| Café & Casual Food | `cafe` | Майя | A1 | Complex complaint, negotiated refund |
| Restaurant & Dining | `restaurant` *(new scene use)* | Лео | A2 | Disputing a bill, organising a group booking |
| Getting Around / Travel | `street` | Роза | A1 | Negotiating compensation, multi-constraint route planning |
| Daily Life & Home | `meeting` (Алекс, established friend) | Алекс | A1 | Discussing lifestyle trade-offs with reasons |
| Shopping & Services | `shop` *(new scene use)* | Эмма | A1 | Disputing contract terms, formal negotiation |
| Work & Study | new scene `office` *(needs one new background asset — implementation detail for later)* | Дэниел | A2 | Giving feedback, disagreeing constructively, negotiating deadlines |
| Social Life & Leisure | `meeting` / `cafe` | Алекс / Майя | A1 | Organising a group event, resolving a scheduling conflict |
| Problems & Solutions | cross-cutting (any NPC) | varies | A1 | Assertive, multi-step negotiation |

**Only one new scene background is implied** (`office`, for Daniel) — every other chapter reuses an already-built scene+NPC pair. This was a deliberate check against scope creep in production (see §F).

---

## 3. The 5 existing A1 situations — placed in the new structure

| ID | Title | Chapter | Comes before | Comes after |
|---|---|---|---|---|
| `les_sie_a1_e1` | Первое знакомство | People & Connections | (course start) | A1.6 (meeting Rosa) |
| `les_sie_a1_e2` | Заказ в кафе | Café & Casual Food | A1.1 | A1.7 (Shopping) |
| `les_sie_a1_e3` | Мой обычный день | Daily Life & Home | A1.2 | A1.9 (Social Life) |
| `les_sie_a1_e4` | Я потерялась в городе | Getting Around | A1.3 | A1.8 (buying a ticket) |
| `les_sie_a1_e5` | Заказ пошёл не по плану | Problems & Solutions | A1.2, A1.4 | A2 chapter openers |

No changes to their content/code — this section only records where they sit in the wider map.

---

## 4. Full situation tables — A1 (10)

### A1.1 — `les_sie_a1_e1` «Первое знакомство» *(existing)*
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Кафе/место встречи, первая встреча с Алексом |
| Capability | «Я могу поздороваться, представиться и спросить имя» |
| Conversation goal | Обменяться именами и базовой информацией |
| NPC | Алекс |
| Turns | ~7 |
| Key phrases | Hello, I'm..., Nice to meet you, Where are you from?, What do you do? |
| Vocabulary | greetings, self-introduction, countries, jobs |
| Grammar | be-verbs (am/is/are) |
| Mission | Представиться и ответить на 3 вопроса о себе |
| Review | — (первая ситуация) |
| Prerequisite | — |
| Source | BC "Starting Out" Ep.1 "They Meet" |
| Source URL | https://learnenglish.britishcouncil.org/general-english/video-series/starting-out |
| Why A1 | CEFR A1: "can introduce themselves... ask and answer simple questions about personal details" (BC A1 can-do) |

### A1.2 — `les_sie_a1_e2` «Заказ в кафе» *(existing)*
| Field | Value |
|---|---|
| Chapter | Café & Casual Food |
| Setting | Кофейня, заказ у Майи |
| Capability | «Я могу заказать напиток, уточнить его и спросить цену» |
| Conversation goal | Сделать простой заказ |
| NPC | Майя |
| Turns | ~7 |
| Key phrases | Can I get..., with milk, to go, How much is it? |
| Vocabulary | drinks, sizes, payment |
| Grammar | can (request) |
| Mission | Заказать напиток с уточнениями |
| Review | greetings (A1.1) |
| Prerequisite | A1.1 |
| Source | Cambridge A2 Key topic list ("Food and Drink") — used as forward-reference for topic validity |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A1 | CEFR A1: single predictable transactional exchange, no negotiation |

### A1.3 — `les_sie_a1_e3` «Мой обычный день» *(existing)*
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Разговор с Алексом о повседневности |
| Capability | «Я могу рассказать, чем занимаюсь и как проходит день» |
| Conversation goal | Описать рутину |
| NPC | Алекс |
| Turns | ~8 |
| Key phrases | work from home, start/finish work, usually, never |
| Vocabulary | daily routine, time, frequency words |
| Grammar | Present Simple (positive), frequency adverbs |
| Mission | Рассказать о своём типичном дне |
| Review | be-verbs (A1.1) |
| Prerequisite | A1.1 |
| Source | ELLLO A1 (routine/daily-basics topics) |
| Source URL | https://elllo.org/levels/A1-English-Lessons/index.html |
| Why A1 | CEFR A1/BC A2-border: kept simple/present-only to stay A1 |

### A1.4 — `les_sie_a1_e4` «Я потерялась в городе» *(existing)*
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Улица, Роза помогает с направлением |
| Capability | «Я могу спросить дорогу и переспросить, если не поняла» |
| Conversation goal | Найти нужное место |
| NPC | Роза |
| Turns | ~7 |
| Key phrases | Excuse me, Where is..., go straight, turn left, I don't understand |
| Vocabulary | directions, places |
| Grammar | there is/are (implicit via Rosa's replies) |
| Mission | Дойти до вокзала по указаниям |
| Review | — |
| Prerequisite | A1.1 |
| Source | Cambridge A2 Key topic list ("shapes, sizes, locations, directions") |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A1 | CEFR A1: "can ask for directions" is a canonical A1 survival function |

### A1.5 — `les_sie_a1_e5` «Заказ пошёл не по плану» *(existing)*
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Кафе, Майя перепутала заказ |
| Capability | «Я могу спокойно объяснить, что заказ перепутали, и попросить заменить» |
| Conversation goal | Исправить простую ошибку |
| NPC | Майя |
| Turns | ~6 |
| Key phrases | I ordered..., but this is..., there's been a mistake, could you change it |
| Vocabulary | order-correction phrases |
| Grammar | Past Simple (single verb: "ordered"), Could you...? (polite request) |
| Mission | Указать на ошибку и попросить исправить |
| Review | café vocabulary (A1.2) |
| Prerequisite | A1.2 |
| Source | BC Speaking skills, A1 tier ("checking understanding") — scaled-down precursor to B2's "problem-resolution" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why A1 | Single, concrete, low-stakes mistake — not yet negotiation (that's B1/B2) |

### A1.6 — `sit_a1_people_02` «Знакомство с соседкой» *(new)*
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Подъезд/двор дома, первая встреча с Розой (до того как она станет "той, кто знает район") |
| Capability | «Я могу коротко познакомиться с соседом» |
| Conversation goal | Представиться, узнать, что Роза — соседка |
| NPC | Роза |
| Turns | ~6 |
| Key phrases | I just moved in, How long have you lived here?, Nice to meet you |
| Vocabulary | neighbour, move in, live |
| Grammar | be-verbs, question formation (recycled) |
| Mission | Представиться Розе и узнать один факт о районе |
| Review | greetings, self-intro (A1.1) |
| Prerequisite | A1.1 |
| Source | BC "Starting Out" Ep.1 (meeting pattern) |
| Source URL | https://learnenglish.britishcouncil.org/general-english/video-series/starting-out |
| Why A1 | Same narrow single-goal exchange as A1.1, new NPC/context only |

### A1.7 — `sit_a1_shop_01` «Покупка в магазине» *(new)*
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Магазин на углу, первая встреча с Эммой |
| Capability | «Я могу купить простую вещь и узнать цену» |
| Conversation goal | Купить один предмет |
| NPC | Эмма |
| Turns | ~6 |
| Key phrases | How much is this?, Do you have..., I'll take it |
| Vocabulary | shop items, prices, sizes/colours |
| Grammar | this/that, can (availability) |
| Mission | Купить предмет, уточнив цену |
| Review | numbers (from placement-level basics) |
| Prerequisite | A1.1 |
| Source | Cambridge A2 Key topic list ("Clothes and Accessories, Colours") |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A1 | CEFR A1: single transactional purchase, predictable script |

### A1.8 — `sit_a1_travel_02` «Покупка билета» *(new)*
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Касса/автомат, Роза подсказывает, куда обратиться |
| Capability | «Я могу купить билет и узнать время» |
| Conversation goal | Купить билет на нужное время |
| NPC | Роза |
| Turns | ~6 |
| Key phrases | One ticket to..., What time does it leave?, How much is it? |
| Vocabulary | tickets, time, transport |
| Grammar | there is/are, question words (recycled) |
| Mission | Купить билет на конкретное время |
| Review | directions (A1.4) |
| Prerequisite | A1.4 |
| Source | Cambridge A2 Key topic list ("prices, numbers, times") |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A1 | Predictable transactional script, same tier as A1.7 |

### A1.9 — `sit_a1_social_01` «Что ты любишь делать?» *(new)*
| Field | Value |
|---|---|
| Chapter | Social Life & Leisure |
| Setting | Разговор с Алексом после нескольких встреч |
| Capability | «Я могу сказать, что мне нравится, и предложить встретиться» |
| Conversation goal | Обменяться интересами, предложить план |
| NPC | Алекс |
| Turns | ~7 |
| Key phrases | I like..., Do you want to...?, How about...? |
| Vocabulary | hobbies, free time |
| Grammar | like + -ing (recycled present simple) |
| Mission | Предложить встречу на основе общего интереса |
| Review | daily routine (A1.3) |
| Prerequisite | A1.3 |
| Source | BC "Starting Out" Ep.3 "What do you like doing?" |
| Source URL | https://learnenglish.britishcouncil.org/general-english/video-series/starting-out |
| Why A1 | CEFR A1: "making suggestions" (BC A1 speaking function) |

### A1.10 — `sit_a1_daily_02` «Где ты живёшь?» *(new)*
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Кафе, Майя спрашивает про жильё в разговоре |
| Capability | «Я могу простыми словами описать, где живу» |
| Conversation goal | Описать жильё в двух-трёх фразах |
| NPC | Майя |
| Turns | ~6 |
| Key phrases | I live in..., There is/are..., near/next to |
| Vocabulary | home, rooms, location words |
| Grammar | there is/are |
| Mission | Описать жильё, ответив на 2 уточняющих вопроса |
| Review | café small talk (A1.2), directions vocabulary (A1.4) |
| Prerequisite | A1.2, A1.4 |
| Source | ELLLO A1 ("home" among core identity topics) |
| Source URL | https://elllo.org/levels/A1-English-Lessons/index.html |
| Why A1 | CEFR A1: simple description of immediate environment |

---

## 5. Full situation tables — A2 (16)

### A2.1 — `sit_a2_people_01` «Рассказать о себе подробнее»
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Алекс расспрашивает подробнее при новой встрече |
| Capability | «Я могу рассказать о работе, семье и увлечениях чуть подробнее» |
| Conversation goal | Дать связный, но простой рассказ о себе |
| NPC | Алекс |
| Turns | ~9 |
| Key phrases | I work as..., I have..., I've lived here for... |
| Vocabulary | family, jobs, duration |
| Grammar | Present Simple (extended), for/since (light intro) |
| Mission | Рассказать о себе в 3-4 связных предложениях |
| Review | A1.1, A1.6 |
| Prerequisite | A1.1, A1.6 |
| Source | BC A2 can-do: "describe aspects of their... environment" |
| Source URL | https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/a2-pre-intermediate |
| Why A2 | CEFR A2: "simple, direct exchange of information on familiar topics" — beyond A1's bare facts |

### A2.2 — `sit_a2_people_02` «Знакомство на вечеринке у Дэниела»
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Неформальная вечеринка, первая встреча с Дэниелом (до рабочих ситуаций) |
| Capability | «Я могу непринуждённо познакомиться в компании» |
| Conversation goal | Познакомиться, поддержать лёгкий разговор |
| NPC | Дэниел |
| Turns | ~8 |
| Key phrases | How do you know...?, What do you do?, Small world! |
| Vocabulary | social small talk |
| Grammar | Present Simple, question tags (light intro) |
| Mission | Поддержать 3 реплики светской беседы |
| Review | self-intro (A1.1) |
| Prerequisite | A1.1 |
| Source | BC "Starting Out" Ep.2 "Tom's Party" |
| Source URL | https://learnenglish.britishcouncil.org/general-english/video-series/starting-out |
| Why A2 | BC A2 function: "showing interest" in conversation |

### A2.3 — `sit_a2_cafe_01` «Изменить заказ»
| Field | Value |
|---|---|
| Chapter | Café & Casual Food |
| Setting | Кофейня, нужно исправить/уточнить заказ на месте |
| Capability | «Я могу изменить или уточнить заказ» |
| Conversation goal | Скорректировать заказ до оплаты |
| NPC | Майя |
| Turns | ~7 |
| Key phrases | Actually, can I change..., instead of, no problem |
| Vocabulary | modifiers, substitutions |
| Grammar | could/would (polite forms, light intro) |
| Mission | Изменить один пункт заказа |
| Review | A1.2 |
| Prerequisite | A1.2 |
| Source | Cambridge A2 Key topic list ("Food and Drink") |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A2 | CEFR A2: simple direct exchange, slightly less predictable than A1 |

### A2.4 — `sit_a2_restaurant_01` «Бронирование столика»
| Field | Value |
|---|---|
| Chapter | Restaurant & Dining |
| Setting | Звонок/визит в ресторан, первая встреча с Лео |
| Capability | «Я могу забронировать столик» |
| Conversation goal | Договориться о времени и количестве гостей |
| NPC | Лео |
| Turns | ~7 |
| Key phrases | I'd like to book a table, for how many?, What time? |
| Vocabulary | booking, numbers, time |
| Grammar | would like (polite request) |
| Mission | Забронировать столик на конкретное время |
| Review | numbers/time (A1.8) |
| Prerequisite | A1.8 |
| Source | Cambridge B1 Preliminary topics ("Food and Drink", "Places: Town and City") — forward reference, level-appropriate simplification |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why A2 | New, slightly more formal register than café — matches A2's step up |

### A2.5 — `sit_a2_restaurant_02` «Заказ с особыми пожеланиями»
| Field | Value |
|---|---|
| Chapter | Restaurant & Dining |
| Setting | За столиком, заказ с уточнениями |
| Capability | «Я могу сделать заказ с уточнением деталей» |
| Conversation goal | Заказать блюдо с изменением состава |
| NPC | Лео |
| Turns | ~8 |
| Key phrases | without onions, is there..., for two, please |
| Vocabulary | food/ingredients, quantities |
| Grammar | without/with, some/any |
| Mission | Сделать заказ с одним уточнением |
| Review | café ordering pattern (A1.2, A2.3) |
| Prerequisite | A2.4 |
| Source | Cambridge B1 Preliminary ("Food and Drink") |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why A2 | Direct exchange with one added layer of specificity |

### A2.6 — `sit_a2_travel_01` «Опоздание, смена планов»
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Роза встречает опоздавшего пользователя |
| Capability | «Я могу объяснить, что опоздал(а), и спросить, что делать» |
| Conversation goal | Объяснить ситуацию, получить совет |
| NPC | Роза |
| Turns | ~8 |
| Key phrases | I'm late because..., What should I do?, missed the bus |
| Vocabulary | delays, transport problems |
| Grammar | Past Simple (reason), should (advice) |
| Mission | Объяснить причину опоздания и спросить совет |
| Review | directions (A1.4, A1.8) |
| Prerequisite | A1.4, A1.8 |
| Source | ELLLO topic-shift signal (logistics emerging by B1, simplified early here as first exposure) |
| Source URL | https://elllo.org/levels/B1-English-Lessons/index.html |
| Why A2 | CEFR A2: Past Simple for recent events, "simple direct exchange" |

### A2.7 — `sit_a2_travel_02` «Уточнить маршрут»
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Улица, менее очевидный маршрут |
| Capability | «Я могу переспросить и уточнить маршрут» |
| Conversation goal | Убедиться, что маршрут понят верно |
| NPC | Роза |
| Turns | ~7 |
| Key phrases | Sorry, did you say...?, So I go..., is that right? |
| Vocabulary | clarification phrases |
| Grammar | reported confirmation ("so you said...") |
| Mission | Повторить маршрут своими словами для подтверждения |
| Review | A1.4 |
| Prerequisite | A1.4 |
| Source | BC Speaking skills, A1→A2 tier ("checking understanding") |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why A2 | Active clarification strategy — step up from A1's passive listening |

### A2.8 — `sit_a2_daily_01` «Рассказать о выходных»
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Алекс спрашивает про прошедшие выходные |
| Capability | «Я могу рассказать, что делал(а) на выходных» |
| Conversation goal | Дать связный рассказ о прошлом событии |
| NPC | Алекс |
| Turns | ~8 |
| Key phrases | I went..., I watched..., it was great |
| Vocabulary | weekend activities |
| Grammar | Past Simple (regular + common irregular verbs) |
| Mission | Рассказать о выходных в 3 предложениях |
| Review | daily routine (A1.3) |
| Prerequisite | A1.3 |
| Source | CEFR A2 can-do: "describe... in terms of... their past" |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why A2 | Past Simple narrative — canonical A2 grammar target |

### A2.9 — `sit_a2_daily_02` «Планы на следующую неделю»
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Разговор с Алексом о будущем |
| Capability | «Я могу рассказать о своих планах» |
| Conversation goal | Поделиться простыми планами |
| NPC | Алекс |
| Turns | ~7 |
| Key phrases | I'm going to..., I'm meeting..., on Friday |
| Vocabulary | future time expressions |
| Grammar | going to, Present Continuous for arrangements |
| Mission | Рассказать о двух планах на неделю |
| Review | A2.8 |
| Prerequisite | A2.8 |
| Source | CEFR A2: "communicate... routine tasks" applied forward to plans |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why A2 | going to/Present Continuous-for-future = standard A2 grammar |

### A2.10 — `sit_a2_shop_01` «Возврат или обмен товара»
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Магазин, товар нужно вернуть/обменять |
| Capability | «Я могу вернуть или обменять покупку» |
| Conversation goal | Объяснить причину и договориться об обмене |
| NPC | Эмма |
| Turns | ~8 |
| Key phrases | I'd like to return/exchange..., it doesn't fit, do you have a bigger size? |
| Vocabulary | returns, sizes, receipts |
| Grammar | Present Perfect (light: "I've bought this") |
| Mission | Вернуть или обменять один товар |
| Review | A1.7 |
| Prerequisite | A1.7 |
| Source | Cambridge A2 Key topic list ("Clothes and Accessories") |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A2 | Simple everyday task requiring direct information exchange |

### A2.11 — `sit_a2_shop_02` «Спросить про скидку»
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Магазин, интересует акция |
| Capability | «Я могу спросить об условиях скидки» |
| Conversation goal | Узнать цену/условия акции |
| NPC | Эмма |
| Turns | ~6 |
| Key phrases | Is this on sale?, How much do I save?, until when? |
| Vocabulary | discounts, offers |
| Grammar | comparatives (cheaper, better) — light intro |
| Mission | Уточнить условия скидки |
| Review | A1.7 |
| Prerequisite | A1.7 |
| Source | Cambridge A2 Key topic list |
| Source URL | https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf |
| Why A2 | Direct info exchange, one added comparative layer |

### A2.12 — `sit_a2_work_01` «Чем ты занимаешься подробнее»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Первая рабочая ситуация — знакомство с Дэниелом на этой почве |
| Capability | «Я могу рассказать о своей работе/учёбе чуть подробнее» |
| Conversation goal | Описать роль и обязанности просто |
| NPC | Дэниел |
| Turns | ~8 |
| Key phrases | I'm responsible for..., I usually..., it's interesting because |
| Vocabulary | job duties, workplace |
| Grammar | Present Simple + frequency (recycled) |
| Mission | Описать работу в 3 предложениях |
| Review | A2.1 |
| Prerequisite | A2.1, A2.2 |
| Source | BC A2 function: "talking about... employment" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why A2 | BC explicitly places "employment" talk at A2 |

### A2.13 — `sit_a2_work_02` «Попросить о помощи с задачей»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Разговор с коллегой Дэниелом о простой задаче |
| Capability | «Я могу попросить о помощи и объяснить простую задачу» |
| Conversation goal | Договориться о помощи |
| NPC | Дэниел |
| Turns | ~8 |
| Key phrases | Could you help me with...?, I need to..., by when? |
| Vocabulary | tasks, deadlines (simple) |
| Grammar | Could you...? (recycled from A1.5), need to |
| Mission | Попросить о конкретной помощи |
| Review | Could you...? (A1.5) |
| Prerequisite | A2.12 |
| Source | BC A2 function set (employment-adjacent) |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why A2 | Still direct/transactional, workplace register kept simple |

### A2.14 — `sit_a2_social_01` «Пригласить и изменить планы»
| Field | Value |
|---|---|
| Chapter | Social Life & Leisure |
| Setting | Алекс и пользователь договариваются, потом меняют план |
| Capability | «Я могу пригласить и, если нужно, перенести встречу» |
| Conversation goal | Договориться, затем скорректировать план |
| NPC | Алекс |
| Turns | ~9 |
| Key phrases | Are you free on...?, Can we change it to...?, that works |
| Vocabulary | scheduling |
| Grammar | going to, could we... instead |
| Mission | Пригласить и перенести встречу один раз |
| Review | A1.9 |
| Prerequisite | A1.9, A2.9 |
| Source | CEFR A2: "simple, direct exchange" applied to arrangements |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why A2 | Two-step negotiation (invite + change) beyond A1's single suggestion |

### A2.15 — `sit_a2_problems_01` «Потерял(а) вещь»
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Улица/дом, Роза помогает разобраться |
| Capability | «Я могу объяснить проблему и попросить помощи» |
| Conversation goal | Описать проблему и получить помощь |
| NPC | Роза |
| Turns | ~8 |
| Key phrases | I've lost my..., have you seen...?, I think I left it at |
| Vocabulary | lost items, locations |
| Grammar | Present Perfect ("I've lost"), Past Simple (recall) |
| Mission | Описать потерю и последнее известное место |
| Review | directions vocabulary (A1.4) |
| Prerequisite | A1.4 |
| Source | ELLLO topic-shift (logistics/problem topics emerging) |
| Source URL | https://elllo.org/levels/B1-English-Lessons/index.html |
| Why A2 | Present Perfect for recent-relevant-past = A2/B1 boundary grammar, kept simple |

### A2.16 — `sit_a2_problems_02` «Ошибка в счёте»
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Ресторан, в счёте ошибка |
| Capability | «Я могу указать на ошибку в счёте» |
| Conversation goal | Исправить ошибку в оплате |
| NPC | Лео |
| Turns | ~7 |
| Key phrases | I think there's a mistake, I didn't order..., could you check? |
| Vocabulary | bill, payment |
| Grammar | Past Simple (didn't order), could you check |
| Mission | Указать на конкретную ошибку в счёте |
| Review | A1.5 (mistake-correction pattern), A2.4/A2.5 |
| Prerequisite | A1.5, A2.4 |
| Source | Same functional family as A1.5, one register step up (restaurant vs café) |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why A2 | CEFR A2: direct exchange to resolve a concrete factual error |

---

## 6. Full situation tables — B1 (18)

### B1.1 — `sit_b1_people_01` «Обсудить новости с Алексом»
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Алекс делится новостью, пользователь реагирует |
| Capability | «Я могу отреагировать на новость и выразить мнение» |
| Conversation goal | Поддержать разговор о новости |
| NPC | Алекс |
| Turns | ~9 |
| Key phrases | Did you hear...?, That's great/terrible, I think... |
| Vocabulary | reactions, opinion markers |
| Grammar | Present Perfect (news), I think/I believe |
| Mission | Отреагировать и высказать короткое мнение |
| Review | A2.1 |
| Prerequisite | A2.1 |
| Source | BC B1 function: "responding to news" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B1 | BC explicitly places "responding to news" at B1 |

### B1.2 — `sit_b1_people_02` «Не согласиться вежливо»
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Алекс и пользователь по-разному смотрят на что-то простое |
| Capability | «Я могу вежливо не согласиться с другом» |
| Conversation goal | Выразить несогласие, сохранив тон |
| NPC | Алекс |
| Turns | ~9 |
| Key phrases | I see what you mean, but..., I'm not sure I agree |
| Vocabulary | disagreement softeners |
| Grammar | I don't think..., modal softeners (might, could) |
| Mission | Не согласиться, объяснив причину |
| Review | B1.1 |
| Prerequisite | B1.1 |
| Source | CEFR B1: "explain opinions" |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B1 | Early, low-stakes version of B2's full disagreement function |

### B1.3 — `sit_b1_cafe_01` «Порекомендовать и обсудить выбор»
| Field | Value |
|---|---|
| Chapter | Café & Casual Food |
| Setting | Майя знает пользователя как постоянного клиента |
| Capability | «Я могу обсудить и порекомендовать выбор» |
| Conversation goal | Обсудить варианты, дать рекомендацию |
| NPC | Майя |
| Turns | ~8 |
| Key phrases | What do you recommend?, If I were you..., it depends on |
| Vocabulary | preferences, recommendations |
| Grammar | conditionals (light: if I were you) |
| Mission | Дать и обосновать рекомендацию |
| Review | café vocabulary (A1.2, A2.3) |
| Prerequisite | A2.3 |
| Source | Cambridge B1 Preliminary ("Food and Drink", "Personal Feelings, Opinions") |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why B1 | Opinion + light conditional = B1 territory |

### B1.4 — `sit_b1_restaurant_01` «Особые диетические потребности»
| Field | Value |
|---|---|
| Chapter | Restaurant & Dining |
| Setting | За столиком, нужно подробно объяснить непереносимость |
| Capability | «Я могу подробно объяснить диетические ограничения» |
| Conversation goal | Убедиться, что блюдо подходит |
| NPC | Лео |
| Turns | ~9 |
| Key phrases | I'm allergic to..., does it contain...?, could you make sure |
| Vocabulary | allergies, ingredients |
| Grammar | Present Simple (facts), could you make sure that... |
| Mission | Объяснить ограничение и получить подтверждение |
| Review | A2.5 |
| Prerequisite | A2.5 |
| Source | Cambridge B1 Preliminary ("Health, Medicine and Exercise", "Food and Drink") |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why B1 | More precise, consequence-aware exchange than A2's simple modification |

### B1.5 — `sit_b1_restaurant_02` «Серьёзная жалоба на обслуживание»
| Field | Value |
|---|---|
| Chapter | Restaurant & Dining |
| Setting | Обслуживание было плохим, нужно пожаловаться |
| Capability | «Я могу пожаловаться на сервис и попросить решение» |
| Conversation goal | Добиться конкретного решения проблемы |
| NPC | Лео |
| Turns | ~10 |
| Key phrases | I'm not happy with..., this isn't what I expected, what can you do about it? |
| Vocabulary | complaint language |
| Grammar | Present Perfect (I've been waiting), should have |
| Mission | Сформулировать жалобу и получить решение |
| Review | A2.16 |
| Prerequisite | A2.16, B1.4 |
| Source | ALTE Level 2: "deal in a general way with non-routine information" |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B1 | Non-routine, multi-turn problem-solving — canonical B1 |

### B1.6 — `sit_b1_travel_01` «Проблема в поездке»
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Задержка/отмена транспорта, Роза помогает сориентироваться |
| Capability | «Я могу объяснить сложную ситуацию в поездке» |
| Conversation goal | Понять ситуацию и решить, что делать дальше |
| NPC | Роза |
| Turns | ~9 |
| Key phrases | My train's been cancelled, what are my options?, is there another way |
| Vocabulary | delays, alternatives |
| Grammar | Present Perfect Passive (has been cancelled) — light exposure |
| Mission | Изложить ситуацию и выбрать альтернативу |
| Review | A2.6 |
| Prerequisite | A2.6 |
| Source | ALTE "social & tourist" context axis; CEFR B1 "deal with most situations while travelling" |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B1 | CEFR B1's own headline example is literally "travelling" situations |

### B1.7 — `sit_b1_travel_02` «Спросить совет о маршруте на день»
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Планирование дня с помощью Розы |
| Capability | «Я могу спросить рекомендацию и уточнить детали» |
| Conversation goal | Составить план на основе совета |
| NPC | Роза |
| Turns | ~8 |
| Key phrases | What would you suggest?, is it worth...?, how long does it take |
| Vocabulary | recommendations, duration |
| Grammar | worth + -ing, comparatives |
| Mission | Составить простой план дня на основе совета |
| Review | B1.6 |
| Prerequisite | B1.6 |
| Source | Cambridge B1 Preliminary ("Places: Town and City", "Travel and Transport") |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why B1 | Evaluating options with reasons — B1-level reasoning |

### B1.8 — `sit_b1_daily_01` «Рассказать историю из жизни»
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Алекс просит рассказать о каком-то опыте |
| Capability | «Я могу рассказать связную историю о своём опыте» |
| Conversation goal | Рассказать историю с началом, серединой, концом |
| NPC | Алекс |
| Turns | ~10 |
| Key phrases | Have you ever...?, it happened when..., I'll never forget |
| Vocabulary | experience, storytelling connectors |
| Grammar | Present Perfect (experience) + Past Simple (narrative) |
| Mission | Рассказать связную историю в 4-5 предложениях |
| Review | A2.8 |
| Prerequisite | A2.8 |
| Source | CEFR B1: "describe experiences and events" |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B1 | Present Perfect (experience) + sustained narrative = canonical B1 grammar target |

### B1.9 — `sit_b1_daily_02` «Обсудить изменение в жизни»
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Разговор о переезде/смене привычек |
| Capability | «Я могу обсудить изменение в жизни и его причины» |
| Conversation goal | Объяснить, что изменилось и почему |
| NPC | Алекс |
| Turns | ~9 |
| Key phrases | I used to..., but now..., the reason is |
| Vocabulary | change, habits |
| Grammar | used to (past habit) |
| Mission | Сравнить "раньше" и "сейчас" |
| Review | B1.8 |
| Prerequisite | B1.8 |
| Source | ELLLO B1 ("Life in the 80s" — past-vs-now framing) |
| Source URL | https://elllo.org/levels/B1-English-Lessons/index.html |
| Why B1 | used to = flagship B1 grammar, directly evidenced in ELLLO's own B1 set |

### B1.10 — `sit_b1_shop_01` «Проблема с подпиской/счётом»
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Магазин/сервис, проблема со счётом за услугу |
| Capability | «Я могу решить вопрос со счётом или подпиской» |
| Conversation goal | Разобраться в проблеме за несколько шагов |
| NPC | Эмма |
| Turns | ~10 |
| Key phrases | I was charged twice, can you look into this?, I'd like this fixed |
| Vocabulary | billing, subscriptions |
| Grammar | Passive (I was charged), Present Perfect |
| Mission | Описать проблему со счётом и добиться решения |
| Review | A2.10 |
| Prerequisite | A2.10 |
| Source | Cambridge B1 Preliminary ("Services") |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why B1 | Multi-step, non-routine service issue |

### B1.11 — `sit_b1_shop_02` «Сравнить варианты перед покупкой»
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Магазин, выбор между двумя товарами |
| Capability | «Я могу сравнить варианты и объяснить свой выбор» |
| Conversation goal | Сделать выбор с обоснованием |
| NPC | Эмма |
| Turns | ~8 |
| Key phrases | this one is better because, compared to, I'd rather |
| Vocabulary | comparison language |
| Grammar | comparatives/superlatives, would rather |
| Mission | Сравнить два варианта и выбрать |
| Review | A2.11 |
| Prerequisite | A2.11 |
| Source | Cambridge B1 Preliminary topic breadth (general) |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why B1 | Reasoned comparison, not just a fact-request |

### B1.12 — `sit_b1_work_01` «Объяснить задачу коллеге»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Встреча с Дэниелом, нужно объяснить задачу и сроки |
| Capability | «Я могу объяснить рабочую задачу и её сроки» |
| Conversation goal | Передать задачу понятно |
| NPC | Дэниел |
| Turns | ~9 |
| Key phrases | What I need is..., by the end of..., does that make sense? |
| Vocabulary | tasks, deadlines, project language |
| Grammar | need + noun/infinitive, future forms |
| Mission | Объяснить задачу и срок |
| Review | A2.13 |
| Prerequisite | A2.13 |
| Source | BC B1 function: "face-to-face meetings" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B1 | BC explicitly places structured meetings at B1 |

### B1.13 — `sit_b1_work_02` «Попросить об услуге на работе»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Разговор с Дэниелом, нужна услуга/одолжение |
| Capability | «Я могу вежливо попросить об одолжении» |
| Conversation goal | Получить согласие на просьбу |
| NPC | Дэниел |
| Turns | ~8 |
| Key phrases | Would you mind...?, I'd really appreciate it, only if it's not too much trouble |
| Vocabulary | favours, politeness markers |
| Grammar | Would you mind + -ing |
| Mission | Попросить об одолжении вежливо |
| Review | Could you...? family (A1.5, A2.13) |
| Prerequisite | B1.12 |
| Source | BC B1 function: "requesting favours" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B1 | BC explicitly places "requesting favours" at B1 |

### B1.14 — `sit_b1_work_03` «Простое собеседование»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Дэниел выступает в роли интервьюера на новую позицию внутри компании |
| Capability | «Я могу рассказать о своём опыте на простом собеседовании» |
| Conversation goal | Ответить на типовые вопросы собеседования |
| NPC | Дэниел |
| Turns | ~10 |
| Key phrases | Tell me about..., my strength is..., I'm interested in this role because |
| Vocabulary | skills, experience, strengths |
| Grammar | Present Perfect (experience), because-clauses |
| Mission | Ответить на 3 типовых вопроса собеседования |
| Review | B1.8 (experience), A2.12 |
| Prerequisite | B1.8, A2.12 |
| Source | ALTE Level 2 "work" context axis |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B1 | ALTE explicitly names "work" as one of four B1-appropriate contexts |

### B1.15 — `sit_b1_social_01` «Организовать групповую встречу»
| Field | Value |
|---|---|
| Chapter | Social Life & Leisure |
| Setting | Алекс и пользователь организуют встречу для нескольких друзей |
| Capability | «Я могу организовать встречу для группы» |
| Conversation goal | Согласовать время, место, участников |
| NPC | Алекс |
| Turns | ~9 |
| Key phrases | Let's find a time that works for everyone, what if we..., I'll check with |
| Vocabulary | group coordination |
| Grammar | conditionals (what if), future forms |
| Mission | Согласовать детали групповой встречи |
| Review | A2.14 |
| Prerequisite | A2.14 |
| Source | CEFR B1: "make arrangements" |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B1 | Multi-party coordination beyond A2's two-person plan |

### B1.16 — `sit_b1_social_02` «Вежливо отказаться»
| Field | Value |
|---|---|
| Chapter | Social Life & Leisure |
| Setting | Приглашение, которое нужно вежливо отклонить |
| Capability | «Я могу вежливо отказаться, предложив альтернативу» |
| Conversation goal | Отказаться, не испортив отношения |
| NPC | Алекс |
| Turns | ~8 |
| Key phrases | I'd love to, but..., how about instead?, maybe another time |
| Vocabulary | polite refusal |
| Grammar | would love to (but), instead of |
| Mission | Отказаться и предложить альтернативу |
| Review | B1.15 |
| Prerequisite | B1.15 |
| Source | CEFR B1: social interaction nuance |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B1 | Softened refusal = relational speech, B1-appropriate |

### B1.17 — `sit_b1_problems_01` «Решить проблему через несколько шагов»
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Звонок в сервис (через контекст Эммы/Дэниела) по многошаговой проблеме |
| Capability | «Я могу решить проблему за несколько шагов» |
| Conversation goal | Пройти через уточнение → варианты → решение |
| NPC | Эмма |
| Turns | ~10 |
| Key phrases | Let me explain from the start, so what you're saying is, that should work |
| Vocabulary | step-by-step problem-solving |
| Grammar | sequencing language (first, then, so), reported confirmation |
| Mission | Провести проблему от описания до решения |
| Review | B1.10 |
| Prerequisite | B1.10 |
| Source | ALTE Level 2: "non-routine information" |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B1 | Multi-step process management — core B1 skill |

### B1.18 — `sit_b1_problems_02` «Вежливо, но настойчиво добиться решения»
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Лео/Эмма не сразу соглашаются на решение проблемы |
| Capability | «Я могу вежливо, но настойчиво добиться решения» |
| Conversation goal | Не отступить, оставаясь вежливым |
| NPC | Лео |
| Turns | ~9 |
| Key phrases | I understand, but I still..., could we find another way?, I'd really like this resolved |
| Vocabulary | persistence markers |
| Grammar | I understand, but..., concessive clauses (light) |
| Mission | Настоять на решении вежливо |
| Review | B1.5, B1.17 |
| Prerequisite | B1.5, B1.17 |
| Source | ALTE Level 2 → bridges toward Level 3's negotiation |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B1 | Final B1 step before B2's full negotiation/disagreement chapter |

---

## 7. Full situation tables — B2 (14)

### B2.1 — `sit_b2_people_01` «Обсудить спорную тему с другом»
| Field | Value |
|---|---|
| Chapter | People & Connections |
| Setting | Алекс и пользователь — давние знакомые, обсуждают тему, где мнения расходятся |
| Capability | «Я могу аргументированно обсудить тему, по которой мы не согласны» |
| Conversation goal | Обменяться и защитить точки зрения |
| NPC | Алекс |
| Turns | ~11 |
| Key phrases | I see your point, but..., on the other hand, what makes you say that? |
| Vocabulary | argumentation connectors |
| Grammar | mixed conditionals, concession clauses (although, even though) |
| Mission | Представить и защитить свою точку зрения |
| Review | B1.2 |
| Prerequisite | B1.2 |
| Source | BC B2 function: "contesting viewpoints" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | BC explicitly places "contesting viewpoints" at B2 |

### B2.2 — `sit_b2_restaurant_01` «Организовать сложный групповой заказ»
| Field | Value |
|---|---|
| Chapter | Restaurant & Dining |
| Setting | Большая компания, у всех разные пожелания |
| Capability | «Я могу организовать сложный заказ для группы с разными пожеланиями» |
| Conversation goal | Согласовать заказ для всех |
| NPC | Лео |
| Turns | ~11 |
| Key phrases | Let's see, who's having..., can we split the bill, to summarise |
| Vocabulary | group logistics, bill-splitting |
| Grammar | reported speech (she said she wants...), summarising language |
| Mission | Собрать и подтвердить сложный групповой заказ |
| Review | B1.4, B1.5 |
| Prerequisite | B1.4, B1.5 |
| Source | ALTE Level 3: "achieve most goals... range of topics" |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B2 | Coordinating multiple viewpoints at once = B2 complexity |

### B2.3 — `sit_b2_restaurant_02` «Оспорить счёт и добиться компенсации»
| Field | Value |
|---|---|
| Chapter | Restaurant & Dining |
| Setting | Серьёзная ошибка в счёте после плохого опыта |
| Capability | «Я могу оспорить счёт и договориться о компенсации» |
| Conversation goal | Добиться конкретной компенсации |
| NPC | Лео |
| Turns | ~10 |
| Key phrases | I don't think it's fair that..., what I'd expect is, could we agree on |
| Vocabulary | negotiation, fairness language |
| Grammar | I don't think it's fair that, would expect |
| Mission | Договориться о конкретной компенсации |
| Review | B1.5, B1.18 |
| Prerequisite | B1.5, B1.18 |
| Source | BC B2 function: "problem-resolution" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | BC explicitly places "problem-resolution" at B2 |

### B2.4 — `sit_b2_travel_01` «Переговоры о компенсации за поездку»
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Серьёзный сбой в поездке, нужна компенсация |
| Capability | «Я могу договориться о компенсации за сорванную поездку» |
| Conversation goal | Добиться справедливого решения |
| NPC | Роза (в контексте помощи с сервисом) |
| Turns | ~10 |
| Key phrases | Given the circumstances, I'd expect, is there any flexibility on |
| Vocabulary | negotiation, formal complaint |
| Grammar | given that, conditionals (would expect) |
| Mission | Договориться о компенсации |
| Review | B1.6 |
| Prerequisite | B1.6 |
| Source | ALTE Level 3 "social & tourist" complexity |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B2 | Formal negotiation over a serious travel disruption |

### B2.5 — `sit_b2_travel_02` «Сложный маршрут с ограничениями»
| Field | Value |
|---|---|
| Chapter | Getting Around / Travel |
| Setting | Планирование маршрута с несколькими условиями (время, бюджет, погода) |
| Capability | «Я могу спланировать маршрут с учётом нескольких ограничений» |
| Conversation goal | Найти решение, удовлетворяющее всем условиям |
| NPC | Роза |
| Turns | ~9 |
| Key phrases | Taking into account, the downside is, it might be worth |
| Vocabulary | trade-off language |
| Grammar | taking into account, might/could for possibility |
| Mission | Предложить маршрут с учётом всех условий |
| Review | B1.7 |
| Prerequisite | B1.7 |
| Source | ALTE Level 3: "achieve most goals... range of topics" |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B2 | Multi-constraint reasoning, nuanced trade-offs |

### B2.6 — `sit_b2_daily_01` «Плюсы и минусы образа жизни»
| Field | Value |
|---|---|
| Chapter | Daily Life & Home |
| Setting | Разговор с Алексом об осознанном выборе образа жизни |
| Capability | «Я могу обсудить плюсы и минусы с аргументами» |
| Conversation goal | Взвешенно обсудить выбор |
| NPC | Алекс |
| Turns | ~10 |
| Key phrases | The advantage is..., however, the downside is, it really depends on |
| Vocabulary | pros/cons connectors |
| Grammar | however/nevertheless, it depends on whether |
| Mission | Представить сбалансированный взгляд с плюсами и минусами |
| Review | B1.9 |
| Prerequisite | B1.9 |
| Source | CEFR B2: "explain a viewpoint... advantages and disadvantages" |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B2 | This is CEFR's own literal B2 example function |

### B2.7 — `sit_b2_shop_01` «Оспорить условия услуги»
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Проблема с условиями контракта/подписки |
| Capability | «Я могу оспорить условия услуги и договориться» |
| Conversation goal | Изменить или расторгнуть невыгодные условия |
| NPC | Эмма |
| Turns | ~10 |
| Key phrases | This wasn't made clear to me, I'd like to renegotiate, what are my options here? |
| Vocabulary | contracts, terms |
| Grammar | Passive (wasn't made clear), conditionals |
| Mission | Договориться об изменении условий |
| Review | B1.10 |
| Prerequisite | B1.10 |
| Source | BC B2 functions (advice/problem-resolution) applied to services |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | Formal negotiation over abstract terms, not a concrete item |

### B2.8 — `sit_b2_work_01` «Высказать мнение на рабочей встрече»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Рабочая встреча с Дэниелом и коллегами |
| Capability | «Я могу высказать и обосновать мнение на встрече» |
| Conversation goal | Внести и защитить предложение |
| NPC | Дэниел |
| Turns | ~10 |
| Key phrases | From my perspective, I'd like to propose, the reason I think this is |
| Vocabulary | meeting language |
| Grammar | I'd like to propose, from my perspective |
| Mission | Внести предложение с обоснованием |
| Review | B1.12 |
| Prerequisite | B1.12 |
| Source | BC B2 function: "offering advice" (adapted to meeting context) |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | Structured opinion-giving in a formal setting |

### B2.9 — `sit_b2_work_02` «Конструктивно не согласиться с коллегой»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Дэниел и пользователь расходятся во мнении по рабочему вопросу |
| Capability | «Я могу конструктивно не согласиться на работе» |
| Conversation goal | Не согласиться, сохранив рабочие отношения |
| NPC | Дэниел |
| Turns | ~10 |
| Key phrases | I see it differently, would it help if, let's find a middle ground |
| Vocabulary | constructive disagreement |
| Grammar | would it help if, let's + base verb |
| Mission | Не согласиться конструктивно и предложить компромисс |
| Review | B2.8 |
| Prerequisite | B2.8 |
| Source | BC B2 function: "disagreeing" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | BC explicitly places "disagreeing" at B2 |

### B2.10 — `sit_b2_work_03` «Договориться о новом дедлайне»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Срок сдачи задачи нужно пересмотреть |
| Capability | «Я могу договориться об изменении сроков» |
| Conversation goal | Получить новый, реалистичный срок |
| NPC | Дэниел |
| Turns | ~9 |
| Key phrases | Realistically, I'd need, would it be possible to push this to, I don't want to overpromise |
| Vocabulary | deadlines, realistic estimates |
| Grammar | would it be possible to, realistically |
| Mission | Договориться о новом сроке |
| Review | B1.12 |
| Prerequisite | B1.12, B2.9 |
| Source | ALTE Level 3 "work" context |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B2 | Negotiation with justification, not just a request |

### B2.11 — `sit_b2_work_04` «Дать сложную обратную связь»
| Field | Value |
|---|---|
| Chapter | Work & Study |
| Setting | Нужно тактично указать на проблему в работе коллеги |
| Capability | «Я могу тактично дать сложную обратную связь» |
| Conversation goal | Указать на проблему конструктивно |
| NPC | Дэниел |
| Turns | ~9 |
| Key phrases | One thing I'd suggest is, it might be worth considering, overall though |
| Vocabulary | feedback softeners |
| Grammar | it might be worth + -ing, one thing I'd suggest |
| Mission | Дать обратную связь тактично, начав и закончив на позитиве |
| Review | B2.9 |
| Prerequisite | B2.9 |
| Source | BC B2 function: "offering advice" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | Nuanced, face-saving communication — hallmark B2 skill |

### B2.12 — `sit_b2_social_01` «Уладить недопонимание с другом»
| Field | Value |
|---|---|
| Chapter | Social Life & Leisure |
| Setting | Между пользователем и Алексом возникло недопонимание |
| Capability | «Я могу уладить недопонимание с другом» |
| Conversation goal | Прояснить ситуацию и восстановить отношения |
| NPC | Алекс |
| Turns | ~10 |
| Key phrases | I think there's been a misunderstanding, what I meant was, I didn't mean to |
| Vocabulary | misunderstanding, clarification |
| Grammar | what I meant was, I didn't mean to + infinitive |
| Mission | Прояснить недопонимание и восстановить контакт |
| Review | B1.16 |
| Prerequisite | B1.16 |
| Source | CEFR B2: fluent, spontaneous interaction with native-like repair |
| Source URL | https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages |
| Why B2 | Emotional/relational nuance beyond B1's simple polite refusal |

### B2.13 — `sit_b2_problems_01` «Сложные переговоры о возврате денег»
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Спор о возврате денег за услугу/товар |
| Capability | «Я могу провести сложные переговоры о возврате» |
| Conversation goal | Добиться справедливого решения через переговоры |
| NPC | Эмма |
| Turns | ~11 |
| Key phrases | Let's see if we can find a solution that works for both of us, I'm willing to, in that case |
| Vocabulary | negotiation, compromise |
| Grammar | I'm willing to, a solution that works for both |
| Mission | Договориться о взаимоприемлемом решении |
| Review | B1.17, B2.3 |
| Prerequisite | B1.17, B2.3 |
| Source | ALTE Level 3: "achieve most goals" |
| Source URL | http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf |
| Why B2 | Full two-sided negotiation, not one-sided complaint |

### B2.14 — `sit_b2_problems_02` «Отстоять свою позицию в споре»
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Финальная ситуация курса — собеседник настаивает на своём, нужно отстоять позицию |
| Capability | «Я могу отстоять свою позицию в споре, оставаясь вежливым» |
| Conversation goal | Не уступить в главном, сохранив уважительный тон |
| NPC | Лео |
| Turns | ~11 |
| Key phrases | I hear you, but I have to insist, with respect, I still believe, let's agree to disagree if needed |
| Vocabulary | assertiveness, respectful firmness |
| Grammar | I have to insist, with respect, let's agree to disagree |
| Mission | Отстоять позицию до разумного разрешения ситуации |
| Review | B1.18, B2.9, B2.13 |
| Prerequisite | B1.18, B2.9 |
| Source | BC B2 functions (disagreeing + problem-resolution combined) — capstone situation |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | Combines every B2 function (BC's own list) into one capstone exchange |

---

## 8. Progression logic — the explicit complexity ladder

| Level | What's new | What's recycled |
|---|---|---|
| **A1** | Short, predictable exchanges. Basic requests. Introducing yourself. Buying/ordering. Asking simple information. | — (foundation) |
| **A2** | Longer everyday tasks. Past/future reference. Changing plans. Explaining a simple problem. Comparing. Making arrangements. | A1 greetings, café/shop patterns, direction-asking |
| **B1** | Sustaining a conversation. Telling a story/experience. Expressing opinion. Explaining reasons. Solving problems. Phone/work/services. | A2 past narrative, polite requests, A1 core vocabulary |
| **B2** | Argumentation. Persuasion. Disagreement. Negotiation. Nuanced opinion. Complex work/social situations. | B1 opinion language, negotiation openers, all prior chapters' NPCs and settings |

**Grammar emerges from situation, never the reverse** — concretely, per the existing 5 A1 situations and this plan's extensions:

- *"I want to explain what happened over the weekend"* → Past Simple (A2.8), not "Past Simple lesson."
- *"I want to tell Alex about something I've done in my life"* → Present Perfect (B1.8), not "Present Perfect lesson."
- *"I want to arrange to meet someone next week"* → going to / Present Continuous for arrangements (A2.9), not "future forms lesson."
- *"I need to convince a colleague my deadline is unrealistic"* → conditionals + hedging language (B2.10), not "conditionals lesson."

Every grammar target above is attached to the situation that motivates it in the tables in §4–§7 — there is no separate grammar-only track.

---

## 9. Conversation-first structural rule (mandatory for every future situation)

Directly extending the fix already shipped for the 5 existing A1 situations (`3f38062`, see `A1_FULL_LEARNING_QA.md`):

1. **NPC opener → learner reply → authored NPC continuation → ...** — every situation is designed turn-by-turn before any grammar/vocabulary is attached to it, exactly like the e1–e5 dialogue flows already built.
2. **No role mismatch.** A phrase that's naturally NPC-voiced (e.g. "Anything else?", "No problem") is never assigned as something the learner must produce — it stays in the NPC's own authored line. This was an explicit, real bug found and fixed in the existing 5 situations (`itm_sie_anything_else`, `itm_sie_no_problem`) — the same check applies to all 58 new situations during production.
3. **No repeated information.** A situation never asks the learner to re-state something already established earlier in the same scene (the exact bug found and removed from e1/e3 — "What's your name?" after names were already exchanged; "I usually start at nine" duplicating "I start work at nine").
4. **No dialogue existing only for a grammar target.** Every learner line must be something a real person would plausibly say in that exact moment of that exact scene — the grammar target is discovered by what the scene needs, not inserted afterward.

---

## 10. Cast

No new characters are needed — `apps/web/src/brand/cast.tsx` already defines six, three of which (Эмма, Дэниел, Лео) are fully designed but currently unused in any live situation:

| Cast | Role (as already defined in code) | Chapter(s) |
|---|---|---|
| Алекс | новый знакомый, потом друг | People & Connections, Daily Life & Home, Social Life & Leisure |
| Майя | бариста в кофейне у дома | Café & Casual Food, occasional Daily Life |
| Роза | соседка, знает весь район | Getting Around / Travel, one People & Connections situation |
| Эмма | продавщица в магазине на углу | Shopping & Services |
| Дэниел | коллега по работе | Work & Study |
| Лео | официант в ресторане | Restaurant & Dining, capstone Problems & Solutions |

One new scene background is implied (`office`, for Дэниел's Work & Study chapter) — everything else reuses scenes (`meeting`, `cafe`, `street`, `shop`, `restaurant`) already defined in `apps/web/src/brand/situationScenes.ts`.

---

## 11. Review design

Every situation table above has an explicit **Review** field naming exactly what returns and why it's natural in that scene (never a random unrelated phrase) — e.g. B1.14's interview situation reviews B1.8's "talking about experience" pattern because a real interview naturally calls for exactly that skill. The **Prerequisite** field is the dependency graph: a situation is only reachable once its prerequisites are complete, which is also what makes the review natural (the learner has always just done the thing being reviewed, recently, in a related context).

---

## A. Overall statistics

| Metric | Value |
|---|---|
| Chapters | 9 |
| A1 situations | 10 (5 existing + 5 new) |
| A2 situations | 16 |
| B1 situations | 18 |
| B2 situations | 14 |
| **Total situations** | **58** |
| Approx. dialogue turns/situation | 6–11 (grows with level) |
| Approx. learner hours (at ~6 min/situation incl. mission, per existing product's own estimate in `sie-a1-lessons.json`'s `estimatedMinutes`) | **~6 hours** core path (58 × ~6 min) + review/spaced-repetition time on top, realistically **15–25 hours** total A1→B2 with review included |

## B. Coverage map — CEFR conversational capabilities

**Covered well:** introductions/social bonding, transactional service exchanges (café/restaurant/shop), directions/travel, daily-routine narration, opinion-giving, complaint/problem-resolution, workplace communication, negotiation/disagreement.

**Gaps, honestly flagged:**
- **Health & medical** situations (describing symptoms, pharmacy, doctor's visit) — present only tangentially (B1.4's allergy mention). A full "Health" chapter is a reasonable future addition, not included here to avoid a 10th chapter without clear A1-level content to anchor it (CEFR A1 rarely covers medical self-advocacy).
- **Phone-only interaction** (no visual/scene cues) is implied (B1.17) but not structurally distinct from in-person situations — worth a dedicated design pass later if the product wants audio-only phone-call scenes.
- **Formal writing-adjacent speech** (e.g. reading a form aloud, giving an address in detail) is only lightly touched (A1.10).

## C. Grammar progression (situation-first, not syllabus-first)

- **A1**: be-verbs, can (ability/requests), Present Simple (positive), frequency adverbs, there is/are, Could you...? (recycled surface form).
- **A2**: Present Simple extended, Past Simple (regular + common irregular), going to / Present Continuous for arrangements, comparatives, light Present Perfect exposure.
- **B1**: Present Perfect (experience, recent relevance), used to, Passive (light), conditionals (light: if I were you), reported confirmation, sequencing/connective language.
- **B2**: mixed/full conditionals, concession clauses (although/even though), Passive (extended), hedging/softening language, negotiation-specific structures (would it be possible to, I'm willing to, let's agree to disagree).

## D. Vocabulary domains

Personal identity & relationships · food & drink (café + restaurant registers) · directions & transport · daily routine & home · shopping & money · work & workplace tasks · leisure & social planning · problems, complaints & negotiation · (light) health/allergies as a B1 cross-reference.

## E. Risk / redundancy audit

- **Closest pair, checked and cleared**: A1.2 (café order) vs A2.3 (change a café order) — same NPC/scene, but A2.3 requires an unprompted correction mid-transaction, a genuinely different (harder) skill, not a repeat. Kept both.
- **Closest pair, checked and cleared**: A1.5 vs A2.16 vs B1.5 (mistake → complaint → serious complaint) — this is an intentional, explicit complexity ladder (same underlying function, three depths), not redundancy. Documented as such in each table's "Review" field.
- **Redundancy risk flagged and resolved during design**: an early draft had a second "ask for directions" A2 situation nearly identical to A1.4 — replaced with A2.6 (explaining *why* you're late, not just asking directions again), which requires new grammar (Past Simple reason-giving) the original didn't.
- **Complexity-jump risk**: B1→B2 inside Work & Study is the steepest single jump in the whole plan (4 B2 situations vs 3 B1 ones, all requiring negotiation/disagreement language). This is intentional per BC's own research finding (B2's defining functions are advice/problem-resolution/disagreement, concentrated exactly in professional contexts) but is the single area most worth re-reviewing once real learners are testing B1→B2, since it's the biggest register jump in the whole plan.
- **No chapter has more than 2 situations at any single level except Work & Study at B1(3)/B2(4)** — deliberate, grounded in research (see above), not oversight.

## F. Production estimate (rough, for planning only)

| Item | Per situation | × 53 new situations *(58 − 5 existing)* |
|---|---|---|
| Dialogue turns to author (NPC + learner + npcReply, per the shipped pattern) | ~8 avg | ~425 authored NPC lines |
| Learning items (vocabulary/phrases) | ~7 avg | ~370 items |
| Grammar presentations (new, not recycled) | ~0.4 avg (many recycle) | ~20 new grammar patterns total across all 4 levels |
| Missions | 1 | 53 |
| Review links (cross-situation) | ~1.5 avg | ~80 explicit review connections |
| QA cases (dialogue verification + content audit, per the pattern already built for A1) | 1 verification pass + 1 audit pass per situation | 53 verification runs, 4 audit passes (one per level) |
| New scene backgrounds needed | — | **1** (`office`) |
| New cast members needed | — | **0** (all 6 already designed) |

This is a **planning-grade estimate**, not a committed schedule — intended to size the effort, not to be quoted as a deadline.

---

*End of master plan. No code, seeds, or migrations were touched in producing this document. Awaiting confirmation before any production work begins.*
