# Knowledge Atlas — project reference materials

These files are references, NOT the production source tree. Do not simply copy one giant HTML file into src/pages.

## Source of truth
- `content/Core_Lecture_01_v3.md`: approved Russian Core narrative. Keep text unchanged unless user explicitly requests editing.
- `design/atlas_modern_editorial.html` and `.png`: approved Modern Editorial visual direction. Clean white, strong sans-serif typography, cool neutrals, restrained muted violet, minimal cards, no photography.
- `prototype/knowledge_atlas_lecture_01_full.html`: latest all-in-one WORKING behavior reference. Contains Quick/Core/Mastery, unlockable steps, progress, local state. May have slight UI differences from the visual direction reference. Recreate behavior in modular Astro/React components, not by embedding the whole file.
- `sources/*`: original lecture transcript, official lecture summary and blackboard PDF. Use to verify precise academic content and timing, not to change approved Core text without discussion.

## Implementation targets
Astro + MDX + React + TypeScript, no backend initially. Preserve per-chapter navigation, three modes, progressive reveal, ability to read unlocked parts, local progress, responsive layout, and accessibility.
Do not include the source PDFs in the public build unless publication rights and need are reviewed. Prefer external links to Yale originals.
