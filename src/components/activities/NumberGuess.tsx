import { useEffect, useId, useState } from 'react';
import type { LearningConfig } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import { predictionKeys, readPreviousPrediction, savePrediction, snapshotPrediction, savedNumber } from '../../lib/learning/predictions';
import { getUI } from '../../i18n/ui';

export default function NumberGuess({ config, previousConfig, stage = 'current' }: { config: LearningConfig; previousConfig?: LearningConfig; stage?: 'current' | 'revised' }) {
  const { state, store, persistence } = useLearning(config), t = getUI(config.locale), id = useId();
  const stored = savedNumber(state.responses[predictionKeys[stage]]);
  const startingValue = stored || savedNumber(state.responses[predictionKeys.current]) || savedNumber(state.responses[predictionKeys.original]) || '33';
  const [draft, setDraft] = useState(startingValue);
  useEffect(() => { setDraft(startingValue); }, [startingValue]);
  useEffect(() => {
    if (persistence === 'pending' || savedNumber(state.responses[predictionKeys.original]) || !previousConfig) return;
    const previous = readPreviousPrediction(previousConfig);
    if (previous) store.update((s) => snapshotPrediction(s, previous, previousConfig.chapterId));
  }, [store, persistence, previousConfig, state.responses]);
  const original = savedNumber(state.responses[predictionKeys.original]);
  return <section className="activity prediction" aria-label={stage === 'current' ? t.currentPrediction : t.revisedPrediction}>
    <div className="prediction-original"><span>{t.originalPrediction}</span><strong>{original || '—'}</strong><p>{original ? '' : t.noOriginalPrediction}</p></div>
    <label className="field-label" htmlFor={id}>{stage === 'current' ? t.currentPrediction : t.revisedPrediction}</label>
    <output className="number-value" htmlFor={id}>{draft}</output>
    <input id={id} name={`prediction-${stage}`} autoComplete="off" type="range" min="1" max="100" step="1" value={draft} disabled={persistence === 'pending'} onChange={(e) => setDraft(e.target.value)} />
    <div className="range-ends"><span>1</span><span>100</span></div>
    <div className="compact-actions"><button className="secondary" type="button" disabled={persistence === 'pending'} onClick={() => store.update((s) => savePrediction(s, stage, draft))}>{t.savePrediction}</button><span role="status">{stored === draft ? persistence === 'memory' ? t.savedMemory : t.predictionSaved : t.predictionDraft}</span></div>
  </section>;
}
