

interface AspectSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AspectSelector({ value, onChange }: AspectSelectorProps) {
  const ratios = ['1:1', '4:5', '16:9', '9:16'];
  return (
    <div className="input-group">
      <label className="input-label">Aspect Ratio</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {ratios.map(ratio => (
          <button 
            key={ratio}
            className="btn-primary" 
            style={{ 
              padding: '0.5rem', 
              background: value === ratio ? 'var(--accent-blue)' : 'var(--bg-tertiary)' 
            }}
            onClick={() => onChange(ratio)}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
}
