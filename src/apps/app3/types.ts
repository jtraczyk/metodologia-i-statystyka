export interface DistributionColor {
  id: string;
  name: string;
  primary: string;       // e.g. #009EE0
  secondary: string;     // e.g. #0284c7
  light: string;         // e.g. rgba(0, 158, 224, 0.15)
  fillGradientStart: string;
  fillGradientEnd: string;
  border: string;
  accent: string;
  text: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface DistributionConfig {
  id: 'dist-a' | 'dist-b' | 'dist-c';
  name: string;
  enabled: boolean;
  color: DistributionColor;
  mean: number;          // Target mean (μ)
  sd: number;            // Target standard deviation (σ)
  skewness: number;      // Target skewness (γ₁)
  kurtosis: number;      // Target excess kurtosis (γ₂)
  sampleN: number;       // Sample size (N) for empirical data
  showDistribution: boolean;
  showHistogram: boolean;
  rawSample: number[];   // Sampled empirical values
}

export interface HistogramBin {
  x0: number;
  x1: number;
  mid: number;
  count: number;
  density: number;       // Scaled density such that sum(density * dx) = 1
  percentage: number;
}

export interface TheoreticalMoments {
  mean: number;
  sd: number;
  variance: number;
  median: number;
  mode: number;
  skewness: number;
  excessKurtosis: number;
  peakDensity: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface EmpiricalMoments {
  n: number;
  sampleMean: number;
  sampleSD: number;
  sampleVariance: number;
  sampleMedian: number;
  sampleMode: number;
  sampleSkewness: number;     // Fisher-Pearson g1
  sampleExcessKurtosis: number; // Fisher-Pearson g2
  min: number;
  max: number;
  bins: HistogramBin[];
}

export interface DistributionCalculations {
  config: DistributionConfig;
  theoretical: TheoreticalMoments;
  empirical: EmpiricalMoments;
  pdfPoints: { x: number; y: number }[];
}

export interface DisplaySettings {
  comparisonMode: 'single' | 'dual' | 'triple';
  showMean: boolean;
  showMedian: boolean;
  showMode: boolean;
  showHistogram: boolean;
  showSigmaBands: boolean;
  showEmpiricalValues: boolean;
  showGrid: boolean;
  binCount: number;
  lockAxes: boolean;              // Fixed scale for X and Y to clearly show shifting and spreading
  showZScore: boolean;            // Whether Z-score / probability region is highlighted
  zTargetX: number;               // Target value X for standardizing to z
  zProbMode: 'lessThan' | 'greaterThan' | 'twoTailed' | 'between';
  zTargetX2: number;              // Second value X2 when mode is 'between'
  xAxisLabel?: string;            // Custom editable X-axis label (default: 'Wartość cechy (x)')
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  comparisonMode: 'single' | 'dual' | 'triple';
  distA: Partial<DistributionConfig>;
  distB?: Partial<DistributionConfig>;
  distC?: Partial<DistributionConfig>;
  displaySettings?: Partial<DisplaySettings>;
}
