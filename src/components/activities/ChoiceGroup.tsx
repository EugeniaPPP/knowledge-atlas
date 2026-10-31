import type { ReactNode } from 'react';
type Props = {
  name: string; label: string; value: string; options: { value: string; label: ReactNode }[];
  onChange: (value: string) => void; large?: boolean; disabled?: boolean;
};
export default function ChoiceGroup({ name, label, value, options, onChange, large, disabled }: Props) {
  return <fieldset className={`choices ${large ? 'strategy-choice' : ''}`} disabled={disabled}>
    <legend>{label}</legend>
    <div className="choice-options">{options.map((option) => <label key={option.value} className={`choice ${value === option.value ? 'selected' : ''}`}>
      <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
      <span>{option.label}</span>
    </label>)}</div>
  </fieldset>;
}
