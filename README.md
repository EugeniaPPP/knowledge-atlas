# Knowledge Atlas

Интерактивный учебник по Yale ECON 159: Game Theory. Русский текст, режимы Quick / Core / Mastery, локальные ответы и прогресс. Статическое приложение на Astro, MDX и React.

## Разработка

Node.js 24; npm и `package-lock.json`.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
npm run test:dist
npm run test:e2e
```

Браузеры Playwright устанавливаются отдельно: `npm exec playwright install`. На macOS тесты Chromium автоматически используют установленный Google Chrome, если он доступен. Функциональные сценарии выполняются также в Firefox и WebKit; визуальные эталоны фиксируются в Chromium и принимаются после просмотра.

Для локального просмотра собранной версии: `npm run build`, затем `npm run preview`. Остановка фонового preview-сервера Astro: `npm exec astro preview stop`.

Локальный сайт открывается с префиксом **http://127.0.0.1:4321/knowledge-atlas/**. Тот же префикс используется при разработке, preview и публикации.

Если порт 4321 уже занят сервером разработки, запусти preview на другом порту (`npm run preview -- --port 4322`) и проверки через `PLAYWRIGHT_PORT=4322 npm run test:e2e`.

## GitHub Pages

Автоматическая публикация при push в `main` настроена на **https://eugeniappp.github.io/knowledge-atlas/**. Настройка GitHub и локальная проверка описаны в [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Commit и push выполняются после явного подтверждения пользователя.

## Правила

- `AGENTS.md` — работа с репозиторием и границы изменений.
- `DESIGN.md` — утверждённая система Modern Editorial.
- `CONTENT_GUIDELINES.md` — редакционные и учебные принципы.
- `docs/CONTENT_SCHEMA.md` — формат контента, источники и будущий authoring workflow.
- `references/` — исходные референсы, сохраняются без изменений.

Первая глава доступна в режимах Quick, Core и Mastery. Authoring pipeline и навык `author-lesson` будут реализованы отдельно после согласования. Пользовательские данные не отправляются во внешние сервисы.
