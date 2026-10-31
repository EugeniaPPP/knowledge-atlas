import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { getUI, format } from '../../i18n/ui';
import type { Model } from '../../lib/content/schema';
import { analyzePayoffs, type Player } from '../../lib/games/dominance';

const number = (n: number) => String(n).replace(/^-/, '−');
export default function AnalysisMatrix({ model, reveal, practice, bestBeforeCheck }: { model: Model; reveal: boolean; practice: boolean; bestBeforeCheck: boolean }) {
  const [player, selectPlayer] = useState<Player | null>(null);
  const scrollRegion = useRef<HTMLDivElement>(null), [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const element = scrollRegion.current;
    if (!element) return;
    const measure = () => setScrollable(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, []);
  const t = getUI(model.locale), id = useId();
  const players = model.players || { row: t.you, column: t.partner, meaning: t.pairNote };
  const result = player ? analyzePayoffs(model, player) : null;
  const status = (s: number) => !reveal || !result ? '' : result.dominant[s] ? `${result.dominant[s]}-dominant` : result.dominated[s] ? `${result.dominated[s]!.kind}-dominated` : '';
  const focus = (next: Player) => selectPlayer((previous) => previous === next ? null : next);
  const statements: string[] = [];
  if (result && reveal) {
    result.dominant.forEach((relation, s) => { if (relation) statements.push(format(relation === 'strict' ? t.strictlyDominant : t.weaklyDominant, { strategy: result.names[s] })); });
    if (!result.dominant.some(Boolean)) statements.push(t.dominantNone);
    result.dominated.forEach((relation, s) => {
      if (!relation) return;
      const comparisons = result.values[relation.by].map((v, o) => `${number(v)} ${v === result.values[s][o] ? '=' : '>'} ${number(result.values[s][o])}`).join('; ');
      statements.push(format(relation.kind === 'strict' ? t.strictlyDominatedBy : t.weaklyDominatedBy, { strategy: result.names[s], other: result.names[relation.by], comparisons }));
    });
    if (!result.dominated.some(Boolean)) statements.push(t.dominatedNone);
  }
  return <section className="analysis-matrix" data-matrix-id={model.id} aria-label={model.caption}>
    <div className="eyebrow">{t.payoffMatrix}</div>
    <p className="matrix-note">{model.caption}</p>
    <div className="analysis-board" style={{ '--matrix-columns': model.columns.length, '--matrix-rows': model.rows.length } as CSSProperties}>
      <button type="button" className="matrix-player column-player" data-analysis-player="column" aria-pressed={player === 'column'} aria-controls={id} onClick={() => focus('column')}>{players.column} <span aria-hidden="true">→</span></button>
      <button type="button" className="matrix-player row-player" data-analysis-player="row" aria-pressed={player === 'row'} aria-controls={id} onClick={() => focus('row')}>{players.row} <span aria-hidden="true">↓</span></button>
      <div className="analysis-scroll" ref={scrollRegion} role="region" aria-label={`${t.matrixRegion}: ${model.caption}`} tabIndex={0}>
        <div className="analysis-table">
          <table><caption className="sr-only">{model.caption}. {players.meaning}</caption>
            <colgroup><col className="analysis-row-label" />{model.columns.map((c) => <col key={c} />)}</colgroup>
            <thead><tr><th scope="col"><span className="sr-only">{players.row} / {players.column}</span></th>{model.columns.map((c, s) => <th key={c} scope="col" data-strategy-status={player === 'column' ? status(s) : ''}>{c}</th>)}</tr></thead>
            <tbody>{model.payoffs.map((row, r) => <tr key={model.rows[r]}><th scope="row" data-strategy-status={player === 'row' ? status(r) : ''}>{model.rows[r]}</th>{row.map((pair, c) => <td key={c}>
              <div className="matrix-value" data-strategy-status={player ? status(player === 'row' ? r : c) : ''}>
                <span className="sr-only">{players.row}: {number(pair[0])}; {players.column}: {number(pair[1])}.</span>
                <span aria-hidden="true">(<span className={player === 'column' ? 'other-payoff' : ''} data-best-response={!!(result && player === 'row' && (reveal || bestBeforeCheck) && result.bestRepliesByOpponent[c].includes(r))}>{number(pair[0])}</span>, <span className={player === 'row' ? 'other-payoff' : ''} data-best-response={!!(result && player === 'column' && (reveal || bestBeforeCheck) && result.bestRepliesByOpponent[r].includes(c))}>{number(pair[1])}</span>)</span>
              </div>
            </td>)}</tr>)}</tbody>
          </table>
          {player && <div className="analysis-guides" aria-hidden="true">{(player === 'row' ? model.columns : model.rows).map((label, i) => <div key={label} data-comparison-group={player === 'row' ? 'column' : 'row'} style={player === 'row' ? { gridColumn: i + 1, gridRow: `1 / span ${model.rows.length}` } : { gridRow: i + 1, gridColumn: `1 / span ${model.columns.length}` }} />)}</div>}
        </div>
      </div>
    </div>
    {scrollable && <p className="matrix-note">{t.matrixScrollHint}</p>}
    <p className="matrix-note">{players.meaning}</p>
    <div className="matrix-analysis-note" id={id} role="status"><p>{player ? `${player === 'row' ? t.compareColumns : t.compareRows} ${reveal ? statements.join(' ') : t.matrixPending}` : t.matrixHint}</p></div>
    {result && (reveal || bestBeforeCheck) && <ul className="sr-only">{result.opponents.map((opponent, i) => <li key={opponent}>{opponent}: {t.bestResponseLegend} — {result.bestRepliesByOpponent[i].map((s) => result.names[s]).join(', ')}.</li>)}</ul>}
    {player && (reveal || bestBeforeCheck) && <div className="matrix-legend"><span>{t.bestResponseLegend}</span>{reveal && <><span className="legend-dominant">{t.dominantLegend}</span><span className="legend-dominated">{t.dominatedLegend}</span><span>{t.weakLegend}</span></>}</div>}
    {practice && !reveal && !player && <span className="sr-only">{t.matrixPending}</span>}
  </section>;
}
