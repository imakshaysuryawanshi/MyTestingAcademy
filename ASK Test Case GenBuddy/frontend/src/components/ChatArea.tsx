import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SendHorizontal, Copy, Check, X, Square, Download, Paperclip, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import type { Message } from '../types';

interface ChatAreaProps {
  messages: Message[];
  isGenerating: boolean;
  onSendMessage: (text: string, image?: string) => void;
  onStop: () => void;
}

export const ChatArea = ({ messages, isGenerating, onSendMessage, onStop }: ChatAreaProps) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string, content: string, type: 'excel' | 'doc' | 'csv' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (id: string, content: string) => {
    try {
      const element = document.getElementById(`msg-content-${id}`);
      if (element && navigator.clipboard.write) {
          const html = element.innerHTML;
          const blobHtml = new Blob([html], { type: "text/html" });
          const blobText = new Blob([content], { type: "text/plain" });
          const data = [new ClipboardItem({ "text/plain": blobText, "text/html": blobHtml })];
          await navigator.clipboard.write(data);
      } else {
          await navigator.clipboard.writeText(content);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback
      navigator.clipboard.writeText(content);
    }
  };

  const handleDownloadCSV = (content: string) => {
    // Basic Markdown Table to CSV Parser
    const lines = content.split('\n');
    const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    
    if (tableLines.length < 3) {
      alert("No valid table data found to export.");
      return;
    }

    const csvContent = tableLines
      .filter((_, i) => i !== 1) // Remove the Markdown separator line '|---|---|...'
      .map(line => {
        return line.trim()
          .split('|')
          .slice(1, -1) // Remove outer empty match blocks
          .map(cell => {
            let text = cell.trim();
            // Convert any HTML <br> tags used in generation back to valid line breaks
            text = text.replace(/<br\s*\/?>/gi, '\n');
            // Escape double quotes inside the cell
            text = text.replace(/"/g, '""');
            return `"${text}"`;
          })
          .join(',');
      });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImage(event.target?.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    }
  };

  const parseFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    
    try {
      if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setAttachedFile({ name: file.name, content: result.value, type: 'doc' });
      } 
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to CSV but clean it to avoid huge strings of empty commas
        const rawCsv = XLSX.utils.sheet_to_csv(worksheet);
        const cleanedCsv = rawCsv.split('\n')
          .map(row => row.replace(/,+$/, '').trim()) // Trim trailing commas and spaces
          .filter(row => row.length > 0 && row.replace(/,/g, '').length > 0) // Remove empty/comma-only rows
          .join('\n');
          
        setAttachedFile({ name: file.name, content: cleanedCsv, type: 'excel' });
      }
      else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const cleanedCsv = text.split('\n')
          .map(row => row.replace(/,+$/, '').trim())
          .filter(row => row.length > 0 && row.replace(/,/g, '').length > 0)
          .join('\n');
        setAttachedFile({ name: file.name, content: cleanedCsv, type: 'csv' });
      }
      else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      else {
        alert("Unsupported file type. Please upload .docx, .xlsx, .xls, .csv, or images.");
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      alert("Failed to read file content.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleSend = () => {
    if ((input.trim() || image || attachedFile) && !isGenerating) {
      let finalPrompt = input;
      if (attachedFile) {
        finalPrompt += `\n\n[CONTENT EXTRACTED FROM FILE: ${attachedFile.name}]\n---\n${attachedFile.content}\n---`;
      }
      onSendMessage(finalPrompt, image || undefined);
      setInput('');
      setImage(null);
      setAttachedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="main-content">
      <div className="chat-area">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center" style={{ color: 'var(--text-muted)' }}>
            <h2>Welcome to ASK Test Case GenBuddy</h2>
            <p style={{ marginTop: '1rem', maxWidth: '400px', textAlign: 'center' }}>
              Paste your Jira requirements, user stories, plain text, or images below to generate structured functional and non-functional test cases.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role} ${editingId === msg.id ? 'editing' : ''}`}>
            {msg.role === 'user' ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.image && <img src={msg.image} alt="uploaded" style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '8px', display: 'block' }} />}
                
                {editingId === msg.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={editInput} 
                      onChange={(e) => setEditInput(e.target.value)}
                      className="edit-textarea"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-secondary text-xs p-1" style={{ padding: '0.25rem 0.5rem'}} onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn btn-primary text-xs p-1" style={{ padding: '0.25rem 0.5rem'}} onClick={() => {
                        setEditingId(null);
                        onSendMessage(editInput, msg.image);
                      }}>Resend</button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative pr-8">
                    {msg.content}
                    <button 
                      className="edit-btn" 
                      onClick={() => { setEditingId(msg.id); setEditInput(msg.content); }}
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bot-message-container">
                <div id={`msg-content-${msg.id}`} className="markdown-body">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div className="message-actions">
                  {msg.content.includes('|') && (
                    <button 
                      className="action-btn" 
                      onClick={() => handleDownloadCSV(msg.content)}
                      title="Export as CSV"
                    >
                      <Download size={16} />
                    </button>
                  )}
                  <button 
                    className="action-btn" 
                    onClick={() => handleCopy(msg.id, msg.content)}
                    title="Copy to clipboard"
                  >
                    {copiedId === msg.id ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="message bot">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div 
        className={`input-area ${isDragging ? 'dragging' : ''}`} 
        style={{ flexDirection: 'column', alignItems: 'stretch' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {(image || attachedFile) && (
          <div className="preview-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '0 5px' }}>
            {image && (
              <div className="image-preview-container" style={{ margin: 0 }}>
                <img src={image} alt="preview" className="image-thumb" />
                <button className="remove-thumb-btn" onClick={() => setImage(null)}><X size={14} /></button>
              </div>
            )}
            {attachedFile && (
              <div className="file-preview-container">
                <div className="file-preview-icon">
                  {attachedFile.type === 'excel' || attachedFile.type === 'csv' ? 
                    <FileSpreadsheet size={20} className="text-success" /> : 
                    <FileText size={20} className="text-primary" />
                  }
                </div>
                <div className="file-preview-info">
                  <span className="file-name">{attachedFile.name}</span>
                  <span className="file-type">{attachedFile.type.toUpperCase()}</span>
                </div>
                <button className="remove-thumb-btn" onClick={() => setAttachedFile(null)}><X size={14} /></button>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <button 
            className="attach-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Attach File (Word, Excel, CSV, Image)"
            disabled={isGenerating}
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".docx,.xlsx,.xls,.csv,image/*"
          />
          <textarea 
            placeholder="Type prompt or drop files here..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button 
              className="send-btn" 
              onClick={onStop} 
              style={{ backgroundColor: 'var(--danger)' }}
              title="Stop Generation"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button 
              className="send-btn" 
              onClick={handleSend} 
              disabled={(!input.trim() && !image) || isGenerating}
            >
              <SendHorizontal size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
