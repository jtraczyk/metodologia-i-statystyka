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
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'normal-n2',
    title: '1. Bardzo mała próba: n = 2 (duży rozrzut średnich)',
    subtitle: 'SE = 7,07 — duża niepewność pojedynczej średniej',
    description:
      'Przy zaledwie n = 2 uśredniane są tylko dwie obserwacje. Choć średnia jest nieobciążonym estymatorem, rozrzut średnich jest znaczny (błąd standardowy wynosi SE = 10 / √2 ≈ 7,07).',
    sampleN: 2,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'normal-n10',
    title: '2. Umiarkowana próba: n = 10 (widoczne skupianie)',
    subtitle: 'SE = 3,16 — ponad trzykrotna redukcja błędu',
    description:
      'Gdy n wzrasta do 10, błąd standardowy spada do 3,16. Średnie z prób zaczynają wyraźnie koncentrować się wokół średniej populacji μ = 50.',
    sampleN: 10,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'normal-n30',
    title: '3. Złoty standard metodologii: n = 30 (reguła kciuka)',
    subtitle: 'SE = 1,83 — wysoka precyzja estymacji',
    description:
      'Wielkość próby n = 30 to w badaniach społecznych i psychologii powszechnie przyjmowany próg, przy którym rozkład średnich z próby ma doskonałe przybliżenie rozkładem normalnym.',
    sampleN: 30,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'normal-n100',
    title: '4. Duża próba: n = 100 (bardzo mały błąd standardowy)',
    subtitle: 'SE = 1,00 — aż 10-krotnie węższy rozkład niż populacja',
    description:
      'Przy n = 100 błąd standardowy wynosi SE = 10 / √100 = 1,00. Prawie 99% wszystkich średnich z prób mieści się w wąskim przedziale od 47 do 53.',
    sampleN: 100,
    populationType: 'normal',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'skewed-n30',
    title: '5. Populacja skośna (asymetryczna) -> normalny rozkład średnich',
    subtitle: 'n = 30 z rozkładu z silnym ogonem (np. zarobki, czas reakcji)',
    description:
      'Populacja wyjściowa jest silnie asymetryczna z długim prawym ogonem. Mimo to średnie z prób n = 30 układają się w symetryczny dzwon Gaussa! To sedno twierdzenia granicznego.',
    sampleN: 30,
    populationType: 'skewed',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'uniform-n25',
    title: '6. Populacja jednostajna (płaska) -> normalny rozkład średnich',
    subtitle: 'n = 25 z prostokątnego rozkładu prawdopodobieństwa',
    description:
      'Wszystkie wartości z przedziału mają identyczną szansę wylosowania. Jednak suma i średnia z niezależnych zmiennych tworzy gładki dzwon normalny.',
    sampleN: 25,
    populationType: 'uniform',
    populationMean: 50,
    populationSD: 10,
  },
  {
    id: 'bimodal-n30',
    title: '7. Populacja bimodalna (dwugarbna) -> jeden dzwon średnich',
    subtitle: 'n = 30 z populacji o dwóch oddzielnych szczytach',
    description:
      'Populacja składa się z dwóch odrębnych skupisk, w środku prawie nie ma obserwacji! Mimo to średnie z prób koncentrują się właśnie pośrodku, tworząc pojedynczy unimodalny rozkład normalny.',
    sampleN: 30,
    populationType: 'bimodal',
    populationMean: 50,
    populationSD: 10,
  },
];
