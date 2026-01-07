
import React, { useState, useMemo } from 'react';

interface Props {
  name: string;
  css: string;
  pColor: string;
  sColor: string;
}

export const VariationCard: React.FC<Props> = ({ name, css, pColor, sColor }) => {
  const [copied, setCopied] = useState(false);

  const elementorSnippet = useMemo(() => {
    return `selector {\n  ${css.trim()}\n}`;
  }, [css]);

  const handleCopy = () => {
    navigator.clipboard.writeText(elementorSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewStyle = useMemo(() => {
    return {
      background: css
        .replace(/var\(--p\)/g, pColor)
        .replace(/var\(--s\)/g, sColor)
        .replace('background:', '')
        .replace(';', '')
        .trim()
    };
  }, [css, pColor, sColor]);

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
      <div className="p-5 flex-shrink-0">
        <div 
          className="w-full aspect-[4/3] rounded-[2rem] shadow-inner flex items-center justify-center relative overflow-hidden group/canvas ring-1 ring-slate-50" 
          style={previewStyle}
        >
          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center">
            <button 
              onClick={handleCopy} 
              className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform scale-90 group-hover/canvas:scale-100 transition-all hover:bg-indigo-600 hover:text-white"
            >
              {copied ? '✓ Copied' : 'Copy Selector'}
            </button>
          </div>
        </div>
      </div>
      <div className="px-8 pb-8 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-slate-800 text-base tracking-tight">{name}</h3>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-100 shadow-sm" style={{backgroundColor: pColor}} />
            <div className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-100 shadow-sm" style={{backgroundColor: sColor}} />
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-3">
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advanced > Custom CSS</span>
           </div>
           <code className="text-[10px] text-slate-400 font-mono block overflow-hidden text-ellipsis whitespace-nowrap bg-slate-50 px-3 py-2 rounded-xl group-hover:text-indigo-600 transition-colors">
            {css.trim()}
          </code>
        </div>
      </div>
    </div>
  );
};
