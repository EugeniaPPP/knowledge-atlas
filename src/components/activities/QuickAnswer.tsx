import { useLearning } from '../../lib/learning/use-learning';
import type { LearningConfig } from '../../lib/content/schema';

export default function QuickAnswer({ config, answer }: { config: LearningConfig; answer: { lead: string; body: string } }) {
  const { state, store, persistence } = useLearning(config);
  return <div>
    <button className="secondary" disabled={persistence === 'pending'} aria-expanded={state.quickReveal} aria-controls="quick-answer" onClick={() => store.update((s) => ({ ...s, quickReveal: !s.quickReveal }))}>{state.quickReveal ? 'Скрыть ответ ↑' : 'Показать ответ ↓'}</button>
    <div className="feedback" id="quick-answer" hidden={!state.quickReveal}><strong>{answer.lead}</strong> {answer.body}</div>
  </div>;
}
