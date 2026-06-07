
import { Wand2, RefreshCw } from 'lucide-react';

interface GenerateButtonProps {
  isGenerating: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function GenerateButton({ isGenerating, onClick, disabled }: GenerateButtonProps) {
  return (
    <button 
      className="btn-primary" 
      style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.5rem', 
        fontSize: '1.1rem', 
        opacity: isGenerating || disabled ? 0.7 : 1, 
        cursor: isGenerating || disabled ? 'not-allowed' : 'pointer' 
      }}
      onClick={onClick}
      disabled={isGenerating || disabled}
    >
      {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
      {isGenerating ? 'Generating...' : 'Generate'}
    </button>
  );
}
