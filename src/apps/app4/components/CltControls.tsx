import React from 'react';
import {
  PopulationConfig,
  CltDisplaySettings,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  Gauge,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { formatNum, studentTInv } from '../utils/statistics';

interface CltControlsProps {
  population: PopulationConfig;
  onChangePopulation: (updates: Partial<PopulationConfig>) => void;
  sampleSizeN: number;
  onChangeSampleSizeN: (n: number) => void;
  confidenceLevel: number;
  onChangeConfidenceLevel: (level: number) => void;
  displaySettings: CltDisplaySettings;
  onUpdateDisplaySettings: (updates: Partial<CltDisplaySettings>) => void;
  onSampleOne: () => void;
  onSampleBatch?: (count: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClearSamples: () => void;
  isAnimating: boolean;
  kSamples: number;
  coveredCount?: number;
  coverageRate?: number;
}

export const CltControls: React.FC<CltControlsProps> = ({
  population,
  onChangePopulation,
  sampleSizeN,
  onChangeSampleSizeN,
  confidenceLevel,
  onChangeConfidenceLevel,
  displaySettings,
  onUpdateDisplaySettings,
  onSampleOne,
  isPlaying,
  onTogglePlay,
  onClearSamples,
  isAnimating,
  kSamples,
}) => {
  const theoreticalSE = population.sd / Math.sqrt(sampleSizeN);
  const df = Math.max(1, sampleSizeN - 1);
  const alpha = 1 - confidenceLevel;
  const tCrit = studentTInv(1 - alpha / 2, df);
  const confidencePercent = Math.round(confidenceLevel * 100);

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col gap-5 sticky top-20 text-slate-800">
      {/* 1. PRIMARY SAMPLING ACTIONS (LOSOWANIE ZAWSZE POJEDYNCZEJ PRÓBKI: RĘCZNIE LUB AUTOMATYCZNIE) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Menu losowania prób
          </label>
          <span className="text-xs font-semibold text-slate-500">
            Wylosowano prób: <strong className="text-slate-900 font-mono text-sm">{kSamples}</strong>
          </span>
        </div>

        {/* 2 Primary Sampling Buttons: Ręcznie vs Automatycznie */}
        <div className="space-y-2">
          {/* Option A: Ręczne losowanie 1 próbki */}
          <button
            type="button"
            onClick={onSampleOne}
            disabled={isPlaying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title="Wylosuj ręcznie pojedynczą próbkę (1 próbka o liczebności n)"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Wylosuj 1 próbkę (ręcznie)</span>
          </button>

          {/* Option B: Automatyczne losowanie ciągłe */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: isPlaying ? '#dc2626' : '#344B57' }}
            title={isPlaying ? 'Zatrzymaj automatyczne losowanie' : 'Uruchom automatyczne losowanie (1 próbka na krok)'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 animate-pulse" />
                <span>Zatrzymaj automatyczne losowanie</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Automatyczne losowanie</span>
              </>
            )}
          </button>
        </div>

        {/* Animation Speed and Clear Button */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Tempo:</span>
            {(['slow', 'normal', 'fast'] as const).map((speed) => (
              <button
                key={`speed-${speed}`}
                type="button"
                onClick={() => onUpdateDisplaySettings({ animationSpeed: speed })}
                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  displaySettings.animationSpeed === speed
                    ? 'bg-[#344B57] text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {speed === 'slow' ? '1x' : speed === 'normal' ? '2x' : '5x'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearSamples}
            disabled={kSamples === 0}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer disabled:opacity-40"
            title="Usuń dotychczas wylosowane próby i zacznij od nowa"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Wyczyść</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. CONFIDENCE INTERVAL LEVEL & WIDTH (SZEROKOŚĆ PRZEDZIAŁU UFNOŚCI) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="ci-level-slider" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Poziom / szerokość przedziału (CI):
          </label>
          <span className="text-base font-extrabold text-amber-800 font-mono">
            {confidencePercent}% CI
          </span>
        </div>

        {/* Quick select buttons for 80%, 90%, 95%, 99% */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[
            { val: 0.80, label: '80% CI' },
            { val: 0.90, label: '90% CI' },
            { val: 0.95, label: '95% CI' },
            { val: 0.99, label: '99% CI' },
          ].map((item) => {
            const isSelected = Math.abs(confidenceLevel - item.val) < 0.005;
            return (
              <button
                key={`ci-btn-${item.val}`}
                type="button"
                onClick={() => onChangeConfidenceLevel(item.val)}
                className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#344B57] border-[#344B57] text-white font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{item.label}</div>
              </button>
            );
          })}
        </div>

        {/* Fine-tuning range slider for confidence level */}
        <input
          id="ci-level-slider"
          type="range"
          min="80"
          max="99"
          step="1"
          value={confidencePercent}
          onChange={(e) => onChangeConfidenceLevel(parseInt(e.target.value, 10) / 100)}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-hidden"
          style={{ accentColor: '#344B57' }}
        />

        <div className="mt-2 text-[11px] text-slate-600 bg-amber-50/70 p-2 rounded-lg border border-amber-200/80 flex justify-between items-center">
          <span>Krytyczne t (df={df}):</span>
          <strong className="font-mono text-slate-900">t_crit = {formatNum(tCrit, 3)}</strong>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 3. SAMPLE SIZE (N) (LICZBA OBSERWACJI W PRÓBCE) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="sample-size-slider" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Liczba obserwacji w próbce (n):
          </label>
          <span className="text-base font-extrabold text-slate-900 font-mono">
            n = {sampleSizeN}
          </span>
        </div>

        <input
          id="sample-size-slider"
          type="range"
          min="2"
          max="100"
          value={sampleSizeN}
          onChange={(e) => onChangeSampleSizeN(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-hidden"
          style={{ accentColor: '#344B57' }}
        />

        {/* Quick select buttons */}
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {[2, 5, 10, 25, 30, 50, 100].map((nVal) => {
            const isSelected = sampleSizeN === nVal;
            return (
              <button
                key={`preset-n-${nVal}`}
                type="button"
                onClick={() => onChangeSampleSizeN(nVal)}
                className="px-2 py-0.5 text-[11px] rounded-md font-mono font-semibold transition-colors cursor-pointer"
                style={
                  isSelected
                    ? { backgroundColor: '#344B57', color: '#ffffff' }
                    : { backgroundColor: '#f1f5f9', color: '#334155' }
                }
              >
                {nVal}
              </button>
            );
          })}
        </div>

        <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
          Błąd standardowy: <strong className="font-mono text-slate-900">SE = σ/√n = {formatNum(theoreticalSE, 2)}</strong>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. POPULATION DISTRIBUTION: ONLY NORMAL DISTRIBUTION AS REQUESTED */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-600" />
          Rozkład cechy w populacji:
        </label>

        {/* Selected element: only Rozkład normalny information */}
        <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Rozkład normalny</span>
        </div>

        {/* Population Sliders */}
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Prawdziwa średnia (μ):</span>
              <span className="font-bold font-mono text-slate-800">{formatNum(population.mean, 1)}</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="1"
              value={population.mean}
              onChange={(e) => onChangePopulation({ mean: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-hidden"
              style={{ accentColor: '#344B57' }}
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Odchylenie w populacji (σ):</span>
              <span className="font-bold font-mono text-slate-800">{formatNum(population.sd, 1)}</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={population.sd}
              onChange={(e) => onChangePopulation({ sd: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-hidden"
              style={{ accentColor: '#344B57' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
