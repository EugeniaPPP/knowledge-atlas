import { getUI, format } from '../../i18n/ui';
import type { Exercise, LearningConfig, Model } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import ChoiceGroup from './ChoiceGroup';
import PayoffMatrix from './PayoffMatrix';
import StrategySequence from './StrategySequence';

export default function Mastery({ exercises, models, config }: { exercises: Exercise[]; models: Record<string, Model>; config: LearningConfig }) {
  const { state, store, persistence } = useLearning(config);
  const t = getUI(config.locale);
  const checked = exercises.filter((e) => state.answers[e.id]?.checked).length;
  const correct = exercises.filter((e) => state.answers[e.id]?.checked && state.answers[e.id]?.selected === e.correct).length;
  return <div>
    <div className="mastery-score" role="status"><strong>{format(t.correctCount, { count: correct, total: exercises.length })}</strong><span>{format(t.checkedCount, { count: checked, total: exercises.length })}</span></div>
    {exercises.map((exercise, index) => {
      const answer = state.answers[exercise.id];
      const isCorrect = answer?.selected === exercise.correct;
      const partnerKey = `mastery-${exercise.id}-partner`;
      const savedColumn = state.responses[partnerKey];
      const previousPair = exercise.strategySequence?.pairs.find((p) => p.optionId === answer?.selected);
      const column = savedColumn !== undefined && exercise.modelId && models[exercise.modelId].columns.some((_, c) => String(c) === savedColumn) ? Number(savedColumn) : previousPair?.column;
      const selectAnswer = (selected: string) => store.update((s) => ({ ...s, answers: { ...s.answers, [exercise.id]: { selected, checked: false } } }));
      return <article className="question" key={exercise.id} id={exercise.id}>
        <div className="eyebrow">{t.exercise} {String(index + 1).padStart(2, '0')} / {String(exercises.length + 1).padStart(2, '0')}</div>
        <h3>{exercise.title}</h3>{exercise.context && <p>{exercise.context}</p>}<p>{exercise.prompt}</p>
        {exercise.strategySequence && exercise.modelId ? <StrategySequence exercise={exercise} model={models[exercise.modelId]} selected={answer?.selected} column={column} disabled={persistence === 'pending'}
          onAnswerChange={selectAnswer} onColumnChange={(selectedColumn) => store.update((s) => {
            const answers = { ...s.answers }; delete answers[exercise.id];
            return { ...s, responses: { ...s.responses, [partnerKey]: String(selectedColumn) }, answers };
          })} /> : <>
          {exercise.modelId && <PayoffMatrix model={models[exercise.modelId]} />}
          <ChoiceGroup disabled={persistence === 'pending'} name={`mastery-${exercise.id}`} label={t.chooseAnswer} value={answer?.selected || ''} options={exercise.options.map((o) => ({ value: o.id, label: o.text }))} onChange={selectAnswer} />
        </>}
        <button className="primary" disabled={!answer?.selected || persistence === 'pending'} onClick={() => store.update((s) => ({ ...s, answers: { ...s.answers, [exercise.id]: { selected: s.answers[exercise.id].selected, checked: true } } }))}>{t.checkAnswer}</button>
        {answer?.checked && <div className="feedback" role="status"><strong>{isCorrect ? t.correct : t.incorrect}</strong> {exercise.explanation}</div>}
      </article>;
    })}
  </div>;
}
