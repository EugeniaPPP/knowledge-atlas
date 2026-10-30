# Knowledge Atlas

Interactive Russian textbook based on Yale ECON 159. Prioritize a coherent educational narrative, readable scientific models and the approved Modern Editorial aesthetic.

## Sources of truth

1. `references/content/Core_Lecture_01_v3.md` governs chapter 1 Core wording. Do not rewrite, shorten, correct or paraphrase it without explicit editorial permission. Technical MDX markup may change; preserve every educational passage, table, heading and source note.
2. `references/design/atlas_modern_editorial.html` and `.png` govern visual direction.
3. `references/prototype/knowledge_atlas_lecture_01_full.html` governs Quick, Mastery, interactions and navigation behavior.
4. Original Yale materials govern factual verification. Report conflicts with approved content instead of silently correcting it.

Keep `references/` unchanged. Never embed the entire prototype in a production page. Leave unrelated user changes alone, including tracked `.DS_Store` files.

## Implementation boundaries

- Astro statically renders the narrative and navigation; MDX contains content, not application logic. React owns the DOM inside its own interactive islands. A small TypeScript controller owns step disclosure and navigation outside them.
- English stable identifiers; Russian educational text. Derive step counts from metadata.
- The app is hosted at `/knowledge-atlas/`. Build internal absolute links with `sitePath` from `src/lib/navigation/paths.ts`, which reads Astro's `BASE_URL`. Keep external URLs and valid chapter-relative MDX links intact. Do not hardcode domain-root links or asset paths. Keep browser tests under the deployment base.
- Reuse semantic CSS tokens and existing learning components. Follow `DESIGN.md` and `CONTENT_GUIDELINES.md`.
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

Use browser screenshots at desktop and mobile widths for significant UI changes. Review screenshots before accepting visual baselines. Do not refresh baselines merely to hide a regression. Source PDFs and authoring artifacts must be absent from `dist/`.
