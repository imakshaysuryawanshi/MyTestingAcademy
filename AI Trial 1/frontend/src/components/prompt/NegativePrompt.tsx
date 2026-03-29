

interface NegativePromptProps {
  negativePrompt: string;
  onChange: (value: string) => void;
}

export default function NegativePrompt({ negativePrompt, onChange }: NegativePromptProps) {
  return (
    <div className="input-group">
      <label className="input-label">Negative Prompt</label>
      <textarea 
         className="text-input text-area" 
         style={{ minHeight: '60px' }}
         placeholder="blurry, low quality, distorted, bad anatomy..."
         value={negativePrompt}
         onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
