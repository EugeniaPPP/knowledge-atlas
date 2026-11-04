import { useEffect, useId, useRef, useState } from 'react';
import { allocateVoters } from '../../lib/games/spatial-voting';
import type { ElectionCopy } from '../../lib/content/election';
export type { ElectionCopy } from '../../lib/content/election';
type Model = { positions: number[]; groupPercent: number; initialPositions: number[]; examples: number[][] };
const format = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));
export default function ElectionExplorer({ model, content: c }: { model: Model; content: ElectionCopy }) {
  const [choices, setChoices] = useState(model.initialPositions), [ready, setReady] = useState(false);
  const id = useId(), scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { setReady(true); }, []);
  const result = allocateVoters(model.positions, model.positions.map(() => model.groupPercent), choices);
  const percent = (value: number) => format(c.percent, { value });
  const share = (candidate: string, value: number) => value ? format(c.allocation, { candidate, value }) : c.none;
  const names = [c.candidate1, c.candidate2], short = [c.short1, c.short2];
  return <div className="election" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{c.title}</h3><p className="election-instruction js-only">{c.instruction}</p>
    <p className="election-scroll-hint">{c.scrollHint}</p><noscript><p className="election-instruction">{c.fallback}</p></noscript>
    <div className="election-scroll" ref={scroll} tabIndex={0} role="region" aria-label={c.region}>
      <div className="js-only">{choices.map((choice, candidate) => <fieldset className={`candidate-${candidate + 1}`} key={candidate} disabled={!ready}>
        <legend>{names[candidate]}</legend><div className="election-grid">{model.positions.map((position) => <label className="position-choice" key={position}>
          <input type="radio" name={`${id}-candidate-${candidate}`} value={position} aria-label={format(c.position, { position })} checked={choice === position} onChange={() => setChoices((current) => current.map((value, i) => i === candidate ? position : value))} /><span>{position}</span>
        </label>)}</div>
      </fieldset>)}</div>
      <p className="voters-label">{c.voters}</p><ol className="election-grid">{result.groups.map((group) => <li key={group.position} data-voter={group.position}>
        <span className="voter-position" aria-label={format(c.groupLabel, { position: group.position })}>{group.position}</span>
        <div className="vote-block" aria-hidden="true">{group.shares.map((value, i) => <span key={i} className={`vote-fill candidate-${i + 1}`} style={{ height: `${100 * value / model.groupPercent}%` }} />)}</div>
        {group.shares.map((value, i) => <span key={i} className={`voter-share candidate-${i + 1}`}>{share(short[i], value)}</span>)}
      </li>)}</ol><div className="axis-ends"><span>{c.left}</span><span>{c.right}</span></div>
    </div>
    <div className="election-presets js-only"><span>{c.exampleLabel}:</span>{model.examples.map(([first, second]) => <button type="button" className="secondary" key={`${first}-${second}`} disabled={!ready} onClick={() => { setChoices([first, second]); if (scroll.current) scroll.current.scrollLeft = 0; }}>{format(c.example, { first, second })}</button>)}</div>
    <p className="vote-totals" role="status" aria-live="polite" aria-atomic="true">{result.totals.map((value, i) => <span className={`candidate-${i + 1}`} key={i}><span>{names[i]}</span><strong data-vote-total={i}>{percent(value)}</strong></span>)}</p>
    <details><summary>{c.details}</summary><div className="election-calculation" role="region" tabIndex={0} aria-label={c.tableRegion}>
      <table><thead><tr>{[c.group, c.distance1, c.distance2, c.share1, c.share2].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{result.groups.map((group) => <tr key={group.position}><th scope="row">{group.position}</th>{group.distances.map((value, i) => <td key={`distance-${i}`}>{value}</td>)}{group.shares.map((value, i) => <td key={`share-${i}`}>{percent(value)}</td>)}</tr>)}</tbody>
        <tfoot><tr><th scope="row" colSpan={3}>{c.total}</th>{result.totals.map((value, i) => <td key={i}>{percent(value)}</td>)}</tr></tfoot>
      </table></div><p className="calculation-sums">{result.totals.map((total, candidate) => <span key={candidate}>{names[candidate]}: {result.groups.filter((g) => g.shares[candidate] > 0).map((g) => percent(g.shares[candidate])).join(' + ')} = <strong>{percent(total)}</strong><br /></span>)}</p>
    </details>
  </div>;
}
