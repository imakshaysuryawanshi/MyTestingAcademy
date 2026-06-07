

interface StepsSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function StepsSlider({ value, onChange }: StepsSliderProps) {
  return (
    <div className="input-group">
      <label className="input-label">Steps (Quality)</label>
      <div className="slider-container">
        <input 
          type="range" 
          min="1" 
          max="150" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          className="slider-input" 
        />
        <div className="slider-value">{value}</div>
      </div>
    </div>
  );
}
