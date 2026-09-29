# H.B1 Production QA

Дата: 2026-09-29. Scope: preview content only. Production, A1 и A2 не изменялись.

## Reference workflow

Использованы Cambridge [B1 Preliminary vocabulary list — Health, Medicine and Exercise](https://www.cambridgeenglish.org/Images/506887-b1-preliminary-vocabulary-list.pdf), Cambridge [B1 health role-play activity](https://www.cambridgeenglish.org/Images/648172-b1-preliminary-for-schools-vocabulary-booklet.pdf) и ELLLO [B1 doctor conversation](https://www.elllo.org/class/B1/B1-05-Should.html) для словаря и порядка `problem → duration → aggravating factor → attempted remedy`. Диалог Speak in English оригинальный; медицинские рекомендации из reference не копировались, `should` не вводился как target.

## Dialogue

Dr. Kim открывает приём нейтральным вопросом. Learner сообщает sore throat/cough и длительность, уточняет отсутствие fever и ухудшение cough лёжа ночью, затем называет warm lemon drinks и throat lozenges, которые уже пробовал. Dr. Kim отвечает на каждую реплику конкретным follow-up и завершает сбор истории переходом к осмотру до рекомендации.

- Target: `gr_b1_present_perfect_duration` — `I've had + symptom + for + time period`.
- Chunks: `I've already tried`, unsuccessful-result report и zero-conditional `it gets worse when`.
- v1: knee pain for two weeks, stairs/walking as aggravating factors, rest/cold pack already tried.
- v2: headaches for ten days, previous doctor visit, four days following earlier advice, screen-work aggravating factor.
- Far review: H.A2 `itm_a2_ha2_symptom`; prerequisites: H.A2/B1.8.
- Scene/cast: clinic / Dr. Kim.

## QA

- Gate A: schemas, IDs, references, lesson-item contiguity, Mission composition, two transfer variations and idempotent reseed PASS.
- Gate B: dialogue coherence, speaker roles, authored continuations, B1 complexity, target/chunk classification, English-only transcript and no duplicate information PASS.
- Gate C: full B1 Chromium run PASS; H.B1 Mission 100%/`can_do`; separate FAIL path 0%/`learning`; opener/session continuity and semantic spoken turns PASS.
- Grammar lint: 0 errors / 0 advisory notes across 47 worksheet situations.
- Full suite: 407/407 PASS (API 321, web 80, shared 6).
- API/web typechecks: PASS.

Полный Chromium-прогон проверил 580 transcript snapshots и 20 Mission results: PASS для всех 19 B1 situations и отдельный FAIL для B1.1. Для H.B1 сохранено 15 representative preview screenshots под ignored `artifacts/qa/session-dialogue/`; H.B1 Mission завершилась с 4/4, 100%, `can_do`.
