import { useState } from 'react';
export type HatsContent = { title: string; fact: string; pink: string; unknown: string; people: [string, string]; views: { id: string; label: string; unknownPerson: number | null; explanation: string }[] };
export default function CommonKnowledgeHats({ content }: { content: HatsContent }) {
  const [selected, setSelected] = useState(content.views[0].id), view = content.views.find((v) => v.id === selected)!;
  return <section className="activity hats" aria-label={content.title}>
    <div className="eyebrow">{content.title}</div><p className="matrix-note">{content.fact}</p>
    <div className="hat-people">{content.people.map((name, i) => <div className="hat-person" key={name}><span className={`hat-symbol ${view.unknownPerson === i ? 'unknown' : ''}`} aria-hidden="true">{view.unknownPerson === i ? '?' : '◒'}</span><strong>{name}</strong><span>{view.unknownPerson === i ? content.unknown : content.pink}</span></div>)}</div>
    <div className="compact-actions">{content.views.map((v) => <button type="button" className="secondary" key={v.id} aria-pressed={v.id === selected} onClick={() => setSelected(v.id)}>{v.label}</button>)}</div>
    <p className="activity-result" role="status">{view.explanation}</p>
  </section>;
}
