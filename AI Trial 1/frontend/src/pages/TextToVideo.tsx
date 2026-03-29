import React, { useState, useEffect } from 'react';
import GeneratorLayout from '../layout/GeneratorLayout';
import PromptInput from '../components/prompt/PromptInput';
import NegativePrompt from '../components/prompt/NegativePrompt';
import ModelSelector from '../components/parameters/ModelSelector';
import StepsSlider from '../components/parameters/StepsSlider';
import CFGScale from '../components/parameters/CFGScale';
import DurationSelector from '../components/parameters/DurationSelector';
import LoRAManager, { type LoRA } from '../components/parameters/LoRAManager';
import GenerateButton from '../components/generation/GenerateButton';
import PreviewCanvas from '../components/preview/PreviewCanvas';
import HistoryPanel from '../components/history/HistoryPanel';
import { generateMedia, type GenerationResponse } from '../services/api';
import { historyStore, type HistoryItem } from '../store/historyStore';

export default function TextToVideo() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('OpenAI - Sora');
  const [duration, setDuration] = useState('4 Seconds');
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7.5);
  const [loras, setLoras] = useState<LoRA[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeResult, setActiveResult] = useState<GenerationResponse['data'] | null>(null);

  useEffect(() => {
    const allHistory = historyStore.getHistory();
    setHistory(allHistory.filter(h => h.type === 'video'));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    const response = await generateMedia({
      prompt,
      negativePrompt,
      model,
      type: 'video',
      steps,
      cfgScale,
      duration,
      loras
    });

    if (response.success) {
      const newItem = response.data as HistoryItem;
      setActiveResult(newItem);
      const updatedHistory = historyStore.addHistory(newItem);
      setHistory(updatedHistory.filter(h => h.type === 'video'));
    }
    
    setIsGenerating(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = historyStore.removeHistory(id);
    setHistory(updatedHistory.filter(h => h.type === 'video'));
    if (activeResult?.id === id) setActiveResult(null);
  };

  const handleClearAll = () => {
    historyStore.clearHistory();
    setHistory([]);
    setActiveResult(null);
  };

  const handleDownload = async (url: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Generated_${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ marginBottom: '1rem', marginTop: '-1rem' }}>
        <h1 className="page-title">AI Video Generator</h1>
      </div>
      <GeneratorLayout 
        prompt={
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <PromptInput prompt={prompt} onChange={setPrompt} placeholder="A futuristic cyberpunk city with flying cars..." />
            </div>
            <div style={{ flex: 1 }}>
              <NegativePrompt negativePrompt={negativePrompt} onChange={setNegativePrompt} />
            </div>
          </div>
        }
        parameters={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Settings</label>
            </div>
            <ModelSelector type="video" value={model} onChange={setModel} />
            <DurationSelector value={duration} onChange={setDuration} />
            <StepsSlider value={steps} onChange={setSteps} />
            <CFGScale value={cfgScale} onChange={setCfgScale} />
            <LoRAManager loras={loras} onChange={setLoras} />
            <GenerateButton isGenerating={isGenerating} onClick={handleGenerate} disabled={!prompt.trim()} />
          </div>
        }
        preview={
          <PreviewCanvas 
            isGenerating={isGenerating} 
            result={activeResult} 
            onDownload={handleDownload} 
            onReusePrompt={setPrompt} 
          />
        }
        history={
          <HistoryPanel 
            history={history} 
            activeId={activeResult?.id || null} 
            onSelect={(item) => setActiveResult(item)} 
            onDelete={handleDelete}
            onClearAll={handleClearAll}
          />
        }
      />
    </div>
  );
}
