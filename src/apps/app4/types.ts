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
  se: number;
  n: number;
  confidenceLevel: number; // e.g. 0.95
  tCrit: number;
  marginOfError: number;
  ciLower: number;
  ciUpper: number;
  containsMu: boolean;    // czy przedział pokrywa prawdziwe μ
  tStat: number;          // t = (mean - mu) / se
  pValue: number;         // wartość p dla testu H0: μ = μ_populacji
  isSignificant: boolean; // czy p < alpha (np. p < 0.05)
  timestamp: number;
}

export interface AnimationPoint {
  id: number;
  value: number;
  currentX: number;
  currentY: number;
  startX?: number;
  startY?: number;
  opacity: number;
  color?: string;
}

export interface FallingPoint {
  id: number;
  value: number;
  x: number;
  y: number;
  opacity: number;
  targetY?: number;
  // Individual point dropping attributes
  color?: string;
  radius?: number;
  isMeanDot?: boolean;
  // Confidence Interval properties for animated drop
  ciLower?: number;
  ciUpper?: number;
  xLower?: number;
  xUpper?: number;
  containsMu?: boolean;
  pValue?: number;
  stage?: 'to_ci' | 'to_hist';
}

export interface HistogramBin {
  x0: number;
  x1: number;
  mid: number;
  count: number;
  density: number;
  percentage: number;
}

export interface CiCoverageStats {
  totalCount: number;             // K: łączna liczba wyznaczonych przedziałów
  coveredCount: number;           // liczba przedziałów zawierających μ
  missedCount: number;            // liczba przedziałów NIEzawierających μ
  coverageRate: number;           // empiryczny odsetek pokrycia (np. 0.948)
  missedLeftCount: number;        // przedziały całkowicie poniżej μ (ciUpper < μ)
  missedRightCount: number;       // przedziały całkowicie powyżej μ (ciLower > μ)
  expectedConfidenceLevel: number;// oczekiwany poziom ufności (np. 0.95)
  significantCount: number;       // liczba prób z p < alpha
  significantRate: number;        // odsetek prób z p < alpha
  meanPValue: number;             // średnia wartość p
  meanCiWidth: number;            // średnia empiryczna szerokość przedziałów
  theoreticalCiWidth: number;     // oczekiwana teoretyczna szerokość przedziału
  recentSamples: SampleItem[];    // ostatnie próbki do wyświetlenia
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

export type LowerViewMode = 'waterfall' | 'distribution' | 'pvalues';

export interface CltDisplaySettings {
  showTheoreticalCurve: boolean;
  showMeanLine: boolean;
  showStandardErrorBands: boolean;
  showIndividualPoints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  confidenceLevel: number; // np. 0.95 (95% CI)
  lowerViewMode: LowerViewMode;
  maxVisibleCisInWaterfall: number;
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sampleN: number;
  confidenceLevel?: number;
  populationType: PopulationType;
  populationMean: number;
  populationSD: number;
}
