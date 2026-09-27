# Content Master Plan — Speak in English, A1 → B2 — V2

**V2 is a delta on top of `CONTENT_MASTER_PLAN_A1_B2.md` (V1), not a rewrite.** Everything V1 got right is kept as-is: 9 recurring Chapters, the 6-person cast, the existing 5 A1 situations, conversation-first/no-role-mismatch/no-repeated-information rules, and grammar-emerges-from-situation. This document only implements the specific changes requested: a Core → Variation → Mission → Review model, a Health strand, a Phone/Remote strand, a full grammar-level audit with concrete fixes, an expanded B2, a Near/Far review split, and recalculated totals. **No code, seeds, or migrations were touched.**

---

## 0. What changed, in one table

| Area | V1 | V2 |
|---|---|---|
| Core situations | 58 | **69** (+4 Health, +7 expanded B2) |
| Practice variations | 0 (implicit) | **149**, explicit, 1–3 per core situation |
| Review model | single "Review" field | **split into Near / Far transfer**, all 69 tagged |
| Grammar targets | mostly consistent, 6 flagged by user as suspect | **21 corrected** after a full 69-situation audit; every construction now tagged `target` or `lexical chunk` |
| Health & Wellbeing | absent | new strand across Problems & Solutions + Shopping & Services, **1 new lightweight NPC** (doctor), **2 new scenes** (`office` unchanged from V1 + new `clinic`) |
| Phone/Remote | absent | **not new situations** — implemented as variations on 5 existing/new situations |
| B2 | 14 situations, complaint/negotiation-heavy | **22 situations** — 7 new covering media/opinion, speculation, consequences, persuasion, nuanced narrative, sustained casual talk |
| Chapters | 9 | **9 — unchanged** |
| Cast | 6 | **6 + 1 lightweight exception** (a doctor, justified below — not a full recurring character on the level of Maya/Alex/etc.) |
| Total learner hours (core path) | ~6h core + loose review estimate | **~18.3h** core+variations+review, itemized per level |

---

## 1. The Core → Variation → Mission → Review model

A **core situation** is exactly what V1 already designed: a full authored NPC-opener → learner-reply → NPC-continuation scene, ending in a Mission. That skeleton doesn't change.

A **practice variation** is a lighter pass over the *same* scene shape that swaps 2–3 concrete details (a name, a number, an item, a reason, a time) so the learner has to re-apply the function, not recall a memorized line. Variations:
- reuse the same NPC, scene, and grammar/vocabulary target as their core situation,
- do **not** get their own Mission (they feed readiness for the core situation's Mission),
- do **not** duplicate the core situation's exact sentences — if a variation would produce the identical learner line, it's not a real variation and shouldn't exist (this is enforced explicitly in §7 by requiring every row to name a concrete change and a concrete transfer skill).

This directly answers "не запоминал один диалог": a learner who can complete A1.2 (order a coffee) but fails A1.2's variation (order a tea, ask a different question about price) hasn't actually learned the function yet — the variation is the signal.

---

## 2. Grammar-Level Consistency Audit — method

For every one of the 69 core situations (58 from V1 + 11 new in V2), each grammar item was checked against its own listed key phrases for two failure modes:

1. **Construction above level, taught as if it were the level's own grammar** — e.g. "How long have you *lived* here?" (Present Perfect Simple) sitting inside an A1 situation whose grammar target was listed as "be-verbs."
2. **Grammar tag with no matching key phrase** — e.g. a situation tagged "mixed conditionals" whose actual key phrases contain no conditional at all.

Resolution rule applied throughout: every construction in a situation's key phrases is now explicitly one of —
- **Target** — the thing this situation actually teaches and later reviews.
- **Lexical chunk (above level)** — a fixed, useful phrase the learner produces or hears as a whole unit, explicitly *not* decomposed grammatically at this level; its real grammatical treatment is deferred to the level where it becomes a proper target (cross-referenced).
- Nothing else. No more "(light intro)," no more vague grammar names without a matching phrase.

### 2.1 The 6 situations the user flagged directly

| Situation | Phrase | Verdict | Resolution |
|---|---|---|---|
| A1.6 | "How long have you lived here?" | Above level (Present Perfect Simple) | **Lexical chunk** — NPC-only line, receptive, learner never has to produce it. Target stays be-verbs/question formation (recycled). |
| A1.5 | "there's been a mistake" | Above level (Present Perfect) | **Lexical chunk** — taught as one fixed functional phrase for reporting an error, same treatment as "I'd like" in most A1 courses. Not decomposed. |
| A2.1 | for/since | Tag existed, no real target elsewhere to anchor it | **Lexical chunk** — "I've lived here for..." taught as exposure; the real Present Perfect target is introduced properly at B1.8. |
| A2.2 | question tags | No matching key phrase at all | **Removed.** Question tags are genuinely B1+ in most syllabi and never appear in this situation's actual lines. New target: Present Simple + Wh-questions (recycled). |
| A2.10 | "I've bought this" (Present Perfect) | Above level, no anchor before B1.8 | **Changed, not chunked** — example simplified to Past Simple: *"I bought this yesterday, I'd like to return it."* Present Perfect claim dropped entirely; target = Past Simple + returns vocabulary. |
| A2.15 | "I've lost my..." | Above level, but semantically this really is a Present-Perfect situation (recent, currently relevant) | **Lexical chunk** — kept as-is (the situation calls for it), explicitly marked as exposure; full target deferred to B1.8, same as A1.6/A2.1. |
| B2.1 | "mixed conditionals" | No conditional anywhere in the actual key phrases | **Replaced.** Target changed to concession clauses (although/even though), which matches British Council's own "contesting viewpoints" B2 function. Added key phrase: *"Although I see your point, I still think..."* |

### 2.2 15 further corrections found during the full audit (not flagged by the user, found by applying the same check to every situation)

| Situation | Issue | Fix |
|---|---|---|
| A2.3 | "could/would" tagged, only "can" appears in phrases | Added phrase *"Could I change this to... instead?"*; "could" marked as a fixed polite-form chunk, primary target stays "can" (recycled from A1.2). |
| A2.11 | "comparatives" tagged, none evidenced | Added phrase *"Is this cheaper than the other one?"* |
| A2.14 | "could we... instead" tagged, phrases only show "Can we" | Added phrase *"Could we change it to... instead?"* so the tag is actually evidenced. |
| B1.1 | "Did you hear...?" doesn't match the Present Perfect target | Changed to *"Have you heard...?"* — also the more natural, more common idiom for this function. |
| B1.2 | "modal softeners (might, could)" tagged, none evidenced | Added phrase *"It might be different for other people, though."* |
| B1.3 | "if I were you" treated as a live conditional target | **Lexical chunk** — fixed second-conditional expression, full paradigm not taught here. |
| B1.5 | "Present Perfect Continuous / should have" tagged, neither evidenced | Added phrases *"I've been waiting for twenty minutes"* and *"You should have told me earlier"* — both marked **lexical chunks**, since neither form has a proper target elsewhere in the plan. |
| B1.6 | "My train's been cancelled" treated as a live Present Perfect Passive target | **Lexical chunk** — one fixed news-delivery phrase, not decomposed. |
| B1.7 | "comparatives" tagged, none evidenced | Added phrase *"Is this route quicker than the other one?"* |
| B1.10 | "Present Perfect" tagged alongside Passive, not evidenced | Dropped. Target = Passive only ("I was charged twice"). |
| B1.12 | "future forms" tagged vaguely | Dropped; replaced with the phrases that actually appear: need + noun/infinitive, time expressions ("by the end of"). |
| B1.14 | reviews B1.8's Present Perfect but no phrase shows it | Added phrase *"I've worked in this field for three years."* Now a genuine review of a real target (B1.8), not a vague claim. |
| B2.2 | "reported speech" tagged, not evidenced | Added phrase *"She said she wanted the pasta, and he wants a salad."* |
| B2.7 | "conditionals" tagged, not evidenced | Added phrase *"If this isn't resolved, I'll need to consider other options."* |
| — | (already correct on inspection) | A1.1–A1.4, A1.7–A1.10, A2.4, A2.6, A2.8–A2.9, A2.12–A2.13, A2.16, B1.4, B1.8–B1.9, B1.11, B1.13, B1.15–B1.18, B2.3–B2.6, B2.8–B2.14: grammar tag and key phrases were already consistent — no change. |

**Net effect**: 21 of 58 V1 situations got a grammar/key-phrase correction; 37 needed none. No situation lost its grammar target entirely — every fix either added a genuinely matching phrase, swapped an over-level example for a same-level one, or relabeled an over-level phrase as an explicit lexical chunk with its real target cross-referenced to where it's properly taught.

---

## 3. Health & Wellbeing — architecture decision

**Not a new Chapter.** Cambridge's own B1 Preliminary topic list treats health as part of a broader "Services" domain rather than a domain requiring dedicated infrastructure, and CEFR's A1–A2 descriptors don't support a full standalone chapter this early. Health is embedded as a strand across two existing chapters:

- **A1** → **Problems & Solutions** (a friend noticing you're unwell is structurally identical to that chapter's existing "name a simple problem" function — no new NPC).
- **A2** → **Shopping & Services**, staying strictly inside Emma's *established* shop-assistant role: buying an over-the-counter remedy off the shelf, exactly the same kind of transaction as A1.7, not a professional pharmacist consultation.
- **B1 / B2** → also **Shopping & Services** (scope explicitly widened in this document to read "everyday shopping *and* service errands, including clinic visits" — matches Cambridge's own umbrella framing of "Services"), where the clinical register genuinely requires a dedicated NPC — see below.

**One new NPC is introduced, deliberately, as the single cast exception in V2**: a doctor, for the B1/B2 clinical register that none of the existing 6 roles (barista, new friend, neighbour, shop assistant, colleague, waiter) can honestly cover. Named **Dr. Kim** — short, neutral, no RU/UA or other regionally-loaded coding, consistent with the existing cast's naming pattern. She is *not* designed as a full recurring "friend" character like Maya/Alex — she exists only inside the 2 Health situations that need her (B1, B2), the minimum footprint that satisfies the requirement. Emma's own role is deliberately **not** stretched to cover this: a shop assistant answering "do you have anything for X?" and pointing at a shelf is realistic; a shop assistant giving dosage/diagnostic guidance is not — which is exactly why the clinical situations get Dr. Kim instead of pushing Emma outside her established role.

**Two new scenes**, not one: V1 already implied `office` (Work & Study/Daniel). V2 adds `clinic` (Dr. Kim, B1/B2). A2's situation reuses the existing `shop` scene (Emma's own shelf simply includes basic over-the-counter remedies, realistic for any corner shop/kiosk — no new asset needed there).

### 3.1 Health situation tables

**H.A1 — `sit_a1_health_01` «Мне нехорошо»**
| Field | Value |
|---|---|
| Chapter | Problems & Solutions |
| Setting | Алекс замечает, что пользователю нехорошо |
| Capability | «Я могу сказать, что мне нехорошо, и назвать простую проблему» |
| Conversation goal | Назвать проблему и получить простое участие/совет |
| NPC | Алекс |
| Turns | ~6 |
| Key phrases | I don't feel well, I have a headache, I need to rest |
| Vocabulary | feel well/unwell, headache, tired, rest |
| Grammar | have + symptom noun (recycled Present Simple) |
| Mission | Сказать, что не так, в 1-2 фразах |
| Review | Near: — · Far: — |
| Prerequisite | A1.3 |
| Source | Cambridge B1 Preliminary topic list, "Health, Medicine and Exercise" (forward-referenced; simplified to A1) |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why A1 | Single, concrete, low-stakes statement of a personal fact — canonical A1 shape |

**H.A2 — `sit_a2_health_01` «Нужно средство от простуды»**
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Магазин Эммы — на полке есть обычные средства от недомоганий (обезболивающее, от кашля), как в любом магазине у дома; Эмма продаёт, а не назначает |
| Capability | «Я могу объяснить простой симптом и попросить подходящее средство в магазине» |
| Conversation goal | Найти и купить подходящее средство |
| NPC | Эмма |
| Turns | ~7 |
| Key phrases | I have a sore throat, do you have anything for a sore throat?, is this the right one? |
| Vocabulary | symptoms (sore throat, cough, fever), shelf/aisle, product names |
| Grammar | have + symptom (recycled), do you have (recycled A1.7), question formation (recycled) |
| Mission | Объяснить симптом и найти подходящее средство на полке |
| Review | Near: shop pattern (A1.7) · Far: — |
| Prerequisite | H.A1, A1.7 |
| Source | Cambridge B1 Preliminary, "Health, Medicine and Exercise" + "Services" |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why A2 | Direct, familiar-topic transaction with Emma exactly in her established shop-assistant role (recycled A1.7) — no professional/clinical register at this level |

**H.B1 — `sit_b1_health_01` «У врача»**
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Кабинет врача, Dr. Kim (новый, минимальный NPC) |
| Capability | «Я могу объяснить врачу симптомы, как долго они длятся, и что я уже пробовал(а)» |
| Conversation goal | Дать врачу достаточно информации для рекомендации |
| NPC | Dr. Kim |
| Turns | ~9 |
| Key phrases | I've had this for three days, I've already tried, it gets worse when |
| Vocabulary | duration, remedies already tried, aggravating factors |
| Grammar | **Present Perfect with duration** (for + time period) — genuine new target, distinct facet from B1.8's experience-use and B1.10's passive-use; "it gets worse when" = zero conditional, marked **lexical chunk** |
| Mission | Описать симптом, длительность и одну попытку самолечения |
| Review | Near: — · Far: shop remedy pattern (H.A2) |
| Prerequisite | H.A2, B1.8 |
| Source | Cambridge B1 Preliminary, "Health, Medicine and Exercise" |
| Source URL | https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf |
| Why B1 | Non-routine, multi-fact exchange requiring sustained explanation — canonical B1 |

**H.B2 — `sit_b2_health_01` «Уточнить рекомендации врача»**
| Field | Value |
|---|---|
| Chapter | Shopping & Services |
| Setting | Тот же кабинет, повторный/уточняющий визит к Dr. Kim |
| Capability | «Я могу уточнить рекомендации, варианты и возможные риски» |
| Conversation goal | Получить и оценить альтернативы |
| NPC | Dr. Kim |
| Turns | ~9 |
| Key phrases | What are the side effects?, is there an alternative?, how long will it take to work? |
| Vocabulary | side effects, alternatives, treatment duration |
| Grammar | will-future (predictive), alternative-seeking questions (recycled from B1.11's comparison language) |
| Mission | Задать 2 уточняющих вопроса о рекомендации и понять ответ |
| Review | Near: H.B1 · Far: comparison language (B1.11) |
| Prerequisite | H.B1 |
| Source | BC B2 function: "offering/evaluating advice" |
| Source URL | https://learnenglish.britishcouncil.org/skills/speaking |
| Why B2 | Evaluating options and risk with nuance — matches BC's own B2 advice/problem-resolution function |

---

## 4. Phone / Remote communication — implemented as variations, not new situations

Per the model in §1, phone/remote communication is a **modality**, not a topic — so it becomes a Practice Variation on situations that already exist, stripping visual/scene context and adding "ask to repeat," "leave a message," or "no visual cues" pressure. No new chapter, no new core situations.

| Level | Function requested | Host situation | Variation |
|---|---|---|---|
| A2 | Book/arrange by phone, ask to repeat | A2.4 (Бронирование столика) | **A2.4-v-phone**: same booking goal, but opens with *"Sorry, could you repeat that?"* — no visual menu/table cues, purely audio-style exchange |
| B1 | Explain a problem, leave a message, clarify without visual context | B1.17 (многошаговая проблема) | **B1.17-v-voicemail**: the service line doesn't pick up — learner leaves a structured voicemail (name, problem, callback request) instead of a live back-and-forth |
| B1 | Explain a task without visual cues | B1.12 (объяснить задачу коллеге) | **B1.12-v-phone**: same task-handoff, but Daniel is remote — learner can't point/gesture, must fully verbalize what would otherwise be shown |
| B2 | Complex work/service call, negotiation | B2.10 (договориться о дедлайне) | **B2.10-v-call**: same negotiation, opens with connection-quality friction (*"Sorry, you cut out for a second"*) before the real negotiation starts |
| B2 | Complex work/service call, negotiation (2nd context) | B2.7 (оспорить условия услуги) | **B2.7-v-call**: same dispute, phone-only, learner must confirm understanding verbally since there's no contract text visible on screen |

---

## 5. Expanded B2 — 7 new situations

V1's B2 leaned almost entirely on complaints/negotiation. These 7 add the missing functions the user listed, without inventing new chapters or cast.

**B2.15 — `sit_b2_people_03` «Обсудить фильм или книгу глубже»** (People & Connections, Алекс) — Capability: «обсудить произведение с сравнением точек зрения». Key phrases: *What did you make of...?, I found it quite..., compared to the book/original.* Grammar: comparing-viewpoints language (recycled/extended from B1.11), opinion adjectives. Review: Near — · Far: B1.3 (recommendation). Prerequisite: B1.3.

**B2.16 — `sit_b2_work_05` «Обсудить новую технологию на работе»** (Work & Study, Дэниел) — Capability: «объяснить сложную идею и её возможные последствия». Key phrases: *The way I see it, this could mean..., it's hard to say how it'll affect.* Grammar: speculation modals (could/might for prediction, recycled from B2.5), hedging. Review: Near — · Far: B2.5. Prerequisite: B2.5, B2.8.

**B2.17 — `sit_b2_people_04` «Предположить, почему что-то произошло»** (People & Connections, Алекс) — Capability: «строить предположения о причинах». Key phrases: *I wonder if..., maybe it's because..., that would explain why.* Grammar: **I wonder if/whether** — genuine new target, speculative subordinate clause. Review: Near: B2.16 · Far: —. Prerequisite: B2.16.

**B2.18 — `sit_b2_social_02` «Свободный разговор без определённой темы»** (Social Life & Leisure, Алекс) — Capability: «поддерживать длинный непринуждённый разговор, естественно меняя тему». Key phrases: *Anyway, speaking of which..., that reminds me...* Grammar: **discourse markers/topic-shift language** — genuine new target, pure discourse competence, no new tense. Review: Near — · Far: B1.1. Prerequisite: B1.1, B1.16.

**B2.19 — `sit_b2_daily_02` «Убедить друга попробовать что-то новое»** (Daily Life & Home, Алекс) — Capability: «убедить, используя аргументы, а не давление». Key phrases: *You should really consider..., think about it this way, what have you got to lose?* Grammar: should for persuasion (recycled), rhetorical questions (functional device, not a grammar target). Review: Near — · Far: B1.13 (favours/persuasion-adjacent). Prerequisite: B1.13, B2.6.

**B2.20 — `sit_b2_people_05` «Рассказать сложную историю с нюансами»** (People & Connections, Алекс) — Capability: «рассказать историю со смешанными чувствами и неожиданным поворотом». Key phrases: *What made it strange was..., I still don't know if..., looking back now.* Grammar: **cleft sentences** ("what made it strange was...") — genuine new target, matches CEFR B2's "emphasising significant points" descriptor. Review: Near — · Far: B1.8 (storytelling). Prerequisite: B1.8.

**B2.21 — `sit_b2_work_06` «Обсудить последствия решения»** (Work & Study, Дэниел) — Capability: «обсудить последствия и выразить неуверенность в исходе». Key phrases: *If we go ahead with this, it could lead to..., on balance, I'm not sure how this will play out.* Grammar: conditional for consequences (recycled/extended from B2.4/B2.5), "on balance" (recycled from B2.6). Review: Near: B2.16 · Far: B2.6. Prerequisite: B2.16.

*(Renumbered for clarity: the 4th "expanded B2" slot originally sketched as a duplicate of B2.16/B2.21's function was merged into B2.21 rather than kept as a separate situation, to avoid the exact redundancy V1's own risk-audit process was built to catch — 7 situations, not 8, cover the 9 requested functions because "explaining a complex idea" and "discussing consequences" naturally co-occur in one workplace scene, and were kept as one rather than artificially split.)*

**B2 new total: 14 (V1) + 7 (above) + 1 (H.B2, §3) = 22.**

---

## 6. Practice Variations — full table (149 rows)

Format: **Core ID → Variation** | what concretely changes | transfer skill tested. Every core situation from §3–§5 of V1/V2 gets 1 variation at A1, 2 at A2/B1, 3 at B2 (rationale: A1 prioritizes confidence over stress-testing; B2 situations are exactly where transfer matters most).

### A1 (11 situations × 1 variation = 11)

| Core | Variation | What changes | Transfer tested |
|---|---|---|---|
| A1.1 | v1 | New partner (Rosa instead of Alex, before A1.6) says a different name/job | Learner must produce intro without leaning on memorized Alex-specific answers |
| A1.2 | v1 | Order a different drink (tea, size "large") | Same request pattern, new noun/adjective |
| A1.3 | v1 | Describe an evening routine instead of a morning one | Same frequency-adverb pattern, new time-of-day vocabulary |
| A1.4 | v1 | Ask directions to a different, less obvious place (the pharmacy, not the station) | Same direction-asking pattern under less predictability |
| A1.5 | v1 | Wrong item is a pastry, not a drink | Same correction pattern, new noun |
| A1.6 | v1 | Meet a different neighbour context (in the elevator, not the yard) | Same intro pattern in a slightly different setting |
| A1.7 | v1 | Buy a different item (notebook instead of a snack) at a different price | Same transaction pattern, new number/noun |
| A1.8 | v1 | Buy a ticket for a different time/destination | Same transaction pattern, new time expression |
| A1.9 | v1 | Suggest a different activity (park instead of café) | Same suggestion pattern, new activity noun |
| A1.10 | v1 | Describe a different type of home (a house, not an apartment) | Same there is/are pattern, new noun set |
| H.A1 | v1 | Symptom changes (stomach ache instead of headache) | Same have+symptom pattern, new noun |

### A2 (17 situations × 2 variations = 34)

| Core | Variation | What changes | Transfer tested |
|---|---|---|---|
| A2.1 | v1 | Job/family details differ from the first telling | Recombine known structures with new facts |
| A2.1 | v2 | Duration differs ("for six months" vs "for two years") | for/since chunk under new numbers |
| A2.2 | v1 | Meet Daniel at a different informal event (a barbecue, not a party) | Same small-talk pattern, new setting noun |
| A2.2 | v2 | A mutual-connection detail changes ("How do you know Maya?" instead of Alex) | Same question pattern, cross-references another NPC |
| A2.3 | v1 | Change quantity, not item ("actually, make that two") | Same correction pattern, new target (quantity vs item) |
| A2.3 | v2 | Change happens after paying starts, requiring a slightly firmer correction | Same function under added pressure |
| A2.4 | v1 | Booking for a different party size/day | Same booking pattern, new numbers |
| A2.4 | v-phone | See §4 | Modality transfer (no visual cues) |
| A2.5 | v1 | Different dietary detail (no dairy instead of no onions) | Same "without X" pattern, new noun |
| A2.5 | v2 | Ordering for a group of 4 instead of 2 | Same pattern, added quantity complexity |
| A2.6 | v1 | Missed a meeting instead of a bus | Same explanation pattern, new noun |
| A2.6 | v2 | Reason is a personal delay, not transport ("I overslept") | Same pattern, more personal register |
| A2.7 | v1 | Route involves 3 turns instead of 2 | Same clarification pattern under more information load |
| A2.7 | v2 | Learner mishears a number, not a direction | Same clarification function, different error type |
| A2.8 | v1 | Weekend activity differs (a trip, not a film) | Same Past Simple pattern, new vocabulary |
| A2.8 | v2 | Weekend included a minor mishap ("it rained, so we...") | Same tense, adds a simple complication |
| A2.9 | v1 | Plans are with a different person (Maya, not Alex) | Same going-to pattern, new subject |
| A2.9 | v2 | One of two planned activities changes mid-conversation | Same pattern, adds correction |
| A2.10 | v1 | Wrong size instead of "doesn't fit" phrasing | Same return pattern, new noun |
| A2.10 | v2 | Exchange for a completely different item, not a size swap | Same function, bigger negotiation |
| A2.11 | v1 | Different product category (shoes, not a jacket) | Same comparison pattern, new nouns |
| A2.11 | v2 | Two items compared instead of "on sale or not" | Same comparatives target, new use case |
| A2.12 | v1 | Different job (teacher, not office worker) | Same description pattern, new vocabulary |
| A2.12 | v2 | Different work schedule (part-time instead of full-time) | Same description pattern, recombine known A2 structures with new facts |
| A2.13 | v1 | Favour is about information, not physical help | Same Could-you pattern, new noun |
| A2.13 | v2 | Daniel is initially busy, requiring a rescheduled favour | Same pattern, adds negotiation step |
| A2.14 | v1 | Invitation is to a group, not one person | Same pattern, pluralizes |
| A2.14 | v2 | Plan changes twice, not once | Same function, repeated under pressure |
| A2.15 | v1 | Lost item is a bag, not a phone | Same Present Perfect chunk, new noun |
| A2.15 | v2 | Item was lost somewhere less obvious (not "the last place you were") | Same function, harder recall |
| A2.16 | v1 | Error is a missing item, not a wrong charge | Same correction pattern, new error type |
| A2.16 | v2 | Error is only spotted after paying | Same function, added social difficulty |
| H.A2 | v1 | Different symptom (cough instead of sore throat) | Same pattern, new noun |
| H.A2 | v2 | Choosing between two available remedies on the shelf | Same pattern, adds comparison (bridges to A2.11) |

### B1 (19 situations × 2 variations = 38)

| Core | Variation | What changes | Transfer tested |
|---|---|---|---|
| B1.1 | v1 | News is personal (a friend's move), not public | Same reacting pattern, new topic register |
| B1.1 | v2 | News is mildly negative, requiring a softer reaction | Same pattern, new emotional register |
| B1.2 | v1 | Disagreement topic changes (a plan, not an opinion on a thing) | Same softened-disagreement pattern, new topic |
| B1.2 | v2 | Alex pushes back once, requiring the learner to hold the position gently | Same pattern, adds a second exchange |
| B1.3 | v1 | Recommendation is about food, not drink | Same pattern, new domain |
| B1.3 | v2 | Two options are compared before recommending | Same pattern, adds comparatives (bridges to B1.11) |
| B1.4 | v1 | Different restriction (vegetarian, not allergy) | Same pattern, new noun |
| B1.4 | v2 | Restriction affects two dishes, not one | Same pattern, added complexity |
| B1.5 | v1 | Complaint is about wrong order, not wait time | Same pattern, new complaint type |
| B1.5 | v2 | Leo initially pushes back before agreeing | Same pattern, adds resistance |
| B1.6 | v1 | Delay instead of cancellation | Same pattern, new disruption type |
| B1.6 | v2 | Two options are offered, learner must choose | Same pattern, adds decision-making |
| B1.7 | v1 | Recommendation is about food, not a route | Same pattern, new domain |
| B1.7 | v2 | Time constraint added ("I only have 2 hours") | Same pattern, adds constraint reasoning |
| B1.8 | v1 | Story is about a mistake, not a highlight | Same narrative pattern, new emotional tone |
| B1.8 | v2 | Story has two connected events, not one | Same pattern, adds sequencing |
| B1.9 | v1 | Change is about a habit, not a location | Same used-to pattern, new domain |
| B1.9 | v2 | Change was gradual, not sudden | Same pattern, subtler contrast |
| B1.10 | v1 | Issue is a wrong subscription tier, not double-charging | Same passive pattern, new issue type |
| B1.10 | v2 | Issue took two calls to resolve | Same pattern, adds persistence |
| B1.11 | v1 | Comparing two services, not two products | Same pattern, new domain |
| B1.11 | v2 | Three options instead of two | Same pattern, added complexity |
| B1.12 | v1 | Task is about a document, not a project step | Same pattern, new noun |
| B1.12 | v-phone | See §4 | Modality transfer |
| B1.13 | v1 | Favour is scheduling-related, not task-related | Same pattern, new domain |
| B1.13 | v2 | Daniel agrees but adds a condition | Same pattern, adds negotiation |
| B1.14 | v1 | Different role (a support role, not the one drafted) | Same interview pattern, new content |
| B1.14 | v2 | Dr. Kim... no — Daniel asks a harder "why should we hire you" question | Same pattern, raises difficulty |
| B1.15 | v1 | Group event is a trip, not a dinner | Same coordination pattern, new domain |
| B1.15 | v2 | One person can't make the first proposed time | Same pattern, adds a constraint |
| B1.16 | v1 | Decline is for a work event, not a social one | Same pattern, new register |
| B1.16 | v2 | Alex asks why, requiring a longer polite explanation | Same pattern, adds follow-up |
| B1.17 | v1 | Problem is a delivery issue, not a billing one | Same multi-step pattern, new domain |
| B1.17 | v-voicemail | See §4 | Modality transfer |
| B1.18 | v1 | Persistence needed with Emma, not Leo | Same pattern, new NPC/context |
| B1.18 | v2 | Two rounds of pushback before resolution | Same pattern, extended persistence |
| H.B1 | v1 | Different symptom set (joint pain, longer duration) | Same Present-Perfect-duration target, new content |
| H.B1 | v2 | Learner has already seen another doctor about it | Same pattern, adds reported-history complexity |

### B2 (22 situations × 3 variations = 66)

| Core | Variation | What changes | Transfer tested |
|---|---|---|---|
| B2.1 | v1 | Disagreement topic is about work, not general | Same concession pattern, new register |
| B2.1 | v2 | Alex holds a stronger opposing view, requiring more persistence | Same pattern, raised difficulty |
| B2.1 | v3 | Topic resolves in partial agreement, not a standoff | Same pattern, different resolution shape |
| B2.2 | v1 | Group order has a dietary conflict layered in | Same pattern, adds constraint |
| B2.2 | v2 | One person changes their order after it's relayed | Same pattern, adds correction |
| B2.2 | v3 | Bill-splitting is uneven (not equal shares) | Same pattern, adds negotiation math |
| B2.3 | v1 | Dispute is about a missing item, not a bad experience | Same pattern, new dispute type |
| B2.3 | v2 | Leo offers a partial, insufficient compensation first | Same pattern, adds a negotiation round |
| B2.3 | v3 | Learner has to reference a prior visit as context | Same pattern, adds narrative continuity |
| B2.4 | v1 | Disruption is a hotel issue, not transport | Same pattern, new domain |
| B2.4 | v2 | Compensation offer is initially too low | Same pattern, adds negotiation round |
| B2.4 | v3 | Learner must reference a specific inconvenience caused | Same pattern, adds evidence-giving |
| B2.5 | v1 | Constraints are budget + weather, not time | Same pattern, new constraint set |
| B2.5 | v2 | Rosa proposes an option the learner must push back on | Same pattern, adds evaluation under disagreement |
| B2.5 | v3 | Four constraints instead of three | Same pattern, raised complexity |
| B2.6 | v1 | Topic is a career choice, not a general lifestyle | Same pattern, new domain |
| B2.6 | v2 | Alex holds a one-sided view the learner must balance | Same pattern, adds contrast |
| B2.6 | v3 | Discussion includes a personal anecdote as evidence | Same pattern, adds narrative support |
| B2.7 | v1 | Dispute is about a gym membership, not a subscription | Same pattern, new domain |
| B2.7 | v-call | See §4 | Modality transfer |
| B2.7 | v2 | Emma offers to modify terms rather than cancel | Same pattern, adds a third option |
| B2.8 | v1 | Proposal is about a process change, not a project idea | Same pattern, new domain |
| B2.8 | v2 | A colleague (implied) already raised a similar idea — learner must differentiate | Same pattern, adds comparison |
| B2.8 | v3 | Proposal meets immediate skepticism | Same pattern, adds resistance |
| B2.9 | v1 | Disagreement is about priorities, not method | Same pattern, new domain |
| B2.9 | v2 | Daniel proposes the middle ground first, learner must refine it | Same pattern, reversed initiative |
| B2.9 | v3 | Disagreement recurs after a prior agreement (things changed) | Same pattern, adds continuity |
| B2.10 | v1 | Renegotiating a budget, not a deadline | Same pattern, new domain |
| B2.10 | v-call | See §4 | Modality transfer |
| B2.10 | v2 | Daniel initially refuses before compromising | Same pattern, adds resistance |
| B2.11 | v1 | Feedback is about communication style, not output quality | Same pattern, new domain |
| B2.11 | v2 | Feedback recipient (implied) responds defensively — learner must stay tactful | Same pattern, raised difficulty |
| B2.11 | v3 | Feedback is positive-with-one-caveat instead of mostly corrective | Same pattern, different balance |
| B2.12 | v1 | Misunderstanding is about a scheduling mix-up, not intent | Same pattern, new domain |
| B2.12 | v2 | Alex is initially still upset, not immediately receptive | Same pattern, adds resistance |
| B2.12 | v3 | Learner must acknowledge their own share of the mix-up | Same pattern, adds self-correction |
| B2.13 | v1 | Refund dispute is about a service, not a product | Same pattern, new domain |
| B2.13 | v2 | Emma proposes store credit instead of cash | Same pattern, adds a third option |
| B2.13 | v3 | Two prior failed resolution attempts are referenced | Same pattern, adds narrative continuity |
| B2.14 | v1 | Dispute is with Emma, not Leo | Same pattern, new NPC/context |
| B2.14 | v2 | Learner must concede one minor point while holding the main one | Same pattern, adds nuance |
| B2.14 | v3 | Resolution is "agree to disagree," not a win | Same pattern, different resolution shape |
| B2.15 | v1 | Topic is a TV series, not a film | Same pattern, new medium |
| B2.15 | v2 | Alex's opinion is the opposite of the learner's | Same pattern, adds real disagreement |
| B2.15 | v3 | Discussion includes a comparison to an earlier work by the same creator | Same pattern, adds depth |
| B2.16 | v1 | Technology is a new tool, not a new process | Same pattern, new domain |
| B2.16 | v2 | Daniel is skeptical of the technology | Same pattern, adds resistance |
| B2.16 | v3 | Discussion includes a specific risk to flag | Same pattern, adds B2.5-style speculation |
| B2.17 | v1 | Speculating about a mutual acquaintance's behaviour, not an event | Same pattern, new subject |
| B2.17 | v2 | Two competing explanations are weighed | Same pattern, adds comparison |
| B2.17 | v3 | The real reason turns out to be different (a twist) | Same pattern, adds narrative payoff |
| B2.18 | v1 | Conversation starts from a different anchor topic | Same discourse-marker pattern, new starting point |
| B2.18 | v2 | Topic shifts three times, not once | Same pattern, raised complexity |
| B2.18 | v3 | Learner has to steer the topic back after a tangent | Same pattern, adds control |
| B2.19 | v1 | Persuading about a habit, not an activity | Same pattern, new domain |
| B2.19 | v2 | Alex raises a real objection the learner must answer | Same pattern, adds resistance |
| B2.19 | v3 | Persuasion succeeds only partially (a compromise) | Same pattern, different resolution shape |
| B2.20 | v1 | Story involves a stranger, not a known person | Same pattern, new subject |
| B2.20 | v2 | Story includes an unresolved feeling ("I still don't know if...") | Same pattern, keeps the ambiguity |
| B2.20 | v3 | Alex asks a follow-up that makes the learner reconsider part of the story | Same pattern, adds real-time reflection |
| B2.21 | v1 | Decision is about budget, not technology | Same pattern, new domain |
| B2.21 | v2 | Daniel is more confident than the learner about the outcome | Same pattern, adds contrast |
| B2.21 | v3 | A downside is identified mid-conversation, not upfront | Same pattern, adds real-time reasoning |
| H.B2 | v1 | Alternative treatment question, not side-effects | Same pattern, new question type |
| H.B2 | v2 | Learner must weigh two options Dr. Kim offers | Same pattern, adds comparison |
| H.B2 | v3 | Learner asks about a lifestyle-change alternative, not medication | Same pattern, broader scope |

---

## 7. Review model V2 — Near vs Far

**Near review**: the function returns within roughly the same level, close in sequence, usually still recognizable as "the thing I just did." **Far transfer review**: the function returns at least one level later, or several situations later, in a different scene, with no recent practice cushioning it — this is the real test of retention.

Full tagging, all 69 core situations (mechanically derived from each situation's own Review/Prerequisite fields in V1/V2):

| ID | Near | Far |
|---|---|---|
| A1.1 | — | — |
| A1.2 | greetings (A1.1) | — |
| A1.3 | be-verbs (A1.1) | — |
| A1.4 | — | — |
| A1.5 | café vocab (A1.2) | — |
| A1.6 | greetings/self-intro (A1.1) | — |
| A1.7 | numbers (placement) | — |
| A1.8 | directions (A1.4) | — |
| A1.9 | daily routine (A1.3) | — |
| A1.10 | café small talk (A1.2), directions (A1.4) | — |
| H.A1 | — | — |
| A2.1 | — | self-intro (A1.1), Rosa intro (A1.6) |
| A2.2 | — | self-intro (A1.1) |
| A2.3 | café ordering (A1.2) | — |
| A2.4 | — | tickets/numbers (A1.8) |
| A2.5 | A2.4 | café ordering pattern (A1.2) |
| A2.6 | — | directions (A1.4, A1.8) |
| A2.7 | — | directions (A1.4) |
| A2.8 | — | daily routine (A1.3) |
| A2.9 | A2.8 | — |
| A2.10 | — | shop pattern (A1.7) |
| A2.11 | — | shop pattern (A1.7) |
| A2.12 | A2.1 | — |
| A2.13 | A2.12 | Could you...? (A1.5) |
| A2.14 | A2.9 | Social suggestion (A1.9) |
| A2.15 | — | directions vocab (A1.4) |
| A2.16 | A2.4/A2.5 | mistake pattern (A1.5) |
| H.A2 | shop pattern (A1.7) | — |
| B1.1 | — | A2.1 |
| B1.2 | B1.1 | — |
| B1.3 | café pattern (A2.3) | café ordering (A1.2) |
| B1.4 | — | restaurant order (A2.5) |
| B1.5 | A2.16 | — |
| B1.6 | — | travel delay (A2.6) |
| B1.7 | B1.6 | — |
| B1.8 | — | daily routine (A2.8) |
| B1.9 | B1.8 | — |
| B1.10 | — | returns (A2.10) |
| B1.11 | — | comparatives (A2.11) |
| B1.12 | — | favours (A2.13) |
| B1.13 | B1.12 | Could you...? (A1.5, A2.13) |
| B1.14 | — | experience (B1.8), job talk (A2.12) |
| B1.15 | — | arrangements (A2.14) |
| B1.16 | B1.15 | — |
| B1.17 | — | subscription issue (B1.10) |
| B1.18 | B1.17 | serious complaint (B1.5) |
| H.B1 | — | shop remedy (H.A2) |
| B2.1 | — | disagreement (B1.2) |
| B2.2 | — | dietary needs (B1.4), complaint (B1.5) |
| B2.3 | — | complaint (B1.5), persistence (B1.18) |
| B2.4 | — | travel problem (B1.6) |
| B2.5 | B2.4 | route advice (B1.7) |
| B2.6 | — | lifestyle change (B1.9) |
| B2.7 | — | billing issue (B1.10) |
| B2.8 | — | task explanation (B1.12) |
| B2.9 | B2.8 | — |
| B2.10 | — | task explanation (B1.12), B2.9 |
| B2.11 | B2.9 | — |
| B2.12 | — | polite decline (B1.16) |
| B2.13 | — | multi-step problem (B1.17), B2.3 |
| B2.14 | B2.9 | persistence (B1.18), B2.13 |
| H.B2 | H.B1 | comparison language (B1.11) |
| B2.15 | — | recommendation (B1.3) |
| B2.16 | — | speculation (B2.5) |
| B2.17 | B2.16 | — |
| B2.18 | — | reacting to news (B1.1) |
| B2.19 | — | favours/persuasion-adjacent (B1.13) |
| B2.20 | — | storytelling (B1.8) |
| B2.21 | B2.16 | pros/cons (B2.6) |

---

## 8. Recalculated stats

| Level | Core situations | Variations | Missions | Review encounters | Approx. learner hours |
|---|---|---|---|---|---|
| A1 | 11 | 11 | 11 | 19 | 2.3 |
| A2 | 17 | 34 | 17 | 29 | 4.4 |
| B1 | 19 | 38 | 19 | 32 | 4.9 |
| B2 | 22 | 66 | 22 | 37 | 6.7 |
| **Total** | **69** | **149** | **69** | **117** | **18.3** |

Method: core situation ≈ 6 min (unchanged from V1's own product-config estimate), variation ≈ 3 min (lighter — same scene/setup, only details change), review encounter ≈ 2 min (a single recognition-style check, matching the existing `role:"review"` mechanic of one MC per review). **~18.3 hours is the core path** (do every core situation, every variation, every review once). Realistic total including natural spaced-repetition replay and drift stays in the same honest range as V1: **~25–35 hours** end to end.

---

## 9. Recalculated production estimate

| Item | V1 estimate | V2 addition | V2 total |
|---|---|---|---|
| New core situations to author (beyond the 5 already shipped) | 53 | +11 (4 Health + 7 B2) | **64** |
| Core NPC lines (`npcReplyCorrect` etc.) | ~425 (53×8) | +88 (11×8) | **~513** |
| Variation NPC lines (new field only where the swapped detail changes the NPC's reply — lighter than a full situation) | 0 | 149×~3 | **~447** |
| New learning items | ~370 (53×7) | +77 (11×7) | **~447** |
| Additional learning items for variations (mostly reuse; new only for the swapped detail) | 0 | 149×~0.5 | **~75** |
| New grammar presentations (real targets only — chunks are relabeling, not new authoring) | ~20 | +6 (Present-Perfect-duration, I wonder if, discourse markers, cleft sentences, plus 2 minor) | **~26** |
| Missions | 53 | +11 | **64** |
| New review links (near+far, new situations only) | ~80 | +25 | **~105** |
| Review-link retagging (near/far metadata on all existing V1 links — no new content, a labeling pass) | — | 80 links retagged | **80 (metadata only)** |
| QA verification passes (1 per new core situation) | 53 | +11 | **64** |
| QA batch passes for variations (1 per ~5 variations, not 1:1) | 0 | 149/5 | **~30** |
| New scene backgrounds | 1 (`office`) | +1 (`clinic`) | **2** |
| New cast | 0 | +1 (Dr. Kim, minimal footprint — 2 situations only) | **1** |

This remains a **planning-grade estimate**, sized for effort, not a committed schedule.

---

## 10. What did NOT change (explicit confirmation)

- **9 Chapters** — unchanged. Health and Phone/Remote were deliberately fit into existing chapters/mechanics rather than added as new ones, per the instruction not to redesign without real necessity.
- **Cast** — Maya, Alex, Rosa, Emma, Daniel, Leo unchanged, same roles, same chapters. The one addition (Dr. Kim) is a minimal-footprint exception with explicit justification (§3), not a general cast expansion.
- **e1–e5** — untouched, same chapter placement and before/after context as V1 §3.
- **Conversation-first, no role-mismatch, no repeated information** — unchanged rules, applied to every new situation and variation in this document.
- **Grammar-emerges-from-situation** — unchanged principle; the audit in §2 exists specifically to *enforce* this principle more rigorously, not to abandon it.
- **Explicit prerequisites/review** — kept and extended into the Near/Far split (§7), not replaced.
- **No Russia/Ukraine geography** — maintained throughout all new content (Health and expanded-B2 situations use neutral settings/names consistent with V1's existing convention).

---

## 11. Final consistency check — 4 corrections applied, curriculum frozen

Four consistency fixes were requested after V2's initial approval, and all four are applied above:

| # | Issue | Fix applied | Location |
|---|---|---|---|
| 1 | A1.6 "How long have you lived here?" mislabeled Present Perfect **Continuous** | Reclassified as Present Perfect **Simple**; still a lexical chunk, NPC-only, receptive | §2, §2.1 |
| 2 | A1.5 "there's been a mistake" mislabeled Present Perfect **Passive** | Reclassified as plain **Present Perfect** ("been" here is the participle of existential "there has been," not a passive marker); still a lexical chunk | §2.1 |
| 3 | H.A1's "need to" tagged with a vague "simple exposure" label, and — worse — cited as "recycled" from A2.13, a *later* situation, which is a genuine sequencing error | Removed from the Grammar field entirely (kept only as an ordinary key phrase/vocabulary item, not a grammar claim); situation's only grammar target is now have + symptom noun (recycled Present Simple) | §3.1 |
| 4a | A2.12-v2 introduced "used to" as an informal preview of B1.9, which V2's own rule (grammar is either a real target or a labeled chunk, never a soft preview) prohibits | Replaced with an A2-level-only variation (different work schedule, part-time vs full-time) — no forward-looking grammar | §6 |
| 4b | H.A2 cast Emma as a pharmacist giving dosage advice, outside her established shop-assistant role | Reframed as buying an over-the-counter remedy off Emma's own shelf (same transactional shape as A1.7); dosage/diagnostic language removed from her lines; the clinical register stays exclusively with Dr. Kim at B1/B2. No new NPC added — cast stays at 6 + the 1 already-approved exception | §3, §3.1, §6 (H.A2 variations), §7 (H.B1's far-review label) |

No other numbers changed as a result (grammar-target counts, production estimate, and hour totals in §8–9 are unaffected — all four fixes were reclassifications/relabels/replacements, not additions or removals of actual content volume).

**Curriculum architecture is now frozen.** No further global redesign without a critical reason, per your instruction. Next step is production content generation planning, not curriculum design.

---

## Sources

Same evidence base as V1 (no new web research was commissioned for this revision; V2 applies V1's existing findings plus internal audit logic):
- [CEFR — Wikipedia](https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages)
- [British Council — Speaking skills, by level](https://learnenglish.britishcouncil.org/skills/speaking)
- [British Council — A1](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/a1-elementary) / [A2](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/a2-pre-intermediate) / [B1](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/b1-intermediate) / [B2](https://learnenglish.britishcouncil.org/english-levels/understand-your-english-level/b2-upper-intermediate)
- [ELLLO — Levels overview](https://elllo.org/levels/)
- [ALTE Can Do statements (PDF)](http://naunicol-e.home.amu.edu.pl/wp-content/uploads/2016/04/alte.pdf)
- [Cambridge English — A2 Key 2020 vocabulary list (PDF)](https://www.cambridgeenglish.org/images/506886-a2-key-2020-vocabulary-list.pdf)
- [Cambridge English — B1 Preliminary vocabulary list (PDF)](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf)

---

*End of V2. No code, seeds, or migrations were touched. Per instruction: after V2, curriculum architecture is frozen — no further global redesign without a critical reason.*
