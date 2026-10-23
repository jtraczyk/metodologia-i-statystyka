import { DatasetConfig, LayerSettings } from '../types';
import { generateDatasetPoints } from '../utils/statistics';

export const COLOR_PALETTES = [
  {
    primary: '#009EE0', // Błękit cyjanowy / Cerulean Blue
    light: 'rgba(0, 158, 224, 0.18)',
    border: '#007BB0',
    accent: '#004F70',
    text: 'text-sky-800',
    badgeBg: 'bg-sky-50/70',
    badgeBorder: 'border-sky-300/60',
  },
  {
    primary: '#F29400', // Ciepły bursztyn / Amber Orange
    light: 'rgba(242, 148, 0, 0.18)',
    border: '#D37E00',
    accent: '#8C5400',
    text: 'text-amber-800',
    badgeBg: 'bg-amber-50/70',
    badgeBorder: 'border-amber-300/60',
  },
  {
    primary: '#1FA22E', // Żywa zieleń / Grass Green
    light: 'rgba(31, 162, 46, 0.18)',
    border: '#178024',
    accent: '#0D5216',
    text: 'text-emerald-800',
    badgeBg: 'bg-emerald-50/70',
    badgeBorder: 'border-emerald-300/60',
  },
  {
    primary: '#8A3FFC', // Fiolet akcentowy / Purple Violet
    light: 'rgba(138, 63, 252, 0.18)',
    border: '#6929C4',
    accent: '#491D8B',
    text: 'text-purple-800',
    badgeBg: 'bg-purple-50/70',
    badgeBorder: 'border-purple-300/60',
  },
];

export const DEFAULT_LAYERS: LayerSettings = {
  showBoxPlot: true,
  showViolin: true,
  showPoints: true,
  showMeanMarker: true,
  pointOpacity: 0.55,
  pointSize: 3.5,
  jitterWidth: 0.45,
  violinBandwidthMultiplier: 1.0,
};

export function createInitialDatasets(seed?: number | null): DatasetConfig[] {
  const g1Seed = seed !== null && seed !== undefined ? seed : undefined;
  const g2Seed = seed !== null && seed !== undefined ? (seed + 1000) : undefined;

  const g1Points = generateDatasetPoints(200, 50, 12, 'normal', g1Seed);
  const g2Points = generateDatasetPoints(250, 65, 15, 'normal', g2Seed);

  return [
    {
      id: 'group-1',
      name: 'Grupa A',
      color: COLOR_PALETTES[0],
      mean: 50,
      sd: 12,
      n: 200,
      distributionType: 'normal',
      rawPoints: g1Points.points,
      jitterOffsets: g1Points.jitter,
    },
    {
      id: 'group-2',
      name: 'Grupa B',
      color: COLOR_PALETTES[1],
      mean: 65,
      sd: 15,
      n: 250,
      distributionType: 'normal',
      rawPoints: g2Points.points,
      jitterOffsets: g2Points.jitter,
    },
  ];
}
