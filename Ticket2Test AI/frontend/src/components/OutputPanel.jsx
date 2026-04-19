import React, { useMemo } from 'react';
import { Copy, FileText, Download, Table as TableIcon, Check, FileDown, ClipboardCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

// eslint-disable-next-line no-unused-vars
const ExportButton = ({ onClick, icon: Icon, label, color, isDarkMode }) => (
  <button 
    onClick={onClick}
    title={label}
    className={`p-2 rounded-md border transition-all active:scale-95 flex items-center justify-center gap-2 hover:shadow-md ${
      isDarkMode 
      ? 'bg-[#1e293b] border-[#334155] text-white hover:bg-[#334155]' 
      : 'bg-white border-[#e9ebf0] text-[#172b4d] hover:bg-gray-50'
    }`}
  >
    <Icon size={16} className={color} />
    <span className="text-[11px] font-bold hidden sm:inline">{label}</span>
  </button>
);

const OutputPanel = ({ testCases, loading, isDarkMode }) => {
  const [copied, setCopied] = React.useState(false);

  const isAPI = testCases?.[0]?.Test_Data !== undefined;

  const headers = useMemo(() => {
    if (!testCases || testCases.length === 0) return [];
    return isAPI 
       ? ['Test Case ID', 'Title', 'Category', 'Description', 'Precondition', 'Steps', 'Test Data', 'Expected', 'Priority', 'Status'] 
       : ['Test Case ID', 'Title', 'Type', 'Priority', 'Preconditions', 'Steps', 'Test Data', 'Expected Result'];
  }, [isAPI, testCases]);

  const rows = useMemo(() => {
    if (!testCases || testCases.length === 0) return [];
    return testCases.map(tc => isAPI 
       ? [tc.id, tc.title, tc.cat, tc.desc, tc.pre, (tc.stepsArr || []).map((s, i) => `${i+1}. ${s}`).join('\n'), tc.Test_Data, tc.expected, tc.prio, tc.status]
       : [tc.id, tc.title, tc.type, tc.priority, tc.preconditions, (tc.steps || []).map((s, i) => `${i+1}. ${s}`).join('\n'), tc.test_data, tc.expected_result]
    );
  }, [testCases, isAPI]);

  if (loading || !testCases || testCases.length === 0) return null;

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    try {
      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell||'').replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, `TestCases_${testCases[0].id.split('_')[0]}.csv`);
    } catch (e) {
      console.error(e);
    }
  };

  const exportMarkdown = () => {
    try {
      const mdHeader = `| ${headers.join(' | ')} |`;
      const mdDivider = `| ${headers.map(() => '---').join(' | ')} |`;
      const mdRows = rows.map(row => `| ${row.map(cell => (cell||'').replace(/\n/g, '<br>').replace(/\|/g, '\\|')).join(' | ')} |`).join('\n');
      const mdContent = `# Test Cases Export\n\n${mdHeader}\n${mdDivider}\n${mdRows}`;
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
      triggerDownload(blob, `TestCases_${Date.now()}.md`);
    } catch (e) {
      console.error(e);
    }
  };

  const copyTSV = () => {
    try {
      const tsvContent = [headers.join('\t'), ...rows.map(row => row.map(cell => (cell||'').replace(/\n/g, ' ').replace(/\t/g, ' ')).join('\t'))].join('\n');
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tsvContent).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        });
      } else {
        // Fallback for non-secure contexts if any
        const textArea = document.createElement("textarea");
        textArea.value = tsvContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportExcel = () => {
    try {
      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "TestCases");
      XLSX.writeFile(wb, `TestCases_Export.xlsx`);
    } catch (e) {
      console.error("Excel export failed", e);
    }
  };



  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Bar with Export Buttons */}
      <div className="flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
           <h2 className={`text-[18px] font-bold ${isDarkMode ? 'text-[#f1f5f9]' : 'text-[#102a5e]'}`}>Generated Test Cases</h2>
           <div className={`h-1 w-1 rounded-full ${isDarkMode ? 'bg-[#334155]' : 'bg-[#e9ebf0]'}`}></div>
           <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#0f3b9c]'}`}>
             {testCases.length} {isAPI ? 'API Endpoints' : 'Cases'}
           </span>
        </div>

        {/* Top Right Exports */}
        <div className="flex items-center gap-2">
           <button 
             onClick={copyTSV}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[11px] font-bold transition-all ${
               copied 
               ? 'bg-green-500 border-green-500 text-white' 
               : (isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white' : 'bg-white border-[#e9ebf0] text-[#1a56db]')
             }`}
           >
             {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy TSV'}
           </button>
           <button onClick={exportExcel} className={`p-1.5 rounded-md border ${isDarkMode ? 'bg-[#1e293b] border-[#334155] text-green-400' : 'bg-white border-[#e9ebf0] text-green-600'}`} title="Excel Export">
             <FileDown size={18} />
           </button>
           <button onClick={exportMarkdown} className={`p-1.5 rounded-md border ${isDarkMode ? 'bg-[#1e293b] border-[#334155] text-blue-400' : 'bg-white border-[#e9ebf0] text-blue-600'}`} title="Markdown Export">
             <FileText size={18} />
           </button>
        </div>
      </div>

      {/* Main Dashboard Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-white border-[#e9ebf0]'}`}>
        <div className={`grid grid-cols-12 gap-4 py-4 px-6 border-b text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8]' : 'bg-[#f8f9fc] border-[#e9ebf0] text-[#5e6c84]'}`}>
            {isAPI ? (
              <>
                <div className="col-span-1">Case ID</div>
                <div className="col-span-3">Details & Params</div>
                <div className="col-span-3">Request Body</div>
                <div className="col-span-3">Validation Steps</div>
                <div className="col-span-2">Expected</div>
              </>
            ) : (
             <>
               <div className="col-span-1">Case ID</div>
               <div className="col-span-3">Title</div>
               <div className="col-span-4">Execution Steps</div>
               <div className="col-span-4">Expected Results</div>
             </>
           )}
        </div>

        <div className="divide-y divide-gray-100 dark:divide-[#334155]">
          {testCases.map((tc, idx) => (
            <div key={idx} className={`grid grid-cols-12 gap-4 py-8 px-6 transition-all group ${isDarkMode ? 'hover:bg-[#1e293b]/50' : 'hover:bg-blue-50/30'}`}>
               {isAPI ? (
                  <>
                     <div className={`col-span-1 text-[11px] font-bold font-mono text-[#0f3b9c] dark:text-[#60a5fa]`}>
                        {tc.id}
                     </div>
                     <div className="col-span-3">
                        <h4 className={`text-[13px] font-bold leading-snug mb-2 ${isDarkMode ? 'text-white' : 'text-[#172b4d]'}`}>{tc.title}</h4>
                        <div className={`text-[11px] space-y-2 opacity-80 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>
                           <p className="line-clamp-2">{tc.desc}</p>
                           <p className="italic text-[10px] font-medium border-l-2 pl-2 border-blue-200">Pre: {tc.pre}</p>
                        </div>
                     </div>
                     <div className="col-span-3">
                        <pre className={`text-[10px] p-3 rounded-lg font-mono overflow-auto max-h-40 ${isDarkMode ? 'bg-[#0b1120] text-[#60a5fa]' : 'bg-[#f4f5f7] text-[#172b4d]'}`}>
                          {tc.Test_Data || "{ }"}
                        </pre>
                     </div>
                     <div className="col-span-3 border-l dark:border-[#334155] pl-4">
                        <ul className="space-y-1.5">
                           {(tc.stepsArr || []).map((step, sIdx) => (
                             <li key={sIdx} className={`text-[12px] flex gap-2 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>
                               <span className="opacity-40 font-mono text-[10px]">{sIdx + 1}.</span>
                               <span>{step}</span>
                             </li>
                           ))}
                        </ul>
                     </div>
                     <div className={`col-span-2 text-[12px] font-medium leading-relaxed pl-4 border-l dark:border-[#334155] ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#0f3b9c]'}`}>
                        {tc.expected}
                     </div>
                  </>
               ) : (
                   <>
                     <div className={`col-span-1 text-[11px] font-bold font-mono text-[#0f3b9c] dark:text-[#60a5fa]`}>
                        {tc.id}
                     </div>
                     <div className="col-span-3 pr-4">
                        <h4 className={`text-[13px] font-bold leading-snug ${isDarkMode ? 'text-white' : 'text-[#172b4d]'}`}>{tc.title}</h4>
                     </div>
                     <div className="col-span-4 border-l dark:border-[#334155] pl-4">
                        <ul className="space-y-2">
                           {(tc.steps || []).map((step, sIdx) => (
                             <li key={sIdx} className={`text-[12px] flex gap-2 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>
                               <span className="opacity-40">{sIdx + 1}.</span> {step}
                             </li>
                           ))}
                        </ul>
                     </div>
                     <div className="col-span-4 border-l dark:border-[#334155] pl-4">
                        <div className={`text-[12px] leading-relaxed p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/10 text-blue-200' : 'bg-blue-50 text-[#0f3b9c]'}`}>
                           {tc.expected_result}
                        </div>
                     </div>
                  </>
               )}
            </div>
          ))}
        </div>
      </div>

      {/* Modern Export Bar (Simplified) */}
      <div className={`rounded-xl p-5 flex flex-wrap items-center justify-between gap-6 shadow-sm border ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-[#f8f9fc] border-[#e9ebf0]'}`}>
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
               <Download size={16} className="text-[#0f3b9c] dark:text-[#60a5fa]" />
            </div>
            <div>
               <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-[#102a5e]'}`}>Export Documentation</p>
               <p className={`text-[10px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Download in multiple formats for your test management tools.</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
             <ExportButton onClick={copyTSV} icon={copied ? ClipboardCheck : Copy} label={copied ? "Copied" : "Copy TSV"} isDarkMode={isDarkMode} />
             <ExportButton onClick={exportExcel} icon={TableIcon} label="Excel" color="text-green-500" isDarkMode={isDarkMode} />
             <ExportButton onClick={exportMarkdown} icon={FileText} label="Markdown" color="text-blue-500" isDarkMode={isDarkMode} />
             <ExportButton onClick={exportCSV} icon={FileDown} label="CSV" isDarkMode={isDarkMode} />
         </div>
      </div>

    </div>
  );
};

export default OutputPanel;
