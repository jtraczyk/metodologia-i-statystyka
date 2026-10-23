/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, BookOpen, RotateCcw, Sliders, BarChart2 } from 'lucide-react';

export interface PresetItem {
  id: string;
  label: string;
}

interface ModuleContextBarProps {
  title: string;
  badge: string;
  presets?: PresetItem[];
  onSelectPreset?: (id: string) => void;
  onReset: () => void;
  onOpenGuide: () => void;
  guideLabel?: string;
  mobileViewMode: 'chart' | 'controls';
  onToggleMobileView: (mode: 'chart' | 'controls') => void;
  controlsLabel?: string;
  chartLabel?: string;
}

const APP_NAVY = '#344B57';

export const ModuleContextBar: React.FC<ModuleContextBarProps> = ({
  title,
  badge,
  presets,
  onSelectPreset,
  onReset,
  onOpenGuide,
  guideLabel = 'Przewodnik',
  mobileViewMode,
  onToggleMobileView,
  controlsLabel = 'Parametry',
  chartLabel = 'Wykres',
}) => {
  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Module Title & Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-md text-white shadow-2xs shrink-0"
              style={{ backgroundColor: APP_NAVY }}
            >
              {badge}
            </span>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              {title}
            </h2>
          </div>

          {/* Action Toolbar (Scenarios, Guide, Reset) */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
            {/* Presets / Scenarios Dropdown */}
            {presets && presets.length > 0 && onSelectPreset && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 hidden sm:inline" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectPreset(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  aria-label="Wybierz scenariusz dydaktyczny"
                  className="px-2.5 py-1.5 min-h-[38px] text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#344B57] shadow-2xs cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
                >
                  <option value="" disabled>
                    Scenariusze dydaktyczne...
                  </option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Guide Button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Otwórz przewodnik dydaktyczny"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">{guideLabel}</span>
              <span className="sm:hidden">Teoria</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 min-h-[38px] rounded-lg text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer active:scale-95 text-xs font-medium"
              title="Przywróć domyślne parametry"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Mobile View Toggle Strip (Only on mobile / tablet < lg) */}
        <div className="lg:hidden mt-2.5 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onToggleMobileView('chart')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer min-h-[42px] ${
                mobileViewMode === 'chart'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" style={{ color: mobileViewMode === 'chart' ? APP_NAVY : undefined }} />
              <span>{chartLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMobileView('controls')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer min-h-[42px] ${
                mobileViewMode === 'controls'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" style={{ color: mobileViewMode === 'controls' ? APP_NAVY : undefined }} />
              <span>{controlsLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
