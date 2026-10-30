import type { Exercise, Model } from '../../lib/content/schema';
import ChoiceGroup from './ChoiceGroup';
import PayoffMatrix from './PayoffMatrix';

type Props = {
  exercise: Exercise; model: Model; selected?: string; column?: number; disabled: boolean;
  onColumnChange: (column: number) => void; onAnswerChange: (optionId: string) => void;
};

export default function StrategySequence({ exercise, model, selected, column, disabled, onColumnChange, onAnswerChange }: Props) {
  const sequence = exercise.strategySequence!;
  const pair = sequence.pairs.find((p) => p.optionId === selected && p.column === column);
  return <div className="strategy-sequence">
    <fieldset className="matrix-strategy" disabled={disabled}>
      <legend>{sequence.partnerPrompt}</legend>
      <p className="note">{sequence.instruction}</p>
      <PayoffMatrix model={model} selectedColumn={column} selectedRow={pair?.row}
        columnChoice={{ name: `mastery-${exercise.id}-partner`, disabled, onChange: onColumnChange }} />
    </fieldset>
    <ChoiceGroup name={`mastery-${exercise.id}-response`} label={sequence.responsePrompt} disabled={disabled || column === undefined} large
      value={pair ? String(pair.row) : ''} options={model.rows.map((label, row) => ({ value: String(row), label }))}
      onChange={(row) => {
        const choice = sequence.pairs.find((p) => p.column === column && p.row === Number(row));
        if (choice) onAnswerChange(choice.optionId);
      }} />
    {column === undefined && <p className="note">{sequence.pendingInstruction}</p>}
  </div>;
}
