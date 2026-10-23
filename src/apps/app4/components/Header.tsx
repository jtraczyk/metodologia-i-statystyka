import React from 'react';
import { Sparkles, RotateCcw, GraduationCap, TrendingUp, BookOpen } from 'lucide-react';
import { PRESET_SCENARIOS } from '../data/defaults';

interface HeaderProps {
  onReset: () => void;
  onOpenGuide: () => void;
  onSelectPreset: (presetId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onOpenGuide,
  onSelectPreset,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Course Title & Author Credits */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0"
            style={{ backgroundColor: '#344B57' }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Podstawy metodologii i statystyki
              </h1>
              {/* Badge explicitly styled with #344B57 as requested */}
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-md text-white shadow-2xs"
                style={{ backgroundColor: '#344B57' }}
              >
                Przedziały ufności (95% CI) & taniec wartości p
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                Autor: <span className="text-slate-900 font-semibold">Jakub Traczyk</span> (Uniwersytet SWPS)
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline text-slate-500">
                Animacja losowania prób, uśredniania, przedziałów ufności i wartości p
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions: Scenarios Dropdown, Guide, Reset */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Presets Menu */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            <span className="font-semibold text-slate-700 hidden md:inline">Scenariusze:</span>
            <select
              id="preset-selector"
              onChange={(e) => {
                if (e.target.value) {
                  onSelectPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              aria-label="Wybierz scenariusz dydaktyczny"
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#344B57] shadow-2xs max-w-[210px] sm:max-w-xs cursor-pointer truncate"
            >
              <option value="" disabled>
                Wybierz scenariusz dydaktyczny...
              </option>
              {PRESET_SCENARIOS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.title}
                </option>
              ))}
            </select>
          </div>

          {/* Guide Modal Button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            title="Otwórz przewodnik dydaktyczny o Centralnym Twierdzeniu Granicznym"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Przewodnik dydaktyczny</span>
            <span className="sm:hidden">Teoria</span>
          </button>

          {/* Reset All */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Przywróć domyślne parametry symulacji"
            aria-label="Zresetuj symulację"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
