
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';

interface Props {
  name: string;
  css: string;
  pColor: string;
  sColor: string;
  useVariables?: boolean;
  onSave?: () => void;
  onEdit?: (name: string, css: string) => void;
  showEdit?: boolean;
}

export const VariationCard: React.FC<Props> = ({ name, css, pColor, sColor, useVariables, onSave, onEdit, showEdit = false }) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCss, setEditedCss] = useState(css);
  
  // Sync editedCss when css prop changes (when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedCss(css);
    }
  }, [css, isEditing]);

  const finalCss = useMemo(() => {
    // Use edited CSS when editing, otherwise use original
    const cssToUse = isEditing ? editedCss : css;
    let output = cssToUse;
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
  }, [css, editedCss, isEditing, pColor, sColor, useVariables]);

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
    // Use edited CSS if editing, otherwise use original
    const cssToUse = isEditing ? editedCss : css;
    // Extract only the desktop background for preview (ignore media queries)
    let bgCss = cssToUse;
    if (cssToUse.includes('@media')) {
      bgCss = cssToUse.split('@media')[0].trim();
    }
    
    return {
      background: bgCss
        .replace(/var\(--p\)/g, pColor)
        .replace(/var\(--s\)/g, sColor)
        .replace('background:', '')
        .replace(/;$/, '')
        .trim()
    };
  }, [css, editedCss, isEditing, pColor, sColor]);

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(name, editedCss);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedCss(css);
    setIsEditing(false);
  };

  return (
    <>
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && handleCancelEdit()}>
          <div className="bg-white rounded-[3rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Edit: {name}</h3>
              <button
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">CSS Code</label>
                <textarea
                  value={editedCss}
                  onChange={(e) => setEditedCss(e.target.value)}
                  className="w-full h-64 font-mono text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  placeholder="background: ..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest">Live Preview</label>
                <div 
                  className="w-full aspect-video rounded-2xl shadow-inner border border-slate-200"
                  style={previewStyle}
                />
                <div className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl">
                  <p className="font-semibold mb-2">Tip:</p>
                  <p>Use <code className="bg-white px-2 py-1 rounded">var(--p)</code> for primary color</p>
                  <p>Use <code className="bg-white px-2 py-1 rounded">var(--s)</code> for secondary color</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
            {showEdit && onEdit && (
              <button 
                onClick={() => {
                  setEditedCss(css);
                  setIsEditing(true);
                }}
                className="w-40 bg-yellow-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform hover:scale-105 active:scale-95 transition-all"
              >
                Edit CSS
              </button>
            )}
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
    </>
  );
};
