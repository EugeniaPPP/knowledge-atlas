# Адаптер к текущему Astro-приложению

Прочитай до создания integration package. Истина API: исходный код, затем `docs/COMPONENT_CATALOG.md`. Изменение схем/React-компонентов — отдельная реализация, не скрытый результат авторского этапа.

## Файлы и маршруты

Целевые пути в `integration/` зеркалят репозиторий:

```text
src/content/chapters/<course>/<lesson>/
  chapter.json
  models.json                     # {} допустим, если моделей нет
  exercises.json                  # только выбранный совместимый формат
  interaction-content.json        # если выбранный формат требует
  data.ts
  {quick,core,mastery,source-notes}.mdx
  en/
    content.json
    data.ts
    {quick,core,mastery,source-notes}.mdx
src/content/concepts/<concept-id>.json
src/content/concepts/en/<concept-id>.json
```

Коллекции автоматически обнаруживают `chapter.json`, три режима и source-notes по glob в `src/content.config.ts`. Новый route-файл каждой главе не нужен. Для каталога курса потребуется согласованное изменение соответствующей записи `src/content/courses/<course>.json`. Не переопределяй существующие понятия глобально без отдельной проверки occurrences/связей.

Frontmatter всех режимов: `chapterId`, `mode: quick|core|mastery`, RU locale можно указать явно `ru`, EN — `en`. Source-notes: только `chapterId`/`locale`, без mode. Импорты относительно **будущего** места файла: RU MDX обычно `../../../../components/...`, EN на уровень глубже. `CoreStep id` и заголовок сверяются с ordered `chapter.steps`. Общий `LearningConfig` содержит `chapterId`, `contentVersion`, `stepIds`; EN меняет только locale, не storage key.

`chapterSchema` требует метаданные источника, source SHA, source IDs/links, `status: preview|published`, непустой произвольный массив steps и durations. `sourceHeader/sourceSha256` — исторический контракт baseline Core; для новой главы документируй, какой **принятый текст Core** хеширован. Хеши исходного транскрипта/PDF хранятся отдельно в source manifest. Не подставляй хеш произвольного источника ради формального поля.

**Ограничение текущего CoreStep:** каждый step требует `sourceStart/sourceEnd`, а footer строит видеоссылку. Для материала без подтверждённых времён подготовь контент и page/line locators, но укажи blocker: нужен поддерживающий такие источники renderer/schema. Не используй фиктивные 0–1 секунду. Отсутствие видео не мешает авторской работе, но может блокировать интеграцию в текущий renderer.

RU/EN маршруты уже общие: `/knowledge-atlas/courses/...` и `/knowledge-atlas/en/courses/...`. Внутренние ссылки через `sitePath`, языковые эквиваленты через `languagePath`. Не создавай авторские черновики внутри `src/content/`: `preview` **не исключает** их из статической сборки.

## Два существующих формата, ни один не универсален

Лекция 1: `exerciseSchema`, `interactionContentSchema`, `translationSchema`, `validateTranslation`, `Mastery`, `WrittenResponse`. Совместимость с ней сохраняется; новые демонстрации не добавляются как очередная ветка `Activity`.

Лекция 2: `AssessmentTask` (choice/integer parts), MDX-условия/решения, `assessmentTranslationSchema`, `validateAssessmentTranslation`, `Exercise` с `AnswerPart`, `CheckTask`, `MasteryScore`, необязательный `SelfExplanation`. Предпочитай эту композицию для задач, когда она выражает нужный тип ответа; choice сейчас **одиночный**, integer — целый. Multiple selection, вещественный допуск, символическая формула и автоматическая оценка эссе отсутствуют.

**Ограничение:** `lessonInteractionsSchema` требует elimination + chain + hats одновременно, assessment translation — тот же bundle. Для главы без них не генерируй бессмысленные placeholders. Опиши минимальное расширение локализованного контракта и его parity tests; до реализации ставь `needs_implementation`. Не копируй весь bundle только ради парсинга. Текущий skill не меняет приложение автоматически.

В EN `content.json` — metadata, `basedOnContentVersion`, текущая `terminologyVersion`, локализованные названия шагов/ссылок и captions, `modelPlayers` при наличии players, локализованные задачи/интерактивы выбранного формата. `en/data.ts` импортирует общие данные из `../data`, вызывает translate/validate и отдаёт EN-копию, а не вторую независимую матрицу. Числа, границы, keys и IDs остаются общими; одинаковость прозы проверяется отдельно по alignment.

`translateModels` локализует caption/players, сохраняет rows/columns. Если стратегия подписана полноценным русским словом, нужен согласованный механизм локализованных display labels со стабильными strategy IDs. Не меняй молча row/column идентичность и не считай перевод caption достаточным.

## Реальные композиции

```mdx
import Exercise from '../../../../components/editorial/Exercise.astro';
import PayoffMatrix from '../../../../components/activities/PayoffMatrix';
import { AnswerPart, CheckTask } from '../../../../components/activities/Assessment';
import { taskById, models, config } from './data';

<Exercise task={taskById['task-id']}>

## Полное условие принятой задачи

<PayoffMatrix model={models['model-id']} analysis={{mode: 'practice'}} task={taskById['task-id']} config={config} client:load />
<AnswerPart task={taskById['task-id']} partId="part-id" config={config} client:load />
<CheckTask task={taskById['task-id']} config={config} client:load />

<details data-task-solution hidden>
<summary>Ответ и объяснение</summary>

Принятый разбор задачи.

</details>

</Exercise>
```

Это иллюстрация API, не готовое упражнение и не шаблон всех глав. Роли задавай в `Model.players`, пары — `[row,column]`. Explain: `analysis={{mode:'explain'}}`; practice — обязательно task/config и без принудительного `revealAnalysis: true`. Вручную переданный revealAnalysis не является проверкой ответа. Не вставляй пользовательские функции как props из Astro в гидратируемый React-остров: составные controlled взаимодействия должны находиться внутри React, как в `Mastery`.

Статические определения/принципы/таблицы/details — MDX/Astro. React только для реально изменяемого состояния. Хранилище — существующий learning module; новые компонентные LocalStorage-ключи запрещены. Записанный ответ не равен скроллу, DOM вне острова не должен управляться React.

## Сохранение принятого текста

После D создай карту draft block → MDX block, отследи неизбежные технические перемещения в hero/source drawer и проверку обратного восстановления. Не меняй слова/числа/оговорки при переносе. Сначала content QA, затем structured package; для применения к `src/` требуется разрешение на интеграцию. После тестов интеграции — отдельная приёмка и отдельная авторизация commit/push/deploy. Ни создание skill, ни принятие RU/EN текста сами по себе её не дают.
