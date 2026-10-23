import React, { useState, useRef, useEffect } from 'react';
import {
  DistributionConfig,
  DisplaySettings,
} from '../types';
import {
  Sliders,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Layers,
  Calculator,
  RefreshCw,
  Lightbulb,
  X,
  GripHorizontal,
  Smartphone,
  Eye,
  Check,
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../data/defaults';

interface MobileFloatingControlsProps {
  distA: DistributionConfig;
  distB: DistributionConfig;
  distC: DistributionConfig;
  activeDistId: 'dist-a' | 'dist-b' | 'dist-c';
  onSelectActiveDist: (id: 'dist-a' | 'dist-b' | 'dist-c') => void;
  onUpdateDist: (id: 'dist-a' | 'dist-b' | 'dist-c', updates: Partial<DistributionConfig>, regenerateSample?: boolean) => void;
  onResample: (id: 'dist-a' | 'dist-b' | 'dist-c') => void;
  displaySettings: DisplaySettings;
  onUpdateDisplaySettings: (updates: Partial<DisplaySettings>) => void;
  onSelectPreset: (presetId: string) => void;
}

type SheetState = 'dock' | 'compact' | 'full';

export const MobileFloatingControls: React.FC<MobileFloatingControlsProps> = ({
  distA,
  distB,
  distC,
  activeDistId,
  onSelectActiveDist,
  onUpdateDist,
  displaySettings,
  onUpdateDisplaySettings,
  onSelectPreset,
}) => {
  const [sheetState, setSheetState] = useState<SheetState>('compact');
  const [isSimplifiedMode, setIsSimplifiedMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'quick' | 'presets' | 'zscore'>('quick');

  const currentDist =
    activeDistId === 'dist-a' ? distA : activeDistId === 'dist-b' ? distB : distC;
  const isDual = displaySettings.comparisonMode === 'dual';
  const isTriple = displaySettings.comparisonMode === 'triple';

  // Touch drag state
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchCurrentY.current === null) {
      touchStartY.current = null;
      touchCurrentY.current = null;
      return;
    }

    const deltaY = touchCurrentY.current - touchStartY.current;
    // Swipe down
    if (deltaY > 40) {
      if (sheetState === 'full') setSheetState('compact');
      else if (sheetState === 'compact') setSheetState('dock');
    }
    // Swipe up
    else if (deltaY < -40) {
      if (sheetState === 'dock') setSheetState('compact');
      else if (sheetState === 'compact') setSheetState('full');
    }

    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  return (
    <aside
      aria-label="Pływające menu mobilne sterowania rozkładem"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out select-none shadow-2xl"
    >
      {/* 1. DOCKED STATE (Minimal Floating Pill) */}
      {sheetState === 'dock' && (
        <div className="p-2 pb-3 bg-gradient-to-t from-slate-900/40 to-transparent flex justify-center">
          <button
            type="button"
            onClick={() => setSheetState('compact')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-semibold text-xs shadow-lg backdrop-blur-md border border-slate-700 active:scale-95 transition-all"
          >
            <GripHorizontal className="w-4 h-4 text-sky-400" />
            <span>⚡ Szybka zmiana:</span>
            <span className="font-mono bg-sky-600/80 px-2 py-0.5 rounded text-[11px]">
              μ={currentDist.mean}
            </span>
            <span className="font-mono bg-amber-600/80 px-2 py-0.5 rounded text-[11px]">
              σ={currentDist.sd}
            </span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      )}

      {/* 2. DRAWER CONTAINER (Compact & Full States) */}
      {sheetState !== 'dock' && (
        <div className="bg-white/95 backdrop-blur-md border-t border-slate-300/80 rounded-t-2xl shadow-2xl flex flex-col max-h-[82vh] transition-all">
          {/* DRAGGABLE HANDLE BAR */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setSheetState(sheetState === 'compact' ? 'full' : 'compact')}
            className="pt-2.5 pb-1 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 active:bg-slate-200/50 rounded-t-2xl"
            title="Przeciągnij w górę lub w dół, aby zmienić rozmiar menu"
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-1"></div>
            <div className="flex items-center justify-between w-full px-3 text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1 text-slate-700">
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Pływające menu mobilne</span>
              </span>

              {/* State Controls: Minimize, Expand, Close */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSimplifiedMode(!isSimplifiedMode);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                    isSimplifiedMode
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Włącz lub wyłącz widok uproszczony dla smartfonów"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  <span>{isSimplifiedMode ? 'Uproszczony' : 'Pełny'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetState(sheetState === 'full' ? 'compact' : 'full');
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                  title={sheetState === 'full' ? 'Zwiń do paska' : 'Rozwiń'}
                >
                  {sheetState === 'full' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetState('dock');
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                  title="Schowaj menu do dyskretnego pigułkowego doku"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* QUICK TOGGLES HEADER: Distribution A/B + Tab Switcher */}
          <div className="px-3 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/80">
            {/* Dist switch */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Rozkład:</span>
              <button
                type="button"
                onClick={() => onSelectActiveDist('dist-a')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  activeDistId === 'dist-a'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                A
              </button>

              {(isDual || isTriple) ? (
                <button
                  type="button"
                  onClick={() => onSelectActiveDist('dist-b')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                    activeDistId === 'dist-b'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  B
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDisplaySettings({ comparisonMode: 'dual' });
                    onUpdateDist('dist-b', { enabled: true, showDistribution: true });
                  }}
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-500 border border-dashed border-slate-300 hover:bg-slate-200/50"
                  title="Porównaj 2 rozkłady jednocześnie"
                >
                  + B
                </button>
              )}

              {isTriple ? (
                <button
                  type="button"
                  onClick={() => onSelectActiveDist('dist-c')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                    activeDistId === 'dist-c'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  C
                </button>
              ) : isDual ? (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDisplaySettings({ comparisonMode: 'triple' });
                    onUpdateDist('dist-c', { enabled: true, showDistribution: true });
                  }}
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-purple-600 border border-dashed border-purple-300 hover:bg-purple-50"
                  title="Dodaj trzeci rozkład"
                >
                  + C
                </button>
              ) : null}
            </div>

            {/* Quick internal tabs */}
            <div className="flex items-center gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('quick')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeTab === 'quick'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Suwaki
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeTab === 'presets'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Scenariusze
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('zscore');
                  if (!displaySettings.showZScore) {
                    onUpdateDisplaySettings({ showZScore: true });
                  }
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  activeTab === 'zscore'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pole Z
              </button>
            </div>
          </div>

          {/* MAIN TOUCH CONTENT */}
          <div className="p-3 overflow-y-auto space-y-3">
            {/* TAB 1: QUICK SLIDERS (μ, σ, and Didactic Intuition) */}
            {activeTab === 'quick' && (
              <div className="space-y-3">
                {/* Simplified mode didactic guidance banner */}
                {isSimplifiedMode && (
                  <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Jak działa kształt rozkładu:</span>{' '}
                      Przesuń <strong>Średnią (μ)</strong>, aby przesunąć dzwon na osi. Zmień{' '}
                      <strong>Odchylenie (σ)</strong>, aby dzwon był smukły i wysoki lub szeroki i
                      płaski!
                    </div>
                  </div>
                )}

                {/* 1. MEAN (μ) TOUCH SLIDER */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                      <span>Średnia (μ) — położenie:</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {currentDist.mean}
                    </span>
                  </div>

                  {/* Wide Touch Slider */}
                  <input
                    type="range"
                    min={-30}
                    max={130}
                    step={1}
                    value={currentDist.mean}
                    onChange={(e) =>
                      onUpdateDist(currentDist.id, { mean: parseFloat(e.target.value) }, true)
                    }
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 my-1"
                  />

                  {/* Touch Quick Stepper Pills */}
                  <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDist(currentDist.id, { mean: currentDist.mean - 5 }, true)
                        }
                        className="px-2 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-700 active:bg-slate-100"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDist(currentDist.id, { mean: currentDist.mean - 1 }, true)
                        }
                        className="px-2 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-700 active:bg-slate-100"
                      >
                        -1
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400">dotknij lub przesuń</span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDist(currentDist.id, { mean: currentDist.mean + 1 }, true)
                        }
                        className="px-2 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-700 active:bg-slate-100"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDist(currentDist.id, { mean: currentDist.mean + 5 }, true)
                        }
                        className="px-2 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-700 active:bg-slate-100"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. STANDARD DEVIATION (σ) TOUCH SLIDER */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Odchylenie (σ) — zmienność / rozproszenie:</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {currentDist.sd}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0.5}
                    max={25}
                    step={0.5}
                    value={currentDist.sd}
                    onChange={(e) =>
                      onUpdateDist(currentDist.id, { sd: parseFloat(e.target.value) }, true)
                    }
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 my-1"
                  />

                  {/* Touch Quick Presets for SD */}
                  <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 15].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { sd: val }, true)}
                          className={`px-2 py-1 rounded font-semibold text-xs border transition-colors ${
                            currentDist.sd === val
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 active:bg-slate-100'
                          }`}
                        >
                          σ={val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ADVANCED PARAMETERS (Skewness & Kurtosis) in FULL or NON-SIMPLIFIED mode */}
                {(!isSimplifiedMode || sheetState === 'full') && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Skewness */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Skośność (γ₁)</span>
                        <span className="font-mono font-bold text-amber-700">
                          {currentDist.skewness}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-1.5}
                        max={1.5}
                        step={0.1}
                        value={currentDist.skewness}
                        onChange={(e) =>
                          onUpdateDist(
                            currentDist.id,
                            { skewness: parseFloat(e.target.value) },
                            true
                          )
                        }
                        className="w-full h-2 bg-slate-200 rounded appearance-none accent-amber-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <button
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { skewness: -0.8 }, true)}
                          className="hover:underline"
                        >
                          Lewo
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { skewness: 0 }, true)}
                          className="font-bold hover:underline"
                        >
                          Symetria
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { skewness: 0.8 }, true)}
                          className="hover:underline"
                        >
                          Prawo
                        </button>
                      </div>
                    </div>

                    {/* Kurtosis */}
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>Kurtoza (γ₂)</span>
                        <span className="font-mono font-bold text-purple-700">
                          {currentDist.kurtosis}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-1.2}
                        max={3.0}
                        step={0.2}
                        value={currentDist.kurtosis}
                        onChange={(e) =>
                          onUpdateDist(
                            currentDist.id,
                            { kurtosis: parseFloat(e.target.value) },
                            true
                          )
                        }
                        className="w-full h-2 bg-slate-200 rounded appearance-none accent-purple-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <button
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { kurtosis: -1.0 }, true)}
                          className="hover:underline"
                        >
                          Płaski
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { kurtosis: 0 }, true)}
                          className="font-bold hover:underline"
                        >
                          Norma
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateDist(currentDist.id, { kurtosis: 2.0 }, true)}
                          className="hover:underline"
                        >
                          Szpiczasty
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ONE-TAP EDUCATIONAL PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dotknij, aby natychmiast załadować scenariusz:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_SCENARIOS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(p.id);
                        setSheetState('compact');
                      }}
                      className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 active:scale-98 transition-all flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{p.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {p.description}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                        Załaduj
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Z-SCORE / PROBABILITY ON MOBILE */}
            {activeTab === 'zscore' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>Pole pod krzywą (Z-Score)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateDisplaySettings({ showZScore: !displaySettings.showZScore })
                    }
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      displaySettings.showZScore
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    {displaySettings.showZScore ? 'Widoczne na wykresie' : 'Wyłączone'}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">Wartość cechy (x):</span>
                    <input
                      type="number"
                      value={displaySettings.zTargetX}
                      step={0.5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onUpdateDisplaySettings({ zTargetX: val, showZScore: true });
                      }}
                      className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <input
                    type="range"
                    min={Math.floor(currentDist.mean - 3.8 * currentDist.sd)}
                    max={Math.ceil(currentDist.mean + 3.8 * currentDist.sd)}
                    step={0.5}
                    value={displaySettings.zTargetX}
                    onChange={(e) =>
                      onUpdateDisplaySettings({
                        zTargetX: parseFloat(e.target.value),
                        showZScore: true,
                      })
                    }
                    className="w-full h-2.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdateDisplaySettings({ zProbMode: 'lessThan' })}
                    className={`flex-1 py-1 px-2 rounded text-center text-[11px] font-semibold border ${
                      displaySettings.zProbMode === 'lessThan'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    P(X ≤ x)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDisplaySettings({ zProbMode: 'greaterThan' })}
                    className={`flex-1 py-1 px-2 rounded text-center text-[11px] font-semibold border ${
                      displaySettings.zProbMode === 'greaterThan'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    P(X ≥ x)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDisplaySettings({ zProbMode: 'twoTailed' })}
                    className={`flex-1 py-1 px-2 rounded text-center text-[11px] font-semibold border ${
                      displaySettings.zProbMode === 'twoTailed'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    2-stronne
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
