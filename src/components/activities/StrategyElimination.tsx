import { useState } from 'react';
import { getUI, format } from '../../i18n/ui';
import type { Locale } from '../../lib/content/schema';
export type EliminationContent = { title: string; assumption: string; levels: { max: number; target: string; text: string }[] };
/** A declared, reviewed elimination procedure, not a solver for arbitrary games. */
export default function StrategyElimination({ content, locale = 'ru' }: { content: EliminationContent; locale?: Locale }) {
  const [index, setIndex] = useState(0), t = getUI(locale), level = content.levels[index];
  return <section className="activity elimination" aria-label={content.title}>
    <div className="activity-heading"><span className="eyebrow">{content.title}</span><span>{format(t.round, { current: index, total: content.levels.length - 1 })}</span></div>
    <div role="status"><strong className="elimination-range">{level.max === 1 ? '1' : `1–${level.max}`}</strong><p className="elimination-target">{t.highestTarget}: {level.target}</p><p>{level.text}</p></div>
    <div className="elimination-bar" aria-hidden="true"><span style={{ transform: `scaleX(${level.max / content.levels[0].max})` }} /></div>
    <div className="range-ends"><span>1</span><span>{content.levels[0].max}</span></div>
    <div className="compact-actions"><button type="button" className="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>{t.back}</button><button type="button" className="secondary" onClick={() => setIndex(index === content.levels.length - 1 ? 0 : index + 1)}>{index === content.levels.length - 1 ? t.restart : t.next}</button></div>
    <p className="matrix-note">{content.assumption}</p>
  </section>;
}
