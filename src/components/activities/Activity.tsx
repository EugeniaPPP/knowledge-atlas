import Message from '../../i18n/Message';
import { getUI, format } from '../../i18n/ui';
import { useEffect, useState } from 'react';
import type { ActivityCopy, LearningConfig, Model } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import PayoffMatrix from './PayoffMatrix';
import ChoiceGroup from './ChoiceGroup';
import type { ActivityKind } from '../../lib/content/component-catalog';

type Props = { kind: ActivityKind; config: LearningConfig; models: Record<string, Model>; copy: ActivityCopy };
const strategies = [{ value: '0', label: 'α' }, { value: '1', label: 'β' }];
const symbol = (n: string) => n === '0' ? 'α' : 'β';
const minus = (n: number) => String(n).replace(/^-/, '−');

export default function Activity({ kind, config, models, copy }: Props) {
  const { state, store, persistence } = useLearning(config);
  const t = getUI(config.locale);
  const [self, setSelf] = useState('0'), [partner, setPartner] = useState('0');
  const [layer, setLayer] = useState('outcomes'), [scenario, setScenario] = useState('00');
  const [motivation, setMotivation] = useState('selfish'), [role, setRole] = useState('selfish');
  const [number, setNumber] = useState(state.responses.number || '33'), [message, setMessage] = useState('');
  useEffect(() => { if (state.responses.number) setNumber(state.responses.number); }, [state.responses.number]);
  const grade = models['grade-game'], fair = models.fairness;
  const saveResponse = (key: string, value: string) => store.update((s) => ({ ...s, responses: { ...s.responses, [key]: value } }));
  const savedMessage = () => persistence === 'local' ? t.saved : t.savedMemory;
  let body;
  const { title, label, lead } = copy;

  if (kind === 'first-choice') {
    const first = state.responses.first || '';
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="first-choice" label={t.chooseStrategy} value={first}
        options={[{ value: 'α', label: 'α' }, { value: 'β', label: 'β' }]} onChange={(v) => saveResponse('first', v)} large />
      <p className="activity-result" role="status">{first ? copy.text.chosen.replace('{choice}', first) : copy.text.empty}</p>
      <span className="source-ref">{copy.text.source}</span>
    </div><div className="activity-model"><PayoffMatrix model={grade} layer="outcomes" selectedRow={first ? first === 'α' ? 0 : 1 : undefined} /></div></div>;
  } else if (kind === 'outcome-explorer') {
    const outcomes = grade.outcomes![Number(self)][Number(partner)];
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="outcome-self" label={t.yourChoice} value={self} options={strategies} onChange={setSelf} large />
      <ChoiceGroup disabled={persistence === 'pending'} name="outcome-partner" label={t.partnerChoice} value={partner} options={strategies} onChange={setPartner} large />
      <div className="readout" role="status"><Message text={t.outcomeReadout} values={{ self: symbol(self), partner: symbol(partner), own: <strong>{outcomes[0]}</strong>, other: <strong>{outcomes[1]}</strong> }} /></div>
    </div><div className="activity-model"><PayoffMatrix model={grade} layer="outcomes" selectedRow={Number(self)} selectedColumn={Number(partner)} /></div></div>;
  } else if (kind === 'matrix-layers') {
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="matrix-layer" label={t.representation} value={layer} options={[{ value: 'outcomes', label: t.grades }, { value: 'payoffs', label: t.payoffs }]} onChange={setLayer} />
      <p className="activity-result">{copy.text.note}</p>
    </div><div className="activity-model" aria-live="polite"><PayoffMatrix model={grade} layer={layer as 'outcomes' | 'payoffs'} /></div></div>;
  } else if (kind === 'dominance') {
    const a = grade.payoffs[0][Number(partner)][0], b = grade.payoffs[1][Number(partner)][0];
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="dominance-partner" label={t.partnerChoice} value={partner} options={strategies} onChange={setPartner} large />
      <p className="activity-result" role="status">{format(t.dominanceReadout, { partner: symbol(partner), a: minus(a), b: minus(b) })}</p>
    </div><div className="activity-model"><div className="comparison"><div><small>{t.yourAlpha}</small><strong>{minus(a)}</strong><span>{t.higher}</span></div><div><small>{t.yourBeta}</small><strong>{minus(b)}</strong><span>{t.lower}</span></div></div></div></div>;
  } else if (kind === 'paradox') {
    const descriptions = copy.text;
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="paradox-case" label={t.situation} value={scenario} options={[{ value: '00', label: t.bothAlpha }, { value: '11', label: t.bothBeta }, { value: '31', label: t.unilateral }]} onChange={setScenario} />
      <p className="activity-result" role="status">{descriptions[scenario]}</p>
    </div><div className="activity-model"><PayoffMatrix model={grade} selectedRow={scenario === '11' ? 1 : 0} selectedColumn={scenario === '00' ? 0 : 1} /></div></div>;
  } else if (kind === 'motivation') {
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="motivation-type" label={t.playerValues} value={motivation} options={[{ value: 'selfish', label: t.ownGrade }, { value: 'fair', label: t.fairness }]} onChange={setMotivation} />
      <p className="activity-result" role="status">{motivation === 'fair' ? copy.text.fair : copy.text.selfish}</p>
    </div><div className="activity-model"><PayoffMatrix model={motivation === 'fair' ? fair : grade} /></div></div>;
  } else if (kind === 'roles') {
    const mixed: Model = { ...grade, caption: role === 'fair' ? copy.text.fairCaption : copy.text.selfishCaption,
      payoffs: grade.payoffs.map((row, r) => row.map((cell, c) => role === 'fair' ? [fair.payoffs[r][c][0], cell[1]] : [cell[0], fair.payoffs[r][c][1]])) };
    body = <div className="activity-grid"><div>
      <ChoiceGroup disabled={persistence === 'pending'} name="player-role" label={t.yourPreferences} value={role} options={[{ value: 'selfish', label: t.yourGrade }, { value: 'fair', label: t.yourFairness }]} onChange={setRole} />
      <div className="readout" role="status">{role === 'fair' ? copy.text.fair : copy.text.selfish}</div>
    </div><div className="activity-model"><PayoffMatrix model={mixed} /></div></div>;
  } else if (kind === 'number-game') {
    body = <div style={{ maxWidth: 680 }}>
      <label className="field-label" htmlFor="number-choice">{t.numberLabel}</label>
      <output className="number-value" htmlFor="number-choice">{number}</output>
      <input disabled={persistence === 'pending'} id="number-choice" type="range" min="1" max="100" step="1" value={number} onChange={(e) => { setNumber(e.target.value); setMessage(''); }} />
      <div className="range-ends"><span>1</span><span>100</span></div>
      <div className="actions"><button className="primary" disabled={persistence === 'pending'} onClick={() => { saveResponse('number', number); setMessage(savedMessage()); }}>{t.savePrediction} <span aria-hidden="true">↗</span></button></div>
      <p className="activity-result" role="status">{message || (state.responses.number ? format(t.savedPrediction, { number: state.responses.number }) : copy.text.empty)}</p>
    </div>;
  } else {
    body = <div>
      <p className="activity-result">{state.responses.first ? copy.text.chosen.replace('{choice}', state.responses.first) : copy.text.empty}</p>
      <label className="field-label" htmlFor="reflection-text">{t.reflectionLabel}</label>
      <textarea disabled={persistence === 'pending'} id="reflection-text" name="reflection" value={state.notes.reflection} maxLength={20000} rows={4} placeholder={t.reflectionPlaceholder} onChange={(e) => { store.update((s) => ({ ...s, notes: { ...s.notes, reflection: e.target.value } })); setMessage(''); }} />
      <div className="actions"><button className="primary" disabled={persistence === 'pending'} onClick={() => setMessage(savedMessage())}>{t.saveNote} <span aria-hidden="true">↗</span></button></div>
      <p className="activity-result" role="status">{message || t.noteLocal}</p>
    </div>;
  }
  return <section className="activity" data-activity={kind} data-hydrated={persistence !== 'pending'} aria-label={title}>
    <header className="activity-heading"><div><div className="eyebrow">{label}</div><h3>{title}</h3>{lead && <p className="activity-lead">{lead}</p>}</div></header>
    {body}
  </section>;
}
