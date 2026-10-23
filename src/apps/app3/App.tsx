import React, { useState, useMemo, useCallback } from 'react';
import {
  DistributionConfig,
  DisplaySettings,
  DistributionCalculations,
} from './types';
import {
  DEFAULT_DISPLAY_SETTINGS,
  createInitialDistributions,
  PRESET_SCENARIOS,
} from './data/defaults';
import {
  getSasParameters,
  sampleFromDistribution,
  computeDistributionCalculations,
} from './utils/statistics';
import { ModuleContextBar, PresetItem } from '../../components/ModuleContextBar';
import { DistributionCanvas } from './components/DistributionCanvas';
import { DistributionControls } from './components/DistributionControls';
import { StatsGuideModal } from './components/StatsGuideModal';

export default function App() {
  const [seed, setSeed] = useState<number>(42);
  const [isSeedFixed, setIsSeedFixed] = useState<boolean>(true);

  // Initialize distributions A, B, and C
  const [distributions, setDistributions] = useState<{
    distA: DistributionConfig;
    distB: DistributionConfig;
    distC: DistributionConfig;
  }>(() => createInitialDistributions(42));

  const [activeDistId, setActiveDistId] = useState<'dist-a' | 'dist-b' | 'dist-c'>('dist-a');
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Update display settings
  const handleUpdateDisplaySettings = useCallback((updates: Partial<DisplaySettings>) => {
    setDisplaySettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Resample a distribution's empirical data points
  const handleResample = useCallback(
    (id: 'dist-a' | 'dist-b' | 'dist-c') => {
      setDistributions((prev) => {
        const target = id === 'dist-a' ? prev.distA : id === 'dist-b' ? prev.distB : prev.distC;
        const sas = getSasParameters(target.skewness, target.kurtosis);
        const offset = id === 'dist-a' ? 0 : id === 'dist-b' ? 1337 : 2026;
        const dsSeed = isSeedFixed ? (seed + offset + (Date.now() % 10000)) : undefined;
        const newSample = sampleFromDistribution(
          target.sampleN,
          target.mean,
          target.sd,
          sas.epsilon,
          sas.delta,
          sas.rawMean,
          sas.rawSd,
          dsSeed
        );

        if (id === 'dist-a') {
          return {
            ...prev,
            distA: { ...prev.distA, rawSample: newSample },
          };
        } else if (id === 'dist-b') {
          return {
            ...prev,
            distB: { ...prev.distB, rawSample: newSample },
          };
        } else {
          return {
            ...prev,
            distC: { ...prev.distC, rawSample: newSample },
          };
        }
      });
    },
    [isSeedFixed, seed]
  );

  // Update a distribution's parameters (mean, sd, skewness, kurtosis, N)
  const handleUpdateDist = useCallback(
    (
      id: 'dist-a' | 'dist-b' | 'dist-c',
      updates: Partial<DistributionConfig>,
      regenerateSample = false
    ) => {
      setDistributions((prev) => {
        const current = id === 'dist-a' ? prev.distA : id === 'dist-b' ? prev.distB : prev.distC;
        const updated = { ...current, ...updates };

        const needsResample =
          regenerateSample ||
          (updates.mean !== undefined && updates.mean !== current.mean) ||
          (updates.sd !== undefined && updates.sd !== current.sd) ||
          (updates.skewness !== undefined && updates.skewness !== current.skewness) ||
          (updates.kurtosis !== undefined && updates.kurtosis !== current.kurtosis) ||
          (updates.sampleN !== undefined && updates.sampleN !== current.sampleN);

        if (needsResample) {
          const sas = getSasParameters(updated.skewness, updated.kurtosis);
          const offset = id === 'dist-a' ? 0 : id === 'dist-b' ? 1337 : 2026;
          const dsSeed = isSeedFixed ? (seed + offset) : undefined;
          updated.rawSample = sampleFromDistribution(
            updated.sampleN,
            updated.mean,
            updated.sd,
            sas.epsilon,
            sas.delta,
            sas.rawMean,
            sas.rawSd,
            dsSeed
          );
        }

        if (id === 'dist-a') {
          return { ...prev, distA: updated };
        } else if (id === 'dist-b') {
          return { ...prev, distB: updated };
        } else {
          return { ...prev, distC: updated };
        }
      });
    },
    [isSeedFixed, seed]
  );

  // Apply a preset scenario
  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
      if (!preset) return;

      if (preset.displaySettings) {
        setDisplaySettings((prev) => ({
          ...prev,
          comparisonMode: preset.comparisonMode,
          ...preset.displaySettings,
        }));
      } else {
        setDisplaySettings((prev) => ({
          ...prev,
          comparisonMode: preset.comparisonMode,
        }));
      }

      setDistributions((prev) => {
        const newDistA = { ...prev.distA, ...preset.distA };
        const sasA = getSasParameters(newDistA.skewness, newDistA.kurtosis);
        const dsSeedA = isSeedFixed ? seed : undefined;
        newDistA.rawSample = sampleFromDistribution(
          newDistA.sampleN,
          newDistA.mean,
          newDistA.sd,
          sasA.epsilon,
          sasA.delta,
          sasA.rawMean,
          sasA.rawSd,
          dsSeedA
        );

        let newDistB = prev.distB;
        if (preset.distB) {
          newDistB = { ...prev.distB, ...preset.distB, enabled: true };
          const sasB = getSasParameters(newDistB.skewness, newDistB.kurtosis);
          const dsSeedB = isSeedFixed ? seed + 1337 : undefined;
          newDistB.rawSample = sampleFromDistribution(
            newDistB.sampleN,
            newDistB.mean,
            newDistB.sd,
            sasB.epsilon,
            sasB.delta,
            sasB.rawMean,
            sasB.rawSd,
            dsSeedB
          );
        }

        let newDistC = prev.distC;
        if (preset.distC) {
          newDistC = { ...prev.distC, ...preset.distC, enabled: true };
          const sasC = getSasParameters(newDistC.skewness, newDistC.kurtosis);
          const dsSeedC = isSeedFixed ? seed + 2026 : undefined;
          newDistC.rawSample = sampleFromDistribution(
            newDistC.sampleN,
            newDistC.mean,
            newDistC.sd,
            sasC.epsilon,
            sasC.delta,
            sasC.rawMean,
            sasC.rawSd,
            dsSeedC
          );
        }

        return {
          distA: newDistA,
          distB: newDistB,
          distC: newDistC,
        };
      });

      setActiveDistId('dist-a');
    },
    [isSeedFixed, seed]
  );

  // Reset all to defaults
  const handleReset = useCallback(() => {
    const initial = createInitialDistributions(42);
    setDistributions(initial);
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    setActiveDistId('dist-a');
    setSeed(42);
  }, []);

  // Compute overall domain range for chart calculations
  const { minDomainX, maxDomainX } = useMemo(() => {
    // When axes are locked, fixed range to clearly see mean shift and sd height changes
    if (displaySettings.lockAxes) {
      const isZPreset =
        Math.abs(distributions.distA.mean) <= 0.01 &&
        Math.abs(distributions.distA.sd - 1) <= 0.01;
      if (isZPreset) {
        return { minDomainX: -5, maxDomainX: 5 };
      }
      return { minDomainX: -30, maxDomainX: 130 };
    }

    const configs = [distributions.distA];
    if (displaySettings.comparisonMode === 'dual' || displaySettings.comparisonMode === 'triple') {
      configs.push(distributions.distB);
    }
    if (displaySettings.comparisonMode === 'triple') {
      configs.push(distributions.distC);
    }

    let min = Infinity;
    let max = -Infinity;

    configs.forEach((d) => {
      const left = d.mean - 4.5 * d.sd;
      const right = d.mean + 4.5 * d.sd;
      if (left < min) min = left;
      if (right > max) max = right;
    });

    return {
      minDomainX: Math.floor(min),
      maxDomainX: Math.ceil(max),
    };
  }, [distributions, displaySettings.comparisonMode, displaySettings.lockAxes]);

  // Compute theoretical moments and empirical histogram for Dist A, B, and C
  const distACalc: DistributionCalculations = useMemo(() => {
    return computeDistributionCalculations(
      distributions.distA,
      minDomainX,
      maxDomainX,
      displaySettings.binCount
    );
  }, [distributions.distA, minDomainX, maxDomainX, displaySettings.binCount]);

  const distBCalc: DistributionCalculations = useMemo(() => {
    return computeDistributionCalculations(
      distributions.distB,
      minDomainX,
      maxDomainX,
      displaySettings.binCount
    );
  }, [distributions.distB, minDomainX, maxDomainX, displaySettings.binCount]);

  const distCCalc: DistributionCalculations = useMemo(() => {
    return computeDistributionCalculations(
      distributions.distC,
      minDomainX,
      maxDomainX,
      displaySettings.binCount
    );
  }, [distributions.distC, minDomainX, maxDomainX, displaySettings.binCount]);

  const [mobileViewMode, setMobileViewMode] = useState<'chart' | 'controls'>('chart');

  const presets: PresetItem[] = useMemo(
    () => PRESET_SCENARIOS.map((p) => ({ id: p.id, label: p.title })),
    []
  );

  return (
    <div className="flex flex-col text-slate-800 font-sans antialiased">
      {/* Module Context Toolbar */}
      <ModuleContextBar
        title="Rozkłady zmiennych"
        badge="Aplikacja 3"
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
        guideLabel="Przewodnik"
        mobileViewMode={mobileViewMode}
        onToggleMobileView={setMobileViewMode}
        controlsLabel="Parametry Rozkładów"
        chartLabel="Wykres i Kwantyle"
      />

      {/* Main Workspace (Unified 2-Column: Controls LEWA lg:col-span-4, Wykres PRAWA lg:col-span-8) */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEWA STRONA: Panel Sterowania Rozkładami (4 kolumny na lg) */}
          <div className={`lg:col-span-4 ${mobileViewMode === 'controls' ? 'block' : 'hidden lg:block'}`}>
            <DistributionControls
              distA={distributions.distA}
              distB={distributions.distB}
              distC={distributions.distC}
              activeDistId={activeDistId}
              onSelectActiveDist={setActiveDistId}
              onUpdateDist={handleUpdateDist}
              onResample={handleResample}
              displaySettings={displaySettings}
              onUpdateDisplaySettings={handleUpdateDisplaySettings}
              seed={seed}
              isSeedFixed={isSeedFixed}
              onToggleFixedSeed={setIsSeedFixed}
              onChangeSeed={setSeed}
            />
          </div>

          {/* PRAWA STRONA: Wykres i Tabela Statystyk (8 kolumn na lg) */}
          <div className={`lg:col-span-8 space-y-4 ${mobileViewMode === 'chart' ? 'block' : 'hidden lg:block'}`}>
            <DistributionCanvas
              distACalc={distACalc}
              distBCalc={distBCalc}
              distCCalc={distCCalc}
              displaySettings={displaySettings}
              onUpdateDisplaySettings={handleUpdateDisplaySettings}
            />
          </div>
        </div>
      </main>

      {/* Educational Theory Modal */}
      <StatsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
