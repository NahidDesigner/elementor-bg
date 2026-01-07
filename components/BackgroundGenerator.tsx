
import React, { useState, useEffect } from 'react';
import { VariationCard } from './VariationCard';
import { ColorPicker } from './ColorPicker';
import { GoogleGenAI } from "@google/genai";
import { supabase, checkSupabaseConnection } from '../lib/supabase';

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
  
  // Custom UI notification states
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const currentLights = responsiveLights[activeDevice];
  const activeLight = currentLights.find(l => l.id === activeLightId) || currentLights[0];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { data: base64, mimeType: file.type } },
              { text: "Extract two prominent colors from this image. Assign the darkest/background color as #hex1 and the brightest/accent color as #hex2. Format: #hex1, #hex2" }
            ]
          }
        });
        const colors = response.text?.match(/#[a-fA-F0-0]{6}/g);
        if (colors && colors.length >= 2) {
          setPrimary(colors[0]);
          setSecondary(colors[1]);
          showToast("Colors extracted!");
        }
      } catch (err) {
        console.error("AI Analysis failed", err);
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 relative">
      
      {/* CUSTOM TOAST */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold text-white transition-all animate-bounce ${toast.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>
          {toast.message}
        </div>
      )}

      {/* SAVE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Save to Cloud</h3>
            <p className="text-slate-500 mb-6 text-sm">Give your masterpiece a name to find it later.</p>
            <input 
              autoFocus
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 mb-6 focus:border-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g. Modern Dark Stage"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePreset}
                disabled={isSaving || !presetNameInput.trim()}
                className="flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {isSaving ? 'Saving...' : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">Delete Preset?</h3>
            <p className="text-slate-500 mb-6 text-sm text-center">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100">No</button>
              <button onClick={() => deletePreset(showDeleteConfirm)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-200">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {dbStatus.status === 'checking' && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Connecting to Cloud...
        </div>
      )}
      
      {dbStatus.status === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <div>
              <p className="text-sm text-red-700 font-bold">Cloud Connection Error</p>
              <p className="text-xs text-red-600 mt-1">{dbStatus.message}</p>
              <button onClick={initDb} className="mt-2 text-xs font-bold text-red-800 underline">Try Reconnecting</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <section className="text-left max-w-2xl">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Studio Pro</h2>
          <p className="text-slate-600">Pro-grade Elementor backgrounds with <span className="font-bold text-indigo-600">Supabase Cloud</span>.</p>
        </section>
        
        <div className="bg-slate-200 p-1 rounded-xl flex shadow-inner">
          <button onClick={() => setActiveTab('gallery')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>Gallery</button>
          <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>Live Editor</button>
          <button onClick={() => setActiveTab('my-presets')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-presets' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>My Cloud ({savedPresets.length})</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          <ColorPicker label="Background Base" value={primary} onChange={setPrimary} />
          <div className="hidden md:block h-12 w-px bg-slate-200"></div>
          <ColorPicker label="Light Color" value={secondary} onChange={setSecondary} />
          <div className="hidden md:block h-12 w-px bg-slate-200"></div>
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider italic">Reference Scan</label>
            <label className="cursor-pointer flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {isAnalyzing ? 'Extracting...' : 'Scan Style'}
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
          {isLoadingPresets ? (
            <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Loading Cloud Presets...
            </div>
          ) : savedPresets.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300">
              <p className="text-slate-400 font-medium">No cloud presets yet. Start designing!</p>
            </div>
          ) : (
            savedPresets.map((p) => (
              <div key={p.id} className="relative group">
                <div onClick={() => loadPreset(p)} className="cursor-pointer">
                  <VariationCard 
                    name={p.name} 
                    css={`background: ${generateGradientString(p.light_config.desktop, p.secondary_color)}, ${p.primary_color};`} 
                    previewPrimary={p.primary_color} 
                    previewSecondary={p.secondary_color} 
                  />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(p.id); }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center min-h-[600px] transition-all duration-300 border border-slate-800">
              <div 
                className={`transition-all duration-500 shadow-2xl border border-white/10 ${activeDevice === 'mobile' ? 'w-[320px] h-[568px] rounded-3xl overflow-hidden' : 'w-full h-[600px]'}`}
                style={{
                  '--e-global-color-primary': primary,
                  '--e-global-color-secondary': secondary,
                  background: `${generateGradientString(responsiveLights[activeDevice])}, ${primary}`
                } as React.CSSProperties}
              >
                <div className="h-full w-full flex flex-col items-center justify-center p-10 text-center relative z-10 pointer-events-none">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl mb-4 flex items-center justify-center border border-white/20">
                     <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  </div>
                  <h3 className="text-white text-3xl font-black mb-2 drop-shadow-lg" style={{ color: `color-mix(in srgb, ${secondary}, #fff 80%)` }}>
                    {activeDevice === 'desktop' ? 'Desktop' : 'Mobile'}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => { setPresetNameInput(`Preset ${savedPresets.length + 1}`); setShowSaveModal(true); }}
                disabled={isSaving}
                className={`absolute top-6 left-6 px-4 py-2 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all ${isSaving ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
              >
                {isSaving ? (
                   <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z"/></svg>
                )}
                {isSaving ? 'Saving...' : 'Cloud Save'}
              </button>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <h4 className="font-bold text-slate-800 text-lg">Lights</h4>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveDevice('desktop')} className={`p-2 rounded-md ${activeDevice === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Desktop</button>
                    <button onClick={() => setActiveDevice('mobile')} className={`p-2 rounded-md ${activeDevice === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Mobile</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {currentLights.map((l, i) => (
                    <button key={l.id} onClick={() => setActiveLightId(l.id)} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeLightId === l.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>L{i + 1}</button>
                  ))}
                  <button onClick={addLight} className="bg-slate-100 text-slate-400 p-2 rounded-lg">+</button>
                </div>

                <div className="space-y-5">
                  <ControlSlider label="X Pos" value={activeLight.posX} onChange={(val: number) => updateLight(activeLight.id, { posX: val })} min={-50} max={150} unit="%" />
                  <ControlSlider label="Y Pos" value={activeLight.posY} onChange={(val: number) => updateLight(activeLight.id, { posY: val })} min={-50} max={150} unit="%" />
                  <ControlSlider label="Power" value={activeLight.intensity} onChange={(val: number) => updateLight(activeLight.id, { intensity: val })} min={0} max={100} unit="%" />
                  <ControlSlider label="Radius" value={activeLight.spread} onChange={(val: number) => updateLight(activeLight.id, { spread: val })} min={5} max={300} unit="%" />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <VariationCard name="Final Responsive Export" css={finalResponsiveCss} previewPrimary={primary} previewSecondary={secondary} />
          </div>
        </div>
      )}
    </div>
  );
};

const ControlSlider = ({ label, value, onChange, min, max, unit }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
  </div>
);
