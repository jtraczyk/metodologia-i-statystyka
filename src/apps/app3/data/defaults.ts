import {
  DistributionConfig,
  DistributionColor,
  DisplaySettings,
  PresetScenario,
} from '../types';
import {
  getSasParameters,
  sampleFromDistribution,
} from '../utils/statistics';

export const DISTRIBUTION_COLORS: DistributionColor[] = [
  {
    id: 'dist-a-color',
    name: 'Błękit SWPS',
    primary: '#009EE0',
    secondary: '#0284c7',
    light: 'rgba(0, 158, 224, 0.16)',
    fillGradientStart: 'rgba(0, 158, 224, 0.35)',
    fillGradientEnd: 'rgba(0, 158, 224, 0.03)',
    border: '#007BB0',
    accent: '#004F70',
    text: 'text-sky-700',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-300',
  },
  {
    id: 'dist-b-color',
    name: 'Bursztyn SWPS',
    primary: '#F29400',
    secondary: '#ea580c',
    light: 'rgba(242, 148, 0, 0.16)',
    fillGradientStart: 'rgba(242, 148, 0, 0.35)',
    fillGradientEnd: 'rgba(242, 148, 0, 0.03)',
    border: '#D37E00',
    accent: '#8C5400',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
  },
  {
    id: 'dist-c-color',
    name: 'Fiolet / Purpura',
    primary: '#7C3AED',
    secondary: '#6D28D9',
    light: 'rgba(124, 58, 237, 0.16)',
    fillGradientStart: 'rgba(124, 58, 237, 0.35)',
    fillGradientEnd: 'rgba(124, 58, 237, 0.03)',
    border: '#6D28D9',
    accent: '#4C1D95',
    text: 'text-purple-700',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-300',
  },
];

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  comparisonMode: 'single',
  showMean: true,
  showMedian: true,
  showMode: true,
  showHistogram: true,
  showSigmaBands: false,
  showEmpiricalValues: true,
  showGrid: true,
  binCount: 20,
  lockAxes: true,
  showZScore: false,
  zTargetX: 60,
  zProbMode: 'lessThan',
  zTargetX2: 40,
  xAxisLabel: 'Wartość cechy (x)',
};

export function createInitialDistribution(
  id: 'dist-a' | 'dist-b' | 'dist-c',
  name: string,
  mean: number,
  sd: number,
  skewness = 0,
  kurtosis = 0,
  sampleN = 500,
  seed?: number
): DistributionConfig {
  const colorIndex = id === 'dist-a' ? 0 : id === 'dist-b' ? 1 : 2;
  const sas = getSasParameters(skewness, kurtosis);
  const sample = sampleFromDistribution(
    sampleN,
    mean,
    sd,
    sas.epsilon,
    sas.delta,
    sas.rawMean,
    sas.rawSd,
    seed
  );

  return {
    id,
    name,
    enabled: true,
    color: DISTRIBUTION_COLORS[colorIndex],
    mean,
    sd,
    skewness,
    kurtosis,
    sampleN,
    showDistribution: true,
    showHistogram: true,
    rawSample: sample,
  };
}

export function createInitialDistributions(seed = 42): {
  distA: DistributionConfig;
  distB: DistributionConfig;
  distC: DistributionConfig;
} {
  return {
    distA: createInitialDistribution('dist-a', 'Rozkład A', 50, 10, 0, 0, 500, seed),
    distB: createInitialDistribution('dist-b', 'Rozkład B', 65, 14, 0, 0, 500, seed + 1337),
    distC: createInitialDistribution('dist-c', 'Rozkład C', 50, 10, 0, 0, 500, seed + 2026),
  };
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'standard-normal',
    title: 'Standardowy rozkład normalny Z (μ = 0, σ = 1)',
    subtitle: 'Klasyczna standaryzacja z-score',
    description:
      'Wzorcowy rozkład Gaussa o średniej 0 i odchyleniu 1. Wszystkie miary tendencji centralnej (średnia, mediana, dominanta) idealnie się pokrywają w punkcie 0.',
    comparisonMode: 'single',
    distA: {
      mean: 0,
      sd: 1,
      skewness: 0,
      kurtosis: 0,
      sampleN: 500,
    },
    displaySettings: {
      showMean: true,
      showMedian: true,
      showMode: true,
      showHistogram: true,
      showSigmaBands: true,
    },
  },
  {
    id: 'iq-scale',
    title: 'Iloraz Inteligencji WAIS (μ = 100, σ = 15)',
    subtitle: 'Typowy rozkład psychometryczny',
    description:
      'Klasyczna skala testów inteligencji Wechslera. Około 68% populacji mieści się w przedziale 85–115 (średnia ± 1 odchylenie standardowe).',
    comparisonMode: 'single',
    distA: {
      mean: 100,
      sd: 15,
      skewness: 0,
      kurtosis: 0,
      sampleN: 600,
    },
    displaySettings: {
      showMean: true,
      showMedian: true,
      showMode: true,
      showHistogram: true,
      showSigmaBands: true,
    },
  },
  {
    id: 'positive-skew',
    title: 'Asymetria prawostronna (dodatnia): Mo < Mdn < M',
    subtitle: 'Np. zarobki w gospodarce, czas reakcji',
    description:
      'Wydłużony prawy ogon wartości skrajnych. Średnia arytmetyczna zostaje silnie "pociągnięta" w prawo przez wysokie wartości odstające. Dominanta (szczyt) znajduje się najbardziej na lewo, a mediana pośrodku.',
    comparisonMode: 'single',
    distA: {
      mean: 50,
      sd: 12,
      skewness: 1.2,
      kurtosis: 0.5,
      sampleN: 500,
    },
    displaySettings: {
      showMean: true,
      showMedian: true,
      showMode: true,
      showHistogram: true,
      showSigmaBands: false,
    },
  },
  {
    id: 'negative-skew',
    title: 'Asymetria lewostronna (ujemna): M < Mdn < Mo',
    subtitle: 'Np. wyniki bardzo łatwego egzaminu, wiek emerytalny',
    description:
      'Wydłużony lewy ogon niskich wyników. Średnia arytmetyczna jest mniejsza od mediany, a dominanta (najczęstszy wynik) osiąga najwyższą wartość.',
    comparisonMode: 'single',
    distA: {
      mean: 60,
      sd: 12,
      skewness: -1.2,
      kurtosis: 0.5,
      sampleN: 500,
    },
    displaySettings: {
      showMean: true,
      showMedian: true,
      showMode: true,
      showHistogram: true,
      showSigmaBands: false,
    },
  },
  {
    id: 'leptokurtic',
    title: 'Rozkład leptokurtyczny (γ₂ > 0)',
    subtitle: 'Smukły wierzchołek i grube ogony (fat tails)',
    description:
      'Wartości silnie skupione wokół średniej, z równoczesną wyższą szansą na pojawienie się rzadkich obserwacji skrajnych w ogonach niż w rozkładzie normalnym.',
    comparisonMode: 'single',
    distA: {
      mean: 50,
      sd: 10,
      skewness: 0,
      kurtosis: 2.2,
      sampleN: 600,
    },
    displaySettings: {
      showMean: true,
      showMedian: false,
      showMode: true,
      showHistogram: true,
    },
  },
  {
    id: 'platykurtic',
    title: 'Rozkład platykurtyczny (γ₂ < 0)',
    subtitle: 'Spłaszczony wierzchołek i lekkie ogony',
    description:
      'Rozkład jest bardziej płaski na szczycie niż rozkład normalny, a wartości są bardziej równomiernie rozproszone w środku przedziału.',
    comparisonMode: 'single',
    distA: {
      mean: 50,
      sd: 12,
      skewness: 0,
      kurtosis: -1.1,
      sampleN: 600,
    },
    displaySettings: {
      showMean: true,
      showMedian: false,
      showMode: true,
      showHistogram: true,
    },
  },
  {
    id: 'compare-means',
    title: 'Porównanie: Różne średnie (efekt przesunięcia)',
    subtitle: 'Rozkład A (μ = 40) vs Rozkład B (μ = 65), jednakowe σ = 10',
    description:
      'Demonstracja roli średniej: zmiana średniej arytmetycznej przesuwa krzywą wzdłuż osi X w lewo lub w prawo, nie zmieniając jej kształtu ani rozpiętości.',
    comparisonMode: 'dual',
    distA: {
      mean: 40,
      sd: 10,
      skewness: 0,
      kurtosis: 0,
      sampleN: 400,
    },
    distB: {
      mean: 65,
      sd: 10,
      skewness: 0,
      kurtosis: 0,
      sampleN: 400,
    },
    displaySettings: {
      showMean: true,
      showMedian: false,
      showMode: false,
      showHistogram: true,
    },
  },
  {
    id: 'compare-sds',
    title: 'Porównanie: Różne odchylenia standardowe (efekt rozproszenia)',
    subtitle: 'Rozkład A (wąski σ = 6) vs Rozkład B (szeroki σ = 16), ta sama średnia',
    description:
      'Mniejsze odchylenie standardowe skutkuje wysokim i wąskim szczytem (mniejsza zmienność). Większe odchylenie daje szeroką i niską krzywą (większa różnorodność wyników).',
    comparisonMode: 'dual',
    distA: {
      mean: 50,
      sd: 6,
      skewness: 0,
      kurtosis: 0,
      sampleN: 450,
    },
    distB: {
      mean: 50,
      sd: 16,
      skewness: 0,
      kurtosis: 0,
      sampleN: 450,
    },
    displaySettings: {
      showMean: true,
      showMedian: false,
      showMode: false,
      showHistogram: true,
    },
  },
  {
    id: 'compare-skewed-vs-normal',
    title: 'Porównanie: Rozkład symetryczny vs Asymetryczny',
    subtitle: 'Rozkład A (normalny) vs Rozkład B (prawostronnie skośny)',
    description:
      'Bezpośrednie nałożenie rozkładu Gaussa na rozkład skośny przy tej samej średniej nominalnej. Zobacz jak asymetria deformuje szczyt i przemieszcza medianę.',
    comparisonMode: 'dual',
    distA: {
      mean: 50,
      sd: 11,
      skewness: 0,
      kurtosis: 0,
      sampleN: 500,
    },
    distB: {
      mean: 50,
      sd: 11,
      skewness: 1.3,
      kurtosis: 0.6,
      sampleN: 500,
    },
    displaySettings: {
      showMean: true,
      showMedian: true,
      showMode: true,
      showHistogram: true,
    },
  },
  {
    id: 'triple-skewness',
    title: '3 wykresy o różnej skośności (lewoskośny, symetryczny, prawoskośny)',
    subtitle: 'Porównanie asymetrii: γ₁ = -1.2 vs γ₁ = 0 vs γ₁ = +1.2',
    description:
      'Zestawienie trzech rozkładów przy jednakowej średniej (μ = 50) i odchyleniu (σ = 10): Rozkład A lewoskośny (M < Mdn < Mo, wydłużony lewy ogon), Rozkład B idealnie symetryczny (dzwon Gaussa, M = Mdn = Mo), Rozkład C prawoskośny (Mo < Mdn < M, wydłużony prawy ogon).',
    comparisonMode: 'triple',
    distA: {
      name: 'Rozkład A (Lewoskośny)',
      mean: 50,
      sd: 10,
      skewness: -1.2,
      kurtosis: 0.5,
      sampleN: 500,
    },
    distB: {
      name: 'Rozkład B (Symetryczny)',
      mean: 50,
      sd: 10,
      skewness: 0,
      kurtosis: 0,
      sampleN: 500,
    },
    distC: {
      name: 'Rozkład C (Prawoskośny)',
      mean: 50,
      sd: 10,
      skewness: 1.2,
      kurtosis: 0.5,
      sampleN: 500,
    },
    displaySettings: {
      showMean: true,
      showMedian: true,
      showMode: true,
      showHistogram: false,
      showSigmaBands: false,
      lockAxes: true,
      xAxisLabel: 'Wartość cechy (x)',
    },
  },
  {
    id: 'triple-kurtosis',
    title: '3 wykresy o różnej kurtozie (platy-, mezo- i leptokurtyczny)',
    subtitle: 'Porównanie spłaszczenia: γ₂ = -1.1 vs γ₂ = 0 vs γ₂ = +2.2',
    description:
      'Trzy rozkłady o tej samej średniej (μ = 50) i odchyleniu (σ = 10): Rozkład A platykurtyczny (spłaszczony szczyt, lekkie ogony), Rozkład B mezokurtyczny (wzorcowy dzwon Gaussa), Rozkład C leptokurtyczny (wysoki, ostry wierzchołek i grube ogony / fat tails).',
    comparisonMode: 'triple',
    distA: {
      name: 'Rozkład A (Platykurtyczny)',
      mean: 50,
      sd: 10,
      skewness: 0,
      kurtosis: -1.1,
      sampleN: 500,
    },
    distB: {
      name: 'Rozkład B (Mezokurtyczny)',
      mean: 50,
      sd: 10,
      skewness: 0,
      kurtosis: 0,
      sampleN: 500,
    },
    distC: {
      name: 'Rozkład C (Leptokurtyczny)',
      mean: 50,
      sd: 10,
      skewness: 0,
      kurtosis: 2.2,
      sampleN: 500,
    },
    displaySettings: {
      showMean: true,
      showMedian: false,
      showMode: true,
      showHistogram: false,
      showSigmaBands: false,
      lockAxes: true,
      xAxisLabel: 'Wartość cechy (x)',
    },
  },
];
