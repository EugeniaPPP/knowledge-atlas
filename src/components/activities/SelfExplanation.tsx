import { useId } from 'react';
import type { LearningConfig } from '../../lib/content/schema';
import { useLearning } from '../../lib/learning/use-learning';
import { getUI } from '../../i18n/ui';
export default function SelfExplanation({ config, label }: { config: LearningConfig; label: string }) {
  const { state, store, persistence } = useLearning(config), id = useId(), t = getUI(config.locale);
  return <div className="self-explanation"><label className="field-label" htmlFor={id}>{label}</label><textarea id={id} name="self-explanation" autoComplete="off" value={state.notes.essay} disabled={persistence === 'pending'} onChange={(e) => store.update((s) => ({ ...s, notes: { ...s.notes, essay: e.target.value.slice(0, 20000) } }))} /><p className="matrix-note">{t.optionalTask}</p></div>;
}
