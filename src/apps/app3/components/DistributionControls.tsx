import React, { useState } from 'react';
import {
  DistributionConfig,
  DisplaySettings,
} from '../types';
import { formatNum, standardNormalCdf } from '../utils/statistics';
import {
  Sliders,
  Dices,
  Hash,
  Download,
  Calculator,
  Lock,
  Unlock,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface DistributionControlsProps {
  distA: DistributionConfig;
  distB: DistributionConfig;
  distC: DistributionConfig;
  activeDistId: 'dist-a' | 'dist-b' | 'dist-c';
  onSelectActiveDist: (id: 'dist-a' | 'dist-b' | 'dist-c') => void;
  onUpdateDist: (id: 'dist-a' | 'dist-b' | 'dist-c', updates: Partial<DistributionConfig>, regenerateSample?: boolean) => void;
  onResample: (id: 'dist-a' | 'dist-b' | 'dist-c') => void;
  displaySettings: DisplaySettings;
  onUpdateDisplaySettings: (updates: Partial<DisplaySettings>) => void;
  seed: number;
  isSeedFixed: boolean;
  onToggleFixedSeed: (fixed: boolean) => void;
  onChangeSeed: (seed: number) => void;
}

export const DistributionControls: React.FC<DistributionControlsProps> = ({
  distA,
  distB,
  distC,
  activeDistId,
  onSelectActiveDist,
  onUpdateDist,
  onResample,
  displaySettings,
  onUpdateDisplaySettings,
  seed,
  isSeedFixed,
  onToggleFixedSeed,
  onChangeSeed,
}) => {
  const [controlTab, setControlTab] = useState<'params' | 'zscore' | 'sample'>('params');

  const isSingle = displaySettings.comparisonMode === 'single';
  const isDual = displaySettings.comparisonMode === 'dual';
  const isTriple = displaySettings.comparisonMode === 'triple';
  const currentDist =
    activeDistId === 'dist-a' ? distA : activeDistId === 'dist-b' ? distB : distC;

  // Handle export sample to CSV
  const handleExportCsv = (dist: DistributionConfig) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Wartosc\n' +
      dist.rawSample.map((val, idx) => `${idx + 1},${val.toFixed(4)}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${dist.name.replace(/\s+/g, '_')}_probka_N${dist.sampleN}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Descriptive text for skewness
  const getSkewnessBadge = (val: number) => {
    if (Math.abs(val) < 0.08) {
      return {
        label: 'Symetryczny (γ₁ = 0)',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        desc: 'Brak asymetrii, dzwon idealnie symetryczny',
      };
    }
    if (val > 0) {
      return {
        label: 'Prawostronna (γ₁ > 0)',
        color: 'bg-amber-50 text-amber-800 border-amber-300',
        desc: 'Dłuższy prawy ogon (Mo < Mdn < M)',
      };
    }
    return {
      label: 'Lewostronna (γ₁ < 0)',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Dłuższy lewy ogon (M < Mdn < Mo)',
    };
  };

  // Descriptive text for kurtosis (no "eksces", use "platykurtyczny")
  const getKurtosisBadge = (val: number) => {
    if (Math.abs(val) < 0.12) {
      return {
        label: 'Mezokurtyczny (γ₂ = 0)',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        desc: 'Kurtoza wzorcowego rozkładu normalnego (γ₂ = 0)',
      };
    }
    if (val > 0) {
      return {
        label: 'Leptokurtyczny (γ₂ > 0)',
        color: 'bg-purple-50 text-purple-800 border-purple-300',
        desc: 'Wysmukły, spiczasty szczyt i grube ogony',
      };
    }
    return {
      label: 'Platykurtyczny (γ₂ < 0)',
      color: 'bg-teal-50 text-teal-800 border-teal-300',
      desc: 'Spłaszczony wierzchołek, lżejsze ogony',
    };
  };

  const skewBadge = getSkewnessBadge(currentDist.skewness);
  const kurtBadge = getKurtosisBadge(currentDist.kurtosis);

  // Calculations for Z-Score and Probability
  const zScore = (displaySettings.zTargetX - currentDist.mean) / currentDist.sd;
  const zScore2 = (displaySettings.zTargetX2 - currentDist.mean) / currentDist.sd;

  let calculatedProbability = 0;
  if (displaySettings.zProbMode === 'lessThan') {
    calculatedProbability = standardNormalCdf(zScore);
  } else if (displaySettings.zProbMode === 'greaterThan') {
    calculatedProbability = 1 - standardNormalCdf(zScore);
  } else if (displaySettings.zProbMode === 'twoTailed') {
    calculatedProbability = 2 * (1 - standardNormalCdf(Math.abs(zScore)));
  } else if (displaySettings.zProbMode === 'between') {
    const minZ = Math.min(zScore, zScore2);
    const maxZ = Math.max(zScore, zScore2);
    calculatedProbability = Math.max(0, standardNormalCdf(maxZ) - standardNormalCdf(minZ));
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* 1. ULTRA-COMPACT "TRYB ANALIZY" HEADER */}
      <div className="p-2.5 sm:p-3 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tryb:
          </span>
          <div className="inline-flex p-0.5 bg-slate-200/80 rounded-md">
            <button
              type="button"
              onClick={() => onUpdateDisplaySettings({ comparisonMode: 'single' })}
              className={`py-1 px-2 text-xs font-bold rounded transition-all flex items-center gap-1 ${
                isSingle
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              1 Rozkład
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateDisplaySettings({ comparisonMode: 'dual' });
                onUpdateDist('dist-b', { enabled: true, showDistribution: true });
              }}
              className={`py-1 px-2 text-xs font-bold rounded transition-all flex items-center gap-1 ${
                isDual
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              2 Rozkłady
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateDisplaySettings({ comparisonMode: 'triple' });
                onUpdateDist('dist-b', { enabled: true, showDistribution: true });
                onUpdateDist('dist-c', { enabled: true, showDistribution: true });
              }}
              className={`py-1 px-2 text-xs font-bold rounded transition-all flex items-center gap-1 ${
                isTriple
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Porównaj 3 wykresy rozkładów jednocześnie"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              3 Rozkłady
            </button>
          </div>
        </div>

        {/* Mode Switcher for Active Dist when Dual or Triple */}
        {(isDual || isTriple) && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Edycja:</span>
            <div className="inline-flex p-0.5 bg-slate-200/80 rounded-md">
              <button
                type="button"
                onClick={() => onSelectActiveDist('dist-a')}
                className={`py-0.5 px-1.5 sm:px-2 rounded text-xs font-bold transition-all ${
                  activeDistId === 'dist-a'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rozkład A
              </button>
              <button
                type="button"
                onClick={() => onSelectActiveDist('dist-b')}
                className={`py-0.5 px-1.5 sm:px-2 rounded text-xs font-bold transition-all ${
                  activeDistId === 'dist-b'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rozkład B
              </button>
              {isTriple && (
                <button
                  type="button"
                  onClick={() => onSelectActiveDist('dist-c')}
                  className={`py-0.5 px-1.5 sm:px-2 rounded text-xs font-bold transition-all ${
                    activeDistId === 'dist-c'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rozkład C
                </button>
              )}
            </div>
          </div>
        )}

        {/* Locked Axes Toggle Indicator */}
        <button
          type="button"
          onClick={() => onUpdateDisplaySettings({ lockAxes: !displaySettings.lockAxes })}
          className={`flex items-center gap-1 py-1 px-2 text-[11px] font-semibold rounded-md border transition-all ${
            displaySettings.lockAxes
              ? 'bg-sky-50 text-sky-800 border-sky-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={
            displaySettings.lockAxes
              ? 'Osie X i Y są zablokowane (stała skala) - zmiana średniej przesuwa krzywą, a SD zmienia jej wysokość'
              : 'Skala osi dopasowuje się automatycznie'
          }
        >
          {displaySettings.lockAxes ? (
            <>
              <Lock className="w-3 h-3 text-sky-600" />
              <span>Osie zablokowane</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3 text-slate-400" />
              <span>Osie auto</span>
            </>
          )}
        </button>
      </div>

      {/* 2. COMPACT TAB NAVIGATION (NO SCROLL SLIDER, ALL BUTTONS FULLY VISIBLE) */}
      <div className="grid grid-cols-3 border-b border-slate-200/80 bg-slate-100/70 p-1 gap-1 text-xs font-semibold select-none">
        <button
          type="button"
          onClick={() => setControlTab('params')}
          className={`py-1.5 px-1 sm:px-2 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
            controlTab === 'params'
              ? 'bg-white text-sky-800 font-bold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Parametry rozkładu: średnia (μ), odchylenie (σ), skośność, kurtoza"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="truncate">Parametry</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setControlTab('zscore');
            if (!displaySettings.showZScore) {
              onUpdateDisplaySettings({ showZScore: true });
            }
          }}
          className={`py-1.5 px-1 sm:px-2 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center relative ${
            controlTab === 'zscore'
              ? 'bg-white text-indigo-800 font-bold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Standaryzacja Z i pole pod krzywą (prawdopodobieństwo)"
        >
          <Calculator className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">Wartość Z</span>
          {displaySettings.showZScore && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setControlTab('sample')}
          className={`py-1.5 px-1 sm:px-2 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
            controlTab === 'sample'
              ? 'bg-white text-emerald-800 font-bold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title={`Próba empiryczna (N=${currentDist.sampleN})`}
        >
          <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Próba N</span>
        </button>
      </div>

      {/* 3. TAB CONTENT AREA */}

      {/* TAB 1: MAIN PARAMETERS (Mean, SD, Skewness, Kurtosis) */}
      {controlTab === 'params' && (
        <div className="p-3 sm:p-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentDist.color.primary }}
              ></div>
              <span className="font-bold text-slate-900">
                {currentDist.name}: parametry populacyjne
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Suwaki ciągłe</span>
          </div>

          {/* 1. MEAN (μ) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="mean-slider" className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Średnia (μ)</span>
                <span className="text-slate-400 text-[11px]">• położenie</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={currentDist.mean}
                  min={-50}
                  max={150}
                  step={1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdateDist(currentDist.id, { mean: val }, true);
                  }}
                  className="w-16 px-1 py-0.5 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>
            <input
              id="mean-slider"
              type="range"
              min={-30}
              max={130}
              step={1}
              value={currentDist.mean}
              onChange={(e) => onUpdateDist(currentDist.id, { mean: parseFloat(e.target.value) }, true)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { mean: -20 }, true)}
                className="hover:text-slate-700 underline"
              >
                -20
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { mean: 0 }, true)}
                className="hover:text-slate-700 underline"
              >
                0 (Z)
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { mean: 50 }, true)}
                className="hover:text-slate-700 underline"
              >
                50 (domyślna)
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { mean: 100 }, true)}
                className="hover:text-slate-700 underline"
              >
                100 (IQ)
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { mean: 120 }, true)}
                className="hover:text-slate-700 underline"
              >
                120
              </button>
            </div>
          </div>

          {/* 2. STANDARD DEVIATION (σ) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="sd-slider" className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Odchylenie stand. (σ)</span>
                <span className="text-slate-400 text-[11px]">• rozproszenie</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={currentDist.sd}
                  min={1}
                  max={40}
                  step={0.5}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) onUpdateDist(currentDist.id, { sd: val }, true);
                  }}
                  className="w-16 px-1 py-0.5 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded focus:border-sky-500 focus:outline-hidden"
                />
              </div>
            </div>
            <input
              id="sd-slider"
              type="range"
              min={2}
              max={35}
              step={0.5}
              value={currentDist.sd}
              onChange={(e) => onUpdateDist(currentDist.id, { sd: parseFloat(e.target.value) }, true)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { sd: 5 }, true)}
                className="hover:text-slate-700 underline"
              >
                σ=5 (wysoki)
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { sd: 10 }, true)}
                className="hover:text-slate-700 underline"
              >
                σ=10
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { sd: 15 }, true)}
                className="hover:text-slate-700 underline"
              >
                σ=15
              </button>
              <button
                type="button"
                onClick={() => onUpdateDist(currentDist.id, { sd: 25 }, true)}
                className="hover:text-slate-700 underline"
              >
                σ=25 (płaski)
              </button>
            </div>
          </div>

          {/* 3. SKEWNESS (γ₁) */}
          <div className="space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="skew-slider" className="font-semibold text-slate-900 flex items-center gap-1">
                <span>Skośność (γ₁)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  {currentDist.skewness > 0 ? `+${currentDist.skewness.toFixed(2)}` : currentDist.skewness.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateDist(currentDist.id, { skewness: 0 }, true)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                >
                  0
                </button>
              </div>
            </div>
            <input
              id="skew-slider"
              type="range"
              min={-2.0}
              max={2.0}
              step={0.05}
              value={currentDist.skewness}
              onChange={(e) =>
                onUpdateDist(currentDist.id, { skewness: parseFloat(e.target.value) }, true)
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex items-center justify-between pt-0.5 text-[10px]">
              <span className={`px-1.5 py-0.2 rounded border font-semibold ${skewBadge.color}`}>
                {skewBadge.label}
              </span>
              <span className="text-slate-500">{skewBadge.desc}</span>
            </div>
          </div>

          {/* 4. KURTOSIS (γ₂) */}
          <div className="space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="kurt-slider" className="font-semibold text-slate-900 flex items-center gap-1">
                <span>Kurtoza (γ₂)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  {currentDist.kurtosis > 0 ? `+${currentDist.kurtosis.toFixed(2)}` : currentDist.kurtosis.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateDist(currentDist.id, { kurtosis: 0 }, true)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                >
                  0
                </button>
              </div>
            </div>
            <input
              id="kurt-slider"
              type="range"
              min={-1.4}
              max={3.0}
              step={0.1}
              value={currentDist.kurtosis}
              onChange={(e) =>
                onUpdateDist(currentDist.id, { kurtosis: parseFloat(e.target.value) }, true)
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex items-center justify-between pt-0.5 text-[10px]">
              <span className={`px-1.5 py-0.2 rounded border font-semibold ${kurtBadge.color}`}>
                {kurtBadge.label}
              </span>
              <span className="text-slate-500">{kurtBadge.desc}</span>
            </div>
          </div>

          {/* MARKERS TOGGLES AND EDITABLE X-AXIS TITLE */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="ctrl-x-axis-label" className="font-semibold text-slate-700">
                Tytuł osi X:
              </label>
              <input
                id="ctrl-x-axis-label"
                type="text"
                value={displaySettings.xAxisLabel ?? 'Wartość cechy (x)'}
                onChange={(e) => onUpdateDisplaySettings({ xAxisLabel: e.target.value })}
                className="w-44 px-2 py-0.5 text-right font-medium text-xs bg-slate-50 border border-slate-200 rounded focus:border-sky-500 focus:outline-hidden"
                placeholder="Wartość cechy (x)"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
              <span className="font-semibold text-slate-500">Linie na osi:</span>
              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1 cursor-pointer" title="Średnia arytmetyczna M (linia ciągła)">
                  <input
                    type="checkbox"
                    checked={displaySettings.showMean}
                    onChange={(e) => onUpdateDisplaySettings({ showMean: e.target.checked })}
                    className="rounded text-sky-700 focus:ring-sky-500 w-3 h-3"
                  />
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <svg width="14" height="4" className="inline-block shrink-0">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Średnia (M)</span>
                  </span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer" title="Mediana Mdn (linia kreskowana)">
                  <input
                    type="checkbox"
                    checked={displaySettings.showMedian}
                    onChange={(e) => onUpdateDisplaySettings({ showMedian: e.target.checked })}
                    className="rounded text-sky-700 focus:ring-sky-500 w-3 h-3"
                  />
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <svg width="14" height="4" className="inline-block shrink-0">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                    <span>Mediana (Mdn)</span>
                  </span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer" title="Dominanta / Moda Mo (linia kropkowana)">
                  <input
                    type="checkbox"
                    checked={displaySettings.showMode}
                    onChange={(e) => onUpdateDisplaySettings({ showMode: e.target.checked })}
                    className="rounded text-sky-700 focus:ring-sky-500 w-3 h-3"
                  />
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <svg width="14" height="4" className="inline-block shrink-0">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="1.5 2" />
                    </svg>
                    <span>Moda (Mo)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Z-SCORE AND PROBABILITY CALCULATIONS */}
      {controlTab === 'zscore' && (
        <div className="p-3 sm:p-4 space-y-3.5 animate-in fade-in duration-150">
          {/* Header & Canvas Shading Toggle */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900">
                Standaryzacja z i prawdopodobieństwo p
              </span>
            </div>
            <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={displaySettings.showZScore}
                onChange={(e) => onUpdateDisplaySettings({ showZScore: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Rysuj pole na wykresie</span>
            </label>
          </div>

          {/* Probability Mode Selection */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 block">
              Kierunek obliczeń / obszar pod krzywą:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onUpdateDisplaySettings({ zProbMode: 'lessThan', showZScore: true })}
                className={`py-1.5 px-2 rounded-md border text-center transition-colors ${
                  displaySettings.zProbMode === 'lessThan'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                p(X ≤ x) [lewy ogon]
              </button>

              <button
                type="button"
                onClick={() => onUpdateDisplaySettings({ zProbMode: 'greaterThan', showZScore: true })}
                className={`py-1.5 px-2 rounded-md border text-center transition-colors ${
                  displaySettings.zProbMode === 'greaterThan'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                p(X ≥ x) [prawy ogon]
              </button>

              <button
                type="button"
                onClick={() => onUpdateDisplaySettings({ zProbMode: 'twoTailed', showZScore: true })}
                className={`py-1.5 px-2 rounded-md border text-center transition-colors ${
                  displaySettings.zProbMode === 'twoTailed'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                p(|z| ≥ |z_obl|) [dwustronny]
              </button>

              <button
                type="button"
                onClick={() => onUpdateDisplaySettings({ zProbMode: 'between', showZScore: true })}
                className={`py-1.5 px-2 rounded-md border text-center transition-colors ${
                  displaySettings.zProbMode === 'between'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                p(x₁ ≤ X ≤ x₂) [przedział]
              </button>
            </div>
          </div>

          {/* Value X Input & Slider */}
          <div className="space-y-1.5 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="z-target-x" className="font-semibold text-slate-900">
                Wartość cechy (x):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="z-target-x"
                  type="number"
                  value={displaySettings.zTargetX}
                  step={0.5}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdateDisplaySettings({ zTargetX: val, showZScore: true });
                  }}
                  className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-white border border-slate-300 rounded focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <input
              type="range"
              min={Math.floor(currentDist.mean - 3.8 * currentDist.sd)}
              max={Math.ceil(currentDist.mean + 3.8 * currentDist.sd)}
              step={0.5}
              value={displaySettings.zTargetX}
              onChange={(e) =>
                onUpdateDisplaySettings({ zTargetX: parseFloat(e.target.value), showZScore: true })
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            {/* If 'between' mode, show second threshold X2 */}
            {displaySettings.zProbMode === 'between' && (
              <div className="pt-2 border-t border-indigo-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="z-target-x2" className="font-semibold text-slate-900">
                    Druga wartość graniczna (x₂):
                  </label>
                  <input
                    id="z-target-x2"
                    type="number"
                    value={displaySettings.zTargetX2}
                    step={0.5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onUpdateDisplaySettings({ zTargetX2: val, showZScore: true });
                    }}
                    className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-white border border-slate-300 rounded focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <input
                  type="range"
                  min={Math.floor(currentDist.mean - 3.8 * currentDist.sd)}
                  max={Math.ceil(currentDist.mean + 3.8 * currentDist.sd)}
                  step={0.5}
                  value={displaySettings.zTargetX2}
                  onChange={(e) =>
                    onUpdateDisplaySettings({ zTargetX2: parseFloat(e.target.value), showZScore: true })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}

            {/* Quick Preset Buttons for Z */}
            <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
              <button
                type="button"
                onClick={() =>
                  onUpdateDisplaySettings({
                    zTargetX: currentDist.mean,
                    showZScore: true,
                  })
                }
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-mono"
              >
                z=0 (μ)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateDisplaySettings({
                    zTargetX: currentDist.mean + 1.0 * currentDist.sd,
                    showZScore: true,
                  })
                }
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-mono"
              >
                z=+1.0
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateDisplaySettings({
                    zTargetX: currentDist.mean - 1.0 * currentDist.sd,
                    showZScore: true,
                  })
                }
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-mono"
              >
                z=-1.0
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateDisplaySettings({
                    zTargetX: parseFloat((currentDist.mean + 1.96 * currentDist.sd).toFixed(1)),
                    showZScore: true,
                  })
                }
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-mono"
              >
                z=+1.96 (α=0.05)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateDisplaySettings({
                    zTargetX: currentDist.mean + 2.0 * currentDist.sd,
                    showZScore: true,
                  })
                }
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-mono"
              >
                z=+2.0
              </button>
            </div>
          </div>

          {/* Detailed Calculations Output Card */}
          <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2.5 shadow-sm text-xs">
            {/* Step 1: Standardization Formula */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                1. Standaryzacja (wartość Z)
              </span>
              <div className="font-mono mt-0.5 text-xs text-slate-200 flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <span>
                  z = (X - μ) / σ = ({formatNum(displaySettings.zTargetX, 1)} - {formatNum(currentDist.mean, 1)}) / {formatNum(currentDist.sd, 1)}
                </span>
                <span className="font-bold text-sm text-indigo-300">
                  = {zScore > 0 ? `+${zScore.toFixed(2)}` : zScore.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Step 2: Probability Output */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                2. Obliczone prawdopodobieństwo (pole pod krzywą)
              </span>
              <div className="mt-0.5 flex items-baseline justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                <span className="font-mono text-slate-200">
                  {displaySettings.zProbMode === 'lessThan' && `P(X ≤ ${formatNum(displaySettings.zTargetX, 1)}) = Φ(${zScore.toFixed(2)})`}
                  {displaySettings.zProbMode === 'greaterThan' && `P(X ≥ ${formatNum(displaySettings.zTargetX, 1)}) = 1 - Φ(${zScore.toFixed(2)})`}
                  {displaySettings.zProbMode === 'twoTailed' && `P(|Z| ≥ ${Math.abs(zScore).toFixed(2)})`}
                  {displaySettings.zProbMode === 'between' && `P(${formatNum(Math.min(displaySettings.zTargetX, displaySettings.zTargetX2), 1)} ≤ X ≤ ${formatNum(Math.max(displaySettings.zTargetX, displaySettings.zTargetX2), 1)})`}
                </span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  {(calculatedProbability * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Didactic Interpretation */}
            <div className="text-[11px] text-slate-300 leading-snug pt-1 border-t border-slate-800">
              {displaySettings.zProbMode === 'lessThan' && (
                <>
                  <strong className="text-white">{(calculatedProbability * 100).toFixed(1)}%</strong> wyników w populacji przyjmuje wartość mniejszą bądź równą <strong>{formatNum(displaySettings.zTargetX, 1)}</strong> (jest to <strong>{Math.round(calculatedProbability * 100)}. percentyl</strong>).
                </>
              )}
              {displaySettings.zProbMode === 'greaterThan' && (
                <>
                  Tylko <strong className="text-white">{(calculatedProbability * 100).toFixed(1)}%</strong> wyników osiąga wartość wyższą niż <strong>{formatNum(displaySettings.zTargetX, 1)}</strong>.
                </>
              )}
              {displaySettings.zProbMode === 'twoTailed' && (
                <>
                  Prawdopodobieństwo uzyskania wyniku tak skrajnego lub bardziej skrajnego w obu ogonach wynosi <strong className="text-white">{(calculatedProbability * 100).toFixed(2)}%</strong> (wartość <em>p</em> dla hipotezy dwustronnej).
                </>
              )}
              {displaySettings.zProbMode === 'between' && (
                <>
                  W przedziale od {formatNum(Math.min(displaySettings.zTargetX, displaySettings.zTargetX2), 1)} do {formatNum(Math.max(displaySettings.zTargetX, displaySettings.zTargetX2), 1)} mieści się <strong className="text-white">{(calculatedProbability * 100).toFixed(1)}%</strong> całej populacji.
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMPIRICAL SAMPLE AND HISTOGRAM */}
      {controlTab === 'sample' && (
        <div className="p-3 sm:p-4 space-y-3 bg-slate-50/40">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-600" />
              Dane empiryczne (próba losowa)
            </h4>
            <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
              N = {currentDist.sampleN}
            </span>
          </div>

          {/* Sample Size (N) Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-700">
              <span>Liczebność próby (N)</span>
              <span className="font-mono font-bold">{currentDist.sampleN} obs.</span>
            </div>
            <input
              type="range"
              min={50}
              max={1500}
              step={50}
              value={currentDist.sampleN}
              onChange={(e) =>
                onUpdateDist(currentDist.id, { sampleN: parseInt(e.target.value, 10) }, true)
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50 (mała)</span>
              <span>250</span>
              <span>500</span>
              <span>1500 (duża)</span>
            </div>
          </div>

          {/* Resample button & Export CSV */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onResample(currentDist.id)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
            >
              <Dices className="w-4 h-4" />
              Wylosuj próbę
            </button>

            <button
              type="button"
              onClick={() => handleExportCsv(currentDist)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Eksportuj CSV
            </button>
          </div>

          {/* Seed Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={isSeedFixed}
                onChange={(e) => onToggleFixedSeed(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span>Zablokuj ziarno (seed):</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                disabled={!isSeedFixed}
                value={seed}
                onChange={(e) => onChangeSeed(parseInt(e.target.value, 10) || 42)}
                className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-semibold bg-white border border-slate-200 rounded disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
