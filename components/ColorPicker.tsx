
import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-none shadow-sm"
        />
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-mono w-28 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
};
