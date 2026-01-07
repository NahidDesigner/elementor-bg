
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-6">
          <span className="text-white font-bold text-xl">DesignPro</span>
        </div>
        <p className="max-w-md mx-auto text-sm mb-8 leading-relaxed">
          The ultimate companion for WordPress designers using Elementor. Generate modern, performant, and beautiful CSS backgrounds with a single click.
        </p>
        <div className="flex justify-center gap-6 mb-8 text-sm">
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
        <div className="pt-8 border-t border-slate-800 text-xs">
          &copy; {new Date().getFullYear()} Elementor Design Pro. Not affiliated with Elementor Ltd.
        </div>
      </div>
    </footer>
  );
};
