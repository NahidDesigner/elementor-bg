
import React, { useState, useEffect } from 'react';
import { VariationCard } from './VariationCard.tsx';
import { ColorPicker } from './ColorPicker.tsx';
import { GoogleGenAI } from "@google/genai";
import { supabase, checkSupabaseConnection } from '../lib/supabase.ts';

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
  created_at?: string;
}

export const BackgroundGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor' | 'my-presets'>('gallery');
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [primary, setPrimary] = useState('#1a1a1a'); 
  const [secondary, setSecondary] = useState('#d4af37');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [dbStatus, setDbStatus] = useState<{status: 'checking' | 'ok' | 'error', message?: string}>({status: 'checking'});
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [responsiveLights, setResponsiveLights] = useState<ResponsiveState>({
    desktop: [{ id: '1', posX: 50, posY: 40, intensity: 80, spread: 60 }],
    mobile: [{ id: '1', posX: 50, posY: 30, intensity: 85, spread: 80 }]
  });
  
  const [activeLightId, setActiveLightId] = useState<string>('1');

  useEffect(() => {
    initDb();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const initDb = async () => {
    setDbStatus({status: 'checking'});
    const check = await checkSupabaseConnection();
    if (check.success) {
      setDbStatus({status: 'ok'});
      fetchPresets();
    } else {
      setDbStatus({status: 'error', message: check.message});
    }
  };

  const fetchPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPresets(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      showToast(`Fetch Failed: ${error.message}`, 'error');
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: presetNameInput,
        primary_color: primary,
        secondary_color: secondary,
        light_config: responsiveLights,
      };

      const { error } = await supabase
        .from('presets')
        .insert([payload]);

      if (error) throw error;
      
      await fetchPresets();
      showToast("Cloud Save Successful!");
      setShowSaveModal(false);
      setPresetNameInput('');
    } catch (error: any) {
      console.error("Save Error:", error);
      showToast(`Save Failed: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const loadPreset = (preset: SavedPreset) => {
    setPrimary(preset.primary_color);
    setSecondary(preset.secondary_color);
    setResponsiveLights(preset.light_config);
    if (preset.light_config.desktop.length > 0) {
      setActiveLightId(preset.light_config.desktop[0].id);
    }
    setActiveTab('editor');
    showToast(`Loaded: ${preset.name}`);
  };

  const deletePreset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSavedPresets(savedPresets.filter(p => p.id !== id));
      showToast("Deleted successfully");
      setShowDeleteConfirm(null);
    } catch (error: any) {
      showToast("Error deleting: " + error.message, 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use process.env.API_KEY directly as per guidelines.
    // The server-side script injects this into the global scope.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      showToast("API Key not found in Environment Settings", 'error');
      return;
    }

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        // Initialize ai client with apiKey in a named parameter
        const ai = new GoogleGenAI({ apiKey });
        // Use ai.models.generateContent and model 'gemini-3-flash-preview'
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64, mimeType: file.type } },
              { text: "Extract two prominent colors from this image. #hex1 (dark), #hex2 (accent). Format: #hex1, #hex2" }
            ]
          }
        });
        
        // Access text via .text property, not .text() method
        const textOutput = response.text;
        const colors = textOutput?.match(/#[a-fA-F0-9]{6}/g);
        if (colors && colors.length >= 2) {
          setPrimary(colors[0]);
          setSecondary(colors[1]);
          showToast("Colors extracted!");
        }
      } catch (err) {
        console.error("AI extraction error:", err);
        showToast("AI extraction failed", 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addLight = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newLight = { id: newId, posX: 50, posY: 50, intensity: 85, spread: 40 };
    setResponsiveLights({
      desktop: [...responsiveLights.desktop, newLight],
      mobile: [...responsiveLights.mobile, { ...newLight }]
    });
    setActiveLightId(newId);
  };

  const updateLight = (id: string, updates: Partial<LightSource>) => {
    setResponsiveLights({
      ...responsiveLights,
      [activeDevice]: responsiveLights[activeDevice].map(l => l.id === id ? { ...l, ...updates } : l)
    });
  };

  const P = 'var(--e-global-color-primary)';
  const S = 'var(--e-global-color-secondary)';

  const generateGradientString = (lightsArray: LightSource[], overrideSecondary?: string) => {
    const color = overrideSecondary || S;
    return lightsArray.map(l => 
      `radial-gradient(circle at ${l.posX}% ${l.posY}%, color-mix(in srgb, ${color}, transparent ${l.intensity}%) 0%, transparent ${l.spread}%)`
    ).join(', ');
  };

  const desktopGradients = generateGradientString(responsiveLights.desktop);
  const mobileGradients = generateGradientString(responsiveLights.mobile);
  
  const finalResponsiveCss = `background: ${desktopGradients}, ${P};\n@media (max-width: 767px) {\n  background: ${mobileGradients}, ${P};\n}`;

  const variations = [
    { name: 'Classic Studio Stage', css: `background: radial-gradient(circle at 50% 40%, color-mix(in srgb, ${S}, transparent 80%) 0%, transparent 60%), radial-gradient(circle at 50% 100%, color-mix(in srgb, ${S}, transparent 90%) 0%, transparent 50%), ${P};` },
    { name: 'The Infinity Curve', css: `background: linear-gradient(180deg, ${P} 0%, transparent 50%, ${P} 100%), radial-gradient(circle at 50% 50%, color-mix(in srgb, ${S}, transparent 75%) 0%, transparent 70%); background-color: ${P};` },
    { name: 'Dual Rim Lighting', css: `background: radial-gradient(circle at 0% 50%, color-mix(in srgb, ${S}, transparent 85%) 0%, transparent 40%), radial-gradient(circle at 100% 50%, color-mix(in srgb, ${S}, transparent 85%) 0%, transparent 40%), radial-gradient(circle at 50% 50%, #111 0%, ${P} 100%);` },
    { name: 'Top-Down Product Stage', css: `background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${S}, transparent 70%) 0%, transparent 70%), ${P};` },
    { name: 'Soft Product Glow', css: `background: radial-gradient(circle at 50% 50%, color-mix(in srgb, ${S}, transparent 85%) 0%, transparent 60%), ${P};` }
  ];

  const currentLights = responsiveLights[activeDevice];
  const activeLight = currentLights.find(l => l.id === activeLightId) || currentLights[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 relative">
      {/* TOAST AND MODALS RENDERED HERE */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold text-white transition-all animate-bounce ${toast.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>
          {toast.message}
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Save to Cloud</h3>
            <input 
              autoFocus
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 mb-6 outline-none"
              placeholder="e.g. Modern Dark Stage"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500">Cancel</button>
              <button onClick={handleSavePreset} className="flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <section className="text-left max-w-2xl">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Studio Pro</h2>
          <p className="text-slate-600">Pro-grade Elementor backgrounds with Cloud Save.</p>
        </section>
        
        <div className="bg-slate-200 p-1 rounded-xl flex shadow-inner">
          <button onClick={() => setActiveTab('gallery')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}>Gallery</button>
          <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}>Editor</button>
          <button onClick={() => setActiveTab('my-presets')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-presets' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}>Cloud</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          <ColorPicker label="Background Base" value={primary} onChange={setPrimary} />
          <ColorPicker label="Light Color" value={secondary} onChange={setSecondary} />
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-semibold text-slate-500 uppercase italic">Scan Image</label>
            <label className="cursor-pointer bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium border border-slate-200">
              {isAnalyzing ? 'Scanning...' : 'Upload'}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </div>

      {activeTab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {variations.map((v, i) => (
            <VariationCard key={i} name={v.name} css={v.css} previewPrimary={primary} previewSecondary={secondary} />
          ))}
        </div>
      )}

      {activeTab === 'my-presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedPresets.map((p) => (
            <div key={p.id} className="relative group" onClick={() => loadPreset(p)}>
              <VariationCard 
                name={p.name} 
                css={`background: ${generateGradientString(p.light_config.desktop, p.secondary_color)}, ${p.primary_color};`} 
                previewPrimary={p.primary_color} 
                previewSecondary={p.secondary_color} 
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-slate-900 rounded-3xl flex items-center justify-center min-h-[600px] relative">
              <div 
                className={`transition-all duration-500 ${activeDevice === 'mobile' ? 'w-[320px] h-[568px] rounded-3xl' : 'w-full h-[600px]'}`}
                style={{
                  '--e-global-color-primary': primary,
                  '--e-global-color-secondary': secondary,
                  background: `${generateGradientString(responsiveLights[activeDevice])}, ${primary}`
                } as React.CSSProperties}
              ></div>
              <button 
                onClick={() => setShowSaveModal(true)}
                className="absolute top-6 left-6 px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm shadow-xl"
              >
                Cloud Save
              </button>
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200">
               <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-800">Light Controls</h4>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveDevice('desktop')} className={`px-2 py-1 rounded-md text-xs ${activeDevice === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Desk</button>
                    <button onClick={() => setActiveDevice('mobile')} className={`px-2 py-1 rounded-md text-xs ${activeDevice === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Mob</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <ControlSlider label="X Pos" value={activeLight.posX} onChange={(v: number) => updateLight(activeLight.id, { posX: v })} min={-50} max={150} />
                  <ControlSlider label="Y Pos" value={activeLight.posY} onChange={(v: number) => updateLight(activeLight.id, { posY: v })} min={-50} max={150} />
                  <ControlSlider label="Radius" value={activeLight.spread} onChange={(v: number) => updateLight(activeLight.id, { spread: v })} min={5} max={300} />
                </div>
            </div>
          </div>
          <VariationCard name="Final Export" css={finalResponsiveCss} previewPrimary={primary} previewSecondary={secondary} />
        </div>
      )}
    </div>
  );
};

const ControlSlider = ({ label, value, onChange, min, max }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);
