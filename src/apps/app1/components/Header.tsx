import React from 'react';
import { BarChart3, HelpCircle, RotateCcw, Sparkles, GraduationCap } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenGuide: () => void;
  onSelectPreset: (presetName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenGuide,
  onSelectPreset,
}) => {
  return (
    <header className="border-b border-slate-200/60 bg-white/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Course Title & Credits */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg text-white flex items-center justify-center shadow-xs shrink-0"
            style={{ backgroundColor: '#344B57' }}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Podstawy metodologii i statystyki
              </h1>
              <span 
                className="text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200/80 bg-slate-100/70 text-slate-700"
              >
                Statystyki opisowe i wykres skrzynkowy
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <GraduationCap className="w-3.5 h-3.5" style={{ color: '#F29400' }} />
                Autor: <span className="text-slate-900 font-semibold">Jakub Traczyk</span> (Uniwersytet SWPS)
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline text-slate-500">
                Wizualizacja warstwowa: wykres skrzynkowy, wiolinowy oraz punkty z szumem losowym
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Presets Menu */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 hidden sm:inline" />
            <span className="font-medium hidden md:inline text-slate-500">Scenariusze:</span>
            <select
              id="preset-selector"
              onChange={(e) => {
                if (e.target.value) {
                  onSelectPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-xs font-medium bg-white/70 hover:bg-white text-slate-700 border border-slate-300/80 rounded-md px-2.5 py-1.5 outline-hidden transition cursor-pointer backdrop-blur-xs"
              defaultValue=""
            >
              <option value="" disabled>Wybierz scenariusz...</option>
              <option value="bimodal">Rozkład bimodalny vs jednomodalny (co ukrywa box plot)</option>
              <option value="sampleSize">Wielkość próby: N=100 vs N=500</option>
              <option value="variance">Ta sama średnia (50), różne odchylenie (SD 6 vs 22)</option>
              <option value="skewed">Rozkład skośny vs symetryczny (Średnia vs Mediana)</option>
            </select>
          </div>

          {/* Guide / Help Button */}
          <button
            id="open-guide-button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white/90 rounded-md border border-slate-200/80 transition cursor-pointer backdrop-blur-xs"
            title="Przewodnik po pojęciach statystycznych"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Przewodnik</span>
          </button>

          {/* Reset Button */}
          <button
            id="reset-datasets-button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white/50 hover:bg-white/80 rounded-md border border-slate-200/70 transition cursor-pointer backdrop-blur-xs"
            title="Przywróć domyślne zbiory danych"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Resetuj</span>
          </button>
        </div>
      </div>
    </header>
  );
};
