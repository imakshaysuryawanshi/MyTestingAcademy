

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PromptInput({ prompt, onChange, placeholder = "Describe what you want to see..." }: PromptInputProps) {
  return (
    <div className="input-group">
      <label className="input-label">Prompt</label>
      <textarea 
        className="text-input text-area" 
        style={{ minHeight: '80px', fontSize: '1rem', padding: '1rem' }}
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
