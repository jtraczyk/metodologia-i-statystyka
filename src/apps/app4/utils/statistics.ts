import {
  PopulationType,
  HistogramBin,
  CltStats,
  SampleItem,
  CiCoverageStats,
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

// ============================================================================
// STUDENT'S T DISTRIBUTION & EXACT P-VALUE / CONFIDENCE INTERVAL MATH
// ============================================================================

/**
 * High-precision Lanczos approximation for log Gamma(x).
 */
export function logGamma(x: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    a += p[i] / (x + i + 1);
  }
  const t = x + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Continued fraction helper for regularized incomplete beta function.
 */
function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 1e-14;
  const fpmin = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;

    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < epsilon) break;
  }
  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b).
 */
export function betaIncomplete(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  } else {
    return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
  }
}

/**
 * Cumulative distribution function of Student's t-distribution with df degrees of freedom.
 */
export function studentTCdf(t: number, df: number): number {
  if (df <= 0) return 0.5;
  if (t === 0) return 0.5;
  const x = df / (df + t * t);
  const ib = betaIncomplete(x, df / 2, 0.5);
  return t > 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

/**
 * Probability density function of Student's t-distribution.
 */
export function studentTPdf(t: number, df: number): number {
  if (df <= 0) return 0;
  const coef = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) / Math.sqrt(Math.PI * df);
  return coef * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
}

/**
 * Inverse standard normal CDF (probit approximation).
 */
function standardNormalInv(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;
  if (p === 0.5) return 0;

  // Abramowitz & Stegun rational approximation
  const q = p < 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(q));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  const num = c0 + t * (c1 + t * c2);
  const den = 1 + t * (d1 + t * (d2 + t * d3));
  const z = t - num / den;
  return p < 0.5 ? -z : z;
}

/**
 * Critical value t_crit for Student's t-distribution:
 * Finds t such that P(T <= t) = p (e.g. p = 0.975 for two-tailed 95% CI).
 */
export function studentTInv(p: number, df: number): number {
  if (df <= 0) return 1.96;
  if (p <= 0.5) {
    if (p === 0.5) return 0;
    return -studentTInv(1 - p, df);
  }
  if (p >= 1) return 20;

  // Cornish-Fisher expansion based on normal quantile
  const z = standardNormalInv(p);
  const z2 = z * z;
  const z3 = z2 * z;
  const z5 = z3 * z2;

  let t =
    z +
    (z3 + z) / (4 * df) +
    (5 * z5 + 16 * z3 + 3 * z) / (96 * df * df) +
    (3 * z5 * z2 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df * df * df);

  // Refine using 2 Newton-Raphson iterations for 10+ digits of precision
  for (let i = 0; i < 3; i++) {
    const cdfVal = studentTCdf(t, df);
    const pdfVal = studentTPdf(t, df);
    if (pdfVal <= 1e-12) break;
    const diff = cdfVal - p;
    t -= diff / pdfVal;
  }

  return Math.max(0.01, t);
}

/**
 * Calculates exact two-tailed p-value for Student's t-test: H0: mu = mu0.
 */
export function calculatePValue(tStat: number, df: number): number {
  if (df <= 0 || isNaN(tStat)) return 1.0;
  const absT = Math.abs(tStat);
  if (absT === 0) return 1.0;
  const x = df / (df + absT * absT);
  const p = betaIncomplete(x, df / 2, 0.5);
  return Math.max(0, Math.min(1, p));
}

/**
 * Calculates complete confidence interval, p-value, and test statistics for a drawn sample.
 */
export function computeSampleItem(
  values: number[],
  populationMean: number,
  confidenceLevel = 0.95,
  id = Date.now()
): SampleItem {
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = n > 0 ? sum / n : 0;

  let sd = 0;
  if (n > 1) {
    const sumSqDiff = values.reduce((a, b) => a + (b - mean) * (b - mean), 0);
    sd = Math.sqrt(sumSqDiff / (n - 1));
  }

  const se = n > 0 ? sd / Math.sqrt(n) : 0;
  const df = Math.max(1, n - 1);
  const alpha = 1 - confidenceLevel;
  const tCrit = studentTInv(1 - alpha / 2, df);
  const marginOfError = tCrit * se;

  const ciLower = mean - marginOfError;
  const ciUpper = mean + marginOfError;

  // Does the confidence interval contain the true population mean?
  const containsMu = populationMean >= ciLower && populationMean <= ciUpper;

  // One-sample t-statistic against true population mean: t = (mean - mu) / se
  const tStat = se > 0 ? (mean - populationMean) / se : 0;
  const pValue = calculatePValue(tStat, df);
  const isSignificant = pValue < alpha;

  return {
    id,
    values,
    mean,
    sd,
    se,
    n,
    confidenceLevel,
    tCrit,
    marginOfError,
    ciLower,
    ciUpper,
    containsMu,
    tStat,
    pValue,
    isSignificant,
    timestamp: Date.now(),
  };
}

/**
 * Computes aggregate coverage statistics for all confidence intervals drawn so far.
 */
export function computeCiCoverageStats(
  samples: SampleItem[],
  populationMean: number,
  populationSD: number,
  sampleSizeN: number,
  confidenceLevel = 0.95
): CiCoverageStats {
  const totalCount = samples.length;
  const df = Math.max(1, sampleSizeN - 1);
  const alpha = 1 - confidenceLevel;
  const tCrit = studentTInv(1 - alpha / 2, df);
  const theoreticalSE = sampleSizeN > 0 ? populationSD / Math.sqrt(sampleSizeN) : 0;
  const theoreticalCiWidth = 2 * tCrit * theoreticalSE;

  if (totalCount === 0) {
    return {
      totalCount: 0,
      coveredCount: 0,
      missedCount: 0,
      coverageRate: 0,
      missedLeftCount: 0,
      missedRightCount: 0,
      expectedConfidenceLevel: confidenceLevel,
      significantCount: 0,
      significantRate: 0,
      meanPValue: 0,
      meanCiWidth: 0,
      theoreticalCiWidth,
      recentSamples: [],
    };
  }

  let coveredCount = 0;
  let missedCount = 0;
  let missedLeftCount = 0;
  let missedRightCount = 0;
  let significantCount = 0;
  let pValueSum = 0;
  let widthSum = 0;

  for (let i = 0; i < totalCount; i++) {
    const s = samples[i];
    const width = s.ciUpper - s.ciLower;
    widthSum += width;
    pValueSum += s.pValue;

    if (s.containsMu) {
      coveredCount++;
    } else {
      missedCount++;
      if (s.ciUpper < populationMean) {
        missedLeftCount++;
      } else {
        missedRightCount++;
      }
    }

    if (s.pValue < alpha) {
      significantCount++;
    }
  }

  const coverageRate = coveredCount / totalCount;
  const significantRate = significantCount / totalCount;
  const meanPValue = pValueSum / totalCount;
  const meanCiWidth = widthSum / totalCount;

  return {
    totalCount,
    coveredCount,
    missedCount,
    coverageRate,
    missedLeftCount,
    missedRightCount,
    expectedConfidenceLevel: confidenceLevel,
    significantCount,
    significantRate,
    meanPValue,
    meanCiWidth,
    theoreticalCiWidth,
    recentSamples: samples.slice(-30),
  };
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
