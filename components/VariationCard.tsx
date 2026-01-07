
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
    const style: any = {
      '--e-global-color-primary': pColor,
      '--e-global-color-secondary': sColor,
    };
    
    // Inject the background property
    const bgMatch = css.match(/background:\s*([^;]+)/);
    if (bgMatch) style.background = bgMatch[1];
    
    return style;
  }, [css, pColor, sColor]);

  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-500">
      <div className="h-48 w-full p-4">
        <div className="w-full h-full rounded-[1.5rem] shadow-inner flex items-center justify-center relative overflow-hidden" style={previewStyle}>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button onClick={handleCopy} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter shadow-xl transform scale-90 group-hover:scale-100 transition-all">
              {copied ? '✓ Copied' : 'Get CSS'}
            </button>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{name}</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-md">Elementor Ready</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative group/code">
          <code className="text-[9px] text-slate-400 font-mono block overflow-hidden text-ellipsis whitespace-nowrap">
            {elementorSnippet.split('\n')[1].trim()}
          </code>
          <div className="absolute inset-0 bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover/code:opacity-100 transition-opacity rounded-xl cursor-pointer" onClick={handleCopy}>
            <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy All Code'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
