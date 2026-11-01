# Выбор компонентов для автора

Актуальная спецификация на основе принятого handoff Лекции 2 и действующего кода. Исторический документ с этим именем находится в `references/handoff-lecture-02/docs/` и описывает **предложенный**, местами отличающийся API. Для новых глав применять [COMPONENT_CATALOG.md](COMPONENT_CATALOG.md), реальные props и схемы. Здесь — правила выбора и существенные ограничения, без второй копии каталога.

## Минимальная карточка взаимодействия

ID; objective IDs; место/parallel block ID; педагогическая трудность и действие читателя; компонент/версия/импорт; данные/props и локализуемые строки; состояния, действия, обратная связь, independently verified expected results; persistence; keyboard/screen-reader behavior; проверки; `gatesReading: false`. Если компонент отсутствует — `needs_implementation`, почему существующие средства недостаточны и что нужно реализовать отдельно.

## Выбор

| Потребность | Реальное средство | Граница |
| --- | --- | --- |
| Повествование, принцип, формула, worked example | MDX, семантическая таблица, существующие CSS-классы | Не требуют React сами по себе |
| Необязательное пояснение | Native details/summary | Существенная оговорка остаётся в основном тексте |
| Шаг чтения | `CoreStep.astro({id,chapter})` | Произвольное число шагов, но сейчас обязательны source timestamps |
| Матрица чистых стратегий | `PayoffMatrix` с `model`, explain/practice | `[row,column]`; mixed strategies не анализируются |
| Составная задача choice/integer | `Exercise` + exports из `Assessment.tsx` | Choice — одиночный; числовой ответ — целое; разбор в MDX |
| Необязательное объяснение | `SelfExplanation({config,label})` | Один `notes.essay` на главу, без автогрейдинга |
| Исторический прогноз 1–100 | `NumberGuess({config,previousConfig?,stage?})` | Фиксированная предметная игра, не общий numeric input |
| Принятая последовательность исключения | `StrategyElimination({content,locale?})` | Проигрыватель проверенных уровней, не решатель любой игры |
| Статическая цепочка | `ConceptChain({label,items})` | Приблизительная эвристика маркируется явно |
| Две перспективы/шляпы | `CommonKnowledgeHats({content})` | Конкретная двухучастниковая модель, не движок epistemic logic |

В `PayoffMatrix` explain: `analysis={{mode:'explain'}}`; practice: `analysis={{mode:'practice'}}` плюс `task` и `config`, без принудительного reveal. Игроки и порядок выигрышей — `model.players`. Нажатие имени переключает фокус; все равные лучшие ответы сохраняются. Не передавать функции из Astro в гидратируемые React props.

`AnswerPart`, `CheckTask`, `MasteryScore` — named exports `Assessment.tsx`, а не отдельные записи version catalog; спецификация композиции регистрируется как `Exercise`. `AnalysisMatrix` — внутренняя реализация, публичный вход `PayoffMatrix`. Не добавлять новые темы в лекционно-специфичный `Activity`.

## Известные ограничения адаптера

- `lessonInteractionsSchema` и assessment translation сейчас требуют **вместе** elimination, chain, hats. Для иных глав нужна минимальная согласованная эволюция контракта; не генерировать чуждые теме placeholders.
- `CoreStep` требует временной диапазон, хотя авторский процесс допускает PDF/slides-only. До расширения renderer отсутствие достоверных времён — integration blocker, а не повод выдумать видео.
- `translateModels` локализует caption/players, но сохраняет rows/columns. Новые словесные названия стратегий требуют display-label контракта с общими stable IDs.
- Multiple selection, дробные/символические ответы и несколько независимо сохраняемых эссе пока не входят в эти API. Не обещать поддержку в спецификации существующего компонента.

Проверки выбираются по компоненту: корректность данных/результата, состояние до/после проверки, повторное редактирование, persistence, RU/EN, клавиатура, no-JS reading, 320/390/768/1440px, Light/Graphite. Новый API не должен менять принятый текст ради удобства реализации.
