

interface ModelSelectorProps {
  type: 'image' | 'video';
  value: string;
  onChange: (value: string) => void;
}

export default function ModelSelector({ type, value, onChange }: ModelSelectorProps) {
  return (
    <div className="input-group">
      <label className="input-label">Provider / Model</label>
      <select 
        className="select-input" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      >
        {type === 'image' ? (
           <>
             <option value="Ollama (Local)">Ollama (Local)</option>
             <option value="LM Studio (Local)">LM Studio (Local)</option>
             <option value="OpenAI - DALL-E 3">OpenAI - DALL-E 3</option>
             <option value="Grok (xAI)">Grok (xAI)</option>
             <option value="Huggingface (Stable Diffusion)">Huggingface - SDXL</option>
             <option value="Gemini">Gemini</option>
             <option value="ComfyUI">ComfyUI</option>
             <option value="Quiho">Quiho</option>
             <option value="Claude (Anthropic)">Claude (Anthropic)</option>
           </>
        ) : (
           <>
             <option value="OpenAI - Sora">OpenAI - Sora</option>
             <option value="Huggingface (Video Crafter)">Huggingface (Video Crafter)</option>
           </>
        )}
      </select>
    </div>
  );
}
