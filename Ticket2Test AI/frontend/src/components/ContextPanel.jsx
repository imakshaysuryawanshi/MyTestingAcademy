import React from 'react';
import { AlignLeft } from 'lucide-react';

// Helper: Parse Atlassian Document Format (ADF) JSON into readable plain text
function parseADF(value) {
  if (!value) return '';
  // If it's already plain text, return as-is
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && parsed.type === 'doc') {
        return extractADFText(parsed);
      }
    } catch {
      return value; // Not JSON - plain text
    }
    return value;
  }
  if (typeof value === 'object' && value.type === 'doc') {
    return extractADFText(value);
  }
  return String(value);
}

function extractADFText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'rule') return '\n---\n';

  const children = node.content || [];
  const childText = children.map(extractADFText).join('');

  if (node.type === 'paragraph') return childText + '\n';
  if (node.type === 'heading') return childText + '\n';
  if (node.type === 'bulletList') return childText;
  if (node.type === 'orderedList') return childText;
  if (node.type === 'listItem') return '• ' + childText;

  return childText;
}

const ContextPanel = ({ data, isDarkMode }) => {
  if (!data) {
    return (
      <div className={`p-5 rounded-lg border opacity-50 ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-[#edf2ff] border-[#d3dcf0]'}`}>
        <h3 className={`text-[11px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2 ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#102a5e]'}`}>
          <AlignLeft size={14} /> User Story Context
        </h3>
        <p className={`text-[12px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Run the generator to fetch context.</p>
      </div>
    );
  }

  // Fix #3: Parse ADF JSON into readable text
  const acceptanceText = parseADF(data.acceptance_criteria);
  const descriptionText = parseADF(data.description);
  const displayText = (acceptanceText && acceptanceText !== 'Not explicitly found')
    ? acceptanceText
    : descriptionText || 'No specific criteria defined.';

  return (
    <div className={`p-5 rounded-lg border ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-[#edf2ff] border-[#d3dcf0]'}`}>
      <h3 className={`text-[11px] font-bold tracking-widest uppercase mb-5 flex items-center gap-2 ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#102a5e]'}`}>
        <span className={`p-1 rounded ${isDarkMode ? 'bg-[#3b82f6]' : 'bg-[#0f3b9c]'} text-white`}><AlignLeft size={12} /></span>
        User Story Context
      </h3>

      <div className="mb-5">
        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Story Title</span>
        <h2 className={`text-[13px] font-semibold leading-relaxed ${isDarkMode ? 'text-[#f1f5f9]' : 'text-[#172b4d]'}`}>
          {data.summary}
        </h2>
      </div>

      <div className="mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Priority / Type</span>
        <div className="flex gap-2 flex-wrap">
          {data.priority && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDarkMode ? 'bg-[#0f172a] text-[#60a5fa]' : 'bg-[#d3e3fd] text-[#0f3b9c]'}`}>{data.priority}</span>
          )}
          {data.issue_type && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDarkMode ? 'bg-[#0f172a] text-[#94a3b8]' : 'bg-white text-[#5e6c84] border border-[#d3dcf0]'}`}>{data.issue_type}</span>
          )}
        </div>
      </div>

      <div>
        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Acceptance Criteria</span>
        <div className={`text-[12px] leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-[#cbd5e1]' : 'text-[#172b4d]'}`}>
          {displayText}
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
