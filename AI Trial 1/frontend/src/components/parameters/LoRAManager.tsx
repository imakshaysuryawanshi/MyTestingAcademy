import { Plus, X, Layers } from 'lucide-react';

export interface LoRA {
  name: string;
  weight: number;
}

interface LoRAManagerProps {
  loras: LoRA[];
  onChange: (loras: LoRA[]) => void;
}

export default function LoRAManager({ loras, onChange }: LoRAManagerProps) {
  const addLoRA = () => {
    onChange([...loras, { name: '', weight: 0.8 }]);
  };

  const removeLoRA = (index: number) => {
    onChange(loras.filter((_, i) => i !== index));
  };

  const updateLoRA = (index: number, field: keyof LoRA, value: string | number) => {
    const updated = [...loras];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="input-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
          <Layers size={14} /> LoRAs / Styles
        </label>
        <button 
          onClick={addLoRA}
          style={{ 
            background: 'var(--bg-tertiary)', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '2px 8px', 
            color: 'var(--accent-blue)', 
            fontSize: '0.75rem', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loras.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            No LoRAs active
          </p>
        ) : (
          loras.map((lora, index) => (
            <div key={index} style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="LoRA Name or Civitai URL"
                  value={lora.name}
                  onChange={(e) => updateLoRA(index, 'name', e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-primary)', 
                    fontSize: '0.8rem', 
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <button onClick={() => removeLoRA(index)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}>
                  <X size={14} />
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1" 
                  value={lora.weight}
                  onChange={(e) => updateLoRA(index, 'weight', parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-blue)', height: '4px' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', minWidth: '2.5rem', textAlign: 'right', fontWeight: '600' }}>
                  {lora.weight.toFixed(1)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
