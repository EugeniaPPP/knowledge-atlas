import type { AnswerPart, AssessmentTask } from '../content/schema';
import type { ChapterState } from './state';

export function validPart(part: AnswerPart, value = ''): boolean {
  if (part.kind === 'choice') return part.options.some((o) => o.id === value);
  return /^-?\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= part.min && Number(value) <= part.max;
}
export function taskChecked(task: AssessmentTask, state: ChapterState): boolean {
  return task.parts.every((p) => state.answers[p.id]?.checked && validPart(p, state.answers[p.id].selected));
}
export function taskCorrect(task: AssessmentTask, state: ChapterState): boolean {
  return taskChecked(task, state) && task.parts.every((p) => p.kind === 'integer' ? Number(state.answers[p.id].selected) === p.correct : state.answers[p.id].selected === p.correct);
}
export function changePart(state: ChapterState, task: AssessmentTask, id: string, selected: string): ChapterState {
  if (!task.parts.some((p) => p.id === id)) return state;
  const answers = { ...state.answers };
  for (const part of task.parts) if (answers[part.id]) answers[part.id] = { ...answers[part.id], checked: false };
  answers[id] = { selected: selected.slice(0, 80), checked: false };
  return { ...state, answers };
}
