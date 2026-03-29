import React from 'react';

/**
 * GeneratorLayout enforces the strict grid template:
 * Top -> Prompt
 * Left -> Parameters
 * Center -> Preview
 * Right -> History
 */
export default function GeneratorLayout({
  prompt,
  parameters,
  preview,
  history,
}: {
  prompt: React.ReactNode;
  parameters: React.ReactNode;
  preview: React.ReactNode;
  history: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '1.5rem',
      overflow: 'hidden'
    }}>
      {/* Top: Prompt Area */}
      <div style={{ flexShrink: 0 }}>
        {prompt}
      </div>

      {/* Main Body: Left Params, Center Preview, Right History */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* Left: Parameters */}
        <div style={{ width: '300px', flexShrink: 0, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {parameters}
        </div>

        {/* Center: Preview */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {preview}
        </div>

        {/* Right: History */}
        <div style={{ width: '280px', flexShrink: 0, overflowY: 'auto' }}>
          {history}
        </div>
        
      </div>
    </div>
  );
}
