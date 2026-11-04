# Knowledge Atlas

Interactive Russian/English textbook based on Yale ECON 159. Prioritize a coherent educational narrative, readable scientific models and the approved Modern Editorial aesthetic.

## Sources of truth

1. `references/content/Core_Lecture_01_v3.md` governs chapter 1 Core wording. Do not rewrite, shorten, correct or paraphrase it without explicit editorial permission. Technical MDX markup may change; preserve every educational passage, table, heading and source note.
2. `references/design/atlas_modern_editorial.html` and `.png` govern visual direction.
3. `references/prototype/knowledge_atlas_lecture_01_full.html` governs Quick, Mastery, interactions and navigation behavior.
4. Original Yale materials govern factual verification. Report conflicts with approved content instead of silently correcting it.

Keep `references/` unchanged. Never embed the entire prototype in a production page. Leave unrelated user changes alone, including tracked `.DS_Store` files.

## Implementation boundaries

- Astro statically renders the narrative and navigation; MDX contains content, not application logic. React owns the DOM inside its own interactive islands. A small TypeScript controller owns step disclosure and navigation outside them.
- Every new lesson ships in Russian and English together: Quick, Core, Mastery, optional sections, exercise feedback/rubrics, sources, metadata and concepts. Use English stable identifiers shared across languages. Derive step counts from metadata.
- Lecture 3 RU/EN was accepted for publication by the user's explicit request “опубликуй обе версии”, bound to bilingual package `51108165887547b8a7ee66f622c45682d51537ebbe897fba085f8f08724c69c3`. Both complete editions are public (`reviewOnly: false`). Keep the current contentVersion/IDs across locales unless the educational revision actually changes. Future unapproved lessons may use `reviewOnly: true`: dev and `npm run build:review` expose them, ordinary builds hide their routes/concepts.
- Lecture 2 was completed and published in Russian first, as explicitly requested. The user has now accepted Lectures 1 and 2, including their RU/EN implementations, as reference lessons for authoring. `availableLocales: ["ru", "en"]` exposes real routes. Content acceptance does not authorize commit/push/deployment. Do not substitute placeholder translations or missing routes.
- Existing unprefixed URLs remain Russian; English uses `/en/`. Use `sitePath(path, locale)` for internal navigation and `languagePath` for equivalent pages. URL determines language; do not redirect by guessed language. Keep the current mode/anchor when switching.
- Consult `docs/TERMINOLOGY.md` and `src/content/terminology/game-theory.json`. Recover English terminology from original sources before writing either version; never round-trip Russian prose into English terminology. Validate equivalence of claims, assumptions and numerical examples, not literal sentence matching.
- Share model matrices, stable step/concept/exercise/option IDs, source locators and answer keys. Localized copy lives in MDX/JSON and `src/i18n/ui.ts`, never in behavior code. Missing translations are build errors; do not silently fall back to Russian on English pages.
- Learner progress is shared across locales under the existing chapter key/schema. Keep notes verbatim; never translate or duplicate learner data. Language switching does not reset, complete or grade anything.
- The app is hosted at `/knowledge-atlas/`. Build internal absolute links with `sitePath` from `src/lib/navigation/paths.ts`, which reads Astro's `BASE_URL`. Keep external URLs and valid chapter-relative MDX links intact. Do not hardcode domain-root links or asset paths. Keep browser tests under the deployment base.
- Reuse semantic CSS tokens and existing learning components. Follow `DESIGN.md` and `CONTENT_GUIDELINES.md`.
- Use one course contents drawer for chapters and nested Core steps; expand and locate the current chapter automatically. Sources are a second view of that drawer with back/focus/scroll restoration, never another stacked modal. Keep the sticky chapter toolbar limited to modes and Core's adjacent progress; concepts remain separate. Preserve native chapter disclosures, link navigation, locked-step behavior and source access in all modes.
- Support Light and the approved Graphite dark theme through semantic tokens. Default to system appearance until a manual choice is saved. The header button switches light/dark directly, with action-labelled moon/sun icons and no menu. Appearance is global across languages/routes and stored separately at `knowledge-atlas:theme`; never include it in chapter progress, exports or reset. Keep synchronous head initialization, system-change handling, no-JavaScript fallback, native color-scheme and theme-color. Check new UI in both themes.
- Prefer native links, buttons, radio groups, tables, details and dialogs. Keep keyboard operation, visible focus and meaningful feedback.
- Progress, responses and notes go through the learning storage module, never directly from individual components to LocalStorage. Scrolling must not complete a step. Revealing all content must not mark it complete.
- MVP has no backend, authentication, telemetry or external requests for learner data. Host fonts locally. Link to Yale media instead of loading third-party embeds automatically.
- `authoring/` is outside public content; source and lesson-run folders are local/gitignored. The project skill `.agents/skills/author-lesson/SKILL.md` is authorized and documented in `docs/AUTHOR_LESSON.md`. Follow its bilingual checkpoints: Blueprint, Core RU, all RU modes, EN adaptation/bilingual approval, then a structured integration package. Never treat approved examples as fixed eight-step templates. The read-only inventory/digest helper is not an autonomous generation or publication pipeline.
- AI validation never constitutes editorial approval. Preserve approved revisions; create proposed revisions separately. A publishable revision needs an explicit human decision bound to its content digest.
- Do not commit, push, deploy or publish without explicit user authorization for that action.

## Verification

Run the relevant checks after implementation:

- `npm run check`: Astro and TypeScript.
- `npm test`: reference integrity, Core preservation, content contracts, game calculations and storage migrations.
- `npm run build`: static production output.
- `npm run test:dist`: after building, verify deployed links, island scripts, fonts and resources under the GitHub Pages base.
- `npm run test:e2e`: Playwright against a local production preview, including keyboard, persistence, responsive and accessibility scenarios.

Verify both languages: eight matching chapter-1 steps, all three modes, nine activities, seven self-contained exercises, translated dialogs/storage messages, equivalent anchors and shared progress. Run bilingual content parity checks and locale browser scenarios.

Use browser screenshots at desktop and mobile widths for significant UI changes. Review screenshots before accepting visual baselines. Do not refresh baselines merely to hide a regression. Source PDFs and authoring artifacts must be absent from `dist/`.
