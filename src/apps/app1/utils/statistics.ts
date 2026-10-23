import { DistributionType, StatisticalSummary } from '../types';

/**
 * High-quality 32-bit PRNG (Mulberry32).
 * Returns a pseudorandom number generator function returning [0, 1).
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
 * Standard Box-Muller transform for generating normally distributed values.
 * Uses a provided RNG generator or defaults to Math.random.
 */
function randomNormal(mean = 0, sd = 1, rng: () => number = Math.random): number {
  let u1 = 0;
  let u2 = 0;
  // Ensure non-zero to avoid log(0)
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * sd;
}

/**
 * Generates synthetic points according to the target parameters and distribution type.
 * Supports an optional seed (or custom RNG) for exact reproducible sampling.
 */
export function generateDatasetPoints(
  n: number,
  targetMean: number,
  targetSD: number,
  distribution: DistributionType,
  seedOrRng?: number | (() => number)
): { points: number[]; jitter: number[] } {
  // Clamp n between 100 and 500 as requested
  const clampedN = Math.max(100, Math.min(500, Math.round(n)));
  const points: number[] = [];
  const jitter: number[] = [];

  const rng: () => number =
    typeof seedOrRng === 'function'
      ? seedOrRng
      : typeof seedOrRng === 'number'
      ? createMulberry32(seedOrRng)
      : Math.random;

  for (let i = 0; i < clampedN; i++) {
    let val = 0;

    switch (distribution) {
      case 'normal':
        val = randomNormal(targetMean, targetSD, rng);
        break;

      case 'bimodal': {
        // Two normal distributions separated to show bimodal density
        const isFirstMode = rng() < 0.5;
        const shift = targetSD * 0.9;
        const subSD = targetSD * 0.55;
        if (isFirstMode) {
          val = randomNormal(targetMean - shift, subSD, rng);
        } else {
          val = randomNormal(targetMean + shift, subSD, rng);
        }
        break;
      }

      case 'skewed': {
        // Right-skewed distribution using exponential/log-normal approximation
        const exp = -Math.log(Math.max(1e-10, rng()));
        // Exponential mean is 1, SD is 1. Shift and scale:
        val = targetMean + (exp - 1) * targetSD;
        break;
      }

      case 'uniform': {
        // Uniform distribution centered at targetMean with variance targetSD^2
        const halfWidth = targetSD * Math.sqrt(3);
        val = targetMean + (rng() * 2 - 1) * halfWidth;
        break;
      }

      default:
        val = randomNormal(targetMean, targetSD, rng);
    }

    points.push(val);
    // Random jitter between -1 and 1
    const j1 = rng();
    const j2 = rng();
    jitter.push((j1 + j2) - 1);
  }

  return { points, jitter };
}

/**
 * Computes percentile using the Type 7 / R / NumPy standard interpolation.
 */
export function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[sorted.length - 1];

  const index = p * (sorted.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const weight = index - lowerIndex;

  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }

  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

/**
 * Computes all statistical summaries, Tukey whiskers, outliers, and KDE curve.
 */
export function computeStatisticalSummary(
  points: number[],
  targetMean: number,
  targetSD: number,
  bandwidthMultiplier = 1.0
): StatisticalSummary {
  const n = points.length;
  if (n === 0) {
    return {
      n: 0,
      targetMean,
      targetSD,
      sampleMean: 0,
      sampleSD: 0,
      median: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      min: 0,
      max: 0,
      lowerWhisker: 0,
      upperWhisker: 0,
      outliers: [],
      kde: [],
    };
  }

  const sorted = [...points].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const sampleMean = sum / n;

  // Sample variance with Bessel's correction (n - 1)
  const sumSqDiff = sorted.reduce((acc, val) => acc + (val - sampleMean) ** 2, 0);
  const sampleSD = n > 1 ? Math.sqrt(sumSqDiff / (n - 1)) : 0;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const q1 = computePercentile(sorted, 0.25);
  const median = computePercentile(sorted, 0.5);
  const q3 = computePercentile(sorted, 0.75);
  const iqr = q3 - q1;

  // Tukey 1.5 * IQR rule for whiskers
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  // Actual data points within fences
  const withinFences = sorted.filter((val) => val >= lowerFence && val <= upperFence);
  const lowerWhisker = withinFences.length > 0 ? withinFences[0] : q1;
  const upperWhisker = withinFences.length > 0 ? withinFences[withinFences.length - 1] : q3;

  // Outliers strictly outside whiskers
  const outliers = sorted.filter((val) => val < lowerWhisker || val > upperWhisker);

  // Kernel Density Estimation (KDE) with Gaussian kernel
  // Silverman's Rule of Thumb for bandwidth
  const iqrSpread = iqr > 0 ? iqr / 1.34 : sampleSD;
  const spread = Math.min(sampleSD || 1, iqrSpread || 1) || 1;
  const baseBandwidth = 0.9 * spread * Math.pow(n, -0.2);
  const bandwidth = Math.max(0.1, baseBandwidth * bandwidthMultiplier);

  // Evaluate KDE across [min - 1.5*bw, max + 1.5*bw] over 80 points
  const kdeSteps = 80;
  const kdeMin = min - 1.5 * bandwidth;
  const kdeMax = max + 1.5 * bandwidth;
  const step = (kdeMax - kdeMin) / (kdeSteps - 1);

  const invSqrt2Pi = 1 / Math.sqrt(2 * Math.PI);
  const kde: { value: number; density: number }[] = [];
  let maxDensity = 0;

  for (let i = 0; i < kdeSteps; i++) {
    const evalPoint = kdeMin + i * step;
    let sumKernel = 0;

    for (let j = 0; j < n; j++) {
      const u = (evalPoint - sorted[j]) / bandwidth;
      const kernel = invSqrt2Pi * Math.exp(-0.5 * u * u);
      sumKernel += kernel;
    }

    const density = sumKernel / (n * bandwidth);
    if (density > maxDensity) maxDensity = density;
    kde.push({ value: evalPoint, density });
  }

  // Normalize density to [0, 1] relative to max density for easy SVG rendering
  const normalizedKde = kde.map((point) => ({
    value: point.value,
    density: maxDensity > 0 ? point.density / maxDensity : 0,
  }));

  return {
    n,
    targetMean,
    targetSD,
    sampleMean,
    sampleSD,
    median,
    q1,
    q3,
    iqr,
    min,
    max,
    lowerWhisker,
    upperWhisker,
    outliers,
    kde: normalizedKde,
  };
}

/**
 * Format numbers cleanly for UI display (e.g., 2 decimal places).
 */
export function formatStat(num: number, decimals = 2): string {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
