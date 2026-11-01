# Контракт авторского пакета v1

Это рабочие артефакты skill, не новая публичная Astro-коллекция. Структурные типы, уже существующие в `src/lib/content/editorial-schema.ts`, переиспользуй там, где они подходят. Не объявляй расширенные поля автоматически проверенными этими Zod-схемами.

## Источники

`authoring/sources/<course>/<lesson>/manifest.json`:

```json
{
  "schemaVersion": 1,
  "lessonId": "yale-econ-159/lecture-03",
  "sources": [],
  "gaps": []
}
```

Для каждого источника заполни: `sourceId`, `sourceType` (transcript, slides, handout, blackboard, summary, paper, web, audio, video, other), название, автор/дата или явное `unknown`, исходный язык, локальный путь/URL, дата получения, SHA-256 локальной версии, pages/duration при наличии, качество извлечения, `readStatus`, `readCoverage`, права/атрибуция, `publicationPolicy` (`link-only`, `approved-excerpt`, `unknown`). Хеш URL без скачанных байтов не вычисляется: пометь недоступный источник, а не выдавай URL за содержимое. Не записывай `readStatus: read` по одному факту наличия файла.

Оригиналы хранятся локально в `raw/`; извлечения — в `extracted/`, с версией инструмента и ссылкой на оригинал. Для PDF указывай физический номер страницы с 1; печатный номер можно добавить отдельно. Transcript span: ID сегмента и подтверждённые start/end seconds. Для слайдов — страница/номер слайда, изображений — файл/область, plain text — диапазон строк, статьи — DOI/URL + раздел/страница. Нет таймкода — нет выдуманного таймкода.

Текущие `sourceSchema` / `sourceSpanSchema` уже проверяют часть этих данных: четыре source kind, transcript/pdf/web locators. Slides/PDF могут использовать PDF locator, но новые source kinds и line/image/audio locators требуют явного адаптера или будущего расширения. Не маскируй `slides` под `summary` ради валидации.

## Run

Создавай только артефакты достигнутого этапа:

```text
authoring/lessons/<course>/<lesson>/runs/<run-id>/
  run.json
  source-inventory.json
  blueprint.md
  concepts.json
  claims.json
  spans.json
  interactions.json
  glossary-delta.json
  drafts/ru/{core,quick,mastery,source-notes}.mdx
  drafts/en/{core,quick,mastery,source-notes}.mdx
  shared/                         # только нужные модели/задания
  alignment.json
  qa.md
  review-manifest.json
  review-digest.json
  decisions.json
  integration/                    # после двуязычной приёмки
```

`run.json`: lesson/run IDs, parentRevision, требуемые локали RU/EN, текущий этап, `status: draft|ready_for_review`, используемая модель (если известна), версия skill, source/input hashes, версии правил/глоссария/API, выходные файлы, blockers/warnings/open questions. Неизвестную модель пометь `unknown`, не угадывай. Stage хранится отдельно от статуса; `ready_for_review` — готовность предъявить текущий этап, а не разрешение на публикацию.

`concepts.json`: concept IDs, RU/EN термины, границы понятий, prerequisites и зависимости, learning objectives с устойчивыми ID, misconceptions, notation, связи с существующими понятиями курса. Отделяй новые concepts от новых occurrences. Принципиально не вводи фиксированного числа objectives или разделов.

`blueprint.md`: главный вопрос/идея, переход от предыдущих знаний, scope и исключённые темы; карта objectives → объяснение → упражнение; последовательность смысловых блоков с stable IDs, вопросом, переходом, источником и временем чтения; необходимые примеры/доказательства/предпосылки, план численных проверок, действительно optional depth, план взаимодействий, новые компоненты и открытые вопросы.

## Прослеживаемость

`spans.json` — единые для RU/EN SourceSpan: source ID/hash, версия извлечения, locator, короткий excerpt и его hash, verification/method/note. OCR — способ извлечения, не независимое подтверждение. Нечитаемая клетка остаётся unverified до визуальной проверки.

`claims.json` — утверждение и его kind (`fact|definition|derivation|example|editorial`), статус, evidence с relation (`supports|contradicts|context`), premise claim IDs, reasoning и assumptions. Расширение рабочего формата: `targets: [{locale,mode,blockId,blockSha256}]`, связывающее одну мысль с обеими версиями. Существующая Zod `claimSchema` принимает один target без locale: при её использовании проверяй проекции отдельно и alignment отдельно. Наличие строки `verified` не доказывает проверку.

Значимые определения/числа/факты → подтверждающие spans. Вывод → проверенные предпосылки и доказательство. Авторский пример → явные условия, независимое решение, `origin: editorial`; он не обязан иметь фиктивную цитату из Yale. Переходному предложению не нужна искусственная ссылка. Изменение исходника делает зависимые spans непроверенными до повторной сверки.

`alignment.json`: stable parallel block ID → mode/objective IDs → RU path/anchor/hash и EN path/anchor/hash → claim/span IDs. Включи основной текст, optional depth, принципы, все условия/разборы, rubric, источники и интерактивные объяснения. Общие model/task/option IDs сопоставляются отдельно. Это смысловые блоки, не требование одинаковых абзацев.

`interactions.json`: существующий `interactionSpecSchema` плюс отдельные поля рабочего расширения: импорт/props, локализуемые labels, входы/выходы, почему выбран компонент, expected mathematical results и тесты. Для `AnswerPart`/`CheckTask`/`MasteryScore` регистрируй родительскую спецификацию `component: Exercise`, а дочерние React-острова указывай в composition: эти exports не отдельные ключи каталога. `CoreStep` — обёртка навигации, не новая graded activity. Всегда `gatesReading: false`.

`glossary-delta.json`: term ID, canonical EN, RU, определение/границы, допустимые варианты, источник/span, proposed change и версия словаря. Глобальный JSON-словарь меняется лишь при разрешённой интеграции. Существующие ID и исторические URL не переименовывай ради перевода.

## Checkpoint и digest

Для каждого A/B/C/D подготовь manifest с **полным явным списком** файлов предъявляемого пакета. Пути относительны корню репозитория. Например, для A:

```json
{
  "schemaVersion": 1,
  "lessonId": "yale-econ-159/lecture-03",
  "stage": "blueprint",
  "requiredLocales": ["ru", "en"],
  "inputFiles": ["CONTENT_GUIDELINES.md", ".agents/skills/author-lesson/SKILL.md"],
  "outputFiles": ["authoring/lessons/yale-econ-159/lecture-03/runs/r01/blueprint.md"]
}
```

Это сокращённая иллюстрация формы, **не достаточный список входов**. В реальном пакете перечисли оригиналы, extracts/registry/spans, все использованные правила и references skill, версию глоссария, каталога и API, зависимости от прошлых решений; outputs включают все оцениваемые тексты, модели, ключи, specs, alignment и QA. Для RU-stage требуемые локали остаются RU/EN, но английские черновики ещё не должны существовать. Этапы helper: `blueprint`, `core-ru`, `modes-ru`, `bilingual`, `integration`.

```sh
node scripts/authoring-review.mjs digest authoring/lessons/yale-econ-159/lecture-03/runs/r01/review-manifest.json
```

Helper читает файлы и выдаёт `inputSha256`, `packageSha256`, file hashes; ничего не одобряет и не переносит в приложение. Сохрани stdout в `review-digest.json`. Не включай в manifest сам manifest, digest или новое решение, чтобы не создавать циклический хеш. Manifest/header и каждый перечисленный путь/байты входят в вычисление; неперечисленные файлы helper не обнаруживает. Полнота manifest — отдельная QA-проверка. Перед продолжением пересчитай digest и сравни с фактически рассмотренным.

`decisions.json` создавай/дополняй только после человеческого ответа: checkpoint, lesson/run/revision, scope/locales, решение, package/input hashes, дата, кто согласовал (как известно из сессии), точная цитата/ссылка на сообщение. Не заполняй отсутствующие сведения вымышленным именем. `EditorialDecision` проверяет форму записи, а не личность или подлинность решения. RU approvals не разрешают EN или deploy. При новой редакции сохраняй старые файлы/решение и укажи supersededBy; не переписывай принятую редакцию.
