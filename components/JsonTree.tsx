import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { JsonNodeProps } from '../types';

const JsonTree: React.FC<JsonNodeProps> = ({ 
  keyName, 
  value, 
  isLast, 
  depth = 0, 
  onCopy, 
  onSelect,
  path = '', 
  showValues = true 
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) onCopy(path, value);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(value);
  };

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;
  
  // Calculate indentation padding
  const paddingLeft = `${depth * 1.5}rem`;

  const renderPrimitive = (val: any) => {
    if (val === null) return <span className="text-gray-500 italic">null</span>;
    if (typeof val === 'string') return <span className="text-green-400">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-orange-400">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-red-400">{val.toString()}</span>;
    return <span className="text-gray-400">{String(val)}</span>;
  };

  const currentPath = keyName ? (path ? `${path}.${keyName}` : keyName) : path;
  
  // Determine key styling. Numeric keys (indices) get a slightly different look.
  const isIndex = !isNaN(Number(keyName));

  if (isObject && !isEmpty) {
    const keys = Object.keys(value);
    const size = isArray ? value.length : keys.length;
    const bracketOpen = isArray ? '[' : '{';
    const bracketClose = isArray ? ']' : '}';
    const typeLabel = isArray ? 'Array' : 'Object';

    return (
      <div 
        className="font-mono text-sm leading-relaxed"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
            className={`flex items-start group/row hover:bg-white/5 rounded px-1 -ml-1 py-0.5 transition-colors`}
            style={{ paddingLeft: depth === 0 ? '0.25rem' : paddingLeft }}
        >
          {/* Toggler */}
          <span 
            className="mr-1 mt-0.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
            onClick={toggleExpand}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>

          {/* Clickable Content Area for Selection */}
          <div className="flex-1 flex items-start flex-wrap cursor-pointer" onClick={handleSelect}>
            {/* Key Name (No Quotes) */}
            {keyName !== undefined && (
                <span className={`mr-1.5 font-medium ${isIndex ? 'text-blue-400/80' : 'text-purple-400'} select-text`}>
                {keyName}<span className="text-gray-500">:</span>
                </span>
            )}

            {/* Type & Brackets */}
            <div className="flex items-center">
                {showValues && <span className="text-gray-500 text-xs mr-2 opacity-70">{typeLabel}</span>}
                {!isExpanded ? (
                    <span className="text-gray-500">
                        {bracketOpen} <span className="text-gray-400 text-xs mx-1">{size}</span> {bracketClose}
                        {!isLast && showValues && <span className="text-gray-600">,</span>}
                    </span>
                ) : (
                    <span className="text-gray-500">{bracketOpen}</span>
                )}

                {/* Quick Actions */}
                {isHovered && showValues && (
                <button 
                    onClick={handleCopy} 
                    className="ml-2 text-gray-600 hover:text-blue-400 opacity-0 group-hover/row:opacity-100 transition-opacity" 
                    title="Copy Object"
                >
                    <Copy size={12} />
                </button>
                )}
            </div>
          </div>
        </div>

        {/* Recursive Children */}
        {isExpanded && (
          <div>
            {keys.map((key, index) => {
              const childValue = value[key as keyof typeof value];
              const childIsLast = index === keys.length - 1;
              const childPath = isArray ? `${currentPath}[${key}]` : (currentPath ? `${currentPath}.${key}` : key);
              
              return (
                <JsonTree
                  key={key}
                  keyName={key} // Always pass key, so array indices are shown
                  value={childValue}
                  isLast={childIsLast}
                  depth={depth + 1}
                  onCopy={onCopy}
                  onSelect={onSelect}
                  path={childPath}
                  showValues={showValues}
                />
              );
            })}
            <div 
                className="hover:bg-white/5 rounded px-1 -ml-1 py-0.5"
                style={{ paddingLeft: paddingLeft }}
            >
              <div className="flex items-center ml-4">
                  <span className="text-gray-500">{bracketClose}</span>
                  {!isLast && showValues && <span className="text-gray-600">,</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primitive Value Render
  return (
    <div 
      className="font-mono text-sm leading-relaxed group/row hover:bg-white/5 rounded px-1 -ml-1 py-0.5 flex items-start cursor-pointer"
      style={{ paddingLeft: paddingLeft }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* Indent Spacer to align with parent toggler arrow (size 14px + mr-1) */}
      <span className="w-[14px] mr-1 inline-block shrink-0"></span>

      {keyName !== undefined && (
        <span className={`mr-1.5 font-medium ${isIndex ? 'text-blue-400/80' : 'text-purple-400'} select-text shrink-0`}>
          {keyName}<span className="text-gray-500">{showValues && ':'}</span>
        </span>
      )}
      
      {showValues && (
        <>
          <span className="select-text break-all">{renderPrimitive(value)}</span>
          {!isLast && <span className="text-gray-600">,</span>}
        </>
      )}
      
      {isHovered && showValues && (
         <button onClick={handleCopy} className="ml-2 text-gray-600 hover:text-blue-400 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" title="Copy Value">
           <Copy size={12} />
         </button>
       )}
    </div>
  );
};

export default JsonTree;