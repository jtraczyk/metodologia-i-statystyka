import {
  PopulationType,
  HistogramBin,
  CltStats,
} from '../types';

/**
 * 32-bit PRNG (Mulberry32) for reproducible seeded sampling.
 */
export function createMulberry32(seed: number): () => number {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INV_SQRT_2PI = 0.3989422804014327;

/**
 * Standard normal density phi(u) = (1/sqrt(2pi)) * exp(-0.5 * u^2)
 */
export function standardNormalPdf(u: number): number {
  return INV_SQRT_2PI * Math.exp(-0.5 * u * u);
}

/**
 * Normal PDF with mean mu and standard deviation sigma.
 */
export function normalPdf(x: number, mean: number, sd: number): number {
  if (sd <= 0) return 0;
  const u = (x - mean) / sd;
  return (1 / sd) * standardNormalPdf(u);
}

/**
 * Box-Muller transform for standard normal variate N(0, 1).
 */
export function randomStandardNormal(rng: () => number = Math.random): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Generates a single random variate from the chosen population type,
 * guaranteed to have expected value mu and standard deviation sigma.
 */
export function sampleOneFromPopulation(
  type: PopulationType,
  mean: number,
  sd: number,
  rng: () => number = Math.random
): number {
  if (sd <= 0) return mean;

  switch (type) {
    case 'normal': {
      return mean + sd * randomStandardNormal(rng);
    }
    case 'uniform': {
      // Uniform distribution U[a, b] with mean = (a+b)/2 and Var = (b-a)^2 / 12 = sd^2
      // Half-width w = sqrt(3) * sd
      const halfWidth = Math.sqrt(3) * sd;
      const u = rng(); // [0, 1)
      return mean - halfWidth + 2 * halfWidth * u;
    }
    case 'skewed': {
      // Right-skewed distribution (shifted exponential):
      // Exp(lambda = 1/sd) has mean sd and variance sd^2.
      // Shift by (mean - sd) gives E[X] = mean and Var[X] = sd^2, skewness = 2.
      let u = rng();
      while (u <= 1e-10) u = rng();
      const expVal = -Math.log(u) * sd; // Exp(1/sd)
      return mean - sd + expVal;
    }
    case 'bimodal': {
      // Equal mixture of two Gaussians:
      // Half observations around mu - d, half around mu + d.
      // Var = d^2 + subSd^2. Setting d = sqrt(0.75)*sd, subSd = 0.5*sd gives total Var = sd^2.
      const d = Math.sqrt(0.75) * sd;
      const subSd = 0.5 * sd;
      const component = rng() < 0.5 ? -1 : 1;
      const center = mean + component * d;
      return center + subSd * randomStandardNormal(rng);
    }
  }
}

/**
 * Samples N observations from the specified population.
 */
export function sampleFromPopulation(
  type: PopulationType,
  mean: number,
  sd: number,
  n: number,
  rng: () => number = Math.random
): number[] {
  const result: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = sampleOneFromPopulation(type, mean, sd, rng);
  }
  return result;
}

/**
 * Calculates theoretical PDF of the population at coordinate x.
 */
export function evaluatePopulationPdf(
  x: number,
  type: PopulationType,
  mean: number,
  sd: number
): number {
  if (sd <= 0) return 0;

  switch (type) {
    case 'normal':
      return normalPdf(x, mean, sd);

    case 'uniform': {
      const halfWidth = Math.sqrt(3) * sd;
      const a = mean - halfWidth;
      const b = mean + halfWidth;
      if (x >= a && x <= b) {
        return 1 / (2 * halfWidth);
      }
      return 0;
    }

    case 'skewed': {
      const shift = mean - sd;
      if (x < shift) return 0;
      const lambda = 1 / sd;
      return lambda * Math.exp(-lambda * (x - shift));
    }

    case 'bimodal': {
      const d = Math.sqrt(0.75) * sd;
      const subSd = 0.5 * sd;
      return (
        0.5 * normalPdf(x, mean - d, subSd) +
        0.5 * normalPdf(x, mean + d, subSd)
      );
    }
  }
}

/**
 * Generates coordinate points for drawing the theoretical population curve.
 */
export function getPopulationPdfCurve(
  type: PopulationType,
  mean: number,
  sd: number,
  minX: number,
  maxX: number,
  stepCount = 180
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = (maxX - minX) / (stepCount - 1);

  for (let i = 0; i < stepCount; i++) {
    const x = minX + i * dx;
    const y = evaluatePopulationPdf(x, type, mean, sd);
    points.push({ x, y });
  }

  return points;
}

/**
 * Generates coordinate points for drawing the theoretical sampling distribution
 * (Gaussian bell according to CLT: N(mu, SE^2) where SE = sigma / sqrt(n)).
 */
export function getTheoreticalCltCurve(
  mean: number,
  se: number,
  minX: number,
  maxX: number,
  stepCount = 180
): { x: number; y: number }[] {
  if (se <= 0) return [];
  const points: { x: number; y: number }[] = [];
  const dx = (maxX - minX) / (stepCount - 1);

  for (let i = 0; i < stepCount; i++) {
    const x = minX + i * dx;
    const y = normalPdf(x, mean, se);
    points.push({ x, y });
  }

  return points;
}

/**
 * Computes sample statistics and histogram bins for the sampled means.
 */
export function computeCltStats(
  sampleMeans: number[],
  populationMean: number,
  populationSD: number,
  sampleSizeN: number,
  minX: number,
  maxX: number,
  binCount = 28
): CltStats {
  const theoreticalSE = sampleSizeN > 0 ? populationSD / Math.sqrt(sampleSizeN) : 0;
  const k = sampleMeans.length;

  if (k === 0) {
    return {
      kSamples: 0,
      sampleSizeN,
      populationMean,
      populationSD,
      theoreticalSE,
      meanOfMeans: 0,
      sdOfMeans: 0,
      minMean: 0,
      maxMean: 0,
      skewnessOfMeans: 0,
      kurtosisOfMeans: 0,
      bins: [],
    };
  }

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < k; i++) {
    const v = sampleMeans[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const meanOfMeans = sum / k;

  let sumSqDiff = 0;
  let sumCubeDiff = 0;
  let sumQuadDiff = 0;

  for (let i = 0; i < k; i++) {
    const d = sampleMeans[i] - meanOfMeans;
    sumSqDiff += d * d;
    sumCubeDiff += d * d * d;
    sumQuadDiff += d * d * d * d;
  }

  const variance = k > 1 ? sumSqDiff / (k - 1) : 0;
  const sdOfMeans = Math.sqrt(variance);

  // Fisher-Pearson sample skewness g1
  let skewnessOfMeans = 0;
  if (k > 2 && sdOfMeans > 0) {
    const m3 = sumCubeDiff / k;
    const m2 = sumSqDiff / k;
    skewnessOfMeans = (Math.sqrt(k * (k - 1)) / (k - 2)) * (m3 / Math.pow(m2, 1.5));
  }

  // Fisher-Pearson sample excess kurtosis g2
  let kurtosisOfMeans = 0;
  if (k > 3 && variance > 0) {
    const factor1 = (k * (k + 1)) / ((k - 1) * (k - 2) * (k - 3));
    const term1 = factor1 * (sumQuadDiff / Math.pow(sdOfMeans, 4));
    const term2 = (3 * Math.pow(k - 1, 2)) / ((k - 2) * (k - 3));
    kurtosisOfMeans = term1 - term2;
  }

  // Histogram calculation
  const binWidth = (maxX - minX) / binCount;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const x0 = minX + i * binWidth;
    const x1 = x0 + binWidth;
    bins.push({
      x0,
      x1,
      mid: (x0 + x1) / 2,
      count: 0,
      density: 0,
      percentage: 0,
    });
  }

  for (let i = 0; i < k; i++) {
    const v = sampleMeans[i];
    if (v < minX) {
      bins[0].count++;
    } else if (v >= maxX) {
      bins[binCount - 1].count++;
    } else {
      const idx = Math.min(binCount - 1, Math.max(0, Math.floor((v - minX) / binWidth)));
      bins[idx].count++;
    }
  }

  for (let i = 0; i < binCount; i++) {
    bins[i].density = bins[i].count / (k * binWidth);
    bins[i].percentage = (bins[i].count / k) * 100;
  }

  return {
    kSamples: k,
    sampleSizeN,
    populationMean,
    populationSD,
    theoreticalSE,
    meanOfMeans,
    sdOfMeans,
    minMean: min,
    maxMean: max,
    skewnessOfMeans,
    kurtosisOfMeans,
    bins,
  };
}

/**
 * Calculates mean and sample SD of a single array of numbers.
 */
export function getSampleMeanAndSD(values: number[]): { mean: number; sd: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, sd: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  if (n <= 1) return { mean, sd: 0 };
  const sumSqDiff = values.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  const sd = Math.sqrt(sumSqDiff / (n - 1));
  return { mean, sd };
}

/**
 * Formats numbers for clean scientific Polish display.
 */
export function formatNum(num: number, decimals = 2): string {
  if (isNaN(num) || !isFinite(num)) return '–';
  return num.toLocaleString('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
