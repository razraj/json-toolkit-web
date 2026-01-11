import React, { useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  error?: string | null;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, error, placeholder, readOnly = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = value.split('\n').length;
  const lines = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  return (
    <div className={`relative flex h-full w-full bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-lg overflow-hidden font-mono text-sm`}>
      {/* Line Numbers */}
      <div 
        ref={lineNumbersRef}
        className="hidden sm:block w-12 bg-gray-950 text-gray-600 text-right p-4 overflow-hidden select-none border-r border-gray-800"
      >
        {lines.map((num) => (
          <div key={num} className="leading-6">{num}</div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`flex-1 w-full h-full bg-gray-900 text-gray-200 p-4 leading-6 resize-none outline-none ${readOnly ? 'opacity-80' : ''}`}
      />
      
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-900/90 text-red-200 px-4 py-2 rounded shadow-lg text-xs backdrop-blur-sm border border-red-700 max-w-md">
          <p className="font-bold">Syntax Error:</p>
          <p className="font-mono mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;