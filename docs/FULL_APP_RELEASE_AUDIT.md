# Full App Release Audit

**Дата:** 30 сентября 2026
**Проверенная ревизия:** `5118d8c` (`docs(content): freeze B2 level after full QA`)
**Объект:** Speak in English как целое beta/release-приложение
**Контент:** A1–B2, 69/69; frozen content и curriculum во время аудита не менялись
**Production:** не затрагивался

## Итог

Release Fix Block 2 завершён: все **P0/P1/P2 закрыты**. Daily routes имеют единый auth state, session context больше не перекрывает диалог, Course масштабируется до B2, визуальные fallback единообразны, а grammar, My English и Review используют learner-facing presentation. Frozen curriculum/content не менялись; production не затрагивался.

Сводка backlog:

| Severity            | Количество | Beta status                 |
| ------------------- | ---------: | --------------------------- |
| P0 blocker          |          0 | закрыто Release Fix Block 1 |
| P1 release-critical |          0 | закрыто Release Fix Block 1 |
| P2 polish           |          0 | закрыто Release Fix Block 2 |
| P3 nice-to-have     |          2 | можно оставить на post-beta |
| **Открыто**         |      **2** | только P3                   |

## Как проводился аудит

- Chromium/Playwright, локальный Vite и настоящие Hono handlers с одноразовой SQLite; API-ответы для основных flow не были моками.
- Публичный production-mode preview: Welcome, Demo, Demo Result и fail-closed поведение защищённых данных без Telegram.
- Авторизованный product flow: onboarding-ready, placement start/result, Today, Course, My English, My Space, Session, Review empty/due, Mission PASS/FAIL.
- Viewports: `390×844`, `320×568`, `320×420` (состояние с уменьшенной высотой как при клавиатуре), `430×932`.
- Проверены reload и повторный `start`: один и тот же `sessionId` возвращается после reload; прогресс не дублируется.
- Проверены loading/error/empty states, прямые URL, визуальные locks, review due/empty, полный A1 smoke и имеющиеся актуальные freeze-прогоны A1–B2.
- Отдельными API-воспроизведениями проверены завершённый A1 и запрет старта A2 для пользователя с `current_cefr_level = A1`.
- Полный test suite, typecheck обоих приложений, preview build, grammar lint, schema/reference/contiguity/seed-idempotency проверки.

Локальный Wrangler не запускался: установленный `workerd` требует macOS 13.5+, а машина аудита работает на macOS 12.6. Это ограничение локального runtime, а не finding приложения. Авторизованный E2E выполнен тем же способом, который уже используется в `verify-session-dialogue.mjs`: React + реальные Hono handlers + одноразовая SQLite + подписанный dev-auth.

## Backlog

### REL-001 — после завершения уровня нет перехода на следующий уровень — **ЗАКРЫТО**

- **Экран/flow:** последняя Mission A1/A2/B1 → Today/Course → следующий уровень.
- **Как воспроизвести:** пройти все 11 A1 situations и их Missions; открыть Today или Course; затем запросить старт `sit_a2_people_01`.
- **Фактическое поведение:** пользователь остаётся на A1; `Course` возвращает `11/11`, оставляет последнюю A1 situation текущей, `Today` возвращает `action: none`; старт A2 отвечает `wrong_level`. Аналогичного механизма перехода A2→B1 и B1→B2 нет.
- **Ожидаемое поведение:** после подтверждённого завершения уровня приложение предлагает и атомарно открывает следующий уровень, сохраняя историю и capabilities предыдущего уровня. После B2 показывается честный финальный state.
- **Severity:** **P0 blocker**.
- **Предполагаемая причина:** `current_cefr_level` устанавливается только placement; completion Mission обновляет capability/rewards, но не уровень. `getCourse` и `getToday` читают только текущий уровень, а `checkLessonEligibility` запрещает любой другой. Полностью пройденный Course специально оставляет последний эпизод `currentEpisodeId`.
- **Рекомендуемое исправление:** добавить явную серверную модель level completion/transition и идемпотентный переход A1→A2→B1→B2; определить UX подтверждения перехода и финальный B2 state; покрыть API и E2E переходами каждого уровня. Не менять frozen curriculum/content.
- **Исправление:** успешная последняя Mission атомарно переводит A1→A2→B1→B2; Course/Today/preview/start идемпотентно сверяют старые полностью завершённые уровни. После B2 следующий lesson отсутствует, Today показывает честное завершение уровня.

### REL-002 — визуальные locks не соответствуют backend prerequisites и обходятся прямым URL — **ЗАКРЫТО**

- **Экран/flow:** Course → заблокированная будущая situation → прямой deep link.
- **Как воспроизвести:** на свежем A1 увидеть 10 строк с «Сначала закончи предыдущую ситуацию»; открыть `/course/sit_a1_health_01`, нажать «Начать».
- **Фактическое поведение:** Course показывает настоящий lock и disabled-кнопку, но Episode Preview доступен по URL, а backend успешно создаёт session последней A1 situation. В аудите получен реальный `sessionId`.
- **Ожидаемое поведение:** либо последовательный prerequisite должен одинаково применяться в API, preview и Course, либо Course должен показывать будущие элементы как доступные/«впереди» без ложного обещания блокировки.
- **Severity:** **P1 release-critical**.
- **Предполагаемая причина:** `coursePathState.ts` ввёл клиентский lock, а `checkLessonEligibility` проверяет только принадлежность уровню. Комментарии `curriculumService.ts` и approved product docs по-прежнему говорят, что backend prerequisite-системы нет.
- **Рекомендуемое исправление:** выбрать единую release-модель. Для последовательного курса предпочтительно добавить server-side prerequisite check и вернуть отдельный код ошибки; закрыть прямые preview/session URL и добавить E2E bypass-test.
- **Исправление:** один backend access-check теперь обслуживает preview и session start; доступна первая незавершённая либо уже начатая/пройденная situation, остальные возвращают `prerequisite_locked` (403). Course использует ту же модель состояний.

### REL-003 — onboarding-ready ломается на узком mobile и прячет CTA — **ЗАКРЫТО**

- **Экран/flow:** onboarding → «Всё готово» → placement.
- **Как воспроизвести:** открыть `/onboarding/ready` при `390×844` и `320×568`.
- **Фактическое поведение:** при 390 px CTA начинается на `y=814.9`, его низ находится за границей viewport (`868.9 > 844`). При 320 px CTA также далеко ниже fold, а документ имеет горизонтальный overflow **60 px** (`scrollWidth 380` при viewport 320).
- **Ожидаемое поведение:** CTA полностью виден или очевидно доступен вертикальной прокруткой; декоративные элементы не увеличивают ширину документа; safe-area соблюдён.
- **Severity:** **P1 release-critical**.
- **Предполагаемая причина:** большие абсолютно позиционированные `.blob` выходят за границы `.has-blobs`, у которой нет clipping; `.center-screen` центрирует высокий набор элементов без компактного breakpoint.
- **Рекомендуемое исправление:** ограничить декоративные blobs через `overflow: clip`/локальный wrapper, добавить compact-height breakpoint и проверить CTA на 320/360/375/390 px плюс iOS safe-area.
- **Исправление:** blobs снова абсолютно позиционированы и локально обрезаются; CTA полностью видим и кликабелен при 320×568 и 390×844, horizontal overflow отсутствует, существующие safe-area paddings сохранены.

### REL-004 — Mission FAIL показывает технический `0` вместо situation glyph — **ЗАКРЫТО**

- **Экран/flow:** Mission FAIL (и любой result без reward) для ситуаций вне первых пяти A1.
- **Как воспроизвести:** провалить Mission, например `sit_b2_people_01`.
- **Фактическое поведение:** cue показывает `0 Обсудить спорную тему с другом`.
- **Ожидаемое поведение:** нейтральная иконка сцены/ситуации без технической цифры.
- **Severity:** **P1 release-critical**.
- **Предполагаемая причина:** `SessionResult` вызывает `situationGlyph(result.episodeId, 0)`, а mapping содержит только `les_sie_a1_e1..e5`; fallback печатает переданную позицию. Дефект затрагивает остальные 64 frozen situations.
- **Рекомендуемое исправление:** использовать общий `sceneIcon`/семантический fallback либо не показывать glyph; добавить screenshot/assertion для unmapped A2/B1/B2 Mission FAIL.
- **Исправление:** непозиционный result cue использует нейтральный SVG fallback и больше не показывает sentinel `0`; B2 FAIL проверен в Chromium.

### REL-005 — возврат в первую незавершённую session подписан как «Начать» — **ЗАКРЫТО**

- **Экран/flow:** начать первую session situation → выйти на Today/reload → вернуться.
- **Как воспроизвести:** открыть первую A1 session, не завершать ни одного захода, перейти на Today.
- **Фактическое поведение:** backend правильно возвращает ту же active session и тот же `sessionId`, но Today показывает «Сегодняшняя ситуация» и CTA «Начать».
- **Ожидаемое поведение:** «Продолжаем ситуацию» / «Продолжить» для любой active session, включая первый незавершённый заход.
- **Severity:** **P1 release-critical**.
- **Предполагаемая причина:** `resolveTodayCta` и eyebrow смотрят только на `episode.sessionsDone > 0`, игнорируя уже известный `TodayAction = session` и наличие active session.
- **Рекомендуемое исправление:** добавить в DTO явный resume-state либо различать `start`/`resume` action на сервере; не выводить resume из счётчика завершённых sessions.
- **Исправление:** `state = learning` считается resume даже при `sessionsDone = 0`; Today и Course показывают «Продолжить», backend возвращает тот же active session.

### REL-006 — прямые защищённые страницы вне Telegram сообщают об ошибке сети — **ЗАКРЫТО**

- **Экран/flow:** `/today`, `/course`, `/my`, `/my/space` вне Telegram.
- **Как воспроизвести:** открыть production-mode preview прямым URL без Telegram initData.
- **Фактическое поведение:** данные fail-closed, но пользователь получает «Проверь связь» вместо объяснения, что приложение нужно открыть через Telegram.
- **Ожидаемое поведение:** единый auth-specific state/redirect «Открой приложение через Telegram».
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** эти routes находятся вне `RequireAuthenticated`; каждая страница преобразует 401 в общий network `ErrorState`.
- **Рекомендуемое исправление:** поместить daily shell под auth gate либо типизировать 401 отдельно от transport/server errors.
- **Исправление:** весь daily shell (`Today`, `Course`, `My English`, `My Space`, preview/privacy) помещён под общий `RequireAuthenticated`; прямой вход показывает единый Telegram-specific state.

### REL-007 — `Ситуация: …` остаётся поверх сцены и пересекается с dialogue bubble — **ЗАКРЫТО**

- **Экран/flow:** любая Session, каждый activity.
- **Как воспроизвести:** открыть `les_sie_a1_e1/session` или любую authored situation.
- **Фактическое поведение:** pill постоянно расположен поверх сцены; верхняя часть NPC bubble проходит под ним/касается его. Контекст повторяется на каждом activity.
- **Ожидаемое поведение:** situation label появляется как intro-only/fade или занимает отдельное место без пересечения с репликами.
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** `Session` всегда передаёт `sceneChip(scene)`, а `.scene__label` и `.scene__dialogue` используют пересекающиеся absolute offsets.
- **Рекомендуемое исправление:** показывать label только при первом входе/коротко анимировать исчезновение; оставить dialogue layout стабильным.
- **Исправление:** situation chip показывается только на первом activity первой session, имеет отдельное место и плавно исчезает; последующие activities/sessions его не рендерят. Mission label остаётся осмысленным persistent context.

### REL-008 — Course плохо масштабируется на B2 — **ЗАКРЫТО**

- **Экран/flow:** Course пользователя B2.
- **Как воспроизвести:** открыть B2 Course с 22 situations.
- **Фактическое поведение:** 16 chapters рендерят одинаковый крупный hero-блок; full-page screenshot имеет высоту **8293 px** при viewport 844 px. Текущая situation позднего chapter требует длинной ручной прокрутки; автопозиционирования к current node нет.
- **Ожидаемое поведение:** уровень и общий прогресс видны один раз; chapters остаются быстро сканируемыми; приложение приводит к текущему узлу.
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** `ChapterPath` повторяет `course-hero` для каждого module, а Course не сворачивает завершённые главы и не скроллит к `currentEpisodeId`.
- **Рекомендуемое исправление:** один level header, компактные chapter headers/progress, сворачивание завершённых глав или безопасный scroll-to-current.
- **Исправление:** Course имеет один общий hero/progress; главы стали компактными раскрываемыми секциями, открыта только текущая, а поздний current chapter автоматически приводится в viewport. B2 сократился с 8293 px до менее 3500 px без horizontal overflow.

### REL-009 — визуальная система контента не покрывает весь A1–B2 — **ЗАКРЫТО**

- **Экран/flow:** Course thumbnails и Session cast после первых A1 situations.
- **Как воспроизвести:** сравнить первые пять A1 rows/sessions с поздними A1, A2, B1 и B2.
- **Фактическое поведение:** только первые пять A1 situations имеют отдельные thumbnails; остальные используют повторяющиеся scene icons. Часть cast states выглядит как плоский coded fallback рядом с фотореалистичными backgrounds/Kvo.
- **Ожидаемое поведение:** последовательная визуальная иерархия и согласованный стиль персонажей во всём frozen course.
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** art manifest предусматривает fallback, но production art set заполнен частично.
- **Рекомендуемое исправление:** подготовить release art inventory и закрыть наиболее заметные recurring cast states/thumbnails; сохранить существующие scene/cast mappings.
- **Исправление:** до появления полного атомарного raster-набора все recurring cast states используют одну завершённую editorial SVG-систему; каждый Course thumbnail теперь системно собирается из authored scene/cast mapping. Частичный raster-набор больше не меняет стиль персонажа посреди курса.

### REL-010 — статистика My English обрезает русские подписи — **ЗАКРЫТО**

- **Экран/flow:** My English, верхние три metric cards, viewport 390 px и уже.
- **Как воспроизвести:** открыть `/my` на `390×844`.
- **Фактическое поведение:** «закреплено» отображается как `закрепле…`; карточки выглядят как обрезанные системные данные.
- **Ожидаемое поведение:** все три короткие подписи читаются полностью.
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** три flex-карточки с фиксированными icon/padding и принудительным `text-overflow: ellipsis`.
- **Рекомендуемое исправление:** уменьшить gap/padding, разрешить перенос или перейти на компактный grid при узкой ширине.
- **Исправление:** метрики переведены на responsive grid; подписи не используют ellipsis, а на 320 px вторичные иконки скрываются, сохраняя полные «встречено / закреплено / пройдено».

### REL-011 — grammar card использует внутренние англоязычные названия правил — **ЗАКРЫТО**

- **Экран/flow:** grammar activities, особенно A1/A2.
- **Как воспроизвести:** дойти до grammar card `gr_a1_be_positive`.
- **Фактическое поведение:** learner видит заголовок `Be - positive`, затем формулу и русское объяснение. Заголовки неоднородны и выглядят как taxonomy автора курса.
- **Ожидаемое поведение:** beginner-facing функциональный заголовок на русском, а английская construction/formula остаётся примером.
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** `ActivityPanel` напрямую выводит `activity.content.title` из grammar seed; отдельного presentation label нет.
- **Рекомендуемое исправление:** добавить UI-localized display title/presentation mapping без изменения frozen grammar classification и authored targets.
- **Исправление:** UI-only presentation mapping показывает русскую коммуникативную функцию; authored pattern title, ID, formula, explanation и scoring не менялись.

### REL-012 — пустой Review показывает действие, которое ничего не делает — **ЗАКРЫТО**

- **Экран/flow:** новый пользователь → Review empty → «Хочу ещё».
- **Как воспроизвести:** открыть Review до встречи с любым learning item и нажать «Хочу ещё».
- **Фактическое поведение:** start extra practice возвращает `nothing_due`; UI ловит ошибку и возвращается к тому же empty screen без объяснения.
- **Ожидаемое поведение:** скрыть/disable CTA до появления памяти либо объяснить, что сначала нужно пройти situation.
- **Severity:** **P2 polish**.
- **Предполагаемая причина:** CTA зависит только от `due === 0`, а не от общего числа memory items/возможности extra practice.
- **Рекомендуемое исправление:** вернуть `availableForExtra`/memory count в overview и условно показывать CTA.
- **Исправление:** review overview возвращает `availableForExtra`; «Хочу ещё» показывается только при существующей памяти, а новый пользователь видит объяснение, что сначала нужно пройти ситуацию.

### REL-013 — число `+15` в пустом My Space не объяснено

- **Экран/flow:** My Space нового пользователя.
- **Как воспроизвести:** открыть `/my/space` до первой Mission.
- **Фактическое поведение:** над Kvo показано `+15`, хотя рядом нет подписи; это легко принять за валюту/XP, которых продукт намеренно не использует.
- **Ожидаемое поведение:** понятный сигнал «ещё 15 воспоминаний» либо менее числовой preview будущего наполнения.
- **Severity:** **P3 nice-to-have**.
- **Предполагаемая причина:** `room-slot--more` выводит количество всех locked reward objects без label.
- **Рекомендуемое исправление:** добавить короткий accessible/context label или заменить count на нейтральную визуальную подсказку.

### REL-014 — Course не показывает текущий CEFR level в шапке

- **Экран/flow:** Course на A1/A2/B1/B2.
- **Как воспроизвести:** открыть Course после placement.
- **Фактическое поведение:** первый hero говорит только «Курс» и название главы; при одинаковом фоне уровни визуально неразличимы.
- **Ожидаемое поведение:** компактный A1/A2/B1/B2 context рядом с общим заголовком.
- **Severity:** **P3 nice-to-have**.
- **Предполагаемая причина:** `CourseResponse.level` доступен, но `Course.tsx` его не выводит.
- **Рекомендуемое исправление:** добавить существующий level pill без изменения curriculum или navigation.

## Результаты по системам

| Область                     | Результат | Примечание                                                                         |
| --------------------------- | --------- | ---------------------------------------------------------------------------------- |
| Welcome + Demo              | PASS      | Нет horizontal overflow на 390/320; dialogue order и word bank работают            |
| Onboarding                  | PASS      | REL-003 закрыт; CTA и overflow проверены на 320×568 и 390×844                      |
| Placement / level selection | PASS      | Adaptive A1/A2/B1/B2 classification, persistence, idempotency и result UI проходят |
| Today                       | PASS      | Межуровневое продолжение, resume и auth entry согласованы                          |
| Course                      | PASS с P3 | Locks/API и B2 scaling проходят; остаётся только REL-014                           |
| My English                  | PASS      | capability states честны, все mobile metric labels читаются                        |
| My Space                    | PASS с P3 | persistence/rewards/companion покрыты; остаётся REL-013                            |
| Session / transcript        | PASS      | semantic turns, intro-only context, authored replies и reload/resume проходят      |
| Mission PASS/FAIL           | PASS      | scoring/capability/rewards сохранены; технический `0` устранён                     |
| Practice Variations         | PASS      | transfer plans и separation от Mission проходят frozen QA/tests                    |
| Near/Far Review             | PASS      | SRS отдельно от Practice; empty/extra/resume/scheduling/consolidation проходят     |
| Межуровневый переход        | PASS      | A1→A2→B1→B2 и финальный B2 state проверены                                         |
| Locked/prerequisites        | PASS      | Course, preview и start используют одну sequential policy                          |
| Loading/error/empty         | PASS      | единый auth entry и честный Review empty state                                     |
| Mobile/keyboard/scroll      | PASS      | 320/390/430, keyboard-height, safe-area, CTA и horizontal overflow проверены       |
| Frozen A1–B2 regression     | PASS      | 69 plans structurally valid; grammar/content/reference checks зелёные              |

## Automated QA

- `pnpm test`: **429/429 PASS** — API 332, web 91, shared 6.
- `pnpm typecheck`: **PASS** — contracts, shared, learning-engine, API, web и test/QA tsconfigs.
- Preview build: **PASS**.
- Grammar classification lint: **0 errors, 0 advisory notes**, 69 worksheet situations, 67 situations с grammar target.
- Seed fresh import: **PASS**.
- Seed idempotency/reseed-in-place: **PASS**.
- Schema, invalid references, order-index contiguity: **PASS**.
- Все 69 A1–B2 lessons строят валидный activity plan: **PASS**.
- Старые сохранённые pre-marker plans: `restoreDialogueTurns` восстанавливает semantic turns; review остаётся non-spoken: **PASS**.
- Session reload/resume и result reload: **PASS**.
- Practice и Review resume/idempotency: **PASS**.
- Свежий Chromium A1 smoke: A1.1–A1.5 Mission PASS, A1.1 Mission FAIL, transcript assertions: **PASS**.
- Полные freeze Chromium-артефакты остальных A1, всех A2/B1/B2 сохранены; после freeze frozen content не менялся.
- Release Fix Block 1 Chromium regression (`verify-release-fix-block1.mjs`): **PASS** — level boundaries, final B2, locks, resume, onboarding mobile и B2 Mission FAIL.
- Release Fix Block 2 Chromium regression (`verify-release-fix-block2.mjs`): **PASS** — auth entry, intro fade, compact B2 Course/autoscroll, unified art, My English 320/390, localized grammar, Review empty и keyboard-height CTA.

## Скриншоты и артефакты

Новый release-audit набор находится в `artifacts/qa/full-release-audit/` (19 representative screenshots + `observations.json`). Основные файлы:

- `01-welcome-390x844.png`, `02-welcome-320x568.png`
- `02a-onboarding-ready-390x844.png`, `02b-onboarding-ready-320x568.png`, `02c-placement-start.png`
- `03-today-fresh.png`, `04-course-fresh.png`
- `05-locked-future-session-start.png`, `06-session-in-progress.png`, `07-today-resume.png`
- `08-my-english-learning.png`, `09-my-space-initial.png`
- `10-review-empty.png`, `11-review-due.png`
- `12-session-keyboard-height.png`, `13-session-430x932.png`
- `14-today-error.png` … `17-my-space-error.png`
- `18-course-a1-complete.png`, `19-today-a1-complete.png`

Публичный preview QA обновил `artifacts/qa/findings.json` и screenshots Welcome/Demo/unauthenticated states. Полные session/Mission snapshots находятся в `artifacts/qa/session-dialogue/`, включая PASS/FAIL результаты и B2 Course.

Release Fix Block 2 before/after screenshots находятся в `artifacts/qa/release-fix-block2/`: auth entry, A1/B2 Course, Session intro, grammar card, My English 320/390 и Review empty.

## Что мешает beta

P0/P1/P2 findings отсутствуют. Открыты только два P3: пояснение `+15` в пустом My Space (REL-013) и CEFR context в Course header (REL-014). Они не блокируют beta и в Release Fix Block 2 намеренно не менялись.

## Release Fix Block 1 — verification

- Backend regression: переходы A1→A2, A2→B1, B1→B2, финальный B2 и старый уже завершённый A1 account — **PASS**.
- Access regression: Course locks, direct preview и direct session start согласованы; bypass получает 403 — **PASS**.
- Chromium: Today после каждого level completion, resume первой session, Mission FAIL B2, onboarding 320×568 и 390×844 — **PASS**.
- Representative screenshots: `artifacts/qa/release-fix-block1/`.
- Frozen A1–B2 content/curriculum: без изменений.

## Release Fix Block 2 — verification

- Все семь P2 (REL-006–REL-012): **закрыты**.
- Chromium/mobile: 320×420, 320×568, 390×844; changed screens reviewed — **PASS**.
- B2 Course: один hero, 16 компактных глав, одна раскрытая current chapter, autoscroll; document height <3500 px — **PASS**.
- UI presentation: authored grammar/content IDs, classifications, scene/cast mappings и scoring не менялись.
- Representative before/after screenshots: `artifacts/qa/release-fix-block2/`.
