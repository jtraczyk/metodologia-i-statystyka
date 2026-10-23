import React from 'react';
import {
  PopulationConfig,
  PopulationType,
  CltDisplaySettings,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
  Eye,
  Layers,
} from 'lucide-react';
import { formatNum } from '../utils/statistics';

interface CltControlsProps {
  population: PopulationConfig;
  onChangePopulation: (updates: Partial<PopulationConfig>) => void;
  sampleSizeN: number;
  onChangeSampleSizeN: (n: number) => void;
  displaySettings: CltDisplaySettings;
  onUpdateDisplaySettings: (updates: Partial<CltDisplaySettings>) => void;
  onSampleOne: () => void;
  onSampleBatch: (count: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClearSamples: () => void;
  isAnimating: boolean;
  kSamples: number;
  meanOfMeans?: number;
  sdOfMeans?: number;
}

export const CltControls: React.FC<CltControlsProps> = ({
  population,
  onChangePopulation,
  sampleSizeN,
  onChangeSampleSizeN,
  displaySettings,
  onUpdateDisplaySettings,
  onSampleOne,
  onSampleBatch,
  isPlaying,
  onTogglePlay,
  onClearSamples,
  isAnimating,
  kSamples,
  meanOfMeans,
  sdOfMeans,
}) => {
  const theoreticalSE = population.sd / Math.sqrt(sampleSizeN);

  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col gap-5 sticky top-20 text-slate-800">
      {/* 1. PRIMARY SAMPLING ACTIONS (MENU LOSOWANIA - #344B57 I SZARY) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-600" />
            Menu losowania prób
          </label>
          <span className="text-xs font-semibold text-slate-500">
            Liczba wylosowanych prób: <strong className="text-slate-900 font-mono text-sm">{kSamples}</strong>
          </span>
        </div>

        {/* Big Single Sample Button using #344B57 */}
        <button
          type="button"
          onClick={onSampleOne}
          disabled={isAnimating && !isPlaying}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 hover:brightness-110"
          style={{ backgroundColor: '#344B57' }}
          title="Pobierz 1 próbkę z animacją uśredniania i spadania punktu do dolnego rozkładu"
        >
          <Sparkles className="w-4 h-4 text-slate-200" />
          <span>Pobierz 1 próbkę</span>
          <span className="text-xs font-normal opacity-80">(animacja)</span>
        </button>

        {/* Batch Buttons Grid - Clean Grays and #344B57 */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {[5, 30, 100, 1000].map((batchSize) => (
            <button
              key={`batch-btn-${batchSize}`}
              type="button"
              onClick={() => onSampleBatch(batchSize)}
              disabled={isAnimating && !isPlaying}
              className="flex items-center justify-center py-2 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50"
              title={`Pobierz ${batchSize} prób z animowanym spadaniem punktów na dolny wykres`}
            >
              +{batchSize}
            </button>
          ))}
        </div>

        {/* Auto Continuous Play & Clear Buttons */}
        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onTogglePlay}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border"
            style={
              isPlaying
                ? { backgroundColor: '#344B57', color: '#ffffff', borderColor: '#344B57' }
                : { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }
            }
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="truncate">{isPlaying ? 'Zatrzymaj' : 'Ciągłe losowanie'}</span>
          </button>

          <button
            type="button"
            onClick={onClearSamples}
            disabled={kSamples === 0}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer disabled:opacity-40"
            title="Usuń dotychczas wylosowane próby (K = 0)"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Wyczyść</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. SAMPLE SIZE (N) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="sample-size-slider" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Wielkość próby (n):
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

        {/* Quick select buttons - styled in #344B57 and grays */}
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
          Teoretyczny błąd: <strong className="font-mono text-slate-900">SE = σ/√n = {formatNum(theoreticalSE, 2)}</strong>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 3. POPULATION SHAPE & PARAMETERS */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-600" />
          Rozkład populacji:
        </label>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { id: 'normal', name: 'Normalny' },
            { id: 'skewed', name: 'Prawoskośny' },
            { id: 'uniform', name: 'Jednostajny' },
            { id: 'bimodal', name: 'Dwumodalny' },
          ].map((shape) => {
            const active = population.type === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => onChangePopulation({ type: shape.id as PopulationType })}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer"
                style={
                  active
                    ? { backgroundColor: '#344B57', borderColor: '#344B57', color: '#ffffff', fontWeight: 'bold' }
                    : { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }
                }
              >
                {shape.name}
              </button>
            );
          })}
        </div>

        {/* Population Sliders */}
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">Średnia (μ):</span>
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
              <span className="font-medium text-slate-600">Odchylenie (σ):</span>
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

      <hr className="border-slate-100" />

      {/* 4. DISPLAY OPTIONS */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          Elementy wykresu:
        </label>
        <div className="flex flex-col gap-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={displaySettings.showTheoreticalCurve}
              onChange={(e) => onUpdateDisplaySettings({ showTheoreticalCurve: e.target.checked })}
              className="rounded"
              style={{ accentColor: '#344B57' }}
            />
            <span>Krzywa teoretyczna CTG</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={displaySettings.showStandardErrorBands}
              onChange={(e) => onUpdateDisplaySettings({ showStandardErrorBands: e.target.checked })}
              className="rounded"
              style={{ accentColor: '#344B57' }}
            />
            <span>Pasma błędu standardowego (±1 SE, ±2 SE)</span>
          </label>
        </div>
      </div>
    </aside>
  );
};
