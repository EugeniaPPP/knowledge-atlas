# Как пользоваться author-lesson

Проектный skill: [SKILL.md](../.agents/skills/author-lesson/SKILL.md), metadata для интерфейса: [openai.yaml](../.agents/skills/author-lesson/agents/openai.yaml). Установка в глобальную папку, плагин или API key не нужны. Создан по установленному `skill-creator`; выбран тот же repository scope `.agents/skills`, что у двух уже работающих skills проекта. Это соответствует [текущей официальной документации Codex](https://learn.chatgpt.com/docs/build-skills).

## Куда положить источники

В текущем проекте создайте только папку нужной лекции:

```text
authoring/sources/yale-econ-159/lecture-03/raw/
  transcript.txt
  blackboard.pdf
  slides.pdf
  handout.pdf
```

Названия произвольные; не все виды файлов обязательны. Абсолютный путь для Лекции 3: `/Users/eugeniaposylnaya/Projects/knowledge-atlas/authoring/sources/yale-econ-159/lecture-03/raw/`. Рядом skill создаст `manifest.json` и при необходимости `extracted/`. Оригиналы не редактируются. Можно указать существующую папку или отдельные файлы: skill зарегистрирует их фактические пути без переноса/перезаписи `references/`. URL передавайте вместе с файлами, если известен оригинал.

`authoring/sources/` и `authoring/lessons/` добавлены в `.gitignore`: сюда не попадают случайные публичные copies исходников/черновиков. Проверенные производные артефакты для общего репозитория переносятся отдельно по согласованию. Наличие внешнего источника не означает разрешение зеркалировать его целиком.

## Точный запуск в этом Codex

Откройте чат в проекте `knowledge-atlas` и отправьте:

```text
$author-lesson Подготовь Blueprint для yale-econ-159/lecture-03.
Источники: authoring/sources/yale-econ-159/lecture-03/raw/.
Зарегистрируй и прочитай материалы, составь анализ и Blueprint.
Не пиши Core до моего согласования.
```

При вводе `$` можно выбрать `author-lesson` / `Author Lesson` из доступных skills. Codex обнаруживает изменения skills автоматически; если новый пункт не появился, откройте новый чат проекта, а при необходимости перезапустите Codex. Конфигурацию `~/.codex` менять не нужно. Прямой запасной запуск: «Прочитай `.agents/skills/author-lesson/SKILL.md` и выполни по нему только инвентаризацию …».

Для проверки без текста главы:

```text
$author-lesson Выполни inventory-only для yale-econ-159/lecture-03.
Папка: authoring/sources/yale-econ-159/lecture-03/raw/.
Не создавай Blueprint или учебные тексты.
```

## Как продолжать

Skill предъявит checkpoint и остановится. Ответ связывайте с показанным run/digest, например:

```text
Принимаю Blueprint пакета <показанный packageSha256>.
$author-lesson Продолжи run <путь к run>: напиши Core RU и остановись на его согласовании.
```

Дальше: принятие Core RU → Quick/Mastery RU → принятие всех трёх RU режимов → полная English adaptation + bilingual QA → совместная приёмка → структурированный integration package. Skill не должен спрашивать повторно об уже принятом неизменном этапе; он проверяет совпадение digest и продолжает ближайший разрешённый этап.

Для независимой сверки пакета:

```sh
node scripts/authoring-review.mjs inventory authoring/sources/yale-econ-159/lecture-03/raw/
node scripts/authoring-review.mjs digest authoring/lessons/yale-econ-159/lecture-03/runs/r01/review-manifest.json
```

Обе команды только читают и печатают JSON. Inventory exit 2 означает missing/empty, exit 1 — ошибку; digest exit 0 означает лишь успешный расчёт хеша. Пустые списки файлов, несуществующие пути, дубликаты и выход за пределы репозитория отклоняются. В digest включаются байты manifest и все перечисленные файлы; отдельная содержательная проверка должна подтвердить полноту списка. Helper не извлекает PDF, не проверяет математику, не удостоверяет человека и не выдаёт разрешений.

Полная схема процесса: [LESSON_AUTHORING_WORKFLOW.md](LESSON_AUTHORING_WORKFLOW.md). Результат пробного запуска: [AUTHOR_LESSON_DRY_RUN.md](AUTHOR_LESSON_DRY_RUN.md). Ни одобрение контента, ни создание skill не означает команду на commit/push/deploy.
