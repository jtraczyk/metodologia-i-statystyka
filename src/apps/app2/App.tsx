import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  PopulationConfig,
  SampleItem,
  CltDisplaySettings,
  FallingPoint,
} from './types';
import {
  DEFAULT_POPULATION,
  DEFAULT_DISPLAY_SETTINGS,
  PRESET_SCENARIOS,
} from './data/defaults';
import {
  sampleFromPopulation,
  getSampleMeanAndSD,
  computeCltStats,
} from './utils/statistics';
import { ModuleContextBar, PresetItem } from '../../components/ModuleContextBar';
import { CltCanvas } from './components/CltCanvas';
import { CltControls } from './components/CltControls';
import { CltStatsSummary } from './components/CltStatsSummary';
import { CltGuideModal } from './components/CltGuideModal';

export default function App() {
  // Population Configuration
  const [population, setPopulation] = useState<PopulationConfig>(DEFAULT_POPULATION);

  // Sample size n
  const [sampleSizeN, setSampleSizeN] = useState<number>(10);

  // Accumulated sample means [x̄_1, x̄_2, ... x̄_K]
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const sampleMeansRef = useRef<number[]>([]);
  sampleMeansRef.current = sampleMeans;

  // The latest single drawn sample
  const [currentSample, setCurrentSample] = useState<SampleItem | null>(null);

  // Display toggles
  const [displaySettings, setDisplaySettings] = useState<CltDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

  // Modal guide
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Continuous auto-sampling (Play/Pause)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<number | null>(null);

  // Animation states
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'sampling' | 'averaging' | 'falling' | 'landing'>('idle');
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [animatedPoints, setAnimatedPoints] = useState<{ id: number; value: number; currentX: number; currentY: number; opacity: number }[]>([]);
  const [fallingPoints, setFallingPoints] = useState<FallingPoint[]>([]);

  // Animation frame and cancel refs
  const animFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Sync for CSV export
  useEffect(() => {
    (window as unknown as { __lastSampleMeans?: number[] }).__lastSampleMeans = sampleMeans;
  }, [sampleMeans]);

  // Coordinate domain calculation for shared horizontal axis: [minX, maxX]
  const { minX, maxX } = useMemo(() => {
    const mu = population.mean;
    const sigma = population.sd;
    const spread = Math.max(sigma * 4, 32);
    return {
      minX: Math.round(mu - spread),
      maxX: Math.round(mu + spread),
    };
  }, [population.mean, population.sd]);

  // SVG coordinate transform helper
  const width = 940;
  const margin = { left: 60, right: 40 };
  const plotWidth = width - margin.left - margin.right;
  const scaleX = useCallback((val: number) => {
    return margin.left + ((val - minX) / (maxX - minX)) * plotWidth;
  }, [minX, maxX, plotWidth]);

  // Compute overall CLT statistics
  const cltStats = useMemo(() => {
    return computeCltStats(
      sampleMeans,
      population.mean,
      population.sd,
      sampleSizeN,
      minX,
      maxX,
      30
    );
  }, [sampleMeans, population.mean, population.sd, sampleSizeN, minX, maxX]);

  // Clean up animations and timers on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (playTimerRef.current) window.clearInterval(playTimerRef.current);
    };
  }, []);

  // Stop any active animation safely
  const stopOngoingAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFallingPoints([]);
    setAnimatedPoints([]);
    setAnimationPhase('idle');
  }, []);

  // Update Population
  const handleChangePopulation = useCallback((updates: Partial<PopulationConfig>) => {
    stopOngoingAnimation();
    setPopulation((prev) => ({ ...prev, ...updates }));
    setSampleMeans([]);
    sampleMeansRef.current = [];
    setCurrentSample(null);
  }, [stopOngoingAnimation]);

  // Update Sample Size n
  const handleChangeSampleSizeN = useCallback((newN: number) => {
    stopOngoingAnimation();
    const validN = Math.max(2, Math.min(100, newN));
    setSampleSizeN(validN);
    setSampleMeans([]);
    sampleMeansRef.current = [];
    setCurrentSample(null);
  }, [stopOngoingAnimation]);

  // Update Display Settings
  const handleUpdateDisplaySettings = useCallback((updates: Partial<CltDisplaySettings>) => {
    setDisplaySettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear all samples
  const handleClearSamples = useCallback(() => {
    stopOngoingAnimation();
    setSampleMeans([]);
    sampleMeansRef.current = [];
    setCurrentSample(null);
    setIsPlaying(false);
  }, [stopOngoingAnimation]);

  // Reset everything to defaults
  const handleReset = useCallback(() => {
    stopOngoingAnimation();
    setPopulation(DEFAULT_POPULATION);
    setSampleSizeN(10);
    setSampleMeans([]);
    sampleMeansRef.current = [];
    setCurrentSample(null);
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    setIsPlaying(false);
  }, [stopOngoingAnimation]);

  // Select Preset Scenario
  const handleSelectPreset = useCallback((presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!preset) return;

    stopOngoingAnimation();
    setIsPlaying(false);

    setPopulation({
      type: preset.populationType,
      name: preset.title,
      mean: preset.populationMean,
      sd: preset.populationSD,
    });
    setSampleSizeN(preset.sampleN);
    setSampleMeans([]);
    sampleMeansRef.current = [];
    setCurrentSample(null);
  }, [stopOngoingAnimation]);

  // Helper to calculate target landing Y on the bottom stack for a given mean
  const calculateLandingY = useCallback((meanVal: number, currentMeans: number[]) => {
    const K = currentMeans.length;
    let dotR = 4.5;
    if (K > 600) dotR = 2.2;
    else if (K > 250) dotR = 2.9;
    else if (K > 80) dotR = 3.8;

    const slotCount = Math.min(100, Math.max(50, Math.floor(plotWidth / (2 * dotR + 1))));
    const slotWidth = (maxX - minX) / slotCount;
    const targetSlot = Math.min(slotCount - 1, Math.max(0, Math.floor((meanVal - minX) / slotWidth)));

    let curCountInSlot = 0;
    for (let i = 0; i < K; i++) {
      const s = Math.min(slotCount - 1, Math.max(0, Math.floor((currentMeans[i] - minX) / slotWidth)));
      if (s === targetSlot) curCountInSlot++;
    }

    const availableH = 245 - 35;
    const stepY = curCountInSlot * (2 * dotR) > availableH ? Math.max(1.1, availableH / (curCountInSlot + 1)) : 2 * dotR;
    const bottomBaseline = 580;
    return bottomBaseline - curCountInSlot * stepY - dotR - 1;
  }, [minX, maxX, plotWidth]);

  // =========================================================================
  // ACTION 1: Draw 1 sample with full educational animation
  // =========================================================================
  const handleSampleOne = useCallback(() => {
    if (animationPhase !== 'idle' && animationPhase !== 'landing') {
      return;
    }

    stopOngoingAnimation();

    const values = sampleFromPopulation(
      population.type,
      population.mean,
      population.sd,
      sampleSizeN
    );
    const { mean: sampleMean, sd: sampleSd } = getSampleMeanAndSD(values);

    const sampleItem: SampleItem = {
      id: Date.now(),
      values,
      mean: sampleMean,
      sd: sampleSd,
      timestamp: Date.now(),
    };

    setCurrentSample(sampleItem);

    // Initial setup for observation points on the top plot (color #009EE0)
    const initialPoints = values.map((val, idx) => {
      const posX = scaleX(val);
      const posY = 218 - (idx % 4) * 12;
      return {
        id: idx,
        value: val,
        currentX: posX,
        currentY: posY,
        opacity: 1,
      };
    });

    setAnimatedPoints(initialPoints);
    setAnimationPhase('sampling');

    const meanPosX = scaleX(sampleMean);
    const topBaseline = 237;
    const targetLandingY = calculateLandingY(sampleMean, sampleMeansRef.current);

    const samplingPause = 260;
    const averagingDuration = 400;
    const fallingDuration = 380;
    const landingDuration = 180;

    let startTime: number | null = null;
    let currentStage: 'pause1' | 'averaging' | 'falling' | 'landing' = 'pause1';

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (currentStage === 'pause1') {
        if (elapsed >= samplingPause) {
          currentStage = 'averaging';
          startTime = timestamp;
          setAnimationPhase('averaging');
        }
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (currentStage === 'averaging') {
        const progress = Math.min(1, elapsed / averagingDuration);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

        setAnimatedPoints(() => {
          return initialPoints.map((pt) => {
            const curX = pt.currentX + (meanPosX - pt.currentX) * ease;
            const curY = pt.currentY + (topBaseline - 16 - pt.currentY) * ease;
            const op = 1 - ease * 0.7;
            return {
              ...pt,
              currentX: curX,
              currentY: curY,
              opacity: op,
            };
          });
        });

        if (progress >= 1) {
          currentStage = 'falling';
          startTime = timestamp;
          setAnimationPhase('falling');
          // Clear points on top as the mean point starts falling down!
          setAnimatedPoints([]);
          setFallingPoints([
            {
              id: Date.now(),
              value: sampleMean,
              x: meanPosX,
              y: topBaseline,
              opacity: 1,
              targetY: targetLandingY,
            },
          ]);
        }
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (currentStage === 'falling') {
        const progress = Math.min(1, elapsed / fallingDuration);
        const ease = progress * progress;
        const curY = topBaseline + (targetLandingY - topBaseline) * ease;

        setFallingPoints([
          {
            id: Date.now(),
            value: sampleMean,
            x: meanPosX,
            y: curY,
            opacity: 1,
            targetY: targetLandingY,
          },
        ]);

        if (progress >= 1) {
          currentStage = 'landing';
          startTime = timestamp;
          setAnimationPhase('landing');
          setFallingPoints([]);
          // Permanently commit sample mean to history on bottom plot
          setSampleMeans((prev) => [...prev, sampleMean]);
        }
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (currentStage === 'landing') {
        if (elapsed >= landingDuration) {
          setAnimatedPoints([]);
          setFallingPoints([]);
          setAnimationPhase('idle');
          return;
        }
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [animationPhase, population, sampleSizeN, scaleX, calculateLandingY, stopOngoingAnimation]);

  // =========================================================================
  // ACTION 2: Batch sample action (+5, +30, +100, +1000)
  // Ensures points visibly drop to the bottom distribution and NEVER stay on top!
  // =========================================================================
  const handleSampleBatch = useCallback((count: number) => {
    stopOngoingAnimation();

    const topBaseline = 237;

    // A. For +5 samples: Sequential educational drop where each sample appears, averages, and falls
    if (count === 5) {
      let currentIndex = 0;

      const runNextSample = () => {
        if (currentIndex >= 5) {
          setAnimatedPoints([]);
          setFallingPoints([]);
          setAnimationPhase('idle');
          return;
        }

        const values = sampleFromPopulation(population.type, population.mean, population.sd, sampleSizeN);
        const { mean: sampleMean, sd: sampleSd } = getSampleMeanAndSD(values);
        const item: SampleItem = {
          id: Date.now() + currentIndex,
          values,
          mean: sampleMean,
          sd: sampleSd,
          timestamp: Date.now(),
        };
        setCurrentSample(item);

        // 1. Show observation points on top
        setAnimationPhase('sampling');
        const pts = values.map((val, idx) => ({
          id: idx,
          value: val,
          currentX: scaleX(val),
          currentY: 218 - (idx % 4) * 12,
          opacity: 1,
        }));
        setAnimatedPoints(pts);

        const xPos = scaleX(sampleMean);
        const targetY = calculateLandingY(sampleMean, sampleMeansRef.current);

        // 2. Converge to mean after 110ms
        timeoutRef.current = window.setTimeout(() => {
          setAnimationPhase('averaging');
          setAnimatedPoints(pts.map((p) => ({ ...p, currentX: xPos, opacity: 0.3 })));

          // 3. Clear top and drop ball down after 80ms
          timeoutRef.current = window.setTimeout(() => {
            setAnimatedPoints([]); // Top is cleared immediately!
            setAnimationPhase('falling');
            setFallingPoints([
              {
                id: Date.now() + currentIndex,
                value: sampleMean,
                x: xPos,
                y: topBaseline,
                opacity: 1,
                targetY,
              },
            ]);

            // 4. Animate fall to bottom
            let fallStart: number | null = null;
            const fallDuration = 180;
            const animateFall = (t: number) => {
              if (!fallStart) fallStart = t;
              const p = Math.min(1, (t - fallStart) / fallDuration);
              const curY = topBaseline + (targetY - topBaseline) * (p * p);
              setFallingPoints([
                {
                  id: Date.now() + currentIndex,
                  value: sampleMean,
                  x: xPos,
                  y: curY,
                  opacity: 1,
                  targetY,
                },
              ]);

              if (p >= 1) {
                // Landed in bottom distribution!
                setFallingPoints([]);
                setSampleMeans((prev) => [...prev, sampleMean]);
                currentIndex++;
                timeoutRef.current = window.setTimeout(runNextSample, 50);
              } else {
                animFrameRef.current = requestAnimationFrame(animateFall);
              }
            };
            animFrameRef.current = requestAnimationFrame(animateFall);
          }, 80);
        }, 110);
      };

      runNextSample();
      return;
    }

    // B. For +30, +100, +1000 samples:
    // Generate all sample items first
    const newMeans: number[] = [];
    const simulatedMeans = [...sampleMeansRef.current];
    let lastSample: SampleItem | null = null;

    interface Particle {
      id: number;
      mean: number;
      x: number;
      y: number;
      vy: number;
      targetY: number;
      launchTime: number;
      landed: boolean;
    }

    const particles: Particle[] = [];
    const visualBallCount = count <= 100 ? count : 75;
    const emitSpan = count <= 30 ? 350 : 500;

    for (let i = 0; i < count; i++) {
      const values = sampleFromPopulation(population.type, population.mean, population.sd, sampleSizeN);
      const { mean, sd } = getSampleMeanAndSD(values);
      newMeans.push(mean);

      if (i === count - 1) {
        lastSample = {
          id: Date.now() + i,
          values,
          mean,
          sd,
          timestamp: Date.now(),
        };
      }

      if (i < visualBallCount) {
        const x = scaleX(mean);
        const targetY = calculateLandingY(mean, simulatedMeans);
        simulatedMeans.push(mean);
        particles.push({
          id: i,
          mean,
          x,
          y: topBaseline,
          vy: 2.5,
          targetY,
          launchTime: (i / visualBallCount) * emitSpan,
          landed: false,
        });
      }
    }

    if (lastSample) {
      setCurrentSample(lastSample);
      // Flash top points extremely briefly (60ms), then GUARANTEED clear!
      setAnimatedPoints(
        lastSample.values.map((v, i) => ({
          id: i,
          value: v,
          currentX: scaleX(v),
          currentY: 218 - (i % 4) * 12,
          opacity: 0.8,
        }))
      );
    }

    timeoutRef.current = window.setTimeout(() => {
      setAnimatedPoints([]);
    }, 70);

    setAnimationPhase('falling');

    let animStart: number | null = null;
    const landedBatch: number[] = [];
    let chunkIndex = 0;
    const chunkSize = Math.ceil(count / 5);

    const cascadeLoop = (timestamp: number) => {
      if (!animStart) animStart = timestamp;
      const elapsed = timestamp - animStart;

      // Always clear top points during falling
      setAnimatedPoints([]);

      const activeInFlight: FallingPoint[] = [];
      let allBallsLanded = true;

      for (let i = 0; i < visualBallCount; i++) {
        const p = particles[i];
        if (p.landed) continue;

        if (elapsed >= p.launchTime) {
          allBallsLanded = false;
          p.vy += 0.9;
          p.y += p.vy;

          if (p.y >= p.targetY) {
            p.y = p.targetY;
            p.landed = true;
            landedBatch.push(p.mean);
          } else {
            activeInFlight.push({
              id: p.id,
              value: p.mean,
              x: p.x,
              y: p.y,
              opacity: 0.9,
              targetY: p.targetY,
            });
          }
        } else {
          allBallsLanded = false;
        }
      }

      // Flush landed visual balls to state (for count <= 100)
      if (count <= 100 && landedBatch.length > 0) {
        const toCommit = [...landedBatch];
        landedBatch.length = 0;
        setSampleMeans((prev) => [...prev, ...toCommit]);
      } else if (count > 100) {
        // Incrementally commit full 1000 samples across the animation duration
        const targetChunk = Math.min(5, Math.floor((elapsed / 500) * 5) + 1);
        while (chunkIndex < targetChunk) {
          const startIdx = chunkIndex * chunkSize;
          const endIdx = Math.min(count, (chunkIndex + 1) * chunkSize);
          const chunk = newMeans.slice(startIdx, endIdx);
          setSampleMeans((prev) => [...prev, ...chunk]);
          chunkIndex++;
        }
      }

      setFallingPoints(activeInFlight);

      if (allBallsLanded && (count <= 100 || chunkIndex >= 5)) {
        setAnimatedPoints([]);
        setFallingPoints([]);
        setAnimationPhase('idle');
        if (count > 100 && chunkIndex < 5) {
          const remaining = newMeans.slice(chunkIndex * chunkSize);
          setSampleMeans((prev) => [...prev, ...remaining]);
        }
      } else {
        animFrameRef.current = requestAnimationFrame(cascadeLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(cascadeLoop);
  }, [population, sampleSizeN, scaleX, calculateLandingY, stopOngoingAnimation]);

  // Continuous auto-sampling toggle
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Continuous loop handler - each sample visibly drops from top to bottom!
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    const topBaseline = 237;

    playTimerRef.current = window.setInterval(() => {
      const values = sampleFromPopulation(
        population.type,
        population.mean,
        population.sd,
        sampleSizeN
      );
      const { mean, sd } = getSampleMeanAndSD(values);
      setCurrentSample({
        id: Date.now(),
        values,
        mean,
        sd,
        timestamp: Date.now(),
      });

      const xPos = scaleX(mean);
      const targetLandingY = calculateLandingY(mean, sampleMeansRef.current);

      // Flash on top, then fall
      const pts = values.map((v, idx) => ({
        id: idx,
        value: v,
        currentX: scaleX(v),
        currentY: 218 - (idx % 4) * 12,
        opacity: 0.85,
      }));
      setAnimatedPoints(pts);

      // After 60ms, drop ball down and clear top plot
      setTimeout(() => {
        setAnimatedPoints([]);
        setFallingPoints([
          {
            id: Date.now(),
            value: mean,
            x: xPos,
            y: topBaseline + (targetLandingY - topBaseline) * 0.5,
            opacity: 1,
            targetY: targetLandingY,
          },
        ]);

        setTimeout(() => {
          setFallingPoints([]);
          setSampleMeans((prev) => [...prev, mean]);
        }, 90);
      }, 70);
    }, 250);

    return () => {
      if (playTimerRef.current) {
        window.clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, population, sampleSizeN, scaleX, calculateLandingY]);

  // Keyboard shortcut: Space to draw sample
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT') {
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
        title="Centralne twierdzenie graniczne"
        badge="Aplikacja 2"
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
        guideLabel="Przewodnik"
        mobileViewMode={mobileViewMode}
        onToggleMobileView={setMobileViewMode}
        controlsLabel="Parametry i Losowanie"
        chartLabel="Wykresy i Statystyki"
      />

      {/* Main Workspace Layout: Unified 2-Column (Controls LEWA lg:col-span-4, Wykresy PRAWA lg:col-span-8) */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEWA STRONA: Menu losowania & parametry próby (4 kolumny na lg) */}
          <div className={`lg:col-span-4 ${mobileViewMode === 'controls' ? 'block' : 'hidden lg:block'}`}>
            <CltControls
              population={population}
              onChangePopulation={handleChangePopulation}
              sampleSizeN={sampleSizeN}
              onChangeSampleSizeN={handleChangeSampleSizeN}
              displaySettings={displaySettings}
              onUpdateDisplaySettings={handleUpdateDisplaySettings}
              onSampleOne={handleSampleOne}
              onSampleBatch={handleSampleBatch}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onClearSamples={handleClearSamples}
              isAnimating={animationPhase !== 'idle' && animationPhase !== 'landing' && !isPlaying}
              kSamples={sampleMeans.length}
              meanOfMeans={cltStats.meanOfMeans}
              sdOfMeans={cltStats.sdOfMeans}
            />
          </div>

          {/* PRAWA STRONA: Wykresy animacji i estymacji (8 kolumn na lg) */}
          <div className={`lg:col-span-8 flex flex-col gap-5 ${mobileViewMode === 'chart' ? 'block' : 'hidden lg:block'}`}>
            <CltCanvas
              population={population}
              sampleSizeN={sampleSizeN}
              sampleMeans={sampleMeans}
              currentSample={currentSample}
              cltStats={cltStats}
              displaySettings={displaySettings}
              animationPhase={animationPhase}
              animationProgress={animationProgress}
              animatedPoints={animatedPoints}
              fallingPoints={fallingPoints}
              minX={minX}
              maxX={maxX}
            />

            {/* Quantitative Verification & Stats Summary */}
            <CltStatsSummary
              cltStats={cltStats}
              currentSample={currentSample}
              sampleSizeN={sampleSizeN}
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
