import type { Model } from '../content/schema';

export type Player = 'row' | 'column';
export type Relation = 'strict' | 'weak' | null;
export function compareStrategies(a: number[], b: number[]): Relation {
  if (!a.length || a.length !== b.length || [...a, ...b].some((n) => !Number.isFinite(n))) throw new Error('Invalid payoff vectors');
  if (a.every((v, i) => v > b[i])) return 'strict';
  if (a.every((v, i) => v >= b[i]) && a.some((v, i) => v > b[i])) return 'weak';
  return null;
}

/** Pure-strategy analysis. Best replies and dominance are independent computations. */
export function analyzePayoffs(model: Model, player: Player) {
  const names = player === 'row' ? model.rows : model.columns;
  const opponents = player === 'row' ? model.columns : model.rows;
  const values = names.map((_, s) => opponents.map((_, o) => player === 'row' ? model.payoffs[s][o][0] : model.payoffs[o][s][1]));
  const pairwise = values.map((a, i) => values.map((b, j) => i === j ? null : compareStrategies(a, b)));
  const bestRepliesByOpponent = opponents.map((_, o) => {
    const max = Math.max(...values.map((v) => v[o]));
    return names.flatMap((_, s) => values[s][o] === max ? [s] : []);
  });
  const dominant = names.map((_, s): Relation => {
    const others = pairwise[s].filter((_, o) => o !== s);
    if (!others.length) return null;
    return others.every((r) => r === 'strict') ? 'strict' : others.every(Boolean) ? 'weak' : null;
  });
  const dominated = names.map((_, s) => {
    const strict = names.findIndex((_, other) => other !== s && pairwise[other][s] === 'strict');
    const by = strict >= 0 ? strict : names.findIndex((_, other) => other !== s && pairwise[other][s] === 'weak');
    return by < 0 ? null : { by, kind: pairwise[by][s]! };
  });
  return { names, opponents, values, pairwise, bestRepliesByOpponent, dominant, dominated };
}
