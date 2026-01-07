
import React, { useState, useMemo } from 'react';

interface VariationCardProps {
  name: string;
  css: string;
  previewPrimary: string;
  previewSecondary: string;
}

export const VariationCard: React.FC<VariationCardProps> = ({ name, css, previewPrimary, previewSecondary }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Add selector for Elementor custom CSS convenience
    const elementorCss = `selector {\n  ${css}\n}`;
    navigator.clipboard.writeText(elementorCss);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert CSS string to React Style object and inject preview variables
  const previewStyle = useMemo(() => {
    const styleObj: any = {
      '--e-global-color-primary': previewPrimary,
      '--e-global-color-secondary': previewSecondary,
    };
    
    css.split(';').filter(Boolean).forEach(line => {
      const [key, ...val] = line.split(':');
      if (key && val.length) {
        styleObj[key.trim()] = val.join(':').trim();
      }
    });
    
    return styleObj;
  }, [css, previewPrimary, previewSecondary]);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-slate-200">
      <div 
        className="h-56 w-full transition-transform group-hover:scale-105 duration-700 flex items-center justify-center"
        style={previewStyle}
      >
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-lg text-[10px] text-white/40 uppercase tracking-widest font-bold">
          Preview
        </div>
      </div>
      <div className="p-5 border-t border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-800">{name}</h3>
          <button 
            onClick={handleCopy}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <div className="relative group/code">
          <div className="bg-slate-50 rounded-xl p-3 max-h-24 overflow-y-auto border border-slate-100">
            <code className="text-[10px] text-slate-500 font-mono break-all leading-relaxed block">
              selector {'{'}
              <br />
              &nbsp;&nbsp;{css}
              <br />
              {'}'}
            </code>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none opacity-40 h-8 bottom-0" />
        </div>
        <p className="mt-3 text-[10px] text-slate-400 font-medium italic">
          * Uses Elementor Global Color Variables
        </p>
      </div>
    </div>
  );
};
