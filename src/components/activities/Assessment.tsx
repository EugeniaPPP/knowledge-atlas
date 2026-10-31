import { getUI, format } from '../../i18n/ui';
import type { AssessmentTask, LearningConfig } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import { changePart, taskChecked, taskCorrect, validPart } from '../../lib/learning/assessment';
import ChoiceGroup from './ChoiceGroup';

// The answer-copy contract allows only inline code and emphasis, never raw HTML.
function InlineAnswer({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : part)}</>;
}

export function AnswerPart({ task, partId, config }: { task: AssessmentTask; partId: string; config: LearningConfig }) {
  const { state, store, persistence } = useLearning(config);
  const part = task.parts.find((p) => p.id === partId)!;
  const selected = state.answers[part.id]?.selected || '';
  const change = (value: string) => store.update((s) => changePart(s, task, part.id, value));
  if (part.kind === 'choice') return <ChoiceGroup name={part.id} label={part.label} value={selected} options={part.options.map((o) => ({ value: o.id, label: <InlineAnswer text={`${o.id.toUpperCase()}. ${o.text}`} /> }))} onChange={change} disabled={persistence === 'pending'} />;
  return <div className="numeric-part"><label htmlFor={part.id}>{part.label}</label><input id={part.id} name={part.id} type="number" step="1" min={part.min} max={part.max} value={selected} onChange={(e) => change(e.target.value)} disabled={persistence === 'pending'} autoComplete="off" inputMode="numeric" /></div>;
}
export function CheckTask({ task, config }: { task: AssessmentTask; config: LearningConfig }) {
  const { state, store, persistence } = useLearning(config), t = getUI(config.locale);
  return <div className="task-check"><button type="button" className="primary" disabled={persistence === 'pending' || !task.parts.every((p) => validPart(p, state.answers[p.id]?.selected))} onClick={() => store.update((s) => ({ ...s, answers: { ...s.answers, ...Object.fromEntries(task.parts.map((p) => [p.id, { selected: s.answers[p.id].selected, checked: true }])) } }))}>{task.parts.length > 1 ? t.checkTask : t.checkAnswer}</button><p role="status" className="task-verdict">{taskChecked(task, state) ? taskCorrect(task, state) ? t.correct : t.incorrect : ''}</p></div>;
}
export function MasteryScore({ tasks, config }: { tasks: AssessmentTask[]; config: LearningConfig }) {
  const { state } = useLearning(config), t = getUI(config.locale);
  return <div className="mastery-score" role="status"><strong>{format(t.correctTasks, { count: tasks.filter((task) => taskCorrect(task, state)).length, total: tasks.length })}</strong><span>{format(t.completedTasks, { count: tasks.filter((task) => taskChecked(task, state)).length, total: tasks.length })}</span><span>{t.optionalTask}</span></div>;
}
