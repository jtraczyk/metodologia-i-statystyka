export type DistributionType = 'normal' | 'bimodal' | 'skewed' | 'uniform';

export interface DatasetConfig {
  id: string;
  name: string;
  color: {
    primary: string;       // e.g. #3b82f6
    light: string;         // e.g. rgba(59, 130, 246, 0.15)
    border: string;        // e.g. #2563eb
    accent: string;        // e.g. #1d4ed8
    text: string;          // e.g. text-blue-700
    badgeBg: string;       // e.g. bg-blue-50
    badgeBorder: string;   // e.g. border-blue-200
  };
  mean: number;            // Target mean (slider)
  sd: number;              // Target SD (slider)
  n: number;               // Sample size 100 to 500 (slider)
  distributionType: DistributionType;
  rawPoints: number[];
  jitterOffsets: number[]; // pre-computed jitter in [-1, 1]
}

export interface StatisticalSummary {
  n: number;
  targetMean: number;
  targetSD: number;
  sampleMean: number;
  sampleSD: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
  lowerWhisker: number;
  upperWhisker: number;
  outliers: number[];
  kde: { value: number; density: number }[];
}

export interface LayerSettings {
  showBoxPlot: boolean;
  showViolin: boolean;
  showPoints: boolean;
  showMeanMarker: boolean;
  pointOpacity: number;
  pointSize: number;
  jitterWidth: number;
  violinBandwidthMultiplier: number;
}
