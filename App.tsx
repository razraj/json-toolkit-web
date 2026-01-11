import React, { useState, useEffect } from 'react';
import { 
  FileJson, 
  Trash2, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Wand2, 
  FileDown, 
  Upload, 
  Minimize2, 
  Maximize2,
  PanelRightClose,
  PanelRightOpen,
  LayoutTemplate,
  AlignLeft,
  AlignJustify,
  Network,
  Quote,
  Slash,
  Eraser
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import JsonTree from './components/JsonTree';
import { GenerationResult } from './types';
import { fixMalformedJson, generateTypeScriptInterfaces } from './services/geminiService';

const DEMO_JSON = JSON.stringify({
  "project": "Lumina JSON",
  "version": 1.0,
  "features": ["Formatter", "Validator", "AI Repair"],
  "settings": {
    "theme": "dark",
    "autoFormat": true,
    "maxDepth": 5
  },
  "contributors": [
    { "name": "Alice", "role": "Frontend" },
    { "name": "Bob", "role": "AI Engineer" }
  ],
  "active": true,
  "lastUpdated": null
}, null, 2);

function App() {
  const [jsonInput, setJsonInput] = useState<string>(DEMO_JSON);
  const [parsedData, setParsedData] = useState<any>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [aiMode, setAiMode] = useState<'repair' | 'types' | null>(null);
  const [generatedTypes, setGeneratedTypes] = useState<string | null>(null);
  const [formatMode, setFormatMode] = useState<'pretty' | 'raw' | 'tree'>('pretty');

  // Parse JSON whenever input changes
  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedData(null);
      setSelectedData(null);
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedData(parsed);
      setSelectedData(parsed); // Default selection to root
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [jsonInput]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const escapeString = (str: string) => {
    return str.replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/[\b]/g, '\\b')
      .replace(/\f/g, '\\f');
  };

  const unescapeString = (str: string) => {
    return str.replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  };

  const handleEscape = () => {
    setJsonInput(prev => escapeString(prev));
    showNotification("Text Escaped");
  };

  const handleUnescape = () => {
    setJsonInput(prev => unescapeString(prev));
    showNotification("Text Unescaped");
  };

  const handleFormat = (currentInput: string = jsonInput) => {
    try {
      const parsed = JSON.parse(currentInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      setFormatMode('pretty');
      showNotification("JSON Formatted");
      return true;
    } catch (e) {
      // Try to unescape and format if normal format fails
      try {
        const unescaped = unescapeString(currentInput);
        const parsed = JSON.parse(unescaped);
        const formatted = JSON.stringify(parsed, null, 2);
        setJsonInput(formatted);
        setFormatMode('pretty');
        showNotification("Auto-unescaped & Formatted");
        return true;
      } catch (err) {
        showNotification("Cannot format invalid JSON");
        return false;
      }
    }
  };

  const handleMinify = (currentInput: string = jsonInput) => {
    try {
      const parsed = JSON.parse(currentInput);
      setJsonInput(JSON.stringify(parsed));
      setFormatMode('raw');
      showNotification("JSON Minified");
      return true;
    } catch (e) {
        // Try to unescape and minify
        try {
            const unescaped = unescapeString(currentInput);
            const parsed = JSON.parse(unescaped);
            setJsonInput(JSON.stringify(parsed));
            setFormatMode('raw');
            showNotification("Auto-unescaped & Minified");
            return true;
        } catch(err) {
            showNotification("Cannot minify invalid JSON");
            return false;
        }
    }
  };

  const toggleFormat = (mode: 'pretty' | 'raw' | 'tree') => {
    if (mode === formatMode && mode !== 'tree') return; // Allow clicking tree again to refresh if needed?
    
    // Auto-check logic when switching to visualization modes
    if (error && (mode === 'pretty' || mode === 'tree')) {
        // Attempt to unescape if currently invalid
        try {
            const unescaped = unescapeString(jsonInput);
            JSON.parse(unescaped); // validate
            setJsonInput(unescaped); // Update input
            if (mode === 'pretty') {
                // handleFormat will be called below, but we updated state... 
                // State update is async. Let's pass the new value directly.
                 const parsed = JSON.parse(unescaped);
                 setJsonInput(JSON.stringify(parsed, null, 2));
                 setFormatMode('pretty');
                 showNotification("Auto-unescaped JSON");
                 return;
            }
            // For tree, we just updated jsonInput, useEffect will trigger parse.
            if (mode === 'tree') {
                setFormatMode('tree');
                showNotification("Auto-unescaped for Tree View");
                return;
            }
        } catch (ignored) {
            // Unescape didn't help, proceed as normal error
        }
    }

    if (mode === 'tree') {
      setFormatMode('tree');
      return;
    }

    if (mode === 'pretty') {
      handleFormat();
    } else {
      handleMinify();
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setParsedData(null);
    setSelectedData(null);
    setError(null);
    setGeneratedTypes(null);
    setAiMode(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonInput);
    showNotification("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([jsonInput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonInput(text);
    };
    reader.readAsText(file);
  };

  const handleAiFix = async () => {
    if (!error) {
      showNotification("JSON is already valid.");
      return;
    }
    setIsProcessing(true);
    setAiMode('repair');
    const result: GenerationResult = await fixMalformedJson(jsonInput);
    setIsProcessing(false);
    setAiMode(null);

    if (result.error) {
      showNotification(`AI Fix Failed: ${result.error}`);
    } else {
      setJsonInput(result.content);
      showNotification("JSON Repaired by Gemini AI");
    }
  };

  const handleGenerateTypes = async () => {
    if (error || !jsonInput.trim()) {
      showNotification("Please provide valid JSON first.");
      return;
    }
    setIsProcessing(true);
    setAiMode('types');
    const result: GenerationResult = await generateTypeScriptInterfaces(jsonInput);
    setIsProcessing(false);

    if (result.error) {
      showNotification(`Gen Types Failed: ${result.error}`);
      setAiMode(null);
    } else {
      setGeneratedTypes(result.content);
      showNotification("TypeScript Interfaces Generated");
    }
  };

  const onNodeCopy = (path: string, value: any) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    showNotification(`Copied value from ${path || 'root'}`);
  };

  const onNodeSelect = (value: any) => {
      setSelectedData(value);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b0f19] text-gray-300 font-sans selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#0b0f19] z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg text-white shadow-lg shadow-purple-900/20">
            <FileJson size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Lumina JSON</h1>
            <p className="text-xs text-gray-500">Editor & Visualizer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Actions Toolbar */}
           <div className="hidden md:flex items-center bg-gray-900 rounded-lg p-1 border border-gray-800">
             <button onClick={handleEscape} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Escape JSON String">
                <Quote size={18} />
             </button>
             <button onClick={handleUnescape} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Unescape JSON String">
                <Slash size={18} />
             </button>
             <div className="w-px h-4 bg-gray-700 mx-1"></div>
             <button onClick={handleCopy} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Copy All">
                <Copy size={18} />
             </button>
             <button onClick={handleClear} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400 transition-colors" title="Clear">
                <Trash2 size={18} />
             </button>
           </div>
           
           <div className="w-px h-6 bg-gray-800 mx-2 hidden md:block"></div>

           {/* AI Tools */}
           <button 
             onClick={handleAiFix}
             disabled={isProcessing || !error}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
               error 
                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 cursor-pointer' 
                : 'bg-gray-800 text-gray-500 border-transparent cursor-not-allowed'
             }`}
           >
             <Wand2 size={14} className={isProcessing && aiMode === 'repair' ? 'animate-spin' : ''} />
             {isProcessing && aiMode === 'repair' ? 'Fixing...' : 'Fix'}
           </button>

           <button 
             onClick={() => generatedTypes ? setGeneratedTypes(null) : handleGenerateTypes()}
             disabled={isProcessing || !!error}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                generatedTypes
                ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                : 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20'
             } disabled:opacity-50 disabled:cursor-not-allowed`}
           >
             {generatedTypes ? <LayoutTemplate size={14} /> : <Code size={14} className={isProcessing && aiMode === 'types' ? 'animate-spin' : ''} />}
             {generatedTypes ? 'Close Types' : (isProcessing && aiMode === 'types' ? 'Generating...' : 'TS Types')}
           </button>

           <div className="w-px h-6 bg-gray-800 mx-2 hidden md:block"></div>

           <label className="p-2 bg-gray-900 hover:bg-gray-800 rounded-lg cursor-pointer border border-gray-800 text-gray-400 hover:text-white transition-colors" title="Upload JSON">
             <Upload size={18} />
             <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
           </label>
           <button onClick={handleDownload} className="p-2 bg-gray-900 hover:bg-gray-800 rounded-lg border border-gray-800 text-gray-400 hover:text-white transition-colors" title="Download">
             <FileDown size={18} />
           </button>
           
           <div className="w-px h-6 bg-gray-800 mx-2 hidden md:block"></div>

           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className={`p-2 rounded-lg border border-gray-800 transition-colors ${isSidebarOpen ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
             title="Toggle Structure Sidebar"
           >
             {isSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
           </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Editor Area (Left/Center) */}
        <section className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
          {/* Editor Header/Status Bar */}
          <div className="h-10 border-b border-gray-800 bg-[#0b0f19] flex items-center justify-between px-4 text-xs select-none">
             <div className="flex items-center gap-4">
                 <span className="font-medium text-gray-500 uppercase tracking-wider mr-2">Editor</span>
                 
                 {/* Raw / Pretty / Tree Toggle */}
                 <div className="flex bg-gray-900 rounded p-0.5 border border-gray-800">
                    <button 
                      onClick={() => toggleFormat('raw')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${formatMode === 'raw' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <AlignLeft size={10} /> Raw
                    </button>
                    <button 
                      onClick={() => toggleFormat('pretty')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${formatMode === 'pretty' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <AlignJustify size={10} /> Beautify
                    </button>
                    <button 
                      onClick={() => toggleFormat('tree')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${formatMode === 'tree' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <Network size={10} /> Tree View
                    </button>
                 </div>

                 {/* Added Clear Button */}
                 <button 
                    onClick={handleClear} 
                    className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Clear Content"
                 >
                    <Eraser size={12} />
                    <span className="hidden sm:inline">Clear</span>
                 </button>
             </div>

             <div className="flex items-center gap-3">
                {generatedTypes ? (
                    <span className="text-blue-400 flex items-center gap-1.5 bg-blue-400/10 px-2 py-0.5 rounded-full">
                        <LayoutTemplate size={12} /> TypeScript View
                    </span>
                ) : null}
                {error ? (
                  <span className="text-red-400 flex items-center gap-1.5 bg-red-400/10 px-2 py-0.5 rounded-full">
                    <AlertCircle size={12} /> Invalid JSON
                  </span>
                ) : (
                   <span className="text-green-400 flex items-center gap-1.5 bg-green-400/10 px-2 py-0.5 rounded-full">
                     <CheckCircle size={12} /> Valid JSON
                   </span>
                )}
                {formatMode !== 'tree' && (
                    <span className="text-gray-600">
                        Ln {jsonInput.split('\n').length}, Col {jsonInput.length}
                    </span>
                )}
             </div>
          </div>

          <div className="flex-1 relative bg-gray-900">
            {generatedTypes ? (
                <CodeEditor 
                    value={generatedTypes} 
                    onChange={() => {}} 
                    readOnly={true}
                    placeholder="Typescript interfaces..."
                />
            ) : formatMode === 'tree' ? (
                <div className="absolute inset-0 overflow-auto p-4 custom-scrollbar select-text">
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-400 opacity-80">
                            <AlertCircle size={40} className="mb-3"/>
                            <p className="font-medium">Cannot Render Tree View</p>
                            <p className="text-xs text-red-400/70 mt-1 max-w-md text-center">{error}</p>
                            <button 
                                onClick={() => toggleFormat('pretty')}
                                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-white transition-colors"
                            >
                                Return to Editor
                            </button>
                        </div>
                    ) : parsedData !== null ? (
                        <JsonTree 
                          value={parsedData} 
                          isLast={true} 
                          onCopy={onNodeCopy} 
                          showValues={true} 
                          onSelect={onNodeSelect}
                        />
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-gray-600">
                            <Network size={40} className="mb-3 opacity-20"/>
                            <p className="text-sm">Empty JSON</p>
                        </div>
                    )}
                </div>
            ) : (
                <CodeEditor 
                    value={jsonInput} 
                    onChange={(val) => {
                        setJsonInput(val);
                    }} 
                    error={error} 
                    placeholder="Type or paste JSON here..." 
                />
            )}
          </div>
        </section>

        {/* Sidebar (Right) - Structure/Keys */}
        <div 
            className={`border-l border-gray-800 bg-[#0f131f] flex flex-col transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full border-l-0 overflow-hidden'
            }`}
        >
           <div className="h-10 border-b border-gray-800 flex items-center px-4 bg-[#0f131f] shrink-0 min-w-max">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Structure & Keys</span>
              {selectedData !== null && (
                <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                    {Array.isArray(selectedData) ? 'Array' : (typeof selectedData === 'object' && selectedData !== null ? 'Object' : typeof selectedData)}
                </span>
              )}
           </div>
           
           <div className="flex-1 overflow-auto p-4 custom-scrollbar min-w-[20rem]">
              {selectedData !== null ? (
                 <JsonTree value={selectedData} isLast={true} onCopy={onNodeCopy} showValues={false} />
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 p-4 text-center opacity-50">
                    <LayoutTemplate size={32} />
                    <p className="text-sm">Select a node in Tree View <br/> to view structure</p>
                 </div>
              )}
           </div>
        </div>

      </main>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-xl border border-gray-700 text-sm animate-fade-in-up z-50 flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400"/>
          {notification}
        </div>
      )}

      {/* Tailwind Animation Config helper style */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Helper icons needed for the updated design
function Code({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export default App;