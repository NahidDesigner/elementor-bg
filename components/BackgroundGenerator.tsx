
import React, { useState } from 'react';
import { VariationCard } from './VariationCard.tsx';
import { ColorPicker } from './ColorPicker.tsx';
import { BackgroundService } from '../services/background.service.ts';

interface LightSource {
  id: string;
  posX: number;
  posY: number;
  spread: number;
  intensity: number;
}

export const BackgroundGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor'>('gallery');
  const [primary, setPrimary] = useState('#6366f1');
  const [secondary, setSecondary] = useState('#ec4899');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lights, setLights] = useState<LightSource[]>([
    { id: '1', posX: 50, posY: 30, spread: 80, intensity: 60 }
  ]);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageSync = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const colors = await BackgroundService.extractColorsFromImage(base64, file.type);
        setPrimary(colors[0]);
        setSecondary(colors[1]);
        showToast("AI Palette Synchronized!");
      } catch (err: any) {
        showToast(err.message || "Failed to analyze image", 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateLight = (id: string, updates: Partial<LightSource>) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const editorCss = `background: radial-gradient(circle at ${lights[0].posX}% ${lights[0].posY}%, color-mix(in srgb, var(--s), transparent ${100 - lights[0].intensity}%) 0%, transparent ${lights[0].spread}%), var(--p);`;

  const presets = [
    { name: "Aurora Borealis", category: "Gradient", css: "background: linear-gradient(215deg, var(--p) 0%, var(--s) 100%);" },
    { name: "Subtle Center Glow", category: "Gradient", css: "background: radial-gradient(circle at 50% 50%, var(--s) 0%, var(--p) 100%);" },
    { name: "Studio Spotlight", category: "Mesh", css: "background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--s), transparent 60%) 0%, transparent 80%), var(--p);" },
    { name: "Dual Mesh Glow", category: "Mesh", css: "background: radial-gradient(at 0% 0%, var(--s) 0px, transparent 50%), radial-gradient(at 100% 100%, var(--s) 0px, transparent 50%), var(--p);" },
    { name: "Frosted Accents", category: "Glass", css: "background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent), radial-gradient(circle at 20% 20%, var(--s) 0%, transparent 40%), var(--p);" },
    { name: "Velvet Soft", category: "Glass", css: "background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--s), transparent 80%) 0%, var(--p) 100%);" }
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-[2rem] shadow-2xl font-bold text-white transition-all transform animate-bounce ${toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
             Live Design Studio
          </div>
          <h2 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">Studio Pro</h2>
          <p className="text-slate-500 font-medium text-lg">Modern CSS engine for Elementor containers.</p>
        </div>
        <div className="bg-slate-200 p-1.5 rounded-[2rem] flex shadow-inner shrink-0">
          <button onClick={() => setActiveTab('gallery')} className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'gallery' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Gallery</button>
          <button onClick={() => setActiveTab('editor')} className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500'}`}>Visual Editor</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-50 flex flex-wrap items-center justify-center lg:justify-between gap-10">
        <div className="flex flex-wrap items-center justify-center gap-10">
          <ColorPicker label="Base Color" value={primary} onChange={setPrimary} />
          <div className="hidden lg:block w-px h-12 bg-slate-100" />
          <ColorPicker label="Accent Color" value={secondary} onChange={setSecondary} />
        </div>
        
        <div className="flex flex-col items-center lg:items-end gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vision Palette Sync</span>
          <label className={`flex items-center justify-center px-8 py-4 rounded-2xl cursor-pointer transition-all ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:scale-105 active:scale-95'}`}>
            <span className="text-xs font-black uppercase tracking-widest">{isAnalyzing ? 'Analyzing AI...' : 'Upload Reference'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageSync} disabled={isAnalyzing} />
          </label>
        </div>
      </div>

      {activeTab === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {presets.map((p, i) => (
            <VariationCard key={i} name={p.name} css={p.css} pColor={primary} sColor={secondary} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 aspect-video bg-slate-900 rounded-[3.5rem] shadow-2xl overflow-hidden relative border-[12px] border-white ring-1 ring-slate-100">
            <div 
              className="w-full h-full transition-all duration-700"
              style={{
                background: `radial-gradient(circle at ${lights[0].posX}% ${lights[0].posY}%, color-mix(in srgb, ${secondary}, transparent ${100 - lights[0].intensity}%) 0%, transparent ${lights[0].spread}%), ${primary}`
              }}
            />
            <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold text-white tracking-widest uppercase">
               Real-time Simulation
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
            <div>
               <h4 className="text-xl font-black text-slate-800 tracking-tight">Light Geometry</h4>
               <p className="text-xs text-slate-400 font-medium mt-1">Fine-tune the spotlight coordinates.</p>
            </div>
            <EditorSlider label="Horizontal Pos" value={lights[0].posX} onChange={v => updateLight(lights[0].id, { posX: v })} />
            <EditorSlider label="Vertical Pos" value={lights[0].posY} onChange={v => updateLight(lights[0].id, { posY: v })} />
            <EditorSlider label="Glow Radius" value={lights[0].spread} min={10} max={200} onChange={v => updateLight(lights[0].id, { spread: v })} />
            <EditorSlider label="Lumen Intensity" value={lights[0].intensity} onChange={v => updateLight(lights[0].id, { intensity: v })} />
            <div className="pt-6">
              <VariationCard name="Custom Masterpiece" css={editorCss} pColor={primary} sColor={secondary} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditorSlider = ({ label, value, onChange, min = 0, max = 100 }: any) => (
  <div className="space-y-3 group">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">{label}</label>
      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{value}%</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);
