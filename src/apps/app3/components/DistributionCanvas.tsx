import React, { useState, useMemo, useRef } from 'react';
import {
  DistributionCalculations,
  DisplaySettings,
} from '../types';
import { formatNum, standardNormalCdf } from '../utils/statistics';
import {
  Download,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock,
  Calculator,
} from 'lucide-react';
import { SummaryTable } from './SummaryTable';

interface DistributionCanvasProps {
  distACalc: DistributionCalculations;
  distBCalc: DistributionCalculations;
  distCCalc: DistributionCalculations;
  displaySettings: DisplaySettings;
  onUpdateDisplaySettings: (updates: Partial<DisplaySettings>) => void;
}

export const DistributionCanvas: React.FC<DistributionCanvasProps> = ({
  distACalc,
  distBCalc,
  distCCalc,
  displaySettings,
  onUpdateDisplaySettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoveredBin, setHoveredBin] = useState<{
    distName: string;
    range: string;
    count: number;
    percentage: number;
    density: number;
  } | null>(null);

  const isDual = displaySettings.comparisonMode === 'dual';
  const isTriple = displaySettings.comparisonMode === 'triple';

  // Compute overall X-domain across active distributions (locked or dynamic)
  const { minX, maxX, maxY } = useMemo(() => {
    // Check if current active distribution is standard normal Z (mean ~ 0, sd ~ 1)
    const isZPreset =
      Math.abs(distACalc.config.mean) <= 0.01 && Math.abs(distACalc.config.sd - 1) <= 0.01;

    // Locked axes mode as requested by user to clearly visualize changes in mean & sd
    if (displaySettings.lockAxes) {
      if (isZPreset) {
        return {
          minX: -4.5,
          maxX: 4.5,
          maxY: 0.45,
        };
      }
      return {
        minX: -30,
        maxX: 130,
        maxY: 0.10, // sigma=10 peak is 0.04, sigma=5 peak is 0.08, sigma=25 peak is 0.016
      };
    }

    // Dynamic auto-scale
    const configs = [distACalc];
    if (isDual || isTriple) configs.push(distBCalc);
    if (isTriple) configs.push(distCCalc);

    let lowestX = Infinity;
    let highestX = -Infinity;
    let highestY = 0;

    configs.forEach((item) => {
      const { mean, sd } = item.config;
      const left = mean - 4.2 * sd;
      const right = mean + 4.2 * sd;
      if (left < lowestX) lowestX = left;
      if (right > highestX) highestX = right;

      if (item.theoretical.peakDensity > highestY) {
        highestY = item.theoretical.peakDensity;
      }

      if (displaySettings.showHistogram && item.config.showHistogram) {
        item.empirical.bins.forEach((b) => {
          if (b.density > highestY) highestY = b.density;
        });
      }
    });

    if (!isFinite(lowestX) || lowestX === Infinity) lowestX = 0;
    if (!isFinite(highestX) || highestX === -Infinity) highestX = 100;
    if (highestY <= 0) highestY = 0.1;

    return {
      minX: Math.floor(lowestX),
      maxX: Math.ceil(highestX),
      maxY: highestY * 1.25,
    };
  }, [distACalc, distBCalc, distCCalc, isDual, isTriple, displaySettings.showHistogram, displaySettings.lockAxes]);

  // Chart dimensions in SVG viewBox coordinate system
  const width = 900;
  const height = 480;
  const margin = { top: 48, right: 40, bottom: 65, left: 65 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Coordinate transforms
  const scaleX = (val: number) => {
    return margin.left + ((val - minX) / (maxX - minX)) * plotWidth;
  };

  const scaleY = (val: number) => {
    return margin.top + plotHeight - (val / maxY) * plotHeight;
  };

  const invertX = (pixelX: number) => {
    const fraction = (pixelX - margin.left) / plotWidth;
    return minX + fraction * (maxX - minX);
  };

  // Generate SVG path for a PDF curve
  const generatePdfPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`)
      .join(' ');
  };

  const generatePdfAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    const baseline = scaleY(0);
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`)
      .join(' ');
    const firstX = scaleX(points[0].x).toFixed(1);
    const lastX = scaleX(points[points.length - 1].x).toFixed(1);
    return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
  };

  // Nice X ticks
  const xTicks = useMemo(() => {
    const span = maxX - minX;
    let step = 10;
    if (span <= 10) step = 1;
    else if (span <= 25) step = 2;
    else if (span <= 60) step = 5;
    else if (span <= 120) step = 10;
    else if (span <= 250) step = 20;
    else step = 50;

    const start = Math.ceil(minX / step) * step;
    const ticks: number[] = [];
    for (let t = start; t <= maxX; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [minX, maxX]);

  // Nice Y ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const step = maxY / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxY]);

  // Handle mouse movement for inspection tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgPixelX = (clientX / rect.width) * width;
    if (svgPixelX >= margin.left && svgPixelX <= width - margin.right) {
      setHoverX(invertX(svgPixelX));
    } else {
      setHoverX(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setHoveredBin(null);
  };

  // Click on chart to adjust X for Z-score calculation
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!displaySettings.showZScore) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgPixelX = (clientX / rect.width) * width;
    if (svgPixelX >= margin.left && svgPixelX <= width - margin.right) {
      const rawX = invertX(svgPixelX);
      onUpdateDisplaySettings({ zTargetX: parseFloat(rawX.toFixed(1)) });
    }
  };

  // Export chart to standalone vector SVG file
  const handleExportSvg = () => {
    const svgElement = chartSvgRef.current;
    if (!svgElement) return;

    // Clone element so rendered DOM is untouched
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Set standard vector graphics attributes
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('width', `${width}`);
    clone.setAttribute('height', `${height}`);
    clone.setAttribute(
      'font-family',
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    );

    // Insert solid white background rect so the exported SVG looks pristine on any backdrop
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', `${width}`);
    bgRect.setAttribute('height', `${height}`);
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);

    // Remove temporary interactive hover indicator from export
    const crosshair = clone.querySelector('.hover-inspection');
    if (crosshair) crosshair.remove();

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);

    // Add standard XML declaration header
    if (!source.match(/^<\?xml/)) {
      source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\r\n' + source;
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    const sanitizedName = distACalc.config.name.replace(/\s+/g, '_');
    downloadLink.download = `wykres_rozkladu_${sanitizedName}_${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Z-Score calculation for active curve (Dist A)
  const zScoreData = useMemo(() => {
    const { mean, sd } = distACalc.config;
    const x1 = displaySettings.zTargetX;
    const x2 = displaySettings.zTargetX2;
    const z1 = (x1 - mean) / sd;
    const z2 = (x2 - mean) / sd;

    let prob = 0;
    if (displaySettings.zProbMode === 'lessThan') {
      prob = standardNormalCdf(z1);
    } else if (displaySettings.zProbMode === 'greaterThan') {
      prob = 1 - standardNormalCdf(z1);
    } else if (displaySettings.zProbMode === 'twoTailed') {
      prob = 2 * (1 - standardNormalCdf(Math.abs(z1)));
    } else if (displaySettings.zProbMode === 'between') {
      const minZ = Math.min(z1, z2);
      const maxZ = Math.max(z1, z2);
      prob = Math.max(0, standardNormalCdf(maxZ) - standardNormalCdf(minZ));
    }

    return {
      x1,
      x2,
      z1,
      z2,
      prob,
      mean,
      sd,
    };
  }, [distACalc.config, displaySettings.zTargetX, displaySettings.zTargetX2, displaySettings.zProbMode]);

  // Central tendency interpretation message for Dist A
  const relationText = useMemo(() => {
    const { mean, median, mode } = distACalc.theoretical;
    const diff = Math.abs(mean - mode);

    if (diff < 0.25) {
      return {
        type: 'symmetric',
        badge: 'Rozkład symetryczny',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        formula: 'Mo ≈ Mdn ≈ M',
        details: `Wszystkie trzy miary położenia pokrywają się w jednym punkcie (~${formatNum(mean, 1)}). Rozkład jest symetryczny względem średniej.`,
      };
    } else if (mean > mode) {
      return {
        type: 'positive-skew',
        badge: 'Asymetria prawostronna (dodatnia)',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        formula: 'Mo < Mdn < M',
        details: `Dominanta Mo (${formatNum(mode, 1)}) < Mediana Mdn (${formatNum(median, 1)}) < Średnia M (${formatNum(mean, 1)}). Długi prawy ogon ciągnie średnią w stronę wyższych wartości!`,
      };
    } else {
      return {
        type: 'negative-skew',
        badge: 'Asymetria lewostronna (ujemna)',
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        formula: 'M < Mdn < Mo',
        details: `Średnia M (${formatNum(mean, 1)}) < Mediana Mdn (${formatNum(median, 1)}) < Dominanta Mo (${formatNum(mode, 1)}). Długi lewy ogon ciągnie średnią w stronę niższych wartości!`,
      };
    }
  }, [distACalc.theoretical]);

  // Compute vertical tag positions for ALL active distributions (A, B, C)
  // Keeps the tag color identical to the distribution color, and prevents collision between tags
  const statTags = useMemo(() => {
    interface TagItem {
      id: string;
      distId: string;
      type: 'mean' | 'median' | 'mode';
      xVal: number;
      label: string;
      color: string;
    }

    const items: TagItem[] = [];
    const isMulti = isDual || isTriple;

    // 1. Rozkład A
    if (displaySettings.showMean) {
      items.push({
        id: 'dist-a-mean',
        distId: 'dist-a',
        type: 'mean',
        xVal: distACalc.theoretical.mean,
        label: `${isMulti ? 'M_A: ' : 'M: '}${formatNum(distACalc.theoretical.mean, 1)}`,
        color: distACalc.config.color.primary,
      });
    }
    if (displaySettings.showMedian) {
      items.push({
        id: 'dist-a-median',
        distId: 'dist-a',
        type: 'median',
        xVal: distACalc.theoretical.median,
        label: `${isMulti ? 'Mdn_A: ' : 'Mdn: '}${formatNum(distACalc.theoretical.median, 1)}`,
        color: distACalc.config.color.primary,
      });
    }
    if (displaySettings.showMode) {
      items.push({
        id: 'dist-a-mode',
        distId: 'dist-a',
        type: 'mode',
        xVal: distACalc.theoretical.mode,
        label: `${isMulti ? 'Mo_A: ' : 'Mo: '}${formatNum(distACalc.theoretical.mode, 1)}`,
        color: distACalc.config.color.primary,
      });
    }

    // 2. Rozkład B (if dual or triple)
    if (isDual || isTriple) {
      if (displaySettings.showMean) {
        items.push({
          id: 'dist-b-mean',
          distId: 'dist-b',
          type: 'mean',
          xVal: distBCalc.theoretical.mean,
          label: `M_B: ${formatNum(distBCalc.theoretical.mean, 1)}`,
          color: distBCalc.config.color.primary,
        });
      }
      if (displaySettings.showMedian) {
        items.push({
          id: 'dist-b-median',
          distId: 'dist-b',
          type: 'median',
          xVal: distBCalc.theoretical.median,
          label: `Mdn_B: ${formatNum(distBCalc.theoretical.median, 1)}`,
          color: distBCalc.config.color.primary,
        });
      }
      if (displaySettings.showMode) {
        items.push({
          id: 'dist-b-mode',
          distId: 'dist-b',
          type: 'mode',
          xVal: distBCalc.theoretical.mode,
          label: `Mo_B: ${formatNum(distBCalc.theoretical.mode, 1)}`,
          color: distBCalc.config.color.primary,
        });
      }
    }

    // 3. Rozkład C (if triple)
    if (isTriple) {
      if (displaySettings.showMean) {
        items.push({
          id: 'dist-c-mean',
          distId: 'dist-c',
          type: 'mean',
          xVal: distCCalc.theoretical.mean,
          label: `M_C: ${formatNum(distCCalc.theoretical.mean, 1)}`,
          color: distCCalc.config.color.primary,
        });
      }
      if (displaySettings.showMedian) {
        items.push({
          id: 'dist-c-median',
          distId: 'dist-c',
          type: 'median',
          xVal: distCCalc.theoretical.median,
          label: `Mdn_C: ${formatNum(distCCalc.theoretical.median, 1)}`,
          color: distCCalc.config.color.primary,
        });
      }
      if (displaySettings.showMode) {
        items.push({
          id: 'dist-c-mode',
          distId: 'dist-c',
          type: 'mode',
          xVal: distCCalc.theoretical.mode,
          label: `Mo_C: ${formatNum(distCCalc.theoretical.mode, 1)}`,
          color: distCCalc.config.color.primary,
        });
      }
    }

    // Assign tiers based on horizontal distance in pixels
    const minPixelDistance = 64;
    const baseLevel = margin.top + 6;
    const tierStep = 22;

    const assignedTiers: number[] = [];
    const placedInTier: { [tier: number]: number[] } = {};

    items.forEach((item, index) => {
      const px = scaleX(item.xVal);
      let tier = 0;
      while (true) {
        const tierPixels = placedInTier[tier] || [];
        const hasCollision = tierPixels.some((p) => Math.abs(p - px) < minPixelDistance);
        if (!hasCollision) {
          placedInTier[tier] = [...tierPixels, px];
          assignedTiers[index] = tier;
          break;
        }
        tier++;
      }
    });

    return items.map((item, index) => ({
      ...item,
      pixelX: scaleX(item.xVal),
      y: baseLevel + assignedTiers[index] * tierStep,
    }));
  }, [
    distACalc.theoretical,
    distACalc.config.color.primary,
    distBCalc.theoretical,
    distBCalc.config.color.primary,
    distCCalc.theoretical,
    distCCalc.config.color.primary,
    isDual,
    isTriple,
    displaySettings.showMean,
    displaySettings.showMedian,
    displaySettings.showMode,
    maxX,
    minX,
    margin.left,
    margin.top,
    plotWidth,
  ]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
    >
      {/* Chart Top Toolbar */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Wykres gęstości prawdopodobieństwa i histogram</span>
            <span className="sm:hidden">Rozkład prawdopodobieństwa</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
              {distACalc.config.name}
            </span>
            {(isDual || isTriple) && (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-[11px] sm:text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                {distBCalc.config.name}
              </span>
            )}
            {isTriple && (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-[11px] sm:text-xs">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                {distCCalc.config.name}
              </span>
            )}
          </div>

          {(displaySettings.showMean || displaySettings.showMedian || displaySettings.showMode) && (
            <>
              <span className="text-slate-300 hidden xl:inline">|</span>
              <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                {displaySettings.showMean && (
                  <span className="flex items-center gap-1" title="Średnia arytmetyczna M - linia ciągła">
                    <svg width="14" height="4" className="inline-block">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="#64748b" strokeWidth="2" />
                    </svg>
                    M (ciągła)
                  </span>
                )}
                {displaySettings.showMedian && (
                  <span className="flex items-center gap-1" title="Mediana Mdn - linia kreskowana">
                    <svg width="14" height="4" className="inline-block">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                    Mdn (kreskowana)
                  </span>
                )}
                {displaySettings.showMode && (
                  <span className="flex items-center gap-1" title="Dominanta / Moda Mo - linia kropkowana">
                    <svg width="14" height="4" className="inline-block">
                      <line x1="0" y1="2" x2="14" y2="2" stroke="#64748b" strokeWidth="2" strokeDasharray="1.5 2" />
                    </svg>
                    Mo (kropkowana)
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Locked Axes Toggle */}
          <button
            type="button"
            onClick={() => onUpdateDisplaySettings({ lockAxes: !displaySettings.lockAxes })}
            className={`px-2 py-1 rounded-md font-medium transition-colors border flex items-center gap-1 text-[11px] sm:text-xs ${
              displaySettings.lockAxes
                ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title={
              displaySettings.lockAxes
                ? 'Osie są zablokowane (stała skala) - zmiana średniej i SD jest doskonale widoczna'
                : 'Skala dopasowuje się automatycznie'
            }
          >
            {displaySettings.lockAxes ? (
              <Lock className="w-3 h-3 text-sky-700" />
            ) : (
              <Unlock className="w-3 h-3 text-slate-400" />
            )}
            <span>{displaySettings.lockAxes ? 'Osie: Stałe' : 'Osie: Auto'}</span>
          </button>

          {/* Z-Score & Probability Toggle */}
          <button
            type="button"
            onClick={() => onUpdateDisplaySettings({ showZScore: !displaySettings.showZScore })}
            className={`px-2 py-1 rounded-md font-medium transition-colors border flex items-center gap-1 text-[11px] sm:text-xs ${
              displaySettings.showZScore
                ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Włącz/wyłącz wizualizację pola prawdopodobieństwa P i wartości Z"
          >
            <Calculator className="w-3 h-3 text-indigo-600" />
            <span>Wartość Z & P</span>
          </button>

          {/* 3 Sigma toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdateDisplaySettings({ showSigmaBands: !displaySettings.showSigmaBands })
            }
            className={`px-2 py-1 rounded-md font-medium transition-colors border text-[11px] sm:text-xs ${
              displaySettings.showSigmaBands
                ? 'bg-sky-100 text-sky-800 border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Włącz/wyłącz podświetlenie reguły trzech sigm (±1σ, ±2σ, ±3σ)"
          >
            Reguła 3σ
          </button>

          {/* Histogram Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdateDisplaySettings({ showHistogram: !displaySettings.showHistogram })
            }
            className={`px-2 py-1 rounded-md font-medium transition-colors border text-[11px] sm:text-xs ${
              displaySettings.showHistogram
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Pokaż lub ukryj histogram empirycznej próby"
          >
            Histogram
          </button>

          {/* Export SVG */}
          <button
            type="button"
            onClick={handleExportSvg}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors text-[11px] sm:text-xs shadow-2xs"
            title="Pobierz wykres jako wektorowy plik SVG"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Eksportuj SVG</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area - Responsive compact height for smartphones */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2/1] min-h-[220px] max-h-[440px] bg-white select-none">
        <svg
          ref={chartSvgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full h-full block ${displaySettings.showZScore ? 'cursor-crosshair' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleSvgClick}
        >
          <defs>
            {/* Gradients for Dist A and Dist B */}
            <linearGradient id="gradient-dist-a" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009EE0" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#009EE0" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradient-dist-b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F29400" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#F29400" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradient-dist-c" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
            </linearGradient>

            {/* Sigma bands shading */}
            <linearGradient id="sigma-1-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="sigma-2-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
            </linearGradient>

            {/* Z-score probability region gradient */}
            <linearGradient id="zscore-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {displaySettings.showGrid && (
            <g className="grid-lines" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1">
              {/* Horizontal grid lines */}
              {yTicks.map((tick, i) => {
                if (i === 0) return null;
                const y = scaleY(tick);
                return <line key={`y-grid-${i}`} x1={margin.left} y1={y} x2={width - margin.right} y2={y} />;
              })}
              {/* Vertical grid lines */}
              {xTicks.map((tick, i) => {
                const x = scaleX(tick);
                return <line key={`x-grid-${i}`} x1={x} y1={margin.top} x2={x} y2={height - margin.bottom} />;
              })}
            </g>
          )}

          {/* Three Sigma Bands for Dist A if enabled */}
          {displaySettings.showSigmaBands && (
            <g className="sigma-bands">
              {/* Band 3: ±3 sigma (99.73%) */}
              {(() => {
                const { mean, sd } = distACalc.config;
                const x1 = Math.max(minX, mean - 3 * sd);
                const x2 = Math.min(maxX, mean + 3 * sd);
                const points = distACalc.pdfPoints.filter((p) => p.x >= x1 && p.x <= x2);
                if (points.length < 2) return null;
                return (
                  <path
                    d={generatePdfAreaPath(points)}
                    fill="rgba(56, 189, 248, 0.08)"
                  />
                );
              })()}

              {/* Band 2: ±2 sigma (95.45%) */}
              {(() => {
                const { mean, sd } = distACalc.config;
                const x1 = Math.max(minX, mean - 2 * sd);
                const x2 = Math.min(maxX, mean + 2 * sd);
                const points = distACalc.pdfPoints.filter((p) => p.x >= x1 && p.x <= x2);
                if (points.length < 2) return null;
                return (
                  <path
                    d={generatePdfAreaPath(points)}
                    fill="rgba(56, 189, 248, 0.14)"
                  />
                );
              })()}

              {/* Band 1: ±1 sigma (68.27%) */}
              {(() => {
                const { mean, sd } = distACalc.config;
                const x1 = Math.max(minX, mean - 1 * sd);
                const x2 = Math.min(maxX, mean + 1 * sd);
                const points = distACalc.pdfPoints.filter((p) => p.x >= x1 && p.x <= x2);
                if (points.length < 2) return null;
                return (
                  <path
                    d={generatePdfAreaPath(points)}
                    fill="rgba(56, 189, 248, 0.22)"
                  />
                );
              })()}
            </g>
          )}

          {/* Z-SCORE AND PROBABILITY SHADED REGION */}
          {displaySettings.showZScore && (
            <g className="zscore-probability-region">
              {/* Left tail: P(X <= x) */}
              {displaySettings.zProbMode === 'lessThan' && (() => {
                const points = distACalc.pdfPoints.filter((p) => p.x <= zScoreData.x1);
                if (points.length < 2) return null;
                return (
                  <path
                    d={generatePdfAreaPath(points)}
                    fill="url(#zscore-grad)"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                  />
                );
              })()}

              {/* Right tail: P(X >= x) */}
              {displaySettings.zProbMode === 'greaterThan' && (() => {
                const points = distACalc.pdfPoints.filter((p) => p.x >= zScoreData.x1);
                if (points.length < 2) return null;
                return (
                  <path
                    d={generatePdfAreaPath(points)}
                    fill="url(#zscore-grad)"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                  />
                );
              })()}

              {/* Two-tailed: P(|Z| >= |z|) */}
              {displaySettings.zProbMode === 'twoTailed' && (() => {
                const absZ = Math.abs(zScoreData.z1);
                const leftCut = zScoreData.mean - absZ * zScoreData.sd;
                const rightCut = zScoreData.mean + absZ * zScoreData.sd;
                const leftPoints = distACalc.pdfPoints.filter((p) => p.x <= leftCut);
                const rightPoints = distACalc.pdfPoints.filter((p) => p.x >= rightCut);

                return (
                  <>
                    {leftPoints.length >= 2 && (
                      <path
                        d={generatePdfAreaPath(leftPoints)}
                        fill="url(#zscore-grad)"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                      />
                    )}
                    {rightPoints.length >= 2 && (
                      <path
                        d={generatePdfAreaPath(rightPoints)}
                        fill="url(#zscore-grad)"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                      />
                    )}
                  </>
                );
              })()}

              {/* Interval between two points: P(x1 <= X <= x2) */}
              {displaySettings.zProbMode === 'between' && (() => {
                const minXVal = Math.min(zScoreData.x1, zScoreData.x2);
                const maxXVal = Math.max(zScoreData.x1, zScoreData.x2);
                const points = distACalc.pdfPoints.filter((p) => p.x >= minXVal && p.x <= maxXVal);
                if (points.length < 2) return null;
                return (
                  <path
                    d={generatePdfAreaPath(points)}
                    fill="url(#zscore-grad)"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                  />
                );
              })()}
            </g>
          )}

          {/* Empirical Histogram for Dist A */}
          {displaySettings.showHistogram && distACalc.config.showHistogram && (
            <g className="histogram-a">
              {distACalc.empirical.bins.map((bin, i) => {
                const x = scaleX(bin.x0);
                const barW = Math.max(1, scaleX(bin.x1) - x - 1);
                const barH = (bin.density / maxY) * plotHeight;
                const y = scaleY(0) - barH;

                return (
                  <rect
                    key={`hist-a-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, barH)}
                    fill="rgba(0, 158, 224, 0.24)"
                    stroke="#009EE0"
                    strokeWidth="1"
                    strokeOpacity="0.7"
                    rx="1"
                    className="transition-all hover:fill-sky-400/50 cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredBin({
                        distName: distACalc.config.name,
                        range: `[${formatNum(bin.x0, 1)} ; ${formatNum(bin.x1, 1)}]`,
                        count: bin.count,
                        percentage: bin.percentage,
                        density: bin.density,
                      })
                    }
                  />
                );
              })}
            </g>
          )}

          {/* Empirical Histogram for Dist B */}
          {(isDual || isTriple) && displaySettings.showHistogram && distBCalc.config.showHistogram && (
            <g className="histogram-b">
              {distBCalc.empirical.bins.map((bin, i) => {
                const x = scaleX(bin.x0);
                const barW = Math.max(1, scaleX(bin.x1) - x - 1);
                const barH = (bin.density / maxY) * plotHeight;
                const y = scaleY(0) - barH;

                return (
                  <rect
                    key={`hist-b-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, barH)}
                    fill="rgba(242, 148, 0, 0.24)"
                    stroke="#F29400"
                    strokeWidth="1"
                    strokeOpacity="0.7"
                    rx="1"
                    className="transition-all hover:fill-amber-400/50 cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredBin({
                        distName: distBCalc.config.name,
                        range: `[${formatNum(bin.x0, 1)} ; ${formatNum(bin.x1, 1)}]`,
                        count: bin.count,
                        percentage: bin.percentage,
                        density: bin.density,
                      })
                    }
                  />
                );
              })}
            </g>
          )}

          {/* Empirical Histogram for Dist C */}
          {isTriple && displaySettings.showHistogram && distCCalc.config.showHistogram && (
            <g className="histogram-c">
              {distCCalc.empirical.bins.map((bin, i) => {
                const x = scaleX(bin.x0);
                const barW = Math.max(1, scaleX(bin.x1) - x - 1);
                const barH = (bin.density / maxY) * plotHeight;
                const y = scaleY(0) - barH;

                return (
                  <rect
                    key={`hist-c-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, barH)}
                    fill="rgba(124, 58, 237, 0.24)"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    strokeOpacity="0.7"
                    rx="1"
                    className="transition-all hover:fill-purple-400/50 cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredBin({
                        distName: distCCalc.config.name,
                        range: `[${formatNum(bin.x0, 1)} ; ${formatNum(bin.x1, 1)}]`,
                        count: bin.count,
                        percentage: bin.percentage,
                        density: bin.density,
                      })
                    }
                  />
                );
              })}
            </g>
          )}

          {/* PDF Curve for Dist A */}
          {distACalc.config.showDistribution && (
            <g className="curve-dist-a">
              <path
                d={generatePdfAreaPath(distACalc.pdfPoints)}
                fill="url(#gradient-dist-a)"
              />
              <path
                d={generatePdfPath(distACalc.pdfPoints)}
                fill="none"
                stroke="#009EE0"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* PDF Curve for Dist B if Dual or Triple */}
          {(isDual || isTriple) && distBCalc.config.showDistribution && (
            <g className="curve-dist-b">
              <path
                d={generatePdfAreaPath(distBCalc.pdfPoints)}
                fill="url(#gradient-dist-b)"
              />
              <path
                d={generatePdfPath(distBCalc.pdfPoints)}
                fill="none"
                stroke="#F29400"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* PDF Curve for Dist C if Triple */}
          {isTriple && distCCalc.config.showDistribution && (
            <g className="curve-dist-c">
              <path
                d={generatePdfAreaPath(distCCalc.pdfPoints)}
                fill="url(#gradient-dist-c)"
              />
              <path
                d={generatePdfPath(distCCalc.pdfPoints)}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Vertical Markers for Dist A (Mean, Median, Mode) */}
          <g className="markers-a">
            {/* Mode marker (Dominanta) */}
            {displaySettings.showMode && (
              <g className="marker-mode-a">
                <line
                  x1={scaleX(distACalc.theoretical.mode)}
                  y1={margin.top}
                  x2={scaleX(distACalc.theoretical.mode)}
                  y2={scaleY(0)}
                  stroke={distACalc.config.color.primary}
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={scaleX(distACalc.theoretical.mode)}
                  cy={scaleY(distACalc.theoretical.peakDensity)}
                  r="3.5"
                  fill={distACalc.config.color.primary}
                />
              </g>
            )}

            {/* Median marker */}
            {displaySettings.showMedian && (
              <g className="marker-median-a">
                <line
                  x1={scaleX(distACalc.theoretical.median)}
                  y1={margin.top}
                  x2={scaleX(distACalc.theoretical.median)}
                  y2={scaleY(0)}
                  stroke={distACalc.config.color.primary}
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
              </g>
            )}

            {/* Mean marker */}
            {displaySettings.showMean && (
              <g className="marker-mean-a">
                <line
                  x1={scaleX(distACalc.theoretical.mean)}
                  y1={margin.top}
                  x2={scaleX(distACalc.theoretical.mean)}
                  y2={scaleY(0)}
                  stroke={distACalc.config.color.primary}
                  strokeWidth="2.2"
                />
              </g>
            )}
          </g>

          {/* Vertical Markers for Dist B if Dual or Triple */}
          {(isDual || isTriple) && (
            <g className="markers-b">
              {displaySettings.showMode && (
                <g className="marker-mode-b">
                  <line
                    x1={scaleX(distBCalc.theoretical.mode)}
                    y1={margin.top}
                    x2={scaleX(distBCalc.theoretical.mode)}
                    y2={scaleY(0)}
                    stroke={distBCalc.config.color.primary}
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={scaleX(distBCalc.theoretical.mode)}
                    cy={scaleY(distBCalc.theoretical.peakDensity)}
                    r="3.5"
                    fill={distBCalc.config.color.primary}
                  />
                </g>
              )}
              {displaySettings.showMedian && (
                <g className="marker-median-b">
                  <line
                    x1={scaleX(distBCalc.theoretical.median)}
                    y1={margin.top}
                    x2={scaleX(distBCalc.theoretical.median)}
                    y2={scaleY(0)}
                    stroke={distBCalc.config.color.primary}
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                </g>
              )}
              {displaySettings.showMean && (
                <g className="marker-mean-b">
                  <line
                    x1={scaleX(distBCalc.theoretical.mean)}
                    y1={margin.top}
                    x2={scaleX(distBCalc.theoretical.mean)}
                    y2={scaleY(0)}
                    stroke={distBCalc.config.color.primary}
                    strokeWidth="2.2"
                  />
                </g>
              )}
            </g>
          )}

          {/* Vertical Markers for Dist C if Triple */}
          {isTriple && (
            <g className="markers-c">
              {displaySettings.showMode && (
                <g className="marker-mode-c">
                  <line
                    x1={scaleX(distCCalc.theoretical.mode)}
                    y1={margin.top}
                    x2={scaleX(distCCalc.theoretical.mode)}
                    y2={scaleY(0)}
                    stroke={distCCalc.config.color.primary}
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={scaleX(distCCalc.theoretical.mode)}
                    cy={scaleY(distCCalc.theoretical.peakDensity)}
                    r="3.5"
                    fill={distCCalc.config.color.primary}
                  />
                </g>
              )}
              {displaySettings.showMedian && (
                <g className="marker-median-c">
                  <line
                    x1={scaleX(distCCalc.theoretical.median)}
                    y1={margin.top}
                    x2={scaleX(distCCalc.theoretical.median)}
                    y2={scaleY(0)}
                    stroke={distCCalc.config.color.primary}
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                </g>
              )}
              {displaySettings.showMean && (
                <g className="marker-mean-c">
                  <line
                    x1={scaleX(distCCalc.theoretical.mean)}
                    y1={margin.top}
                    x2={scaleX(distCCalc.theoretical.mean)}
                    y2={scaleY(0)}
                    stroke={distCCalc.config.color.primary}
                    strokeWidth="2.2"
                  />
                </g>
              )}
            </g>
          )}

          {/* Z-SCORE VERTICAL MARKERS (X1 and X2) */}
          {displaySettings.showZScore && (
            <g className="zscore-vertical-markers">
              {/* Primary line at X1 */}
              <line
                x1={scaleX(zScoreData.x1)}
                y1={margin.top}
                x2={scaleX(zScoreData.x1)}
                y2={scaleY(0)}
                stroke="#4338ca"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <circle
                cx={scaleX(zScoreData.x1)}
                cy={scaleY(0)}
                r="4.5"
                fill="#4338ca"
              />

              {/* Tag for X1 */}
              <g transform={`translate(${scaleX(zScoreData.x1)}, ${margin.top + 8})`}>
                <rect
                  x="-38"
                  y="0"
                  width="76"
                  height="18"
                  rx="4"
                  fill="#4338ca"
                  className="shadow-xs"
                />
                <text
                  x="0"
                  y="13"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {`X=${formatNum(zScoreData.x1, 1)} (z=${zScoreData.z1 > 0 ? '+' : ''}${formatNum(zScoreData.z1, 2)})`}
                </text>
              </g>

              {/* If 'between' mode, show second marker at X2 */}
              {displaySettings.zProbMode === 'between' && (
                <>
                  <line
                    x1={scaleX(zScoreData.x2)}
                    y1={margin.top}
                    x2={scaleX(zScoreData.x2)}
                    y2={scaleY(0)}
                    stroke="#4338ca"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <circle
                    cx={scaleX(zScoreData.x2)}
                    cy={scaleY(0)}
                    r="4"
                    fill="#4338ca"
                  />
                  <g transform={`translate(${scaleX(zScoreData.x2)}, ${margin.top + 30})`}>
                    <rect
                      x="-38"
                      y="0"
                      width="76"
                      height="18"
                      rx="4"
                      fill="#3730a3"
                      className="shadow-xs"
                    />
                    <text
                      x="0"
                      y="13"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {`x₂=${formatNum(zScoreData.x2, 1)} (z=${zScoreData.z2 > 0 ? '+' : ''}${formatNum(zScoreData.z2, 2)})`}
                    </text>
                  </g>
                </>
              )}
            </g>
          )}

          {/* Top Marker Tags / Value Badges for All Active Distributions */}
          <g className="marker-stat-tags">
            {statTags.map((tag) => (
              <g
                key={tag.id}
                transform={`translate(${tag.pixelX}, ${tag.y})`}
                className="stat-badge pointer-events-none"
              >
                <rect
                  x="-30"
                  y="0"
                  width="60"
                  height="18"
                  rx="4"
                  fill={tag.color}
                  className="shadow-xs"
                />
                <text
                  x="0"
                  y="12.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {tag.label}
                </text>
              </g>
            ))}
          </g>

          {/* Interactive Inspection Crosshair */}
          {hoverX !== null && (
            <g className="hover-inspection pointer-events-none">
              <line
                x1={scaleX(hoverX)}
                y1={margin.top}
                x2={scaleX(hoverX)}
                y2={scaleY(0)}
                stroke="#475569"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <circle
                cx={scaleX(hoverX)}
                cy={scaleY(0)}
                r="4"
                fill="#475569"
              />
            </g>
          )}

          {/* Axes & Labels */}
          <g className="axes">
            {/* X-axis line */}
            <line
              x1={margin.left}
              y1={scaleY(0)}
              x2={width - margin.right}
              y2={scaleY(0)}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Y-axis line */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={scaleY(0)}
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* X Ticks & Labels */}
            {xTicks.map((tick, i) => {
              const x = scaleX(tick);
              return (
                <g key={`x-tick-${i}`} transform={`translate(${x}, ${scaleY(0)})`}>
                  <line y1="0" y2="6" stroke="#64748b" strokeWidth="1.2" />
                  <text
                    y="18"
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {formatNum(tick, 0)}
                  </text>
                </g>
              );
            })}

            {/* Y Ticks & Labels */}
            {yTicks.map((tick, i) => {
              const y = scaleY(tick);
              return (
                <g key={`y-tick-${i}`} transform={`translate(${margin.left}, ${y})`}>
                  <line x1="-5" x2="0" stroke="#64748b" strokeWidth="1.2" />
                  <text
                    x="-8"
                    y="4"
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {formatNum(tick, 3)}
                  </text>
                </g>
              );
            })}

            {/* Axis titles */}
            <text
              x={margin.left + plotWidth / 2}
              y={height - 18}
              textAnchor="middle"
              fill="#1e293b"
              fontSize="12"
              fontWeight="600"
              className="cursor-pointer"
              onClick={() => document.getElementById('ctrl-x-axis-label')?.focus()}
            >
              {displaySettings.xAxisLabel || 'Wartość cechy (x)'}
            </text>

            <text
              transform={`translate(18, ${margin.top + plotHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              fill="#1e293b"
              fontSize="12"
              fontWeight="600"
            >
              Gęstość prawdopodobieństwa f(x)
            </text>
          </g>
        </svg>

        {/* Floating Z-Score Probability Badge on Canvas */}
        {displaySettings.showZScore && (
          <div className="absolute top-2.5 left-3 bg-indigo-950/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs border border-indigo-700/60 text-[11px] sm:text-xs font-mono flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span>
              {displaySettings.zProbMode === 'lessThan' &&
                `p(X ≤ ${formatNum(zScoreData.x1, 1)}) = ${(zScoreData.prob * 100).toFixed(2)}%`}
              {displaySettings.zProbMode === 'greaterThan' &&
                `p(X ≥ ${formatNum(zScoreData.x1, 1)}) = ${(zScoreData.prob * 100).toFixed(2)}%`}
              {displaySettings.zProbMode === 'twoTailed' &&
                `p(|z| ≥ ${Math.abs(zScoreData.z1).toFixed(2)}) = ${(zScoreData.prob * 100).toFixed(2)}%`}
              {displaySettings.zProbMode === 'between' &&
                `p(${formatNum(Math.min(zScoreData.x1, zScoreData.x2), 1)} ≤ X ≤ ${formatNum(Math.max(zScoreData.x1, zScoreData.x2), 1)}) = ${(zScoreData.prob * 100).toFixed(2)}%`}
            </span>
          </div>
        )}

        {/* Hovered Bin Tooltip Card */}
        {hoveredBin && (
          <div className="absolute top-3 right-4 bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-md pointer-events-none backdrop-blur-xs flex flex-col gap-1 border border-slate-700">
            <span className="font-semibold text-sky-300">
              Przedział histogramu ({hoveredBin.distName})
            </span>
            <span>Zakres: {hoveredBin.range}</span>
            <span>
              Liczebność: <strong>{hoveredBin.count}</strong> obs. ({formatNum(hoveredBin.percentage, 1)}%)
            </span>
            <span>Gęstość: {formatNum(hoveredBin.density, 4)}</span>
          </div>
        )}

        {/* Dynamic Point Inspection Box */}
        {hoverX !== null && !hoveredBin && (
          <div className="absolute bottom-16 right-4 bg-white/95 text-slate-800 text-xs px-3.5 py-2.5 rounded-lg shadow-md pointer-events-none border border-slate-200 flex flex-col gap-1">
            <span className="font-bold text-slate-900 border-b border-slate-100 pb-1">
              Punkt na osi: x = {formatNum(hoverX, 2)}
            </span>
            <div className="flex items-center justify-between gap-4 text-sky-700">
              <span>{distACalc.config.name}:</span>
              <span className="font-semibold">
                f(x) ≈ {formatNum(
                  distACalc.pdfPoints.find((p) => Math.abs(p.x - hoverX) < 0.5)?.y || 0,
                  4
                )}
              </span>
            </div>
            {(isDual || isTriple) && (
              <div className="flex items-center justify-between gap-4 text-amber-700">
                <span>{distBCalc.config.name}:</span>
                <span className="font-semibold">
                  f(x) ≈ {formatNum(
                    distBCalc.pdfPoints.find((p) => Math.abs(p.x - hoverX) < 0.5)?.y || 0,
                    4
                  )}
                </span>
              </div>
            )}
            {isTriple && (
              <div className="flex items-center justify-between gap-4 text-purple-700">
                <span>{distCCalc.config.name}:</span>
                <span className="font-semibold">
                  f(x) ≈ {formatNum(
                    distCCalc.pdfPoints.find((p) => Math.abs(p.x - hoverX) < 0.5)?.y || 0,
                    4
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabela z danymi teoretycznymi i obserwowalnymi (domyślnie ukryta, rozwijana) */}
      <SummaryTable
        distACalc={distACalc}
        distBCalc={distBCalc}
        distCCalc={distCCalc}
        displaySettings={displaySettings}
        embedded={true}
      />
    </div>
  );
};
