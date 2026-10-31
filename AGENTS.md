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
- User-approved exception for Lecture 2: complete and review Russian first; English is the next separate step. Declare `availableLocales: ["ru"]` until EN is accepted. Do not create placeholder translations or links to unavailable EN routes. Other bilingual requirements and existing Lecture 1 remain unchanged.
- Existing unprefixed URLs remain Russian; English uses `/en/`. Use `sitePath(path, locale)` for internal navigation and `languagePath` for equivalent pages. URL determines language; do not redirect by guessed language. Keep the current mode/anchor when switching.
- Consult `docs/TERMINOLOGY.md` and `src/content/terminology/game-theory.json`. Recover English terminology from original sources before writing either version; never round-trip Russian prose into English terminology. Validate equivalence of claims, assumptions and numerical examples, not literal sentence matching.
- Share model matrices, stable step/concept/exercise/option IDs, source locators and answer keys. Localized copy lives in MDX/JSON and `src/i18n/ui.ts`, never in behavior code. Missing translations are build errors; do not silently fall back to Russian on English pages.
- Learner progress is shared across locales under the existing chapter key/schema. Keep notes verbatim; never translate or duplicate learner data. Language switching does not reset, complete or grade anything.
- The app is hosted at `/knowledge-atlas/`. Build internal absolute links with `sitePath` from `src/lib/navigation/paths.ts`, which reads Astro's `BASE_URL`. Keep external URLs and valid chapter-relative MDX links intact. Do not hardcode domain-root links or asset paths. Keep browser tests under the deployment base.
- Reuse semantic CSS tokens and existing learning components. Follow `DESIGN.md` and `CONTENT_GUIDELINES.md`.
- Support Light and the approved Graphite dark theme through semantic tokens. Default to system appearance until a manual choice is saved. The header button switches light/dark directly, with action-labelled moon/sun icons and no menu. Appearance is global across languages/routes and stored separately at `knowledge-atlas:theme`; never include it in chapter progress, exports or reset. Keep synchronous head initialization, system-change handling, no-JavaScript fallback, native color-scheme and theme-color. Check new UI in both themes.
- Prefer native links, buttons, radio groups, tables, details and dialogs. Keep keyboard operation, visible focus and meaningful feedback.
- Progress, responses and notes go through the learning storage module, never directly from individual components to LocalStorage. Scrolling must not complete a step. Revealing all content must not mark it complete.
- MVP has no backend, authentication, telemetry or external requests for learner data. Host fonts locally. Link to Yale media instead of loading third-party embeds automatically.
- `authoring/` is outside public content. No authoring pipeline or `author-lesson` skill is authorized for implementation yet. Its contract is documented in `docs/CONTENT_SCHEMA.md`.
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
