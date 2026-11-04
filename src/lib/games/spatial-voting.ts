/** Allocate each fixed voter group among all equally closest candidates. */
export function allocateVoters(positions: readonly number[], weights: readonly number[], choices: readonly number[]) {
  if (!positions.length || positions.length !== weights.length || new Set(positions).size !== positions.length ||
      positions.some((p) => !Number.isFinite(p)) || weights.some((w) => !Number.isFinite(w) || w <= 0) ||
      choices.length < 2 || choices.some((c) => !positions.includes(c))) throw new RangeError('Invalid spatial election');
  const groups = positions.map((position, index) => {
    const distances = choices.map((choice) => Math.abs(position - choice));
    const closest = Math.min(...distances), count = distances.filter((d) => d === closest).length;
    return { position, distances, shares: distances.map((d) => d === closest ? weights[index] / count : 0) };
  });
  return { groups, totals: choices.map((_, candidate) => groups.reduce((sum, group) => sum + group.shares[candidate], 0)) };
}
