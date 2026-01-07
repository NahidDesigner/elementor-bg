
import React, { useState, useEffect } from 'react';
import { VariationCard } from './VariationCard.tsx';
import { ColorPicker } from './ColorPicker.tsx';
import { supabase, checkSupabaseConnection } from '../lib/supabase.ts';
import { BackgroundService } from '../services/background.service.ts';

interface LightSource {
  id: string;
  posX: number;
  posY: number;
  spread: number;
  intensity: number;
}

export const BackgroundGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor' | 'cloud'>('gallery');
  const [primary, setPrimary] = useState('#0f172a');
  const [secondary, setSecondary] = useState('#38bdf8');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lights, setLights] = useState<LightSource[]>([
    { id: '1', posX: 50, posY: 30, spread: 60, intensity: 50 }
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
        const [p, s] = await BackgroundService.extractColorsFromImage(base64, file.type);
        setPrimary(p);
        setSecondary(s);
        showToast("AI Palette Synchronized!");
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateLight = (id: string, updates: Partial<LightSource>) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const editorCss = `background: radial-gradient(circle at ${lights[0].posX}% ${lights[0].posY}%, color-mix(in srgb, var(--e-global-color-secondary), transparent ${100 - lights[0].intensity}%) 0%, transparent ${lights[0].spread}%), var(--e-global-color-primary);`;

  const presets = [
    { name: "Spotlight Studio", css: "background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--e-global-color-secondary), transparent 70%) 0%, transparent 80%), var(--e-global-color-primary);" },
    { name: "Dual Glow", css: "background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--e-global-color-secondary), transparent 80%) 0%, transparent 50%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--e-global-color-secondary), transparent 80%) 0%, transparent 50%), var(--e-global-color-primary);" },
    { name: "Bottom Rise", css: "background: radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--e-global-color-secondary), transparent 60%) 0%, transparent 70%), var(--e-global-color-primary);" }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold text-white transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Studio Pro</h2>
          <p className="text-slate-500 font-medium">Elementor Dynamic Background Engine</p>
        </div>
        <div className="bg-slate-200 p-1.5 rounded-2xl flex shadow-inner">
          {['gallery', 'editor', 'cloud'].map((t) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-wrap items-center justify-center gap-12">
        <ColorPicker label="Base Color" value={primary} onChange={setPrimary} />
        <div className="h-12 w-px bg-slate-100 hidden md:block" />
        <ColorPicker label="Accent Color" value={secondary} onChange={setSecondary} />
        <div className="h-12 w-px bg-slate-100 hidden md:block" />
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vision Sync</span>
          <label className="group relative flex items-center justify-center px-6 py-3 bg-slate-900 rounded-2xl cursor-pointer hover:bg-slate-800 transition-all overflow-hidden">
            <span className="relative z-10 text-white text-xs font-bold">{isAnalyzing ? 'Analyzing...' : 'Upload Image'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageSync} disabled={isAnalyzing} />
            {isAnalyzing && <div className="absolute inset-0 bg-indigo-600 animate-pulse" />}
          </label>
        </div>
      </div>

      {activeTab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {presets.map((p, i) => (
            <VariationCard key={i} name={p.name} css={p.css} pColor={primary} sColor={secondary} />
          ))}
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 aspect-video bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative border-8 border-white">
            <div 
              className="w-full h-full transition-all duration-700"
              style={{
                background: `radial-gradient(circle at ${lights[0].posX}% ${lights[0].posY}%, color-mix(in srgb, ${secondary}, transparent ${100 - lights[0].intensity}%) 0%, transparent ${lights[0].spread}%), ${primary}`
              }}
            />
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Real-time Canvas</span>
              <span className="text-white/50 text-[10px] font-mono">16:9 Aspect</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg space-y-8">
            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full" />
              Light Geometry
            </h4>
            <div className="space-y-6">
              <EditorSlider label="Horizontal" value={lights[0].posX} onChange={v => updateLight(lights[0].id, { posX: v })} />
              <EditorSlider label="Vertical" value={lights[0].posY} onChange={v => updateLight(lights[0].id, { posY: v })} />
              <EditorSlider label="Radius" value={lights[0].spread} min={10} max={200} onChange={v => updateLight(lights[0].id, { spread: v })} />
              <EditorSlider label="Intensity" value={lights[0].intensity} onChange={v => updateLight(lights[0].id, { intensity: v })} />
            </div>
            <div className="pt-4">
              <VariationCard name="Custom Build" css={editorCss} pColor={primary} sColor={secondary} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cloud' && (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[2rem] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl">☁️</div>
          <h3 className="text-xl font-bold text-slate-800">Coming Soon</h3>
          <p className="text-slate-500 max-w-xs text-sm">Cloud saving for your presets is being synchronized with your account.</p>
        </div>
      )}
    </div>
  );
};

const EditorSlider = ({ label, value, onChange, min = 0, max = 100 }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{value}%</span>
    </div>
    <input 
      type="range" min={min} max={max} value={value} 
      onChange={e => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
  </div>
);
