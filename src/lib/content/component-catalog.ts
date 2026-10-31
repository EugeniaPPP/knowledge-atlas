/** Authoring-facing contract; implementations remain ordinary learning components. */
export const activityKinds = ['first-choice', 'outcome-explorer', 'matrix-layers', 'dominance', 'paradox', 'motivation', 'roles', 'number-game', 'reflection'] as const;
export type ActivityKind = typeof activityKinds[number];
export const componentCatalog = {
  PayoffMatrix: { version: 2, purpose: 'Read outcomes/payoffs; compare pure strategies for both players in explain or checked practice mode' },
  NumberGuess: { version: 1, purpose: 'Snapshot a saved prior-chapter number and save independent current/revised predictions' },
  StrategyElimination: { version: 1, purpose: 'Explore a reviewed elimination procedure with explicit assumptions' },
  CommonKnowledgeHats: { version: 1, purpose: 'Compare observer and participant perspectives without revealing an unseen own hat' },
  ConceptChain: { version: 1, purpose: 'Static labelled chain of reasoning; distinguish approximate expectations from exact results' },
  Exercise: { version: 1, purpose: 'Self-contained MDX task with choice/integer parts, explicit checking and delayed analysis' },
  SelfExplanation: { version: 1, purpose: 'Local optional writing without automatic grading' },
  ChoiceGroup: { version: 1, purpose: 'Keyboard-operable single strategy or scenario selection' },
  Activity: { version: 1, kinds: activityKinds, purpose: 'Chapter 1 demonstrations; never gates reading' },
  Mastery: { version: 1, purpose: 'Single-choice questions with feedback after checking' },
  WrittenResponse: { version: 1, purpose: 'Local self-explanation and a self-check rubric' },
  QuickAnswer: { version: 1, purpose: 'Optional short answer disclosure' },
} as const;
