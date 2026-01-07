
import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase.ts';

interface Props {
  name: string;
  css: string;
  pColor: string;
  sColor: string;
  useVariables?: boolean;
  onSave?: () => void;
}

export const VariationCard: React.FC<Props> = ({ name, css, pColor, sColor, useVariables, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const finalCss = useMemo(() => {
    let output = css;
    if (useVariables) {
      output = output
        .replace(/var\(--p\)/g, 'var(--e-global-color-primary)')
        .replace(/var\(--s\)/g, 'var(--e-global-color-secondary)');
    } else {
      output = output
        .replace(/var\(--p\)/g, pColor)
        .replace(/var\(--s\)/g, sColor);
    }
    return output;
  }, [css, pColor, sColor, useVariables]);

  const elementorSnippet = useMemo(() => {
    // Check if CSS contains media queries
    if (finalCss.includes('@media')) {
      // Split by the double newline before @media
      const parts = finalCss.split(/\n\n@media/);
      if (parts.length >= 2) {
        // Desktop part (before media query)
        const desktopPart = parts[0].trim();
        const desktopBg = desktopPart.replace(/^background:\s*/, '').trim().replace(/;$/, '');
        
        // Media query part - format: " (max-width: 767px) {\n  background: ...;\n}"
        const mediaPart = parts[1].trim();
        
        // Extract media query condition
        const queryMatch = mediaPart.match(/^\([^)]+\)/);
        const queryCondition = queryMatch ? queryMatch[0] : '(max-width: 767px)';
        
        // Extract background value from media query
        const contentMatch = mediaPart.match(/\{\s*background:\s*([^;]+);?\s*\}/);
        const mediaBg = contentMatch ? contentMatch[1].trim() : mediaPart.replace(/^\([^)]+\)\s*\{/, '').replace(/\}$/, '').replace(/^background:\s*/, '').trim().replace(/;$/, '');
        
        return `selector {\n  background: ${desktopBg};\n}\n\n@media ${queryCondition} {\n  selector {\n    background: ${mediaBg};\n  }\n}`;
      }
    }
    // No media query, just wrap in selector
    const bgValue = finalCss.replace(/^background:\s*/, '').trim().replace(/;$/, '');
    return `selector {\n  background: ${bgValue};\n}`;
  }, [finalCss]);

  const handleCopy = () => {
    navigator.clipboard.writeText(elementorSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloudSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('presets').insert([{
        name,
        css_body: css,
        primary_color: pColor,
        secondary_color: sColor,
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      onSave?.();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const previewStyle = useMemo(() => {
    // Extract only the desktop background for preview (ignore media queries)
    let bgCss = css;
    if (css.includes('@media')) {
      bgCss = css.split('@media')[0].trim();
    }
    
    return {
      background: bgCss
        .replace(/var\(--p\)/g, pColor)
        .replace(/var\(--s\)/g, sColor)
        .replace('background:', '')
        .replace(/;$/, '')
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
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/canvas:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex flex-col gap-3 items-center justify-center">
            <button 
              onClick={handleCopy} 
              className="w-40 bg-white text-slate-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform hover:scale-105 active:scale-95 transition-all"
            >
              {copied ? '✓ Copied' : 'Copy Selector'}
            </button>
            <button 
              onClick={handleCloudSave}
              disabled={isSaving}
              className="w-40 bg-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save to Cloud'}
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
              <span className={`w-1.5 h-1.5 rounded-full ${useVariables ? 'bg-green-500' : 'bg-indigo-500'} animate-pulse`}></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {useVariables ? 'Elementor Global Mode' : 'Direct Hex Mode'}
              </span>
           </div>
           <code className="text-[10px] text-slate-400 font-mono block overflow-hidden bg-slate-50 px-3 py-2 rounded-xl max-h-24 overflow-y-auto custom-scrollbar">
            {finalCss.trim()}
          </code>
        </div>
      </div>
    </div>
  );
};
