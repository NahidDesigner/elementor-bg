
import React, { useState, useEffect } from 'react';
import { VariationCard } from './VariationCard.tsx';
import { ColorPicker } from './ColorPicker.tsx';
import { supabase, checkSupabaseConnection } from '../lib/supabase.ts';
import { BackgroundService } from '../services/background.service.ts';

interface LightSource {
  id: string;
  posX: number;
  posY: number;
  intensity: number;
  spread: number;
}

interface ResponsiveState {
  desktop: LightSource[];
  mobile: LightSource[];
}

interface SavedPreset {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  light_config: ResponsiveState;
}

export const BackgroundGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor' | 'my-presets'>('gallery');
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [primary, setPrimary] = useState('#1a1a1a'); 
  const [secondary, setSecondary] = useState('#d4af37');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [responsiveLights, setResponsiveLights] = useState<ResponsiveState>({
    desktop: [{ id: '1', posX: 50, posY: 40, intensity: 80, spread: 60 }],
    mobile: [{ id: '1', posX: 50, posY: 30, intensity: 85, spread: 80 }]
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        showToast("Palette synchronized!");
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateLight = (id: string, updates: Partial<LightSource>) => {
    setResponsiveLights(prev => ({
      ...prev,
      [activeDevice]: prev[activeDevice].map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const P = 'var(--e-global-color-primary)';
  const S = 'var(--e-global-color-secondary)';

  const variations = [
    { name: 'Classic Studio', css: `background: radial-gradient(circle at 50% 40%, color-mix(in srgb, ${S}, transparent 80%) 0%, transparent 60%), ${P};` },
    { name: 'Aurora Glow', css: `background: linear-gradient(180deg, ${P}, transparent), radial-gradient(circle at 80% 20%, ${S}, transparent 50%);` },
    { name: 'Deep Focus', css: `background: radial-gradient(circle at 50% 50%, color-mix(in srgb, ${S}, transparent 90%) 0%, ${P} 100%);` }
  ];

  const activeLight = responsiveLights[activeDevice][0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-xl font-bold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Studio Pro</h2>
        <div className="bg-slate-200 p-1 rounded-xl flex">
          <button onClick={() => setActiveTab('gallery')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'gallery' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Gallery</button>
          <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Editor</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap justify-center gap-12">
        <ColorPicker label="Base Color" value={primary} onChange={setPrimary} />
        <ColorPicker label="Accent Light" value={secondary} onChange={setSecondary} />
        <div className="flex flex-col items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase">AI Scan</label>
          <label className="cursor-pointer bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm font-bold">
            {isAnalyzing ? 'Analyzing...' : 'Reference Image'}
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing} />
          </label>
        </div>
      </div>

      {activeTab === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {variations.map((v, i) => (
            <VariationCard key={i} name={v.name} css={v.css} previewPrimary={primary} previewSecondary={secondary} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl min-h-[500px] flex items-center justify-center p-8">
             <div 
                className="w-full h-full rounded-2xl transition-all duration-700 shadow-2xl"
                style={{
                  background: `radial-gradient(circle at ${activeLight.posX}% ${activeLight.posY}%, color-mix(in srgb, ${secondary}, transparent 50%) 0%, transparent ${activeLight.spread}%), ${primary}`
                }}
             />
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-6">
            <h4 className="font-bold text-slate-800 border-b pb-4">Light Editor</h4>
            <div className="space-y-4">
              <Slider label="Horizontal" value={activeLight.posX} onChange={(v) => updateLight(activeLight.id, { posX: v })} />
              <Slider label="Vertical" value={activeLight.posY} onChange={(v) => updateLight(activeLight.id, { posY: v })} />
              <Slider label="Spread" value={activeLight.spread} onChange={(v) => updateLight(activeLight.id, { spread: v })} min={10} max={200} />
            </div>
            <div className="pt-6">
               <VariationCard 
                 name="Live Export" 
                 css={`background: radial-gradient(circle at ${activeLight.posX}% ${activeLight.posY}%, color-mix(in srgb, ${S}, transparent 50%) 0%, transparent ${activeLight.spread}%), ${P};`}
                 previewPrimary={primary}
                 previewSecondary={secondary}
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Slider = ({ label, value, onChange, min = 0, max = 100 }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);
