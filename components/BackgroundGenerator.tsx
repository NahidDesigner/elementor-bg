
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
  
  // Initial presets - converted to state so they can be edited
  const [presets, setPresets] = useState([
    { name: "Aurora Borealis", css: "background: linear-gradient(215deg, var(--p) 0%, var(--s) 100%);" },
    { name: "Deep Space", css: "background: radial-gradient(circle at top left, var(--s), transparent 80%), var(--p);" },
    { name: "Studio Spotlight", css: "background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--s), transparent 60%) 0%, transparent 80%), var(--p);" },
    { name: "Dual Mesh Glow", css: "background: radial-gradient(at 0% 0%, var(--s) 0px, transparent 50%), radial-gradient(at 100% 100%, var(--s) 0px, transparent 50%), var(--p);" },
    { name: "Glassmorphism", css: "background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)), var(--p); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);" },
    { name: "Velvet Soft", css: "background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--s), transparent 80%) 0%, var(--p) 100%);" },
    { name: "Quad Corner Glow", css: "background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--s), transparent 50%) 0%, transparent 65%), radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--s), transparent 45%) 0%, transparent 60%), radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 70%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--s), transparent 45%) 0%, transparent 65%), var(--p);" },
    { name: "Horizontal Stripes", css: "background: radial-gradient(ellipse 200% 30% at 50% 20%, color-mix(in srgb, var(--s), transparent 55%) 0%, transparent 80%), radial-gradient(ellipse 200% 30% at 50% 80%, color-mix(in srgb, var(--s), transparent 50%) 0%, transparent 75%), var(--p);" },
    { name: "Central Orb", css: "background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--s), transparent 30%) 0%, transparent 85%), radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--s), transparent 20%) 0%, transparent 65%), var(--p);" },
    { name: "Edge Spotlight", css: "background: radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--s), transparent 48%) 0%, transparent 75%), radial-gradient(circle at 20% 80%, color-mix(in srgb, var(--s), transparent 52%) 0%, transparent 78%), var(--p);" },
    { name: "Five Point Star", css: "background: radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 70%), radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 65%), radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 65%), radial-gradient(circle at 35% 80%, color-mix(in srgb, var(--s), transparent 38%) 0%, transparent 68%), radial-gradient(circle at 65% 80%, color-mix(in srgb, var(--s), transparent 38%) 0%, transparent 68%), var(--p);" },
    { name: "Bottom Glow", css: "background: radial-gradient(ellipse 180% 120% at 50% 100%, color-mix(in srgb, var(--s), transparent 50%) 0%, transparent 85%), var(--p);" },
    { name: "Side Panels", css: "background: radial-gradient(ellipse 40% 200% at 0% 50%, color-mix(in srgb, var(--s), transparent 45%) 0%, transparent 75%), radial-gradient(ellipse 40% 200% at 100% 50%, color-mix(in srgb, var(--s), transparent 45%) 0%, transparent 75%), var(--p);" },
    { name: "Six Corner", css: "background: radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--s), transparent 42%) 0%, transparent 72%), radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--s), transparent 38%) 0%, transparent 68%), radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--s), transparent 42%) 0%, transparent 72%), radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 70%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--s), transparent 36%) 0%, transparent 66%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 70%), var(--p);" },
    { name: "Conic Gradient", css: "background: conic-gradient(from 45deg at 50% 50%, var(--p) 0deg, color-mix(in srgb, var(--s), transparent 60%) 90deg, var(--p) 180deg, color-mix(in srgb, var(--s), transparent 60%) 270deg, var(--p) 360deg);" },
    { name: "Vertical Cascade", css: "background: radial-gradient(ellipse 100% 40% at 50% 15%, color-mix(in srgb, var(--s), transparent 50%) 0%, transparent 80%), radial-gradient(ellipse 100% 40% at 50% 50%, color-mix(in srgb, var(--s), transparent 35%) 0%, transparent 70%), radial-gradient(ellipse 100% 40% at 50% 85%, color-mix(in srgb, var(--s), transparent 45%) 0%, transparent 75%), var(--p);" },
    { name: "Asymmetric Glow", css: "background: radial-gradient(ellipse 160% 80% at 30% 25%, color-mix(in srgb, var(--s), transparent 48%) 0%, transparent 82%), radial-gradient(circle at 75% 70%, color-mix(in srgb, var(--s), transparent 44%) 0%, transparent 76%), var(--p);" },
    { name: "Top Heavy", css: "background: radial-gradient(ellipse 220% 150% at 50% 10%, color-mix(in srgb, var(--s), transparent 55%) 0%, transparent 88%), radial-gradient(circle at 25% 60%, color-mix(in srgb, var(--s), transparent 32%) 0%, transparent 70%), radial-gradient(circle at 75% 60%, color-mix(in srgb, var(--s), transparent 32%) 0%, transparent 70%), var(--p);" },
    { name: "Floating Orbs", css: "background: radial-gradient(circle at 25% 30%, color-mix(in srgb, var(--s), transparent 46%) 0%, transparent 78%), radial-gradient(circle at 75% 35%, color-mix(in srgb, var(--s), transparent 44%) 0%, transparent 76%), radial-gradient(circle at 40% 75%, color-mix(in srgb, var(--s), transparent 40%) 0%, transparent 72%), radial-gradient(circle at 85% 80%, color-mix(in srgb, var(--s), transparent 38%) 0%, transparent 70%), var(--p);" },
    { name: "Wide Horizon", css: "background: radial-gradient(ellipse 300% 60% at 50% 60%, color-mix(in srgb, var(--s), transparent 52%) 0%, transparent 90%), var(--p);" }
  ]);
  
  const handleEditPreset = (presetName: string, newCss: string) => {
    setPresets(prev => prev.map(p => 
      p.name === presetName ? { ...p, css: newCss } : p
    ));
    showToast(`Updated ${presetName}`, 'success');
  };

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

  // Convert CSS position keywords to percentages
  const convertPositionToPercent = (position: string): { x: number; y: number } => {
    const normalized = position.toLowerCase().trim();
    
    // Keyword combinations
    if (normalized.includes('top') && normalized.includes('left')) return { x: 0, y: 0 };
    if (normalized.includes('top') && normalized.includes('right')) return { x: 100, y: 0 };
    if (normalized.includes('bottom') && normalized.includes('left')) return { x: 0, y: 100 };
    if (normalized.includes('bottom') && normalized.includes('right')) return { x: 100, y: 100 };
    if (normalized.includes('top') && normalized.includes('center')) return { x: 50, y: 0 };
    if (normalized.includes('bottom') && normalized.includes('center')) return { x: 50, y: 100 };
    if (normalized.includes('left') && normalized.includes('center')) return { x: 0, y: 50 };
    if (normalized.includes('right') && normalized.includes('center')) return { x: 100, y: 50 };
    
    // Single keywords
    if (normalized === 'top') return { x: 50, y: 0 };
    if (normalized === 'bottom') return { x: 50, y: 100 };
    if (normalized === 'left') return { x: 0, y: 50 };
    if (normalized === 'right') return { x: 100, y: 50 };
    if (normalized === 'center') return { x: 50, y: 50 };
    
    return { x: 50, y: 50 }; // Default to center
  };

  // Parse CSS to extract lights from radial-gradient patterns
  const parseCssToLights = (cssString: string): LightSource[] | null => {
    // Extract background value (remove "background:" prefix)
    let bgValue = cssString.replace(/^background:\s*/i, '').replace(/;?\s*$/, '').trim();
    
    // Remove media queries if present
    if (bgValue.includes('@media')) {
      bgValue = bgValue.split('@media')[0].trim();
    }
    
    const lights: LightSource[] = [];
    
    // Extract all radial-gradient patterns (including nested ones)
    // Match: radial-gradient(...) where ... can contain nested parentheses
    const findRadialGradients = (str: string): string[] => {
      const gradients: string[] = [];
      let depth = 0;
      let start = -1;
      
      for (let i = 0; i < str.length; i++) {
        if (str.substring(i, i + 17) === 'radial-gradient(') {
          if (start === -1) {
            start = i;
            depth = 1;
            i += 16; // Skip "radial-gradient"
          } else {
            depth++;
          }
        } else if (str[i] === '(' && start !== -1) {
          depth++;
        } else if (str[i] === ')' && start !== -1) {
          depth--;
          if (depth === 0) {
            gradients.push(str.substring(start, i + 1));
            start = -1;
          }
        }
      }
      return gradients;
    };
    
    const gradientStrings = findRadialGradients(bgValue);
    
    for (const gradientContent of gradientStrings) {
      
      // Extract position - try percentages first, then keywords
      let posX = 50, posY = 50; // Default
      
      // Try percentage positions first: "at 50% 30%"
      const percentMatch = gradientContent.match(/at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/i);
      if (percentMatch) {
        posX = Math.round(parseFloat(percentMatch[1]));
        posY = Math.round(parseFloat(percentMatch[2]));
      } else {
        // Try keyword positions: "at top left", "at center", etc.
        const keywordMatch = gradientContent.match(/at\s+([^,)]+?)(?:\s*,|\s*\))/i);
        if (keywordMatch) {
          const position = convertPositionToPercent(keywordMatch[1].trim());
          posX = position.x;
          posY = position.y;
        }
      }
      
      // Extract transparency/spread values
      const transparentMatches = gradientContent.match(/transparent\s+(\d+(?:\.\d+)?)%/gi);
      if (transparentMatches && transparentMatches.length > 0) {
        // Get the last transparent value (usually the spread)
        const lastTransparent = transparentMatches[transparentMatches.length - 1];
        const spreadMatch = lastTransparent.match(/(\d+(?:\.\d+)?)/);
        const spread = spreadMatch ? Math.round(parseFloat(spreadMatch[1])) : 80;
        
        // If there's color-mix, get intensity from first transparent value
        let intensity = 60; // Default
        if (gradientContent.includes('color-mix') && transparentMatches.length > 1) {
          const firstTransparent = transparentMatches[0];
          const intensityMatch = firstTransparent.match(/(\d+(?:\.\d+)?)/);
          if (intensityMatch) {
            const transparentValue = parseFloat(intensityMatch[1]);
            intensity = Math.max(0, Math.min(100, 100 - transparentValue));
          }
        } else if (transparentMatches.length === 1) {
          // Single transparent value - estimate intensity based on color usage
          intensity = gradientContent.includes('var(--s)') || gradientContent.includes('var(--e-global-color-secondary)') ? 70 : 50;
        }
        
        lights.push({
          id: `parsed-${lights.length + 1}-${Date.now()}`,
          posX,
          posY,
          spread,
          intensity
        });
      } else if (gradientContent.includes('radial-gradient')) {
        // Gradient exists but no transparent value - create with defaults
        lights.push({
          id: `parsed-${lights.length + 1}-${Date.now()}`,
          posX,
          posY,
          spread: 80,
          intensity: 60
        });
      }
    }
    
    return lights.length > 0 ? lights : null;
  };

  // Handle editing a preset in visual editor
  const handleEditPresetVisual = (presetName: string, presetCss: string) => {
    // Try to parse CSS into lights
    const parsedLights = parseCssToLights(presetCss);
    
    if (parsedLights && parsedLights.length > 0) {
      // Successfully parsed - load into editor
      setDesktopLights(parsedLights);
      setMobileLights(parsedLights);
      setLights(parsedLights);
      setActiveTab('editor');
      setDevice('desktop');
      showToast(`Loaded ${presetName} into visual editor`, 'success');
    } else {
      // Couldn't parse - show message and still open editor with default
      setActiveTab('editor');
      setDevice('desktop');
      showToast(`${presetName} uses patterns not editable with visual controls. Use manual CSS editing.`, 'error');
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
              showEdit={true}
              onEditVisual={handleEditPresetVisual}
              onEdit={handleEditPreset}
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
