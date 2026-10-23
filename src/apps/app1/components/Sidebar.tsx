import React from 'react';
import { 
  Sliders, 
  Layers, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Info, 
  CircleDot, 
  Activity,
  Dice5,
  Lock,
  Unlock
} from 'lucide-react';
import { DatasetConfig, LayerSettings, DistributionType } from '../types';

interface SidebarProps {
  datasets: DatasetConfig[];
  selectedDatasetId: string;
  onSelectDataset: (id: string) => void;
  onUpdateDataset: (id: string, updates: Partial<DatasetConfig>, shouldRegenerate?: boolean) => void;
  onAddDataset: () => void;
  onRemoveDataset: (id: string) => void;
  onResampleDataset: (id: string) => void;
  onResampleAll: () => void;
  layers: LayerSettings;
  onUpdateLayers: (updates: Partial<LayerSettings>) => void;
  seed: number;
  isSeedFixed: boolean;
  onToggleFixedSeed: (fixed: boolean) => void;
  onChangeSeed: (newSeed: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onUpdateDataset,
  onAddDataset,
  onRemoveDataset,
  onResampleDataset,
  onResampleAll,
  layers,
  onUpdateLayers,
  seed,
  isSeedFixed,
  onToggleFixedSeed,
  onChangeSeed,
}) => {
  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden text-slate-800">
      {/* SECTION 1: LAYER TOGGLES */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Warstwy wykresu
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Widoczność</span>
        </div>

        <div className="space-y-2">
          {/* Layer: Box Plot */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/60 hover:border-slate-300/80 bg-white/60 transition backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 border-2 border-slate-700 bg-white/80 rounded-xs" />
              <div>
                <div className="text-xs font-semibold text-slate-800">Wykres skrzynkowy (Box plot)</div>
                <div className="text-[11px] text-slate-500">Mediana, rozstęp ćwiartkowy (IQR) i wąsy Tukeya</div>
              </div>
            </div>
            <button
              id="toggle-layer-boxplot"
              type="button"
              onClick={() => onUpdateLayers({ showBoxPlot: !layers.showBoxPlot })}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                layers.showBoxPlot 
                  ? 'text-white shadow-xs' 
                  : 'bg-slate-200/70 text-slate-500 hover:bg-slate-200'
              }`}
              style={{ backgroundColor: layers.showBoxPlot ? '#344B57' : undefined }}
              title={layers.showBoxPlot ? 'Ukryj wykres skrzynkowy' : 'Pokaż wykres skrzynkowy'}
            >
              {layers.showBoxPlot ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Layer 1: Individual Points */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/60 hover:border-slate-300/80 bg-white/60 transition backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <CircleDot className="w-4 h-4 text-slate-600" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">1. Punkty z szumem losowym</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-slate-200/60 text-slate-700 font-medium">Jitter</span>
                </div>
                <div className="text-[11px] text-slate-500">Pojedyncze obserwacje z próby</div>
              </div>
            </div>
            <button
              id="toggle-layer-points"
              type="button"
              onClick={() => onUpdateLayers({ showPoints: !layers.showPoints })}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                layers.showPoints 
                  ? 'text-white shadow-xs' 
                  : 'bg-slate-200/70 text-slate-500 hover:bg-slate-200'
              }`}
              style={{ backgroundColor: layers.showPoints ? '#344B57' : undefined }}
              title={layers.showPoints ? 'Ukryj punkty z szumem losowym' : 'Pokaż punkty z szumem losowym'}
            >
              {layers.showPoints ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sub-controls for points if visible */}
          {layers.showPoints && (
            <div className="pl-4 pr-3 py-2.5 bg-white/40 rounded-md border border-slate-200/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Przezroczystość punktów:</span>
                <span className="font-mono text-[11px] text-slate-700 font-medium">{Math.round(layers.pointOpacity * 100)}%</span>
              </div>
              <input
                id="slider-point-opacity"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={layers.pointOpacity}
                onChange={(e) => onUpdateLayers({ pointOpacity: parseFloat(e.target.value) })}
                className="w-full accent-[#344B57] h-1.5 bg-slate-200/80 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 text-[11px]">Szerokość rozproszenia (jitter):</span>
                <span className="font-mono text-[11px] text-slate-700 font-medium">{layers.jitterWidth.toFixed(2)}</span>
              </div>
              <input
                id="slider-jitter-width"
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={layers.jitterWidth}
                onChange={(e) => onUpdateLayers({ jitterWidth: parseFloat(e.target.value) })}
                className="w-full accent-[#344B57] h-1.5 bg-slate-200/80 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Layer 2: Violin Plots */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/60 hover:border-slate-300/80 bg-white/60 transition backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-semibold text-slate-800">2. Wykresy wiolinowe</span>
              </div>
            </div>
            <button
              id="toggle-layer-violin"
              type="button"
              onClick={() => onUpdateLayers({ showViolin: !layers.showViolin })}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                layers.showViolin 
                  ? 'text-white shadow-xs' 
                  : 'bg-slate-200/70 text-slate-500 hover:bg-slate-200'
              }`}
              style={{ backgroundColor: layers.showViolin ? '#344B57' : undefined }}
              title={layers.showViolin ? 'Ukryj wykresy wiolinowe' : 'Pokaż wykresy wiolinowe'}
            >
              {layers.showViolin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Layer: Mean Marker (Diamond) */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-slate-200/60 bg-white/60 hover:bg-white/80 transition backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rotate-45 bg-[#E2001A] border border-[#B30015]" />
              <span className="text-xs text-slate-700 font-medium">Znacznik średniej próby (M)</span>
            </div>
            <button
              id="toggle-layer-mean"
              type="button"
              onClick={() => onUpdateLayers({ showMeanMarker: !layers.showMeanMarker })}
              className={`p-1 rounded-md transition cursor-pointer ${
                layers.showMeanMarker 
                  ? 'text-[#E2001A] bg-red-50 border border-red-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {layers.showMeanMarker ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: DATASET SELECTOR & CONFIGURATION */}
      <div className="p-4 flex-1">
        {/* REPRODUCIBILITY / SET SEED PANEL */}
        <div className="mb-4 p-3 rounded-xl border border-slate-200/70 bg-white/60 backdrop-blur-xs shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Dice5 className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800">Stałe losowanie (Seed)</span>
            </div>
            <button
              id="toggle-fixed-seed-button"
              type="button"
              onClick={() => onToggleFixedSeed(!isSeedFixed)}
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                isSeedFixed
                  ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
              }`}
              title={isSeedFixed ? 'Kliknij, aby włączyć zmienne losowanie' : 'Kliknij, aby ustalić stałe ziarno losowania (seed)'}
            >
              {isSeedFixed ? (
                <>
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Ustalony</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-slate-400" />
                  <span>Zmienne</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white/90 border border-slate-200 rounded-md px-2 py-1 shadow-2xs">
              <span className="text-[11px] font-mono font-medium text-slate-400 mr-1.5 select-none">seed:</span>
              <input
                id="seed-input"
                type="number"
                min="1"
                max="999999"
                value={seed}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onChangeSeed(val);
                  }
                }}
                className="w-full text-xs font-mono font-bold text-slate-800 bg-transparent outline-hidden"
                placeholder="np. 42"
              />
            </div>
            <button
              id="new-seed-button"
              type="button"
              onClick={() => {
                const nextSeed = Math.floor(Math.random() * 89999) + 10000;
                onChangeSeed(nextSeed);
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-md transition cursor-pointer shadow-2xs whitespace-nowrap"
              title="Wylosuj nowe ziarno losowości dla wszystkich grup"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Nowe ziarno</span>
            </button>
          </div>

          <div className="mt-1.5 text-[10px] text-slate-500 leading-tight">
            {isSeedFixed ? (
              <span className="text-emerald-700 font-medium">
                Wszystkie grupy korzystają z deterministycznego ziarna <code>{seed}</code> (dokładnie powtarzalne wyniki).
              </span>
            ) : (
              <span>
                Wspólna baza ziarna dla grup. Zaznacz „Ustalony”, aby próby nie zmieniały się samoczynnie.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Parametry próby
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="resample-all-button"
              type="button"
              onClick={onResampleAll}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-md transition cursor-pointer"
              title="Wylosuj ponownie wszystkie próby"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {datasets.length < 4 && (
              <button
                id="add-dataset-button"
                type="button"
                onClick={onAddDataset}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 hover:text-slate-950 bg-white/80 hover:bg-white border border-slate-300/80 px-2 py-1 rounded-md transition cursor-pointer shadow-2xs"
                title="Dodaj kolejną grupę do porównania"
              >
                <Plus className="w-3 h-3" />
                <span>Dodaj grupę</span>
              </button>
            )}
          </div>
        </div>

        {/* Dataset Selection Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4 p-1 bg-slate-200/50 rounded-lg backdrop-blur-xs">
          {datasets.map((dataset) => {
            const isSelected = dataset.id === selectedDatasetId;
            return (
              <button
                key={dataset.id}
                id={`tab-dataset-${dataset.id}`}
                type="button"
                onClick={() => onSelectDataset(dataset.id)}
                className={`flex-1 min-w-[70px] text-xs font-semibold py-1.5 px-2.5 rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-white/90 text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: dataset.color.primary }}
                />
                <span className="truncate">{dataset.name}</span>
              </button>
            );
          })}
        </div>

        {selectedDataset && (
          <div className="space-y-4">
            {/* Dataset Title & Actions */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-1 mr-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedDataset.color.primary }}
                />
                <input
                  id="input-dataset-name"
                  type="text"
                  value={selectedDataset.name}
                  onChange={(e) => onUpdateDataset(selectedDataset.id, { name: e.target.value }, false)}
                  className="text-xs font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border-b border-transparent focus:border-indigo-400 outline-hidden px-1 py-0.5 w-full"
                  placeholder="Nazwa grupy"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  id="resample-current-button"
                  type="button"
                  onClick={() => onResampleDataset(selectedDataset.id)}
                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-slate-100 px-2 py-1 rounded-md transition cursor-pointer border border-slate-200"
                  title="Wylosuj ponownie próbę dla tej grupy"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Losuj</span>
                </button>
                {datasets.length > 1 && (
                  <button
                    id="delete-dataset-button"
                    type="button"
                    onClick={() => onRemoveDataset(selectedDataset.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                    title="Usuń tę grupę"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* SLIDER 1: MEAN */}
            <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-mean" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Średnia (&mu;)</span>
                  <span className="text-[11px] font-normal text-slate-400">Wartość oczekiwana</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="input-mean-number"
                    type="number"
                    min="-50"
                    max="150"
                    step="0.5"
                    value={selectedDataset.mean}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        onUpdateDataset(selectedDataset.id, { mean: val }, true);
                      }
                    }}
                    className="w-16 text-right font-mono text-xs font-semibold px-1.5 py-0.5 bg-white border border-slate-300 rounded-md focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>
              <input
                id="slider-mean"
                type="range"
                min="0"
                max="100"
                step="1"
                value={selectedDataset.mean}
                onChange={(e) => onUpdateDataset(selectedDataset.id, { mean: parseFloat(e.target.value) }, true)}
                className="w-full accent-[#344B57] h-2 bg-slate-200/80 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* SLIDER 2: STANDARD DEVIATION (SD) */}
            <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-sd" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Odchylenie standardowe (&sigma; / SD)</span>
                  <span className="text-[11px] font-normal text-slate-400">Rozproszenie</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="input-sd-number"
                    type="number"
                    min="1"
                    max="40"
                    step="0.5"
                    value={selectedDataset.sd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        onUpdateDataset(selectedDataset.id, { sd: val }, true);
                      }
                    }}
                    className="w-16 text-right font-mono text-xs font-semibold px-1.5 py-0.5 bg-white border border-slate-300 rounded-md focus:border-slate-500 outline-hidden"
                  />
                </div>
              </div>
              <input
                id="slider-sd"
                type="range"
                min="2"
                max="35"
                step="0.5"
                value={selectedDataset.sd}
                onChange={(e) => onUpdateDataset(selectedDataset.id, { sd: parseFloat(e.target.value) }, true)}
                className="w-full accent-[#344B57] h-2 bg-slate-200/80 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>2 (Wąskie)</span>
                <span>18</span>
                <span>35 (Szerokie)</span>
              </div>
            </div>

            {/* SLIDER 3: SAMPLE SIZE N (FROM 100 TO 500) */}
            <div className="space-y-1.5 bg-white/40 p-3 rounded-lg border border-slate-200/50 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-n" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Wielkość próby (N)</span>
                  <span 
                    className="text-[10px] px-1.5 py-0.2 rounded-xs font-semibold border"
                    style={{ 
                      backgroundColor: 'rgba(52, 75, 87, 0.1)', 
                      borderColor: 'rgba(52, 75, 87, 0.2)', 
                      color: '#25363F' 
                    }}
                  >
                    100 - 500
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="input-n-number"
                    type="number"
                    min="100"
                    max="500"
                    step="10"
                    value={selectedDataset.n}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        const clamped = Math.max(100, Math.min(500, val));
                        onUpdateDataset(selectedDataset.id, { n: clamped }, true);
                      }
                    }}
                    className="w-16 text-right font-mono text-xs font-semibold px-1.5 py-0.5 bg-white/80 border border-slate-300 rounded-md focus:border-slate-500 outline-hidden"
                  />
                </div>
              </div>
              <input
                id="slider-n"
                type="range"
                min="100"
                max="500"
                step="10"
                value={selectedDataset.n}
                onChange={(e) => onUpdateDataset(selectedDataset.id, { n: parseInt(e.target.value, 10) }, true)}
                className="w-full accent-[#344B57] h-2 bg-slate-200/80 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>N = 100</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateDataset(selectedDataset.id, { n: 100 }, true)}
                    className="text-[10px] px-1.5 py-0.5 rounded-xs bg-white/70 border border-slate-200/80 hover:bg-white cursor-pointer"
                  >
                    100
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDataset(selectedDataset.id, { n: 250 }, true)}
                    className="text-[10px] px-1.5 py-0.5 rounded-xs bg-white/70 border border-slate-200/80 hover:bg-white cursor-pointer"
                  >
                    250
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateDataset(selectedDataset.id, { n: 500 }, true)}
                    className="text-[10px] px-1.5 py-0.5 rounded-xs bg-white/70 border border-slate-200/80 hover:bg-white cursor-pointer"
                  >
                    500
                  </button>
                </div>
                <span>N = 500</span>
              </div>
            </div>

            {/* DISTRIBUTION TYPE / SHAPE */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Kształt rozkładu</label>
                <span className="text-[11px] text-slate-400">Dydaktyka</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'normal', label: 'Normalny (Gauss)', desc: 'Klasyczna krzywa dzwonowa' },
                  { id: 'bimodal', label: 'Bimodalny', desc: 'Dwa wyraźne szczyty' },
                  { id: 'skewed', label: 'Prawoskośny', desc: 'Długi prawy ogon' },
                  { id: 'uniform', label: 'Jednostajny', desc: 'Równomierna gęstość' },
                ].map((type) => {
                  const isActive = selectedDataset.distributionType === type.id;
                  return (
                    <button
                      key={type.id}
                      id={`dist-type-${type.id}`}
                      type="button"
                      onClick={() => onUpdateDataset(selectedDataset.id, { distributionType: type.id as DistributionType }, true)}
                      className={`text-left p-2 rounded-lg border transition cursor-pointer ${
                        isActive
                          ? 'border-slate-600 bg-white text-slate-900 shadow-2xs font-medium'
                          : 'border-slate-200/70 hover:border-slate-300 bg-white/50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold leading-tight">{type.label}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{type.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EDUCATIONAL TIP */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg flex items-start gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold">Wskazówka dydaktyczna:</span> Włącz rozkład <strong>Bimodalny</strong> i przełączaj widok między <strong>Wykres skrzynkowy</strong> a <strong>Wykres wiolinowy</strong>, aby pokazać studentom, jak box plot ukrywa wielomodalność danych!
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
