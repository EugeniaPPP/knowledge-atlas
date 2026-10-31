import { getUI } from '../../i18n/ui';
import type { Model } from '../../lib/content/schema';
import type { AssessmentTask, LearningConfig } from '../../lib/content/schema';
import AnalysisMatrix from './AnalysisMatrix';
import { useLearning } from '../../lib/learning/use-learning';
import { taskChecked } from '../../lib/learning/assessment';

type Props = { model: Model; layer?: 'outcomes' | 'payoffs'; selectedRow?: number; selectedColumn?: number;
  columnChoice?: { name: string; disabled: boolean; onChange: (column: number) => void } };
type Analysis = { mode: 'explain' | 'practice'; revealAnalysis?: boolean; bestResponsesBeforeCheck?: boolean };
type MatrixProps = Props & { analysis?: Analysis; config?: LearningConfig; task?: AssessmentTask };
function PracticeMatrix({ model, analysis, config, task }: MatrixProps & { config: LearningConfig; task: AssessmentTask; analysis: Analysis }) {
  const { state } = useLearning(config);
  return <AnalysisMatrix model={model} reveal={taskChecked(task, state)} practice bestBeforeCheck={!!analysis.bestResponsesBeforeCheck} />;
}
export default function PayoffMatrix(props: MatrixProps) {
  if (props.analysis) {
    if (props.analysis.mode === 'practice' && props.config && props.task) return <PracticeMatrix {...props} analysis={props.analysis} config={props.config} task={props.task} />;
    return <AnalysisMatrix model={props.model} reveal={props.analysis.mode === 'explain' || !!props.analysis.revealAnalysis} practice={props.analysis.mode === 'practice'} bestBeforeCheck={!!props.analysis.bestResponsesBeforeCheck} />;
  }
  return <ReadingMatrix {...props} />;
}
function ReadingMatrix({ model, layer = 'payoffs', selectedRow, selectedColumn, columnChoice }: Props) {
  const t = getUI(model.locale);
  const matrix = layer === 'outcomes' && model.outcomes ? model.outcomes : model.payoffs;
  const number = (value: string | number) => String(value).replace(/^-/, '−');
  return <div>
    <div className="matrix-scroll" role="region" aria-label={`${t.matrixRegion}: ${model.caption}`} tabIndex={0}>
      <table className="matrix">
        <caption>{layer === 'outcomes' ? t.outcomeMatrix : t.payoffMatrix} · {model.caption}</caption>
        <thead><tr><th scope="col">{t.you} ↓</th>{model.columns.map((c, column) => <th scope="col" key={c}>{columnChoice ?
          <label className={`matrix-column-choice ${selectedColumn === column ? 'selected' : ''}`}><input type="radio" name={columnChoice.name} value={column} checked={selectedColumn === column} disabled={columnChoice.disabled} onChange={() => columnChoice.onChange(column)} /><span>{t.partner}: {c}</span></label> : `${t.partner}: ${c}`}</th>)}</tr></thead>
        <tbody>{matrix.map((row, r) => <tr key={model.rows[r]}><th scope="row">{model.rows[r]}</th>{row.map((pair, c) =>
          <td key={c} className={(selectedRow === undefined ? selectedColumn === c : selectedRow === r && (selectedColumn === undefined || selectedColumn === c)) ? 'selected' : undefined}>
            {number(pair[0])}, {number(pair[1])}
          </td>)}</tr>)}</tbody>
      </table>
    </div>
    <p className="matrix-note">{t.pairNote}</p>
  </div>;
}
