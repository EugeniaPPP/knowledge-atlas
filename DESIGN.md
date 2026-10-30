# Modern Editorial

## Authority and intent

References: `references/design/atlas_modern_editorial.html` and `.png`. The integrated prototype supplies behavior, not a competing visual direction.

The learner reads a sustained explanation, explores a model, then returns to the argument. The interface should feel like an interactive scientific publication. Its focal points are typography and matrices, not dashboard cards.

Domain vocabulary: strategy, outcome, payoff, comparison, reasoning, coordination, principle, source. The visual signature is a numbered editorial sequence with an adjacent interactive model and restrained segmented progress.

## Foundations

| Role | Reference value |
| --- | --- |
| Ink | `#15171b` |
| Body | `#434952` |
| Reference muted | `#7e828a` |
| Faint decoration | `#a4a7ad` |
| Divider | `#e5e6e9` |
| Subtle surface | `#f6f7f8` |
| Accent (approved refinement) | `#8b72bc` |
| Accent text / focus | `#71529d` |
| Accent pale | `#f2edf9` |
| Accent border | `#a18abc` |
| Paper | `#ffffff` |

Bind components to semantic custom properties. Use a darker secondary-text token when small meaningful text needs more contrast; faint reference colors are for decoration, not essential instructions. Selected state also needs a border, control state or textual indication.

The October 2026 navigation refinement strengthens the reference lilac at the user's request. Reserve it for active mode underlines, selected controls/matrix cells, progress, principle rules and small navigation markers. Keep headings, reading text, primary action backgrounds and broad surfaces neutral.

Use locally hosted Inter Variable with Cyrillic, sans-serif fallbacks and tabular numerals in models. Body approximately 17px / 1.75, secondary copy 14px / 1.55, expressive hero approximately 40–82px with restrained negative tracking. At small widths, reduce headings before compromising reading width. Do not use serif body text.

Use a 4px spacing scale. Reading column approximately 68–74 characters. Broad page canvas with reference-like outer margins; use two columns only when both explanation and model remain readable. Long reasoning stays in a reading column. Separate sections through space and fine rules.

Depth uses fine borders and subtle surface changes. Mostly square geometry; small radii for controls. No decorative shadows, gradients, photography, oversized rounded cards or additional accent palettes. Preserve the reference's white, charcoal, cool gray and muted lilac world.

## Patterns

- The global rail has visible labels “Главы курса” and “Понятия курса”. Buttons open native side dialogs with a concise overview and links to full pages. Compact screens expose the same labelled buttons in the header.
- Place Quick / Core / Mastery below the chapter title in a sticky chapter toolbar labelled “Глава NN · Режимы этой главы”. These are chapter-local route links, with short learning-purpose hints when space allows.
- “Разделы главы” opens only the current chapter's Core steps. “Главы курса” opens the course overview. Do not use the ambiguous standalone label “Содержание”.
- Sources and editorial notes live in a separate dialog. A quiet ancillary link at the end of the chapter opens it; the approved appendix text stays intact. Progress import/export is a separate disclosure within that dialog.
- Principles: lilac rule, small numbered label, strong statement, concise explanation; not a colored card grid.
- Models: visible axes, semantic table, explicit ordering of both players' outcomes, numerical comparisons and keyboard-operable selectors.
- A Mastery strategy sequence uses native radios inside the partner's column headers. Highlight the selected column; after the learner chooses their own row, highlight the resulting cell. Label the two decisions, keep the dependent answer disabled until a column is selected, and distinguish selection from checked correctness. The matrix remains present beside the question at every stage.
- Optional explanations: native `details`, clear summary, essential reasoning outside the disclosure.
- Core remains one accumulated narrative. A completed step is accessible again. Distinguish current location, unlocked content and completion.
- Related concepts are actual links. Do not display active placeholder controls for unbuilt search, maps or note dashboards.

## States and responsive behavior

Every control has default, hover, focus, selected and disabled states where relevant. Storage and import/export expose success and failure. Dialogs close on Escape and return focus to the trigger. Use text alongside status color.

Use at least 44px practical control hit areas, visible focus rings and native radio groups. Meaningful text meets WCAG AA contrast. Avoid page-level horizontal overflow at 320px; large tables may scroll within a labelled region. Respect 200% zoom and reduced motion. Animate only explicit properties; avoid `transition: all`.

Desktop, tablet and mobile layouts share typography and component language. At compact sizes stack models after their explanatory context. Keep mode switching and source access visible; do not require hover.

## Visual acceptance

Compare initial implementation with the approved HTML/PNG. Review hero, reading measure, model proportions, spacing, selected states and navigation at 1440, 768, 390 and 320px. Use stable local fonts and deterministic local state. New screenshot baselines require visual inspection, not automatic acceptance.

## Language navigation

A quiet native-link language control lives in the persistent header: “Русский / English”, compact “RU / EN” below 550px. Use native language names and `lang`, `hreflang`, a visible underline plus `aria-current` for the selected language. No flags, modal, automatic locale redirect or new accent palette. Keep touch targets at least 44px high, and compact the brand to K/ before hiding course/chapter navigation. The switch preserves the corresponding mode and section/exercise anchor. Shared progress stays unchanged.

Both locales use the same grid, Inter, tokens and components; allow headings/captions to wrap naturally. Review English at 320/390/768/1440px, expanded Core, matrix headers, two-stage Mastery and dialogs. Do not shrink meaningful text to force Russian line lengths onto English.
