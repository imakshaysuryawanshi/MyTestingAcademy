

interface DurationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="input-group">
      <label className="input-label">Duration</label>
      <select 
        className="select-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="2 Seconds">2 Seconds</option>
        <option value="4 Seconds">4 Seconds</option>
        <option value="8 Seconds">8 Seconds</option>
      </select>
    </div>
  );
}
