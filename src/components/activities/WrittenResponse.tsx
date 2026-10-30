import { useState } from 'react';
import type { LearningConfig, Model, WrittenExercise } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import PayoffMatrix from './PayoffMatrix';

export default function WrittenResponse({ config, exercise, number, models }: { config: LearningConfig; exercise: WrittenExercise; number: number; models: Record<string, Model> }) {
  const { state, store, persistence } = useLearning(config);
  const [saved, setSaved] = useState(false);
  return <section className="question" aria-labelledby="essay-title">
    <div className="eyebrow">Задание {String(number).padStart(2, '0')} / {String(number).padStart(2, '0')}</div>
    <h3 id="essay-title">{exercise.title}</h3>
    {exercise.context && <p>{exercise.context}</p>}<p>{exercise.prompt}</p>
    {exercise.modelId && <PayoffMatrix model={models[exercise.modelId]} />}
    <label className="field-label" htmlFor="essay-text">Твоё объяснение</label>
    <textarea disabled={persistence === 'pending'} id="essay-text" name="essay" rows={5} maxLength={20000} value={state.notes.essay} placeholder="Моё объяснение…" onChange={(e) => { store.update((s) => ({ ...s, notes: { ...s.notes, essay: e.target.value } })); setSaved(false); }} />
    <div className="actions"><button className="primary" disabled={persistence === 'pending'} onClick={() => setSaved(true)}>Сохранить ответ</button>
      <button className="secondary" disabled={persistence === 'pending'} aria-expanded={state.rubric} aria-controls="essay-rubric" onClick={() => store.update((s) => ({ ...s, rubric: !s.rubric }))}>Критерии самопроверки</button></div>
    <p className="note" role="status">{saved ? persistence === 'local' ? 'Ответ сохранён в этом браузере.' : 'Ответ в памяти страницы. Экспортируй его, чтобы не потерять.' : 'Письменный ответ оцениваешь ты — по критериям ниже.'}</p>
    <div className="feedback" id="essay-rubric" hidden={!state.rubric}>{exercise.rubric}</div>
  </section>;
}
