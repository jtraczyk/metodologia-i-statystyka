import {
  PopulationConfig,
  CltDisplaySettings,
  PresetScenario,
} from '../types';

export const DEFAULT_POPULATION: PopulationConfig = {
  type: 'normal',
  name: 'Rozkład normalny',
  mean: 50,
  sd: 10,
};

export const DEFAULT_DISPLAY_SETTINGS: CltDisplaySettings = {
  showTheoreticalCurve: true,
  showMeanLine: true,
  showStandardErrorBands: true,
  showIndividualPoints: true,
  animationSpeed: 'normal',
  confidenceLevel: 0.95,
  lowerViewMode: 'waterfall',
  maxVisibleCisInWaterfall: 20,
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'ci-95-n10',
    title: '1. Standard metodologii: 95% CI przy n = 10 (Klasyczny taniec CI)',
    subtitle: 'Oczekujemy, że 95% przedziałów pokryje μ = 50, a ~5% chybi (czerwone)',
    description:
      'Każda wylosowana próba generuje 95% przedział ufności. Obserwuj jak przedziały "tańczą" w pionie — średnio 1 na 20 przedziałów (5%) nie pokryje prawdziwej średniej populacji μ = 50 i zabarwi się na czerwono.',
    sampleN: 10,
    confidenceLevel: 0.95,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'ci-95-n30',
    title: '2. Większa próba: 95% CI przy n = 30 (Węższe przedziały, wyższa precyzja)',
    subtitle: 'SE maleje do 1,83 — przedziały są znacznie węższe, pokrycie nadal 95%',
    description:
      'Gdy n wzrasta do 30, margines błędu wyraźnie się kurczy. Choć przedziały są węższe i precyzyjniejsze, to ich odsetek pokrycia populacji nadal wynosi dokładnie 95%!',
    sampleN: 30,
    confidenceLevel: 0.95,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'ci-80-n10',
    title: '3. Niższy poziom ufności: 80% CI (Wąskie przedziały, ale aż 20% chybień)',
    subtitle: 'Aż 1 na 5 przedziałów (20%) nie zawiera prawdziwej wartości μ!',
    description:
      'Węższy przedział kusi pozorami precyzji, lecz kosztem aż 20% ryzyka błędu! Średnio co piąty przedział będzie czerwony (brak pokrycia μ, p < 0,20).',
    sampleN: 10,
    confidenceLevel: 0.80,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'ci-99-n10',
    title: '4. Bardzo wysoki poziom: 99% CI (Bardzo szerokie, tylko 1% chybień)',
    subtitle: 'Niezwykle bezpieczne przedziały — aż 99% pokrycia, niemal brak czerwonych',
    description:
      'Wysoka pewność wymaga szerszego marginesu błędu. Prawie każdy wygenerowany przedział pokrywa prawdziwe μ = 50.',
    sampleN: 10,
    confidenceLevel: 0.99,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'ci-95-n50',
    title: '5. Duża próba: 95% CI przy n = 50 (Bardzo wąskie przedziały, wysoka precyzja)',
    subtitle: 'Przy n = 50 margines błędu jest minimalny — wysoka precyzja estymacji średniej',
    description:
      'Gdy liczebność próby wzrasta do n = 50, błąd standardowy gwałtownie spada (SE = 1,41). Przedziały ufności są niezwykle wąskie, a ich odsetek pokrycia populacji nadal wynosi stabilne 95%.',
    sampleN: 50,
    confidenceLevel: 0.95,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
];
