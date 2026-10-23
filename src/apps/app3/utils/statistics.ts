import {
  DistributionConfig,
  HistogramBin,
  TheoreticalMoments,
  EmpiricalMoments,
  DistributionCalculations,
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

/**
 * Box-Muller transform for standard normal N(0, 1) random variate.
 */
export function randomStandardNormal(rng: () => number = Math.random): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Normal PDF standard formula: phi(u) = (1 / sqrt(2*pi)) * exp(-0.5 * u^2)
 */
const INV_SQRT_2PI = 0.3989422804014327;

export function standardNormalPdf(u: number): number {
  return INV_SQRT_2PI * Math.exp(-0.5 * u * u);
}

/**
 * Standard Normal CDF approximation (Hart's algorithm or erf approximation).
 */
export function standardNormalCdf(x: number): number {
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
  const d = INV_SQRT_2PI * Math.exp(-0.5 * x * x);
  const prob =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1.0 - prob : prob;
}

/**
 * Inverse standard normal CDF (quantile function) via Acklam's algorithm.
 */
export function standardNormalQuantile(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;

  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const q = p - 0.5;
  if (Math.abs(q) <= 0.42) {
    const r = q * q;
    return (
      (q * (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5])) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    );
  } else {
    const r = p < 0.5 ? p : 1.0 - p;
    const s = Math.sqrt(-Math.log(r));
    let x =
      (((((c[0] * s + c[1]) * s + c[2]) * s + c[3]) * s + c[4]) * s + c[5]) /
      ((((d[0] * s + d[1]) * s + d[2]) * s + d[3]) * s + 1.0);
    return p < 0.5 ? -x : x;
  }
}

/**
 * Sinh-Arcsinh (SAS) distribution parameters:
 * epsilon: controls skewness (asymmetry)
 * delta: controls kurtosis / tail weight
 */
export function getSasParameters(targetSkewness: number, targetExcessKurtosis: number) {
  // Map target skewness [-2, 2] to epsilon smoothly
  const epsilon = 0.55 * targetSkewness;

  // Map target excess kurtosis [-1.5, 3] to delta
  let delta = 1.0;
  if (targetExcessKurtosis >= 0) {
    // Leptokurtic: delta < 1
    delta = 1.0 / Math.sqrt(1.0 + 0.38 * targetExcessKurtosis);
  } else {
    // Platykurtic: delta > 1
    delta = 1.0 - 0.3 * targetExcessKurtosis;
  }

  // Pre-calculate moments of the raw SAS transformed variable z = sinh((asinh(U) + eps) / delta)
  // using Simpson's numerical integration with 200 nodes over [-7, 7]
  const nNodes = 200;
  const uMin = -7.0;
  const uMax = 7.0;
  const h = (uMax - uMin) / nNodes;

  let sum0 = 0;
  let sum1 = 0;
  let sum2 = 0;
  let sum3 = 0;
  let sum4 = 0;

  for (let i = 0; i <= nNodes; i++) {
    const u = uMin + i * h;
    const weight = i === 0 || i === nNodes ? 1 : i % 2 === 1 ? 4 : 2;
    const phi = standardNormalPdf(u) * (h / 3) * weight;

    // z(u) = sinh((asinh(u) + epsilon) / delta)
    const z = Math.sinh((Math.asinh(u) + epsilon) / delta);

    sum0 += phi;
    sum1 += z * phi;
  }

  const rawMean = sum1 / sum0;

  for (let i = 0; i <= nNodes; i++) {
    const u = uMin + i * h;
    const weight = i === 0 || i === nNodes ? 1 : i % 2 === 1 ? 4 : 2;
    const phi = standardNormalPdf(u) * (h / 3) * weight;

    const z = Math.sinh((Math.asinh(u) + epsilon) / delta);
    const diff = z - rawMean;
    sum2 += diff * diff * phi;
    sum3 += Math.pow(diff, 3) * phi;
    sum4 += Math.pow(diff, 4) * phi;
  }

  const rawVar = Math.max(1e-6, sum2 / sum0);
  const rawSd = Math.sqrt(rawVar);
  const actualSkewness = sum3 / sum0 / Math.pow(rawSd, 3);
  const actualExcessKurtosis = sum4 / sum0 / Math.pow(rawVar, 2) - 3.0;

  return {
    epsilon,
    delta,
    rawMean,
    rawSd,
    actualSkewness,
    actualExcessKurtosis,
  };
}

/**
 * Calculates the exact PDF value at position x for a distribution with target mean, SD, skewness, and kurtosis.
 */
export function evaluateDistributionPdf(
  x: number,
  targetMean: number,
  targetSD: number,
  epsilon: number,
  delta: number,
  rawMean: number,
  rawSd: number
): number {
  if (targetSD <= 0) return 0;

  // Scale and location to match targetMean and targetSD exactly:
  // X = xi + omega * z  =>  E[X] = xi + omega * rawMean = targetMean
  //                     =>  SD[X] = omega * rawSd = targetSD
  const omega = targetSD / rawSd;
  const xi = targetMean - omega * rawMean;

  const z = (x - xi) / omega;
  // If absolute z is extreme, PDF is effectively 0
  if (Math.abs(z) > 100) return 0;

  const asinhZ = Math.asinh(z);
  const theta = delta * asinhZ - epsilon;
  const u = Math.sinh(theta);

  // If u is too large, exp(-0.5*u^2) underflows to 0
  if (Math.abs(u) > 12) return 0;

  const dU_dZ = (delta * Math.cosh(theta)) / Math.sqrt(1.0 + z * z);
  const fZ = INV_SQRT_2PI * Math.exp(-0.5 * u * u) * dU_dZ;
  return fZ / omega;
}

/**
 * Generates synthetic points according to the target parameters.
 */
export function sampleFromDistribution(
  n: number,
  targetMean: number,
  targetSD: number,
  epsilon: number,
  delta: number,
  rawMean: number,
  rawSd: number,
  seedOrRng?: number | (() => number)
): number[] {
  const rng =
    typeof seedOrRng === 'function'
      ? seedOrRng
      : typeof seedOrRng === 'number'
      ? createMulberry32(seedOrRng)
      : Math.random;

  const omega = targetSD / rawSd;
  const xi = targetMean - omega * rawMean;

  const points: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const u = randomStandardNormal(rng);
    const z = Math.sinh((Math.asinh(u) + epsilon) / delta);
    points[i] = xi + omega * z;
  }

  return points;
}

/**
 * Finds the theoretical mode by performing golden section search on the PDF.
 */
function findTheoreticalMode(
  targetMean: number,
  targetSD: number,
  epsilon: number,
  delta: number,
  rawMean: number,
  rawSd: number
): number {
  if (Math.abs(epsilon) < 1e-4) {
    return targetMean;
  }

  // Bracket search around mean in the direction of opposite skewness
  // (mode moves in opposite direction of skewness tail)
  let a = targetMean - 3.0 * targetSD;
  let b = targetMean + 3.0 * targetSD;

  const phi = (1 + Math.sqrt(5)) / 2;
  const resphi = 2 - phi;

  let c = a + resphi * (b - a);
  let d = b - resphi * (b - a);
  let fc = evaluateDistributionPdf(c, targetMean, targetSD, epsilon, delta, rawMean, rawSd);
  let fd = evaluateDistributionPdf(d, targetMean, targetSD, epsilon, delta, rawMean, rawSd);

  for (let iter = 0; iter < 40; iter++) {
    if (fc > fd) {
      b = d;
      d = c;
      fd = fc;
      c = a + resphi * (b - a);
      fc = evaluateDistributionPdf(c, targetMean, targetSD, epsilon, delta, rawMean, rawSd);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = b - resphi * (b - a);
      fd = evaluateDistributionPdf(d, targetMean, targetSD, epsilon, delta, rawMean, rawSd);
    }
  }

  return (a + b) / 2;
}

/**
 * Computes complete theoretical moments and PDF curve for visualization.
 */
export function computeTheoreticalMoments(
  config: DistributionConfig,
  minX: number,
  maxX: number,
  stepCount = 180
): { theoretical: TheoreticalMoments; pdfPoints: { x: number; y: number }[] } {
  const { mean, sd, skewness, kurtosis } = config;
  const sas = getSasParameters(skewness, kurtosis);

  const omega = sd / sas.rawSd;
  const xi = mean - omega * sas.rawMean;

  // Theoretical median: at standard normal quantile 0.5 (u = 0)
  const zMed = Math.sinh(sas.epsilon / sas.delta);
  const theoreticalMedian = xi + omega * zMed;

  // Theoretical mode
  const theoreticalMode = findTheoreticalMode(
    mean,
    sd,
    sas.epsilon,
    sas.delta,
    sas.rawMean,
    sas.rawSd
  );

  // Theoretical Q1 and Q3 (using normal quantiles -0.67449 and +0.67449)
  const zQ1 = Math.sinh((Math.asinh(-0.67449) + sas.epsilon) / sas.delta);
  const zQ3 = Math.sinh((Math.asinh(0.67449) + sas.epsilon) / sas.delta);
  const q1 = xi + omega * zQ1;
  const q3 = xi + omega * zQ3;
  const iqr = q3 - q1;

  // Evaluate PDF across the requested range [minX, maxX]
  const pdfPoints: { x: number; y: number }[] = [];
  const dx = (maxX - minX) / (stepCount - 1);
  let peakDensity = 0;

  for (let i = 0; i < stepCount; i++) {
    const x = minX + i * dx;
    const y = evaluateDistributionPdf(x, mean, sd, sas.epsilon, sas.delta, sas.rawMean, sas.rawSd);
    if (y > peakDensity) peakDensity = y;
    pdfPoints.push({ x, y });
  }

  const theoretical: TheoreticalMoments = {
    mean,
    sd,
    variance: sd * sd,
    median: theoreticalMedian,
    mode: theoreticalMode,
    skewness: sas.actualSkewness,
    excessKurtosis: sas.actualExcessKurtosis,
    peakDensity,
    q1,
    q3,
    iqr,
  };

  return { theoretical, pdfPoints };
}

/**
 * Computes sample statistics and empirical histogram bins.
 */
export function computeEmpiricalMoments(
  sample: number[],
  minX: number,
  maxX: number,
  binCount = 20
): EmpiricalMoments {
  const n = sample.length;
  if (n === 0) {
    return {
      n: 0,
      sampleMean: 0,
      sampleSD: 0,
      sampleVariance: 0,
      sampleMedian: 0,
      sampleMode: 0,
      sampleSkewness: 0,
      sampleExcessKurtosis: 0,
      min: 0,
      max: 0,
      bins: [],
    };
  }

  const sorted = [...sample].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const sampleMean = sum / n;

  let sumSqDiff = 0;
  let sumCubeDiff = 0;
  let sumQuadDiff = 0;

  for (let i = 0; i < n; i++) {
    const d = sorted[i] - sampleMean;
    sumSqDiff += d * d;
    sumCubeDiff += d * d * d;
    sumQuadDiff += d * d * d * d;
  }

  const sampleVariance = n > 1 ? sumSqDiff / (n - 1) : 0;
  const sampleSD = Math.sqrt(sampleVariance);

  // Fisher-Pearson sample skewness g1
  let sampleSkewness = 0;
  if (n > 2 && sampleSD > 0) {
    const m3 = sumCubeDiff / n;
    const m2 = sumSqDiff / n;
    sampleSkewness = (Math.sqrt(n * (n - 1)) / (n - 2)) * (m3 / Math.pow(m2, 1.5));
  }

  // Fisher-Pearson sample excess kurtosis g2
  let sampleExcessKurtosis = 0;
  if (n > 3 && sampleVariance > 0) {
    const factor1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term1 = factor1 * (sumQuadDiff / Math.pow(sampleSD, 4));
    const term2 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    sampleExcessKurtosis = term1 - term2;
  }

  // Sample median
  const midIndex = Math.floor(n / 2);
  const sampleMedian = n % 2 === 0 ? (sorted[midIndex - 1] + sorted[midIndex]) / 2 : sorted[midIndex];

  // Compute histogram bins
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

  // Count points in bins
  for (let i = 0; i < n; i++) {
    const val = sorted[i];
    if (val < minX) {
      bins[0].count++;
    } else if (val >= maxX) {
      bins[binCount - 1].count++;
    } else {
      const idx = Math.min(binCount - 1, Math.max(0, Math.floor((val - minX) / binWidth)));
      bins[idx].count++;
    }
  }

  // Scale density so total area is 1
  let maxCount = -1;
  let modalBinIndex = 0;

  for (let i = 0; i < binCount; i++) {
    bins[i].density = bins[i].count / (n * binWidth);
    bins[i].percentage = (bins[i].count / n) * 100;
    if (bins[i].count > maxCount) {
      maxCount = bins[i].count;
      modalBinIndex = i;
    }
  }

  const sampleMode = bins[modalBinIndex].mid;

  return {
    n,
    sampleMean,
    sampleSD,
    sampleVariance,
    sampleMedian,
    sampleMode,
    sampleSkewness,
    sampleExcessKurtosis,
    min: sorted[0],
    max: sorted[n - 1],
    bins,
  };
}

/**
 * Calculates complete distribution models for display.
 */
export function computeDistributionCalculations(
  config: DistributionConfig,
  minX: number,
  maxX: number,
  binCount = 20
): DistributionCalculations {
  const { theoretical, pdfPoints } = computeTheoreticalMoments(config, minX, maxX);
  const empirical = computeEmpiricalMoments(config.rawSample, minX, maxX, binCount);

  return {
    config,
    theoretical,
    empirical,
    pdfPoints,
  };
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
