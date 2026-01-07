
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            E
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-none">DesignPro</h1>
            <p className="text-xs text-slate-500 font-medium">for Elementor</p>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="text-indigo-600">Backgrounds</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Premium Assets</a>
        </nav>
      </div>
    </header>
  );
};
