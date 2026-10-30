/** Authoring-facing contract; implementations remain ordinary learning components. */
export const activityKinds = ['first-choice', 'outcome-explorer', 'matrix-layers', 'dominance', 'paradox', 'motivation', 'roles', 'number-game', 'reflection'] as const;
export type ActivityKind = typeof activityKinds[number];
export const componentCatalog = {
  PayoffMatrix: { version: 1, purpose: 'Read outcomes or payoffs with explicit player ordering' },
  ChoiceGroup: { version: 1, purpose: 'Keyboard-operable single strategy or scenario selection' },
  Activity: { version: 1, kinds: activityKinds, purpose: 'Chapter 1 demonstrations; never gates reading' },
  Mastery: { version: 1, purpose: 'Single-choice questions with feedback after checking' },
  WrittenResponse: { version: 1, purpose: 'Local self-explanation and a self-check rubric' },
  QuickAnswer: { version: 1, purpose: 'Optional short answer disclosure' },
} as const;
