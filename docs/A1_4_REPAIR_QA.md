# A1.4 — исправление grammar evidence и QA, 2026-09-27

Изменение подготовлено и проверено локально для preview. Удалённые БД, preview deployment и production не затрагивались. Frozen curriculum и архитектура не изменены.

## Минимальная правка

Изменено только поле `npcReplyCorrect` у `itm_sie_where_is_the` в `seeds/content/sie-a1-items.json`:

- Ученик: **Where is the station, please?**
- Роза, до: **Go straight, then turn left — it's next to the bank.**
- Роза, после: **Go straight, then turn left. There's a bank next to the station.**

Реплика отвечает на вопрос о вокзале, сохраняет маршрут и ориентир. Конструкция `there is` появляется в естественном описании ориентира, как и предусмотрено curriculum. В `grammar-classification.json` она отмечена как target `gr_a1_there_is_are`, источник — `npcReplyCorrect`, speaker — `npc`. Эти два уточняющих поля документируют ручную проверку источника; существующий lint их не проверяет.

Learner phrases, примеры, lesson-item links, grammar target и Mission не изменены. В тестовой БД сравнен полный результат `buildMissionPlan` с прежней и новой NPC-репликой: глубокое равенство подтверждено.

## Проверки

| Проверка | Результат |
|---|---|
| Grammar lint | PASS: 0 ошибок, 0 замечаний |
| `contentSeed`, `contentQA`, `lessonEngineContentQA`, `lessonSessionService` | PASS: 76/76 |
| Полный suite API + web + shared | PASS: 371/371, без пропусков |
| Typecheck API, API tests, web, web tests, web QA | PASS |
| A1.4: три учебные сессии и Mission через реальные сервисы | PASS |
| Mission с правильными ответами | 8/8, 100%, `missionPassed=true`, `can_do` |
| Mission с намеренно неправильными ответами после успешных занятий | 0/8, 0%, `missionPassed=false`, `learning`, наград нет |
| Реальный браузерный проход A1.4 | Все занятия пройдены; Mission 8/8, 100%, успешный экран результата |
| Speaker-role consistency новой реплики | PASS: новая фраза произносится Розой после вопроса ученика |
| Английские реплики A1.4 | Кириллицы в learner/NPC-тексте нет; русские имена и UI-подписи отделены от английского текста |
| Transcript coherence всего A1.4 | FAIL: существующие повторы и сброс контекста между сессиями, см. ниже |

Команды основных проверок:

```sh
node apps/api/scripts/lintGrammarClassification.ts
node --test apps/api/test/contentSeed.test.ts apps/api/test/contentQA.test.ts apps/api/test/lessonEngineContentQA.test.ts apps/api/test/lessonSessionService.test.ts
node --test apps/api/test/*.test.ts apps/web/test/*.test.ts packages/shared/test/*.test.ts
```

Typecheck запускался локальными `typescript/bin/tsc --noEmit -p ...` для всех пяти конфигураций двух приложений. Прямой `node --test` использует те же test-файлы, что workspace scripts; глобального `pnpm` в окружении нет.

Браузерная проверка основана на `apps/web/qa/verify-dialogue.ts`, ограничена A1.4 и использует реальные seed-данные для ответов. Сохранены исходные fallback-ветки выбора ответа; для этого запуска каждая отправка отмечена корректной, итог — 100%. Скрипт сам по себе не проверяет смысловую связность: эта проблема найдена отдельным просмотром transcript и скриншотов, несмотря на успешный exit code.

Wrangler/workerd не поддерживает установленную macOS 12.6 (требуется 13.5+). Поэтому использованы локальный Vite, настоящий Chromium, настоящие Hono API handlers и существующий `createFakeD1` поверх SQLite в памяти. Ответы API не подменялись заранее записанными JSON. Telegram dev-auth прошла обычную проверку подписи. Это проверка локального продукта, не подтверждение работы Cloudflare runtime или удалённого preview. Mission fail проверен через реальные сервисы; браузерный экран fail в этом запуске не проверялся.

## Новое подтверждённое противоречие

Frozen V2 §9 сохраняет правило **conversation-first / no repeated information**. Во второй сессии текущий интерфейс показывает:

1. Ученик: **I don't understand** — после `fill_gap_choice` (`act_012`).
2. Ученик: **Sorry, I don't understand.** — после `sentence_build` (`act_013`).
3. Роза: **No worries, let me say it again.**

Это не два шага разговора: два упражнения на одну мысль превращены в две последовательные реплики. Аналогичное поведение видно в третьей сессии: **turn left** → **Turn left at the corner.**

Кроме того, начало второй сессии снова показывает **Are you looking for something?**, а не сохраняет контекст объяснения маршрута из первой. Подтверждение: `transcript-snapshots.json`, `round=1, step=0`.

Причина в существующем `apps/web/src/routes/Session.tsx`: `submit` добавляет результат `spokenAnswer` для каждого scored activity; `spokenAnswer` возвращает текст и для fill-gap, и для sentence-build, хотя NPC continuation находится только на последнем упражнении item. При инициализации каждой сессии dialogue заново получает исходный opener. Этот код и соответствующие learner items не менялись в текущей правке.

По указанию пользователя остановиться на новом противоречии исправление transcript не выполнялось, Batch 1 не начат. A1.6–A1.8 остаются **planned**; результатов их Mission и Gate A/B/C пока нет.

## QA Gates

- **A:** проверки структуры, тесты и typecheck для seed-правки прошли.
- **B:** новая реплика естественна и соответствует роли; целостный dialogue flow не проходит из-за повторов и сброса контекста.
- **C:** новая реплика и успешный Mission видны в реальном интерфейсе; gate целиком **не пройден** из-за подтверждённой проблемы transcript. Browser Mission fail не проверен.

Исходный grammar finding отмечен **resolved локально**, отдельная проблема transcript — **open**. Статус `done` старого A1.4 в tracker отражает ранее выпущенную версию, а не новое утверждение о прохождении всех gates. Near/Far и Leitner/SRS не изменены.

## Локальные артефакты

Артефакты находятся в `artifacts/qa/a14-repair/` (каталог исключён из git):

- `002-a14-r0-s6.png` — новая NPC-реплика после вопроса о вокзале.
- `005-a14-r1-s3.png` — подтверждённый повтор «I don't understand».
- `006-a14-r2-s3.png` — повтор «turn left».
- `007-les_sie_a1_e4-mission-result.png` — Mission 8/8, 100%.
- `transcript-snapshots.json`, `activities.json` — transcript и сгенерированные занятия.
- `mission-results.json`, `grammar-lint.log`, `targeted-tests.log`, `full-tests.log` — результаты проверок.
- `service-qa.mjs`, `browser-qa.ts`, `browser-qa.log` — локальные QA-скрипты и лог успешного браузерного прохода; пути импортов привязаны к текущему checkout.

`CRASH-final-state.png`, если присутствует, относится к предварительной неуспешной настройке QA, а не к финальному проходу.
