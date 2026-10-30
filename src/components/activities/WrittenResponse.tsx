import { getUI } from '../../i18n/ui';
import { useState } from 'react';
import type { LearningConfig, Model, WrittenExercise } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import PayoffMatrix from './PayoffMatrix';

export default function WrittenResponse({ config, exercise, number, models }: { config: LearningConfig; exercise: WrittenExercise; number: number; models: Record<string, Model> }) {
  const { state, store, persistence } = useLearning(config);
  const t = getUI(config.locale);
  const [saved, setSaved] = useState(false);
  return <section className="question" id={exercise.id} aria-labelledby="essay-title">
    <div className="eyebrow">{t.exercise} {String(number).padStart(2, '0')} / {String(number).padStart(2, '0')}</div>
    <h3 id="essay-title">{exercise.title}</h3>
    {exercise.context && <p>{exercise.context}</p>}<p>{exercise.prompt}</p>
    {exercise.modelId && <PayoffMatrix model={models[exercise.modelId]} />}
    <label className="field-label" htmlFor="essay-text">{t.explanation}</label>
    <textarea disabled={persistence === 'pending'} id="essay-text" name="essay" rows={5} maxLength={20000} value={state.notes.essay} placeholder={t.explanationPlaceholder} onChange={(e) => { store.update((s) => ({ ...s, notes: { ...s.notes, essay: e.target.value } })); setSaved(false); }} />
    <div className="actions"><button className="primary" disabled={persistence === 'pending'} onClick={() => setSaved(true)}>{t.saveAnswer}</button>
      <button className="secondary" disabled={persistence === 'pending'} aria-expanded={state.rubric} aria-controls="essay-rubric" onClick={() => store.update((s) => ({ ...s, rubric: !s.rubric }))}>{t.rubric}</button></div>
    <p className="note" role="status">{saved ? persistence === 'local' ? t.answerSaved : t.answerMemory : t.selfAssess}</p>
    <div className="feedback" id="essay-rubric" hidden={!state.rubric}>{exercise.rubric}</div>
  </section>;
}
