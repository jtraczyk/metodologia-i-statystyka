import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  PopulationConfig,
  SampleItem,
  CltDisplaySettings,
} from './types';
import {
  DEFAULT_POPULATION,
  DEFAULT_DISPLAY_SETTINGS,
  PRESET_SCENARIOS,
} from './data/defaults';
import {
  sampleFromPopulation,
  computeSampleItem,
  computeCiCoverageStats,
  computeCltStats,
} from './utils/statistics';
import { ModuleContextBar, PresetItem } from '../../components/ModuleContextBar';
import { CltCanvas } from './components/CltCanvas';
import { CltControls } from './components/CltControls';
import { CltStatsSummary } from './components/CltStatsSummary';
import { CltGuideModal } from './components/CltGuideModal';

export default function App() {
  // Population Configuration (μ, σ, zawsze rozkład normalny)
  const [population, setPopulation] = useState<PopulationConfig>({
    ...DEFAULT_POPULATION,
    type: 'normal',
  });

  // Sample size n
  const [sampleSizeN, setSampleSizeN] = useState<number>(10);

  // Confidence Interval level 1 - alpha (default 0.95 = 95% CI)
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);

  // Accumulated sample items with their CIs, means, and p-values
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const samplesRef = useRef<SampleItem[]>([]);
  samplesRef.current = samples;

  // The latest single drawn sample
  const [currentSample, setCurrentSample] = useState<SampleItem | null>(null);

  // Display toggles & settings
  const [displaySettings, setDisplaySettings] = useState<CltDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

  // Modal guide
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Continuous auto-sampling (Play/Pause: 1 próbka na krok)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<number | null>(null);

  // Animation active state for subtle UI pulse
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animTimeoutRef = useRef<number | null>(null);

  // Sync for CSV export
  useEffect(() => {
    (window as unknown as { __lastSampleMeans?: number[] }).__lastSampleMeans = samples.map((s) => s.mean);
  }, [samples]);

  // Coordinate domain calculation for horizontal axis: [minX, maxX]
  const { minX, maxX } = useMemo(() => {
    const mu = population.mean;
    const sigma = population.sd;
    const spread = Math.max(sigma * 4, 32);
    return {
      minX: Math.round(mu - spread),
      maxX: Math.round(mu + spread),
    };
  }, [population.mean, population.sd]);

  // Compute confidence interval coverage statistics
  const coverageStats = useMemo(() => {
    return computeCiCoverageStats(
      samples,
      population.mean,
      population.sd,
      sampleSizeN,
      confidenceLevel
    );
  }, [samples, population.mean, population.sd, sampleSizeN, confidenceLevel]);

  // Compute distribution statistics (CLT stats)
  const cltStats = useMemo(() => {
    const means = samples.map((s) => s.mean);
    return computeCltStats(
      means,
      population.mean,
      population.sd,
      sampleSizeN,
      minX,
      maxX,
      30
    );
  }, [samples, population.mean, population.sd, sampleSizeN, minX, maxX]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) window.clearTimeout(animTimeoutRef.current);
      if (playTimerRef.current) window.clearInterval(playTimerRef.current);
    };
  }, []);

  // Update Population (zawsze rozkład normalny)
  const handleChangePopulation = useCallback(
    (updates: Partial<PopulationConfig>) => {
      setPopulation((prev) => ({ ...prev, ...updates, type: 'normal' }));
      setSamples([]);
      samplesRef.current = [];
      setCurrentSample(null);
    },
    []
  );

  // Update Sample Size n
  const handleChangeSampleSizeN = useCallback(
    (newN: number) => {
      const validN = Math.max(2, Math.min(100, newN));
      setSampleSizeN(validN);
      setSamples([]);
      samplesRef.current = [];
      setCurrentSample(null);
    },
    []
  );

  // Update Confidence Level / Width
  // Recalculate CIs and p-values for all existing samples so change is immediately visible
  const handleChangeConfidenceLevel = useCallback(
    (newLevel: number) => {
      const validLevel = Math.max(0.70, Math.min(0.999, newLevel));
      setConfidenceLevel(validLevel);
      setDisplaySettings((prev) => ({ ...prev, confidenceLevel: validLevel }));

      setSamples((prev) =>
        prev.map((s) => computeSampleItem(s.values, population.mean, validLevel, s.id))
      );
      if (currentSample) {
        setCurrentSample((prev) =>
          prev ? computeSampleItem(prev.values, population.mean, validLevel, prev.id) : null
        );
      }
    },
    [population.mean, currentSample]
  );

  // Update Display Settings
  const handleUpdateDisplaySettings = useCallback((updates: Partial<CltDisplaySettings>) => {
    setDisplaySettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear all samples
  const handleClearSamples = useCallback(() => {
    setSamples([]);
    samplesRef.current = [];
    setCurrentSample(null);
    setIsPlaying(false);
  }, []);

  // Reset everything to defaults
  const handleReset = useCallback(() => {
    setPopulation({ ...DEFAULT_POPULATION, type: 'normal' });
    setSampleSizeN(10);
    setConfidenceLevel(0.95);
    setSamples([]);
    samplesRef.current = [];
    setCurrentSample(null);
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    setIsPlaying(false);
  }, []);

  // Select Preset Scenario
  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
      if (!preset) return;

      setIsPlaying(false);
      setPopulation({
        type: 'normal',
        name: preset.title,
        mean: preset.populationMean,
        sd: preset.populationSD,
      });
      setSampleSizeN(preset.sampleN);
      if (preset.confidenceLevel) {
        setConfidenceLevel(preset.confidenceLevel);
      }
      setSamples([]);
      samplesRef.current = [];
      setCurrentSample(null);
    },
    []
  );

  // =========================================================================
  // ACTION: Draw exactly 1 sample (Ręcznie lub Automatycznie)
  // Wyznacza przedział ufności i dodaje do płynnego wodospadu
  // =========================================================================
  const handleSampleOne = useCallback(() => {
    // Losowanie zawsze dokładnie 1 próbki z rozkładu normalnego
    const values = sampleFromPopulation(
      'normal',
      population.mean,
      population.sd,
      sampleSizeN
    );
    const sampleItem = computeSampleItem(
      values,
      population.mean,
      confidenceLevel,
      Date.now() + Math.random()
    );

    setCurrentSample(sampleItem);
    setSamples((prev) => [...prev, sampleItem]);
    setIsAnimating(true);

    if (animTimeoutRef.current) {
      window.clearTimeout(animTimeoutRef.current);
    }
    animTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
    }, 350);
  }, [population.mean, population.sd, sampleSizeN, confidenceLevel]);

  // Continuous auto-sampling toggle (Play/Pause)
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Continuous sampling loop handler: Always 1 sample at steady, smooth cadence
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    const speed = displaySettings.animationSpeed;
    const intervalMs = speed === 'slow' ? 680 : speed === 'normal' ? 360 : 160;

    playTimerRef.current = window.setInterval(() => {
      // Draw 1 sample with unique id
      const values = sampleFromPopulation(
        'normal',
        population.mean,
        population.sd,
        sampleSizeN
      );
      const sampleItem = computeSampleItem(
        values,
        population.mean,
        confidenceLevel,
        Date.now() + Math.random()
      );

      setCurrentSample(sampleItem);
      setSamples((prev) => [...prev, sampleItem]);
    }, intervalMs);

    return () => {
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, displaySettings.animationSpeed, population.mean, population.sd, sampleSizeN, confidenceLevel]);

  // Keyboard shortcut: Space to draw 1 sample manually
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'SELECT'
      ) {
        e.preventDefault();
        handleSampleOne();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSampleOne]);

  const [mobileViewMode, setMobileViewMode] = useState<'chart' | 'controls'>('chart');

  const presets: PresetItem[] = useMemo(
    () => PRESET_SCENARIOS.map((p) => ({ id: p.id, label: p.title })),
    []
  );

  return (
    <div className="flex flex-col text-slate-800 antialiased font-sans">
      {/* Module Context Toolbar */}
      <ModuleContextBar
        title="Przedziały ufności"
        badge="Aplikacja 4"
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
        guideLabel="Przewodnik"
        mobileViewMode={mobileViewMode}
        onToggleMobileView={setMobileViewMode}
        controlsLabel="Parametry i Losowanie"
        chartLabel="Wizualizacja CI"
      />

      {/* Main Workspace (Unified 2-Column: Controls LEWA lg:col-span-4, Wykres PRAWA lg:col-span-8) */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEWA STRONA: Menu parametrów i losowania (4 kolumny na lg) */}
          <div className={`lg:col-span-4 ${mobileViewMode === 'controls' ? 'block' : 'hidden lg:block'}`}>
            <CltControls
              population={population}
              onChangePopulation={handleChangePopulation}
              sampleSizeN={sampleSizeN}
              onChangeSampleSizeN={handleChangeSampleSizeN}
              confidenceLevel={confidenceLevel}
              onChangeConfidenceLevel={handleChangeConfidenceLevel}
              displaySettings={displaySettings}
              onUpdateDisplaySettings={handleUpdateDisplaySettings}
              onSampleOne={handleSampleOne}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onClearSamples={handleClearSamples}
              isAnimating={isAnimating}
              kSamples={samples.length}
              coveredCount={coverageStats.coveredCount}
              coverageRate={coverageStats.coverageRate}
            />
          </div>

          {/* PRAWA STRONA: Wizualizacja przedziałów CI oraz Podsumowanie (8 kolumn na lg) */}
          <div className={`lg:col-span-8 flex flex-col gap-5 ${mobileViewMode === 'chart' ? 'block' : 'hidden lg:block'}`}>
            <CltCanvas
              population={population}
              sampleSizeN={sampleSizeN}
              confidenceLevel={confidenceLevel}
              samples={samples}
              currentSample={currentSample}
              cltStats={cltStats}
              coverageStats={coverageStats}
              displaySettings={displaySettings}
              onUpdateDisplaySettings={handleUpdateDisplaySettings}
              minX={minX}
              maxX={maxX}
            />

            {/* Quantitative Coverage & p-value Statistics Summary */}
            <CltStatsSummary
              coverageStats={coverageStats}
              cltStats={cltStats}
              currentSample={currentSample}
              sampleSizeN={sampleSizeN}
              confidenceLevel={confidenceLevel}
              populationMean={population.mean}
              populationSD={population.sd}
              samples={samples}
            />
          </div>
        </div>
      </main>

      {/* Educational Guide Modal */}
      <CltGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
