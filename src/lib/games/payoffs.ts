import type { Model } from '../content/schema';

/** Returns row strategies strictly dominated by another row, holding each column fixed. */
export function dominatedRows(model: Model): number[] {
  return model.rows.flatMap((_, row) =>
    model.rows.some((_, candidate) => candidate !== row &&
      model.columns.every((_, column) => model.payoffs[candidate][column][0] > model.payoffs[row][column][0]))
      ? [row] : []);
}

export function twoThirdsAverage(numbers: number[]): number {
  if (!numbers.length || numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 100))
    throw new Error('Expected integers between 1 and 100');
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length * 2 / 3;
}
