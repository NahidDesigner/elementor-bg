
import React, { useState, useEffect, useMemo } from 'react';
import { VariationCard } from './VariationCard.tsx';
import { ColorPicker } from './ColorPicker.tsx';
import { BackgroundService } from '../services/background.service.ts';
import { supabase } from '../lib/supabase.ts';

interface LightSource {
  id: string;
  posX: number;
  posY: number;
  spread: number;
  intensity: number;
}

export const BackgroundGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor'>('gallery');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [primary, setPrimary] = useState('#6366f1');
  const [secondary, setSecondary] = useState('#ec4899');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useVariables, setUseVariables] = useState(false);
  const [lights, setLights] = useState<LightSource[]>([
    { id: '1', posX: 50, posY: 30, spread: 80, intensity: 60 }
  ]);
  const [desktopLights, setDesktopLights] = useState<LightSource[]>([
    { id: '1', posX: 50, posY: 30, spread: 80, intensity: 60 }
  ]);
  const [mobileLights, setMobileLights] = useState<LightSource[]>([
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

  // Sync active lights based on device
  useEffect(() => {
    if (device === 'desktop') {
      setLights(desktopLights);
    } else {
      setLights(mobileLights);
    }
  }, [device, desktopLights, mobileLights]);

  // Update lights and sync to device-specific array
  const updateLight = (id: string, updates: Partial<LightSource>) => {
    setLights(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, ...updates } : l);
      if (device === 'desktop') {
        setDesktopLights(updated);
      } else {
        setMobileLights(updated);
      }
      return updated;
    });
  };

  const addLight = () => {
    const newLight: LightSource = {
      id: Date.now().toString(),
      posX: 50,
      posY: 50,
      spread: 80,
      intensity: 60
    };
    const updated = [...lights, newLight];
    setLights(updated);
    if (device === 'desktop') {
      setDesktopLights(updated);
    } else {
      setMobileLights(updated);
    }
  };

  const removeLight = (id: string) => {
    if (lights.length <= 1) {
      showToast("At least one light is required", 'error');
      return;
    }
    const updated = lights.filter(l => l.id !== id);
    setLights(updated);
    if (device === 'desktop') {
      setDesktopLights(updated);
    } else {
      setMobileLights(updated);
    }
  };

  // Generate CSS for a set of lights
  const generateLightsCss = (lightsArray: LightSource[]): string => {
    if (lightsArray.length === 0) {
      return 'var(--p)';
    }
    
    const gradients = lightsArray.map(light => 
      `radial-gradient(circle at ${light.posX}% ${light.posY}%, color-mix(in srgb, var(--s), transparent ${100 - light.intensity}%) 0%, transparent ${light.spread}%)`
    ).join(', ');
    
    return `${gradients}, var(--p)`;
  };

  // Generate complete CSS with media queries
  const editorCss = useMemo(() => {
    const desktopCss = generateLightsCss(desktopLights);
    const mobileCss = generateLightsCss(mobileLights);
    
    // If mobile and desktop lights are different, generate responsive CSS
    const lightsAreDifferent = JSON.stringify(desktopLights) !== JSON.stringify(mobileLights);
    
    if (lightsAreDifferent) {
      return `background: ${desktopCss};\n\n@media (max-width: 767px) {\n  background: ${mobileCss};\n}`;
    }
    
    // Otherwise just return desktop CSS
    return `background: ${desktopCss};`;
  }, [desktopLights, mobileLights]);

  // Generate preview background style
  const previewBackground = useMemo(() => {
    const gradients = lights.map(light => 
      `radial-gradient(circle at ${light.posX}% ${light.posY}%, color-mix(in srgb, ${secondary}, transparent ${100 - light.intensity}%) 0%, transparent ${light.spread}%)`
    ).join(', ');
    
    return `${gradients}, ${primary}`;
  }, [lights, primary, secondary]);

  const presets = [
    { name: "Aurora Borealis", css: "background: linear-gradient(215deg, var(--p) 0%, var(--s) 100%);" },
    { name: "Deep Space", css: "background: radial-gradient(circle at top left, var(--s), transparent 80%), var(--p);" },
    { name: "Studio Spotlight", css: "background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--s), transparent 60%) 0%, transparent 80%), var(--p);" },
    { name: "Dual Mesh Glow", css: "background: radial-gradient(at 0% 0%, var(--s) 0px, transparent 50%), radial-gradient(at 100% 100%, var(--s) 0px, transparent 50%), var(--p);" },
    { name: "Glassmorphism", css: "background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)), var(--p); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);" },
    { name: "Velvet Soft", css: "background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--s), transparent 80%) 0%, var(--p) 100%);" },
    { name: "Triple Ambiance", css: "background: radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--s), transparent 50%) 0%, transparent 75%), radial-gradient(ellipse at 30% 70%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 70%), radial-gradient(ellipse at 70% 70%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 70%), var(--p);" },
    { name: "Soft Spotlight Trio", css: "background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--s), transparent 45%) 0%, transparent 80%), radial-gradient(circle at 25% 75%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 75%), radial-gradient(circle at 75% 75%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 75%), var(--p);" },
    { name: "Ambient Glow", css: "background: radial-gradient(ellipse 150% 100% at 50% 25%, color-mix(in srgb, var(--s), transparent 55%) 0%, transparent 85%), radial-gradient(ellipse 120% 90% at 20% 80%, color-mix(in srgb, var(--s), transparent 38%) 0%, transparent 78%), radial-gradient(ellipse 120% 90% at 80% 80%, color-mix(in srgb, var(--s), transparent 38%) 0%, transparent 78%), var(--p);" },
    { name: "Mood Lighting", css: "background: radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--s), transparent 48%) 0%, transparent 82%), radial-gradient(circle at 28% 72%, color-mix(in srgb, var(--s), transparent 32%) 0%, transparent 73%), radial-gradient(circle at 72% 72%, color-mix(in srgb, var(--s), transparent 32%) 0%, transparent 73%), var(--p);" },
    { name: "Diffused Luminescence", css: "background: radial-gradient(ellipse at 50% 32%, color-mix(in srgb, var(--s), transparent 52%) 0%, transparent 88%), radial-gradient(ellipse at 32% 68%, color-mix(in srgb, var(--s), transparent 36%) 0%, transparent 76%), radial-gradient(ellipse at 68% 68%, color-mix(in srgb, var(--s), transparent 36%) 0%, transparent 76%), var(--p);" },
    { name: "Warm Haze", css: "background: radial-gradient(circle at 50% 33%, color-mix(in srgb, var(--s), transparent 46%) 0%, transparent 81%), radial-gradient(circle at 30% 77%, color-mix(in srgb, var(--s), transparent 34%) 0%, transparent 74%), radial-gradient(circle at 70% 77%, color-mix(in srgb, var(--s), transparent 34%) 0%, transparent 74%), var(--p);" },
    { name: "Layered Illumination", css: "background: radial-gradient(ellipse 140% 110% at 50% 27%, color-mix(in srgb, var(--s), transparent 50%) 0%, transparent 86%), radial-gradient(ellipse 110% 85% at 26% 78%, color-mix(in srgb, var(--s), transparent 37%) 0%, transparent 77%), radial-gradient(ellipse 110% 85% at 74% 78%, color-mix(in srgb, var(--s), transparent 37%) 0%, transparent 77%), var(--p);" },
    { name: "Ethereal Beams", css: "background: radial-gradient(circle at 50% 31%, color-mix(in srgb, var(--s), transparent 47%) 0%, transparent 83%), radial-gradient(circle at 27% 73%, color-mix(in srgb, var(--s), transparent 33%) 0%, transparent 75%), radial-gradient(circle at 73% 73%, color-mix(in srgb, var(--s), transparent 33%) 0%, transparent 75%), var(--p);" },
    { name: "Subtle Radiance", css: "background: radial-gradient(ellipse at 50% 29%, color-mix(in srgb, var(--s), transparent 49%) 0%, transparent 84%), radial-gradient(ellipse at 31% 71%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 72%), radial-gradient(ellipse at 69% 71%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 72%), var(--p);" }
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
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setUseVariables(!useVariables)}
            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${useVariables ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
          >
            {useVariables ? 'Using Elementor Vars' : 'Using Hex Codes'}
          </button>
          <label className={`flex items-center justify-center px-8 py-4 rounded-2xl cursor-pointer transition-all ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:scale-105 active:scale-95'}`}>
            <span className="text-xs font-black uppercase tracking-widest">{isAnalyzing ? 'Analyzing AI...' : 'AI Sync'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageSync} disabled={isAnalyzing} />
          </label>
        </div>
      </div>

      {activeTab === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {presets.map((p, i) => (
            <VariationCard 
              key={i} 
              name={p.name} 
              css={p.css} 
              pColor={primary} 
              sColor={secondary} 
              useVariables={useVariables}
              onSave={() => showToast(`Saved ${p.name} to Cloud`)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex gap-2 self-start bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setDevice('desktop')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${device === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Desktop</button>
              <button onClick={() => setDevice('mobile')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${device === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Mobile</button>
            </div>
            <div className={`mx-auto bg-slate-900 rounded-[3.5rem] shadow-2xl overflow-hidden relative border-[12px] border-white ring-1 ring-slate-100 transition-all duration-500 ${device === 'mobile' ? 'w-[375px] aspect-[9/16]' : 'w-full aspect-video'}`}>
              <div 
                className="w-full h-full transition-all duration-700"
                style={{
                  background: previewBackground
                }}
              />
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10 border-b border-slate-100">
              <div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">Editor Controls</h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Editing {device === 'mobile' ? 'Mobile' : 'Desktop'} Lights ({lights.length})
                </p>
              </div>
              <button
                onClick={addLight}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                + Add Light
              </button>
            </div>
            <div className="space-y-8">
              {lights.map((light, index) => (
                <div key={light.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-sm font-black text-slate-700 uppercase tracking-widest">Light {index + 1}</h5>
                    <button
                      onClick={() => removeLight(light.id)}
                      disabled={lights.length === 1}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-4">
                    <EditorSlider label="X Position" value={light.posX} onChange={v => updateLight(light.id, { posX: v })} />
                    <EditorSlider label="Y Position" value={light.posY} onChange={v => updateLight(light.id, { posY: v })} />
                    <EditorSlider label="Glow Size" value={light.spread} min={10} max={200} onChange={v => updateLight(light.id, { spread: v })} />
                    <EditorSlider label="Brightness" value={light.intensity} onChange={v => updateLight(light.id, { intensity: v })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-100">
              {JSON.stringify(desktopLights) !== JSON.stringify(mobileLights) && (
                <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                      Responsive CSS Generated
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Desktop and mobile backgrounds differ. Media queries included.
                  </p>
                </div>
              )}
              <VariationCard 
                name="Custom Mesh" 
                css={editorCss} 
                pColor={primary} 
                sColor={secondary} 
                useVariables={useVariables}
                onSave={() => showToast("Saved Custom Mesh to Cloud")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditorSlider = ({ label, value, onChange, min = 0, max = 100 }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <span className="text-xs font-black text-indigo-600">{value}%</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);
