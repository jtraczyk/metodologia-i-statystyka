import React, { useState, useMemo, useCallback } from 'react';
import { DatasetConfig, LayerSettings, StatisticalSummary, DistributionType } from './types';
import { COLOR_PALETTES, DEFAULT_LAYERS, createInitialDatasets } from './data/defaults';
import { generateDatasetPoints, computeStatisticalSummary } from './utils/statistics';
import { ModuleContextBar, PresetItem } from '../../components/ModuleContextBar';
import { Sidebar } from './components/Sidebar';
import { BoxPlotCanvas } from './components/BoxPlotCanvas';
import { SummaryTable } from './components/SummaryTable';
import { StatsGuideModal } from './components/StatsGuideModal';

export default function App() {
  const [seed, setSeed] = useState<number>(42);
  const [isSeedFixed, setIsSeedFixed] = useState<boolean>(true);
  const [datasets, setDatasets] = useState<DatasetConfig[]>(() => createInitialDatasets(42));
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('group-1');
  const [layers, setLayers] = useState<LayerSettings>(DEFAULT_LAYERS);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Compute statistical summaries for all active datasets
  const summaries = useMemo(() => {
    const map: Record<string, StatisticalSummary> = {};
    datasets.forEach((d) => {
      map[d.id] = computeStatisticalSummary(
        d.rawPoints,
        d.mean,
        d.sd,
        layers.violinBandwidthMultiplier
      );
    });
    return map;
  }, [datasets, layers.violinBandwidthMultiplier]);

  // Update layer configuration
  const handleUpdateLayers = useCallback((updates: Partial<LayerSettings>) => {
    setLayers((prev) => ({ ...prev, ...updates }));
  }, []);

  // Update a dataset parameter (mean, SD, N, name, distributionType)
  const handleUpdateDataset = useCallback(
    (id: string, updates: Partial<DatasetConfig>, shouldRegenerate = false) => {
      setDatasets((prev) =>
        prev.map((d, index) => {
          if (d.id !== id) return d;

          const updated = { ...d, ...updates };

          // If numeric parameters changed or regeneration requested, re-sample points
          if (
            shouldRegenerate ||
            (updates.mean !== undefined && updates.mean !== d.mean) ||
            (updates.sd !== undefined && updates.sd !== d.sd) ||
            (updates.n !== undefined && updates.n !== d.n) ||
            (updates.distributionType !== undefined && updates.distributionType !== d.distributionType)
          ) {
            // Strictly clamp N to [100, 500]
            const clampedN = Math.max(100, Math.min(500, Math.round(updated.n)));
            const dsSeed = isSeedFixed ? (seed + index * 1337) : undefined;
            const generated = generateDatasetPoints(
              clampedN,
              updated.mean,
              updated.sd,
              updated.distributionType,
              dsSeed
            );
            updated.n = clampedN;
            updated.rawPoints = generated.points;
            updated.jitterOffsets = generated.jitter;
          }

          return updated;
        })
      );
    },
    [isSeedFixed, seed]
  );

  // Add a new comparative group (up to 4 groups)
  const handleAddDataset = useCallback(() => {
    setDatasets((prev) => {
      if (prev.length >= 4) return prev;
      const nextIndex = prev.length;
      const palette = COLOR_PALETTES[nextIndex % COLOR_PALETTES.length];
      const groupLetters = ['A', 'B', 'C', 'D'];
      const letter = groupLetters[nextIndex] || `${nextIndex + 1}`;
      const newId = `group-${Date.now()}`;
      const defaultMean = 55 + (nextIndex % 2 === 0 ? 10 : -5);
      const defaultSD = 12;
      const defaultN = 200;

      const dsSeed = isSeedFixed ? (seed + nextIndex * 1337) : undefined;
      const generated = generateDatasetPoints(defaultN, defaultMean, defaultSD, 'normal', dsSeed);

      const newDataset: DatasetConfig = {
        id: newId,
        name: `Grupa ${letter}`,
        color: palette,
        mean: defaultMean,
        sd: defaultSD,
        n: defaultN,
        distributionType: 'normal',
        rawPoints: generated.points,
        jitterOffsets: generated.jitter,
      };

      setSelectedDatasetId(newId);
      return [...prev, newDataset];
    });
  }, [isSeedFixed, seed]);

  // Remove a dataset
  const handleRemoveDataset = useCallback((id: string) => {
    setDatasets((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((d) => d.id !== id);
      setSelectedDatasetId(filtered[0].id);
      return filtered;
    });
  }, []);

  // Resample one dataset
  const handleResampleDataset = useCallback((id: string) => {
    setDatasets((prev) =>
      prev.map((d, index) => {
        if (d.id !== id) return d;
        // If seed is fixed, increment slightly for this dataset or generate fresh if not fixed
        const dsSeed = isSeedFixed ? (seed + index * 1337 + Date.now() % 1000) : undefined;
        const generated = generateDatasetPoints(d.n, d.mean, d.sd, d.distributionType, dsSeed);
        return {
          ...d,
          rawPoints: generated.points,
          jitterOffsets: generated.jitter,
        };
      })
    );
  }, [isSeedFixed, seed]);

  // Resample all datasets (updates the common seed if fixed or uses random)
  const handleResampleAll = useCallback(() => {
    if (isSeedFixed) {
      // Pick a new seed and regenerate all deterministically
      const newSeed = Math.floor(Math.random() * 89999) + 10000;
      setSeed(newSeed);
      setDatasets((prev) =>
        prev.map((d, index) => {
          const dsSeed = newSeed + index * 1337;
          const generated = generateDatasetPoints(d.n, d.mean, d.sd, d.distributionType, dsSeed);
          return {
            ...d,
            rawPoints: generated.points,
            jitterOffsets: generated.jitter,
          };
        })
      );
    } else {
      setDatasets((prev) =>
        prev.map((d) => {
          const generated = generateDatasetPoints(d.n, d.mean, d.sd, d.distributionType);
          return {
            ...d,
            rawPoints: generated.points,
            jitterOffsets: generated.jitter,
          };
        })
      );
    }
  }, [isSeedFixed]);

  // Change seed directly from UI
  const handleChangeSeed = useCallback((newSeed: number) => {
    setSeed(newSeed);
    setDatasets((prev) =>
      prev.map((d, index) => {
        const dsSeed = isSeedFixed ? (newSeed + index * 1337) : undefined;
        const generated = generateDatasetPoints(d.n, d.mean, d.sd, d.distributionType, dsSeed);
        return {
          ...d,
          rawPoints: generated.points,
          jitterOffsets: generated.jitter,
        };
      })
    );
  }, [isSeedFixed]);

  // Toggle fixed seed
  const handleToggleFixedSeed = useCallback((fixed: boolean) => {
    setIsSeedFixed(fixed);
    if (fixed) {
      // Immediately regenerate deterministically with current seed
      setDatasets((prev) =>
        prev.map((d, index) => {
          const dsSeed = seed + index * 1337;
          const generated = generateDatasetPoints(d.n, d.mean, d.sd, d.distributionType, dsSeed);
          return {
            ...d,
            rawPoints: generated.points,
            jitterOffsets: generated.jitter,
          };
        })
      );
    }
  }, [seed]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    const defaultSeed = 42;
    setSeed(defaultSeed);
    setIsSeedFixed(true);
    setDatasets(createInitialDatasets(defaultSeed));
    setSelectedDatasetId('group-1');
    setLayers(DEFAULT_LAYERS);
  }, []);

  // Load classroom educational presets
  const handleSelectPreset = useCallback((presetName: string) => {
    const s1 = isSeedFixed ? seed : undefined;
    const s2 = isSeedFixed ? (seed + 1337) : undefined;

    if (presetName === 'bimodal') {
      const g1 = generateDatasetPoints(300, 50, 14, 'normal', s1);
      const g2 = generateDatasetPoints(300, 50, 14, 'bimodal', s2);
      setDatasets([
        {
          id: 'group-1',
          name: 'Grupa A (Normalny)',
          color: COLOR_PALETTES[0],
          mean: 50,
          sd: 14,
          n: 300,
          distributionType: 'normal',
          rawPoints: g1.points,
          jitterOffsets: g1.jitter,
        },
        {
          id: 'group-2',
          name: 'Grupa B (Bimodalny)',
          color: COLOR_PALETTES[1],
          mean: 50,
          sd: 14,
          n: 300,
          distributionType: 'bimodal',
          rawPoints: g2.points,
          jitterOffsets: g2.jitter,
        },
      ]);
      setSelectedDatasetId('group-2');
      setLayers({ ...DEFAULT_LAYERS, showBoxPlot: true, showViolin: true, showPoints: true });
    } else if (presetName === 'sampleSize') {
      const g1 = generateDatasetPoints(100, 50, 12, 'normal', s1);
      const g2 = generateDatasetPoints(500, 50, 12, 'normal', s2);
      setDatasets([
        {
          id: 'group-1',
          name: 'Grupa A (N=100)',
          color: COLOR_PALETTES[0],
          mean: 50,
          sd: 12,
          n: 100,
          distributionType: 'normal',
          rawPoints: g1.points,
          jitterOffsets: g1.jitter,
        },
        {
          id: 'group-2',
          name: 'Grupa B (N=500)',
          color: COLOR_PALETTES[1],
          mean: 50,
          sd: 12,
          n: 500,
          distributionType: 'normal',
          rawPoints: g2.points,
          jitterOffsets: g2.jitter,
        },
      ]);
      setSelectedDatasetId('group-1');
      setLayers({ ...DEFAULT_LAYERS, showBoxPlot: true, showPoints: true, showViolin: true });
    } else if (presetName === 'variance') {
      const g1 = generateDatasetPoints(250, 50, 6, 'normal', s1);
      const g2 = generateDatasetPoints(250, 50, 22, 'normal', s2);
      setDatasets([
        {
          id: 'group-1',
          name: 'Grupa A (SD=6)',
          color: COLOR_PALETTES[0],
          mean: 50,
          sd: 6,
          n: 250,
          distributionType: 'normal',
          rawPoints: g1.points,
          jitterOffsets: g1.jitter,
        },
        {
          id: 'group-2',
          name: 'Grupa B (SD=22)',
          color: COLOR_PALETTES[1],
          mean: 50,
          sd: 22,
          n: 250,
          distributionType: 'normal',
          rawPoints: g2.points,
          jitterOffsets: g2.jitter,
        },
      ]);
      setSelectedDatasetId('group-2');
    } else if (presetName === 'skewed') {
      const g1 = generateDatasetPoints(250, 45, 12, 'normal', s1);
      const g2 = generateDatasetPoints(250, 45, 15, 'skewed', s2);
      setDatasets([
        {
          id: 'group-1',
          name: 'Grupa A (Normalny)',
          color: COLOR_PALETTES[0],
          mean: 45,
          sd: 12,
          n: 250,
          distributionType: 'normal',
          rawPoints: g1.points,
          jitterOffsets: g1.jitter,
        },
        {
          id: 'group-2',
          name: 'Grupa B (Prawoskośny)',
          color: COLOR_PALETTES[1],
          mean: 45,
          sd: 15,
          n: 250,
          distributionType: 'skewed',
          rawPoints: g2.points,
          jitterOffsets: g2.jitter,
        },
      ]);
      setSelectedDatasetId('group-2');
      setLayers({ ...DEFAULT_LAYERS, showBoxPlot: true, showMeanMarker: true, showViolin: true });
    }
  }, [isSeedFixed, seed]);

  const [mobileViewMode, setMobileViewMode] = useState<'chart' | 'controls'>('chart');

  const presets: PresetItem[] = [
    { id: 'bimodal', label: 'Rozkład bimodalny vs jednomodalny' },
    { id: 'sampleSize', label: 'Wielkość próby: N=100 vs N=500' },
    { id: 'variance', label: 'Ta sama średnia (50), różne SD (6 vs 22)' },
    { id: 'skewed', label: 'Rozkład skośny vs symetryczny' },
  ];

  return (
    <div className="flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-100 selection:text-slate-900">
      {/* Module Context Toolbar */}
      <ModuleContextBar
        title="Statystyki opisowe i wykres skrzynkowy"
        badge="Aplikacja 1"
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
        guideLabel="Przewodnik"
        mobileViewMode={mobileViewMode}
        onToggleMobileView={setMobileViewMode}
        controlsLabel="Zbiory i Warstwy"
        chartLabel="Wykres i Wyniki"
      />

      {/* Main Workspace Layout (2-Column Unified Layout) */}
      <div className="max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEWA KOLUMNA: Panel Sterowania / Sidebar (4 kolumny na lg) */}
          <div className={`lg:col-span-4 ${mobileViewMode === 'controls' ? 'block' : 'hidden lg:block'}`}>
            <Sidebar
              datasets={datasets}
              selectedDatasetId={selectedDatasetId}
              onSelectDataset={setSelectedDatasetId}
              onUpdateDataset={handleUpdateDataset}
              onAddDataset={handleAddDataset}
              onRemoveDataset={handleRemoveDataset}
              onResampleDataset={handleResampleDataset}
              onResampleAll={handleResampleAll}
              layers={layers}
              onUpdateLayers={handleUpdateLayers}
              seed={seed}
              isSeedFixed={isSeedFixed}
              onToggleFixedSeed={handleToggleFixedSeed}
              onChangeSeed={handleChangeSeed}
            />
          </div>

          {/* PRAWA KOLUMNA: Wykres i Tabela Statystyk (8 kolumn na lg) */}
          <div className={`lg:col-span-8 flex flex-col gap-5 ${mobileViewMode === 'chart' ? 'block' : 'hidden lg:block'}`}>
            <BoxPlotCanvas
              datasets={datasets}
              summaries={summaries}
              layers={layers}
            />

            <SummaryTable
              datasets={datasets}
              summaries={summaries}
            />
          </div>
        </div>
      </div>

      {/* Statistics Teaching Guide Modal */}
      <StatsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
