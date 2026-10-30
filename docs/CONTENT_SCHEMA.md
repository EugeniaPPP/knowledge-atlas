# Content and future authoring contract

This contract separates runtime content from editorial production. It does not implement the authoring pipeline or the `author-lesson` skill.

## Runtime package

`src/content/chapters/<course>/<lesson>/` contains `chapter.json`, `core.mdx`, `quick.mdx`, `mastery.mdx`, `source-notes.mdx`, `models.json`, `exercises.json` and `interaction-content.json` (demonstration copy, written prompt/rubric and Quick feedback). Metadata is validated through shared schemas. Stable IDs survive retitling and reordering. Do not hardcode eight steps in reusable behavior.

`source-notes.mdx` has a `chapterId` frontmatter field and belongs to the separate `sourceNotes` collection. It contains the unchanged approved source/editorial appendix, shown in the sources dialog in every mode. The preservation check reconstructs the approved Core from its narrative and appendix; moving presentation must never remove or rewrite text. Only `quick.mdx`, `core.mdx` and `mastery.mdx` generate learning-mode routes.

Runtime schemas live in `src/lib/content/schema.ts`; future editorial data contracts live in `src/lib/content/editorial-schema.ts`. These validate data shape and explicit readiness constraints; a syntactically valid editorial decision does not authenticate human authorization. No generation, approval or publication workflow is implemented.

- Chapter: `schemaVersion`, `id`, `courseId`, `slug`, `title`, `contentVersion`, `status`, `sourceHeader`, ordered `steps`, `conceptIds`, `sourceIds`, mode durations and content provenance.
- Step: `id`, `title`, source time range, concept references. Heading text remains in MDX; validation checks agreement with metadata.
- Model: stable ID, row/column strategy labels, captions, outcomes and numerical payoff matrices. Pair ordering is always row player then column player.
- Exercise: ID, objective references, prompt, optional matrix/model reference, options, correct option and feedback. Written responses have a separate rubric.
- `context` supplies any necessary local assumptions and player roles; `modelId` renders the matrix inside an exercise or written response. Exercise review checks self-containment, including all inputs needed without opening Core.
- Optional `strategySequence` supplies two stage labels, instructions and a mapping from each answer option ID to a row/column pair. The partner is selected in the matrix's column headers, then the learner chooses a row. Store the predicted column in `responses` under `mastery-<exercise-id>-partner`; preserve final pair IDs in `answers` so existing exports remain compatible. Changing the first choice clears the dependent answer. Feedback appears only after explicit checking; selection alone implies no correctness.
- Concept: stable global ID, Russian title, definition from approved text, prerequisites, related concepts and occurrences in chapters.

MDX owns the narrative and component placement. JSON owns data and references. Component implementations own behavior. Learner state is a separate versioned local document keyed by course and chapter.

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

## Future storage and skill boundaries

Source registry: `authoring/sources/<course>/<lecture>/manifest.json`, original material and extracted versions. Existing chapter 1 registry entries may reference unchanged files under `references/`.

Runs: `authoring/lessons/<course>/<lesson>/runs/<run-id>/` with analysis, evidence, three MDX drafts, models, exercises, interaction specs, validation and a human-readable review package. A rerun creates a revision instead of replacing approved work.

`author-lesson` will read these contracts, repository guidelines and the component catalog. Supported tasks: analyze, draft, validate, revise. One lesson plus relevant course context per run. Output stops at review readiness; missing sources, unknown components and unresolved factual claims remain explicit. Shared deterministic validators belong in the project, not duplicated inside skill prompts. No custom skill or generation pipeline is built in the current migration.
