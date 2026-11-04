# Content and authoring contract

This contract separates runtime content from editorial production. It does not implement the authoring pipeline or the `author-lesson` skill.

## Runtime package

`src/content/chapters/<course>/<lesson>/` contains `chapter.json`, `core.mdx`, `quick.mdx`, `mastery.mdx`, `source-notes.mdx`, `models.json`, `exercises.json` and `interaction-content.json` (demonstration copy, written prompt/rubric and Quick feedback). Metadata is validated through shared schemas. Stable IDs survive retitling and reordering. Do not hardcode eight steps in reusable behavior.

`source-notes.mdx` has a `chapterId` frontmatter field and belongs to the separate `sourceNotes` collection. It contains the unchanged approved source/editorial appendix, shown in the sources dialog in every mode. The preservation check reconstructs the approved Core from its narrative and appendix; moving presentation must never remove or rewrite text. Only `quick.mdx`, `core.mdx` and `mastery.mdx` generate learning-mode routes.

Runtime schemas live in `src/lib/content/schema.ts`; initial editorial data contracts live in `src/lib/content/editorial-schema.ts`. These validate data shape and explicit readiness constraints; a syntactically valid editorial decision does not authenticate human authorization. The project skill now guides the editorial workflow; there is no autonomous generation, approval or publication engine.

- Chapter: `schemaVersion`, `id`, `courseId`, `slug`, `title`, `contentVersion`, `status`, `sourceHeader`, ordered `steps`, `conceptIds`, `sourceIds`, mode durations and content provenance.
- `availableLocales` declares complete editions available in the current build (legacy default `ru,en`). Lecture 2 was published as `ru` first; its complete local EN review edition declares `ru,en`. Routes, catalog links, language control and hreflang derive from availability; no placeholder EN or silent fallback. This build flag does not grant editorial approval or deployment authorization.
- Step: `id`, `title`, source time range, concept references. Heading text remains in MDX; validation checks agreement with metadata.
- Model: stable ID, row/column strategy labels, captions, outcomes and numerical payoff matrices. Pair ordering is always row player then column player.
- Exercise: ID, objective references, prompt, optional matrix/model reference, options, correct option and feedback. Written responses have a separate rubric.
- `context` supplies any necessary local assumptions and player roles; `modelId` renders the matrix inside an exercise or written response. Exercise review checks self-containment, including all inputs needed without opening Core.
- Optional `strategySequence` supplies two stage labels, instructions and a mapping from each answer option ID to a row/column pair. The partner is selected in the matrix's column headers, then the learner chooses a row. Store the predicted column in `responses` under `mastery-<exercise-id>-partner`; preserve final pair IDs in `answers` so existing exports remain compatible. Changing the first choice clears the dependent answer. Feedback appears only after explicit checking; selection alone implies no correctness.
- Concept: stable global ID, localized title, definition from approved text, prerequisites, related concepts and occurrences in chapters.

MDX owns the narrative and component placement. JSON owns data and references. Component implementations own behavior. Learner state is a separate versioned local document keyed by course and chapter.

### Lecture 2 runtime additions

- `AssessmentTask`: stable `id`, `origin: lecture|editorial`, optional `modelId`, nonempty `parts`. A choice part has `id`, `label`, options with IDs and original inline copy, and a correct ID; an integer part has `id`, `label`, `min`, `max`, `correct`. IDs and keys are shared by future translations. Rich conditions and full explanations remain in MDX. One explicit check covers all parts. See `assessmentTaskSchema` and `docs/COMPONENT_CATALOG.md`.
- Matrix role copy: optional `players: {row,column,meaning}`. Numeric order is unchanged by roles or locale. The approved procedure, hats perspectives and reasoning-chain labels are in `interaction-content.json`; behavior never embeds Russian chapter copy.
- SchemaVersion 1 remains compatible: answer parts use `answers[partId]`; checked state is invalidated for all parts of an edited task. Optional writing uses `notes.essay`. There is no automatic grade for prose.
- Lecture 2 predictions use `responses['number-original'|'number-current'|'number-revised'|'number-origin']`. On first available valid prior save, snapshot Lecture 1's `responses.number`; never write the prior chapter. Without a prior save, the first explicit new save establishes the original. A slider default is not a save. The existing Lecture 1 store contains its **latest** saved number; a lost earlier historical choice cannot be recovered. A Lecture 2 export includes its snapshot, so it works without Lecture 1 on another browser. Theme remains outside chapter data.
- Approved derivative baselines and reversible markup mapping: `tests/fixtures/lecture-02-approved/`. Raw transcript/PDF and internal handoff are local/gitignored and absent from `dist`. Historical review headers move out of the rendered hero, the full source appendix moves to the existing dialog, implementation notes move to the sources dialog; wording is retained and reconstructed in tests. No new editorial approval is fabricated by this technical manifest.

`preview` does not itself prevent static output; do not push/deploy the integration without the user's explicit authorization. No publication pipeline or automatic promotion gate is implemented here.

## Editorial entities

| Entity | Required contract |
| --- | --- |
| Source | ID, type, title, author, path/URL, acquisition date, SHA-256, attribution and publication policy |
| SourceSpan | ID, source ID and hash, extraction version, locator, short excerpt/hash, verification status |
| Claim | ID, statement, kind (`fact`, `definition`, `derivation`, `example`, `editorial`), evidence links, contradictions, verification status |
| ConceptAnalysis | Concepts, prerequisites, objectives, misconceptions, notation, scope boundaries and course connections |
| InteractionSpec | ID, objective IDs, target block, component name/version, model/props, states/actions, expected results, persistence and accessibility; `needs_implementation` when unavailable |
| AuthoringRun | ID, lesson, input hashes, guideline/skill/model versions, parent revision, generated files, validation and unresolved questions |
| EditorialDecision | Human decision, reviewed package digest, reviewer, date and decision reference |

Evidence links use `supports`, `contradicts` or `context`. A target is a mode and stable block ID plus its content hash. Transcript locators use segment IDs and timestamp ranges; PDFs use one-based page numbers and optional regions; papers use URL/DOI and page/section. OCR extraction is not independent evidence. Source changes invalidate dependent locators until checked.

Important assertions need evidence. Derivations reference supported premises and reasoning. Examples may be original, but must declare assumptions rather than pretend to be source facts. Transitional prose needs no artificial citation.

## Lifecycle and publication

`draft -> ready_for_review -> approved -> published`; requested changes return to a new draft revision. Machine validation only permits `ready_for_review`. Never create an approval on behalf of the editor.

A package digest covers narrative, models, exercises, metadata and evidence. Record hashes of the used sources, guidelines and component contract. Modification makes the prior approval stale. A future production gate must include only the selected, matching human-approved revision; `status: approved` alone is not sufficient evidence. Promotion and deployment remain separate explicit actions.

The first local migrated chapter uses `status: preview`. It can be reviewed locally; no new publication approval is inferred from migration authorization. Core 3.0 wording is already approved and protected, but the migrated package still needs acceptance before public release.

## Authoring storage and skill boundaries

Source registry: `authoring/sources/<course>/<lecture>/manifest.json`, original material and extracted versions. Existing chapter 1 registry entries may reference unchanged files under `references/`.

Runs: `authoring/lessons/<course>/<lesson>/runs/<run-id>/` with analysis, evidence, three MDX drafts, models, exercises, interaction specs, validation and a human-readable review package. A rerun creates a revision instead of replacing approved work.

The project skill `.agents/skills/author-lesson/SKILL.md` reads these contracts, repository guidelines and the component catalog. Supported tasks: inventory, analyze/Blueprint, draft, validate, revise, prepare an integration package. One lesson plus relevant course context per run. Each stage stops at human review; missing sources, unknown components and unresolved factual claims remain explicit. Shared deterministic validators belong in the project, not duplicated inside skill prompts. A read-only `scripts/authoring-review.mjs` computes inventories/review digests; no autonomous generation or publication pipeline exists. See `docs/LESSON_AUTHORING_WORKFLOW.md` and the skill's `references/artifacts.md` for current bilingual working artifacts and their differences from the original Zod contracts.

## Локализация RU / EN

- `chapter.json`, `models.json`, `exercises.json`, `interaction-content.json`, три MDX и `source-notes.mdx` в корне главы — существующая русская редакция. Поле `locale` по умолчанию `ru` сохраняет совместимость.
- `en/{quick,core,mastery,source-notes}.mdx`: соответствующая английская редакция, frontmatter `chapterId`, `locale: en`, и `mode` только для учебных режимов.
- `en/content.json`: `chapterId`, `locale`, `basedOnContentVersion`, `terminologyVersion`, локализованные заголовки/описание/длительности/названия шагов и источников, `modelCaptions`, упражнения и `interactions` (включая письменный ответ, rubric и Quick feedback). `en/data.ts` применяет копию к общим данным и проверяет ID/ключи/placeholder-контракты.
- Для составных заданий лекции 2 тот же файл использует `format: assessment`, `modelPlayers`, массив `AssessmentTask` и `lessonInteractionsSchema`. `validateAssessmentTranslation` запрещает менять ID/типы/ключи/границы частей, численную лестницу, значения цепочки и видимость перспектив. Тексты условий и разборов — в EN MDX, численные модели берутся из RU-пакета.
- Лекция 3 использует `format: spatial-assessment`, общие метаданные и `modelPlayers`, `exerciseCopy: {taskId: {parts: {partId: {label, options?: {optionId: text}}}}}`, `interactions.election: ElectionCopy`. `translateAssessmentTasks` переносит только текст на общие задания, сохраняя kinds, диапазоны и ключи; проверяет точный набор ID. `electionCopySchema` требует каждую UI-строку, `validateElectionCopy` сохраняет placeholders. `allTranslationsSchema` принимает три фактических формата без фиктивных elimination/hats. `translateChapter`/`translateModels` общие для них.
- Модели и ссылки на источники берутся из общего пакета, численные данные не копируются в перевод. Упражнения пока представлены двумя JSON-наборами ради простого редактирования; `validateTranslation` запрещает расхождение ID, целей, вариантов, правильных ответов и mappings. MDX содержит локализованные объяснения тех же общих моделей.
- Понятия: `concepts/<id>.json` и `concepts/en/<id>.json`, общие ID/связи/stepId. У курса есть `title` и `titleEn`; названия оригинальных лекций Yale остаются английскими в обеих версиях.
- `src/i18n/ui.ts` — парные строки интерфейса. `src/lib/content/queries.ts` выбирает локаль явно и требует полный набор режимов; отсутствующая глава EN не заменяется русской.
- RU URL: `/knowledge-atlas/...`; EN URL: `/knowledge-atlas/en/...`. Шаблоны страниц общие, route-файлы тонкие. Языковые ссылки содержат `lang`/`hreflang`, страницы — `html.lang` и альтернативные адреса.
- `LearningConfig.locale` отвечает только за сообщения. Сохранённое состояние по-прежнему schemaVersion 1, общий chapterId и storage key: ответы, открытые шаги и заметки не дублируются по языкам. Заметки никогда автоматически не переводятся.

## Контракт author-lesson: два языка

Skill реализует редакционный процесс по этому контракту; это не автоматический pipeline. Новая лекция создаётся как общий анализ и две редакции, а не как независимые генерации без сверки. Утверждённая последовательность этапов — `docs/LESSON_AUTHORING_WORKFLOW.md`.

1. Источники сохраняют исходный язык, SHA-256 и locators; единый `SourceSpan` повторно используется в обоих языках.
2. `ConceptAnalysis` фиксирует определения/границы на исходном языке, парные термины RU/EN и версию словаря. Численные модели, objectives и InteractionSpec общие.
3. Рабочий `Claim.targets` пакета skill содержит `locale` и `blockSha256`; `parallelBlockId` связывает версии. Отдельные формулировки одного утверждения ссылаются на одни evidence spans. Для авторского примера общие assumptions и derivation; не выдавать его за цитату Yale. Исходная Zod-схема принимает один target без locale: её проекции и alignment проверяются отдельно, без заявления о встроенной поддержке расширенного формата.
4. Рабочий run фиксирует `requiredLocales: [ru,en]`, `terminologyVersion`, source/input hashes и локализованные outputFiles. Review package включает RU/EN рядом, alignment manifest (общий blockId → обе версии и хеши) и unresolved questions. Текущие Zod editorial schemas проверяют только исходную часть контракта; поддержка полного рабочего пакета описана в skill, не реализована как отдельный pipeline.
5. Валидаторы проверяют режимы/шаги/опциональные блоки/интерактивы, связи понятий, ID/ключи/формулы/матрицы/таймкоды, отсутствие пропусков/чужого языка, клавиатуру и адаптивность. Семантическое ревью отдельно проверяет полноту и естественную терминологию. Совпадение ID не доказывает смысловую эквивалентность.
6. `EditorialDecision` связывается с общим package digest обеих редакций, моделей, словаря и evidence. Одобрение только RU не разрешает публикацию EN; изменение любой редакции делает совместное одобрение устаревшим. AI не создаёт человеческое одобрение.

При изменении русского Core английский перевод помечается устаревшим через `basedOnContentVersion` и рассматривается в той же редакционной задаче. При изменении только перевода обновляется его digest/редакция, стабильный chapterId сохраняется. Расширять типы будущего pipeline следует при его реализации, после отдельного согласования.
