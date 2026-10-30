# Публикация на GitHub Pages

Репозиторий: `EugeniaPPP/knowledge-atlas`, ветка `main`. Репозиторий уже публичный: для него доступна бесплатная публикация GitHub Pages.

Адрес после первого успешного deploy: **https://eugeniappp.github.io/knowledge-atlas/**.

## Что настроено в проекте

- `astro.config.mjs`: `output: 'static'`, `site: 'https://eugeniappp.github.io'`, `base: '/knowledge-atlas'`, `trailingSlash: 'always'`.
- `sitePath()` добавляет `import.meta.env.BASE_URL` к внутренним путям навигации и favicon. Импортированные CSS, JavaScript, шрифты и React islands получают префикс при сборке Astro. Относительные ссылки между режимами в MDX сохраняются.
- `.github/workflows/deploy.yml` запускается при push в `main`; доступен и ручной запуск из Actions. Deploy разрешён только из `main`.
- Сборка использует Node.js 24, `actions/checkout@v7` и официальный `withastro/action@v6`. Перед загрузкой `dist/` выполняются проверка типов, тесты контента/логики, сборка и проверка путей готового сайта.
- Отдельный job с `actions/deploy-pages@v5` публикует артефакт в окружение `github-pages`. Только этот job получает права `pages: write` и `id-token: write`. Публикации выполняются последовательно.
- Публикуется только `dist/`. Исходные материалы `references/`, редакционные файлы и исходники приложения не копируются на сайт. Публичный GitHub-репозиторий при этом содержит те файлы, которые будут закоммичены в него.

Формат локального прогресса общий для языков. Русские адреса сохраняются; английские добавляют `/en/` после `/knowledge-atlas/`. Отдельная настройка GitHub Pages для второго языка не требуется.

## Действия вручную в GitHub

1. Открой [Settings → Pages](https://github.com/EugeniaPPP/knowledge-atlas/settings/pages).
2. В **Build and deployment → Source** выбери **GitHub Actions**. Используется уже подготовленный workflow из репозитория; генерировать второй workflow не требуется.
3. Если Actions отключены, включи их в **Settings → Actions → General**. При ограничениях списка actions разреши используемые официальные GitHub/Astro actions и их зависимости.
4. После согласованного commit и push всех необходимых файлов приложения и workflow в `main` открой **Actions → Deploy Knowledge Atlas to GitHub Pages** и дождись успешных `build` и `deploy`.
5. Для повторного запуска используй **Run workflow** с веткой `main`. При включённом подтверждении окружения `github-pages` одобри deployment в интерфейсе GitHub.

Workflow использует встроенный `GITHUB_TOKEN`. Добавлять персональный токен, секреты, отдельную ветку `gh-pages` или настраивать собственный домен не требуется.

Commit и push выполняются только после явного подтверждения пользователя. Локальные проверки не подтверждают успешный удалённый deploy: результат каждого запуска виден в GitHub Actions.

## Локальная проверка той же сборки

```sh
npm run check
npm test
npm run build
npm run test:dist
npm run preview -- --port 4322
PLAYWRIGHT_PORT=4322 npm run test:e2e
```

Открывай **http://127.0.0.1:4322/knowledge-atlas/**. При `npm run dev` используй тот же префикс на порту сервера разработки, обычно 4321. Остановка тестового preview: `npm run preview -- stop`.

Playwright проверяет русские и английские Quick/Core/Mastery, переключение языка с общим прогрессом, переходы между режимами, интерактивные матрицы, восстановление ответов и заметок после обновления, экспорт/импорт, клавиатуру, доступность, мобильные экраны и существующие визуальные эталоны. Пути проверяются под `/knowledge-atlas/`, включая CSS, шрифты и JavaScript React islands.

Прогресс с localhost автоматически не переезжает на домен GitHub Pages: это разные хранилища браузера. Для переноса используй **Источники → Сохранение и перенос прогресса → Экспортировать JSON**, затем импорт на опубликованном сайте. На GitHub Pages прогресс остаётся локальным; публикация сайта не загружает ответы или заметки на сервер.

## Официальные инструкции

- [Astro: GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [withastro/action](https://github.com/withastro/action)
- [GitHub: выбор источника публикации](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub: доступность Pages на разных тарифах](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
