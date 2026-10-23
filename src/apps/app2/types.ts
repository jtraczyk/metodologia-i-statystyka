export type PopulationType = 'normal' | 'uniform' | 'skewed' | 'bimodal';

export interface PopulationConfig {
  type: PopulationType;
  name: string;
  mean: number;       // μ (populacyjna średnia)
  sd: number;         // σ (populacyjne odchylenie standardowe)
  skewness?: number;  // populacyjna skośność
  kurtosis?: number;  // populacyjna kurtoza
}

export interface SampleItem {
  id: number;
  values: number[];
  mean: number;
  sd: number;
  timestamp: number;
}

export interface AnimationPoint {
  id: number;
  value: number;
  currentX: number;
  currentY: number;
  opacity: number;
}

export interface FallingPoint {
  id: number;
  value: number;
  x: number;
  y: number;
  opacity: number;
  targetY?: number;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  mid: number;
  count: number;
  density: number;
  percentage: number;
}

export interface CltStats {
  kSamples: number;          // K: liczba pobranych prób
  sampleSizeN: number;       // n: liczebność pojedynczej próby
  populationMean: number;    // μ
  populationSD: number;      // σ
  theoreticalSE: number;     // SE = σ / sqrt(n)
  meanOfMeans: number;       // x̄̄ = średnia ze średnich
  sdOfMeans: number;         // s_x̄ = empiryczne odchylenie średnich
  minMean: number;
  maxMean: number;
  skewnessOfMeans: number;   // g1 średnich
  kurtosisOfMeans: number;   // g2 średnich
  bins: HistogramBin[];
}

export interface StackedDot {
  id: number;
  value: number;
  x: number;
  y: number;
  r: number;
  isLatest?: boolean;
}

export interface CltDisplaySettings {
  showTheoreticalCurve: boolean;
  showMeanLine: boolean;
  showStandardErrorBands: boolean;
  showIndividualPoints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sampleN: number;
  populationType: PopulationType;
  populationMean: number;
  populationSD: number;
}
