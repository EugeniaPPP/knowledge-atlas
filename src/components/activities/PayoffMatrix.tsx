import type { Model } from '../../lib/content/schema';

type Props = { model: Model; layer?: 'outcomes' | 'payoffs'; selectedRow?: number; selectedColumn?: number;
  columnChoice?: { name: string; disabled: boolean; onChange: (column: number) => void } };
export default function PayoffMatrix({ model, layer = 'payoffs', selectedRow, selectedColumn, columnChoice }: Props) {
  const matrix = layer === 'outcomes' && model.outcomes ? model.outcomes : model.payoffs;
  const number = (value: string | number) => String(value).replace(/^-/, '−');
  return <div>
    <div className="matrix-scroll" role="region" aria-label={`Матрица: ${model.caption}`} tabIndex={0}>
      <table className="matrix">
        <caption>{layer === 'outcomes' ? 'Матрица исходов' : 'Матрица выигрышей'} · {model.caption}</caption>
        <thead><tr><th scope="col">Ты ↓</th>{model.columns.map((c, column) => <th scope="col" key={c}>{columnChoice ?
          <label className={`matrix-column-choice ${selectedColumn === column ? 'selected' : ''}`}><input type="radio" name={columnChoice.name} value={column} checked={selectedColumn === column} disabled={columnChoice.disabled} onChange={() => columnChoice.onChange(column)} /><span>Партнёр: {c}</span></label> : `Партнёр: ${c}`}</th>)}</tr></thead>
        <tbody>{matrix.map((row, r) => <tr key={model.rows[r]}><th scope="row">{model.rows[r]}</th>{row.map((pair, c) =>
          <td key={c} className={(selectedRow === undefined ? selectedColumn === c : selectedRow === r && (selectedColumn === undefined || selectedColumn === c)) ? 'selected' : undefined}>
            {number(pair[0])}, {number(pair[1])}
          </td>)}</tr>)}</tbody>
      </table>
    </div>
    <p className="matrix-note">В каждой ячейке сначала твой результат, затем результат партнёра.</p>
  </div>;
}
