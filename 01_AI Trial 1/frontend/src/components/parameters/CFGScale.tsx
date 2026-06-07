

interface CFGScaleProps {
  value: number;
  onChange: (value: number) => void;
}

export default function CFGScale({ value, onChange }: CFGScaleProps) {
  return (
    <div className="input-group">
      <label className="input-label">CFG Scale (Prompt Adherence)</label>
      <div className="slider-container">
        <input 
          type="range" 
          min="1" 
          max="30" 
          step="0.5" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          className="slider-input" 
        />
        <div className="slider-value">{value}</div>
      </div>
    </div>
  );
}
