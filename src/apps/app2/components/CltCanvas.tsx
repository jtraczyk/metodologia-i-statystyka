import React, { useMemo } from 'react';
import {
  PopulationConfig,
  SampleItem,
  CltStats,
  CltDisplaySettings,
  FallingPoint,
} from '../types';
import {
  getPopulationPdfCurve,
  getTheoreticalCltCurve,
  formatNum,
} from '../utils/statistics';

interface CltCanvasProps {
  population: PopulationConfig;
  sampleSizeN: number;
  sampleMeans: number[];
  currentSample: SampleItem | null;
  cltStats: CltStats;
  displaySettings: CltDisplaySettings;
  animationPhase: 'idle' | 'sampling' | 'averaging' | 'falling' | 'landing';
  animationProgress: number;
  animatedPoints: { id: number; value: number; currentX: number; currentY: number; opacity: number }[];
  fallingPoints: FallingPoint[];
  minX: number;
  maxX: number;
}

export const CltCanvas: React.FC<CltCanvasProps> = ({
  population,
  sampleSizeN,
  sampleMeans,
  currentSample,
  cltStats,
  displaySettings,
  animationPhase,
  animatedPoints,
  fallingPoints,
  minX,
  maxX,
}) => {
  // SVG Canvas geometry
  const width = 940;
  const height = 630;
  const margin = { left: 60, right: 40, top: 38, bottom: 42 };
  const plotWidth = width - margin.left - margin.right;

  // Split into Top Plot (Population) and Bottom Plot (Sampling Distribution)
  const topPlot = {
    top: 42,
    height: 195,
    bottom: 237,
  };

  const bottomPlot = {
    top: 335,
    height: 245,
    bottom: 580,
  };

  // Shared horizontal scaling function
  const scaleX = (val: number) => {
    return margin.left + ((val - minX) / (maxX - minX)) * plotWidth;
  };

  // =========================================================================
  // 1. TOP PLOT (ROZKŁAD POPULACJI - KOLOR #009EE0)
  // =========================================================================
  const populationCurve = useMemo(() => {
    return getPopulationPdfCurve(population.type, population.mean, population.sd, minX, maxX, 180);
  }, [population.type, population.mean, population.sd, minX, maxX]);

  const maxPopPdf = useMemo(() => {
    let m = 0;
    populationCurve.forEach((p) => {
      if (p.y > m) m = p.y;
    });
    return Math.max(m * 1.25, 0.05);
  }, [populationCurve]);

  const scalePopY = (pdfY: number) => {
    return topPlot.bottom - (pdfY / maxPopPdf) * topPlot.height;
  };

  const popPathD = useMemo(() => {
    if (populationCurve.length === 0) return '';
    return populationCurve
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.x).toFixed(1)} ${scalePopY(pt.y).toFixed(1)}`)
      .join(' ');
  }, [populationCurve, minX, maxX, maxPopPdf]);

  const popAreaD = useMemo(() => {
    if (populationCurve.length === 0) return '';
    const firstX = scaleX(populationCurve[0].x).toFixed(1);
    const lastX = scaleX(populationCurve[populationCurve.length - 1].x).toFixed(1);
    const baselineY = topPlot.bottom.toFixed(1);
    return `${popPathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [popPathD, populationCurve, topPlot.bottom]);

  // =========================================================================
  // 2. BOTTOM PLOT (ROZKŁAD ŚREDNICH Z PRÓB - KOLOR #F29400)
  // Stacked Circles permanently present in columns
  // =========================================================================
  const { persistentDots, maxStack, dy } = useMemo(() => {
    const K = sampleMeans.length;
    if (K === 0) {
      return { persistentDots: [], maxStack: 0, dy: 9, r: 4.5 };
    }

    let dotR = 4.5;
    if (K > 600) dotR = 2.2;
    else if (K > 250) dotR = 2.9;
    else if (K > 80) dotR = 3.8;

    const slotCount = Math.min(100, Math.max(50, Math.floor(plotWidth / (2 * dotR + 1))));
    const slotWidth = (maxX - minX) / slotCount;

    const stackCounts = new Array(slotCount).fill(0);
    for (let i = 0; i < K; i++) {
      const val = sampleMeans[i];
      const s = Math.min(slotCount - 1, Math.max(0, Math.floor((val - minX) / slotWidth)));
      stackCounts[s]++;
    }

    const calculatedMaxStack = Math.max(...stackCounts, 1);
    const availableHeight = bottomPlot.height - 35;
    const stepY = calculatedMaxStack * (2 * dotR) > availableHeight
      ? Math.max(1.1, availableHeight / calculatedMaxStack)
      : 2 * dotR;

    const curLevel = new Array(slotCount).fill(0);
    const dots: {
      id: number;
      value: number;
      cx: number;
      cy: number;
      r: number;
      isLatest: boolean;
    }[] = [];

    for (let i = 0; i < K; i++) {
      const val = sampleMeans[i];
      const s = Math.min(slotCount - 1, Math.max(0, Math.floor((val - minX) / slotWidth)));
      const level = curLevel[s]++;
      const cx = scaleX(minX + (s + 0.5) * slotWidth);
      const cy = bottomPlot.bottom - level * stepY - dotR - 1;
      dots.push({
        id: i,
        value: val,
        cx,
        cy,
        r: dotR,
        isLatest: i === K - 1,
      });
    }

    return {
      persistentDots: dots,
      maxStack: calculatedMaxStack,
      dy: stepY,
      r: dotR,
    };
  }, [sampleMeans, minX, maxX, plotWidth, bottomPlot.bottom, bottomPlot.height]);

  // Theoretical CLT Normal Curve - themed with #F29400
  const theoreticalSE = cltStats.theoreticalSE;
  const theoreticalCltCurve = useMemo(() => {
    if (sampleSizeN <= 0 || theoreticalSE <= 0) return [];
    return getTheoreticalCltCurve(population.mean, theoreticalSE, minX, maxX, 220);
  }, [population.mean, theoreticalSE, minX, maxX, sampleSizeN]);

  const curveApexHeight = useMemo(() => {
    const K = sampleMeans.length;
    if (K < 15) {
      return bottomPlot.height * 0.78;
    }
    const stackHeightPx = maxStack * dy;
    return Math.min(bottomPlot.height - 25, Math.max(bottomPlot.height * 0.65, stackHeightPx * 1.15));
  }, [sampleMeans.length, maxStack, dy, bottomPlot.height]);

  const maxCltPdf = useMemo(() => {
    let m = 0;
    theoreticalCltCurve.forEach((p) => {
      if (p.y > m) m = p.y;
    });
    return m > 0 ? m : 0.1;
  }, [theoreticalCltCurve]);

  const scaleBottomY = (pdfY: number) => {
    return bottomPlot.bottom - (pdfY / maxCltPdf) * curveApexHeight;
  };

  const cltPathD = useMemo(() => {
    if (theoreticalCltCurve.length === 0) return '';
    return theoreticalCltCurve
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.x).toFixed(1)} ${scaleBottomY(pt.y).toFixed(1)}`)
      .join(' ');
  }, [theoreticalCltCurve, minX, maxX, maxCltPdf, curveApexHeight]);

  const cltAreaD = useMemo(() => {
    if (theoreticalCltCurve.length === 0) return '';
    const firstX = scaleX(theoreticalCltCurve[0].x).toFixed(1);
    const lastX = scaleX(theoreticalCltCurve[theoreticalCltCurve.length - 1].x).toFixed(1);
    const baselineY = bottomPlot.bottom.toFixed(1);
    return `${cltPathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [cltPathD, theoreticalCltCurve, bottomPlot.bottom]);

  // Horizontal ticks for shared X axis
  const xTicks = useMemo(() => {
    const range = maxX - minX;
    const step = range <= 40 ? 5 : range <= 80 ? 10 : 20;
    const ticks: number[] = [];
    const start = Math.ceil(minX / step) * step;
    for (let x = start; x <= maxX; x += step) {
      ticks.push(x);
    }
    return ticks;
  }, [minX, maxX]);

  const currentSampleMean = currentSample?.mean ?? null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Visual Canvas Area */}
      <div className="relative w-full bg-slate-50/50 p-2 sm:p-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-sans"
          style={{ minWidth: '640px', maxHeight: '760px' }}
        >
          <defs>
            {/* Gradients: Top is #009EE0, Bottom is #F29400 */}
            <linearGradient id="popAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009EE0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#009EE0" stopOpacity="0.02" />
            </linearGradient>

            <linearGradient id="cltAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F29400" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F29400" stopOpacity="0.01" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="strongGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ====================================================================
              TOP ZONE: POPULATION DISTRIBUTION (COLOR #009EE0)
             ==================================================================== */}
          <g id="top-population-group">
            {/* Title & Badge */}
            <text x={margin.left} y={topPlot.top - 16} fill="#009EE0" className="text-xs font-bold tracking-tight">
              1. Rozkład cechy w populacji (Rozkład macierzysty)
            </text>
            <text x={margin.left + 360} y={topPlot.top - 16} fill="#64748b" className="text-[11px] font-medium">
              μ = {formatNum(population.mean, 1)}, σ = {formatNum(population.sd, 1)}
            </text>

            {/* Background Panel Box */}
            <rect
              x={margin.left}
              y={topPlot.top}
              width={plotWidth}
              height={topPlot.height}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1"
              rx="8"
            />

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac) => {
              const y = topPlot.bottom - frac * topPlot.height;
              return (
                <line
                  key={`top-grid-${frac}`}
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* Vertical Tick lines */}
            {xTicks.map((xVal) => {
              const xPos = scaleX(xVal);
              return (
                <line
                  key={`top-xtick-${xVal}`}
                  x1={xPos}
                  y1={topPlot.top}
                  x2={xPos}
                  y2={topPlot.bottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* Population Theoretical Area & Curve (STRICTLY #009EE0) */}
            {popAreaD && <path d={popAreaD} fill="url(#popAreaGrad)" />}
            {popPathD && (
              <path
                d={popPathD}
                fill="none"
                stroke="#009EE0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Population Mean Vertical Line (μ) in #009EE0 */}
            {population.mean >= minX && population.mean <= maxX && (
              <g>
                <line
                  x1={scaleX(population.mean)}
                  y1={topPlot.top}
                  x2={scaleX(population.mean)}
                  y2={topPlot.bottom}
                  stroke="#009EE0"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x={scaleX(population.mean)}
                  y={topPlot.top + 14}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-[#007BB0]"
                >
                  μ = {formatNum(population.mean, 1)}
                </text>
              </g>
            )}

            {/* X-axis ticks & labels for top plot */}
            {xTicks.map((xVal) => {
              const xPos = scaleX(xVal);
              return (
                <g key={`top-label-${xVal}`}>
                  <line x1={xPos} y1={topPlot.bottom} x2={xPos} y2={topPlot.bottom + 4} stroke="#94a3b8" strokeWidth="1" />
                  <text
                    x={xPos}
                    y={topPlot.bottom + 15}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-500 font-mono"
                  >
                    {xVal}
                  </text>
                </g>
              );
            })}

            {/* Sampled animated observations on top plot (STRICTLY #009EE0) */}
            {(animationPhase === 'sampling' || animationPhase === 'averaging') &&
              animatedPoints.map((pt, idx) => {
                return (
                  <g key={`anim-pt-${idx}`} style={{ opacity: pt.opacity }}>
                    <line
                      x1={pt.currentX}
                      y1={pt.currentY}
                      x2={pt.currentX}
                      y2={topPlot.bottom}
                      stroke="#009EE0"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.35"
                    />
                    <circle
                      cx={pt.currentX}
                      cy={pt.currentY}
                      r={sampleSizeN > 40 ? 3 : sampleSizeN > 15 ? 4.5 : 6}
                      fill="#009EE0"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      filter="url(#softGlow)"
                    />
                    {sampleSizeN <= 10 && (
                      <text
                        x={pt.currentX}
                        y={pt.currentY - 8}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-[#004F70] font-mono"
                      >
                        {formatNum(pt.value, 1)}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* Merged Mean point indicator on top plot during averaging */}
            {animationPhase === 'averaging' && currentSampleMean !== null && (
              <g>
                <line
                  x1={scaleX(currentSampleMean)}
                  y1={topPlot.top}
                  x2={scaleX(currentSampleMean)}
                  y2={topPlot.bottom}
                  stroke="#F29400"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                <circle
                  cx={scaleX(currentSampleMean)}
                  cy={topPlot.bottom - 16}
                  r="8"
                  fill="#F29400"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#strongGlow)"
                />
                <text
                  x={scaleX(currentSampleMean)}
                  y={topPlot.bottom - 28}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-[#b45309] font-mono"
                >
                  x̄ = {formatNum(currentSampleMean, 2)}
                </text>
              </g>
            )}
          </g>

          {/* ====================================================================
              MIDDLE TRANSFER ZONE: ANIMATED DROPPING MEAN(S) - COLOR #F29400
             ==================================================================== */}
          <g id="transfer-zone">
            {fallingPoints.map((fp) => (
              <g key={`falling-pt-${fp.id}`} style={{ opacity: fp.opacity }}>
                {fallingPoints.length <= 6 && (
                  <line
                    x1={fp.x}
                    y1={topPlot.bottom}
                    x2={fp.x}
                    y2={bottomPlot.bottom}
                    stroke="#F29400"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.35"
                  />
                )}

                {/* Animated Falling Ball with Motion Trail in #F29400 */}
                {fallingPoints.length <= 15 && (
                  <circle
                    cx={fp.x}
                    cy={fp.y - 12}
                    r={fallingPoints.length > 20 ? 2 : 4}
                    fill="#F29400"
                    opacity="0.3"
                  />
                )}
                <circle
                  cx={fp.x}
                  cy={fp.y}
                  r={fallingPoints.length > 30 ? 3.5 : fallingPoints.length > 10 ? 5 : 7.5}
                  fill="#F29400"
                  stroke="#ffffff"
                  strokeWidth={fallingPoints.length > 15 ? 1 : 2}
                  filter={fallingPoints.length <= 6 ? 'url(#strongGlow)' : undefined}
                />

                {fallingPoints.length === 1 && (
                  <text
                    x={fp.x + 13}
                    y={fp.y + 4}
                    fill="#b45309"
                    className="text-[10px] font-bold font-mono"
                  >
                    x̄ = {formatNum(fp.value, 2)}
                  </text>
                )}
              </g>
            ))}

            {/* Context message during stages */}
            {animationPhase === 'idle' && sampleMeans.length === 0 && (
              <g transform={`translate(${width / 2 - 125}, ${(topPlot.bottom + bottomPlot.top) / 2 - 13})`}>
                <rect width="250" height="26" rx="13" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <text x="125" y="17" textAnchor="middle" className="text-[11px] font-medium fill-slate-600">
                  Pobierz próbkę z menu po prawej stronie →
                </text>
              </g>
            )}

            {animationPhase === 'falling' && (
              <g transform={`translate(${width / 2 - 130}, ${(topPlot.bottom + bottomPlot.top) / 2 - 13})`}>
                <rect width="260" height="26" rx="13" fill="#fffbeb" stroke="#fcd34d" strokeWidth="1" />
                <text x="130" y="17" textAnchor="middle" className="text-[11px] font-bold fill-[#b45309]">
                  {fallingPoints.length > 1
                    ? `Punkty spadają na dolny rozkład: ${fallingPoints.length} prób ↓`
                    : 'Średnia z próby (x̄) spada na dolny rozkład ↓'}
                </text>
              </g>
            )}

            {animationPhase === 'averaging' && (
              <g transform={`translate(${width / 2 - 120}, ${(topPlot.bottom + bottomPlot.top) / 2 - 13})`}>
                <rect width="240" height="26" rx="13" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
                <text x="120" y="17" textAnchor="middle" className="text-[11px] font-bold fill-[#007BB0]">
                  Uśrednianie: punkty zjeżdżają się do x̄
                </text>
              </g>
            )}
          </g>

          {/* ====================================================================
              BOTTOM ZONE: SAMPLING DISTRIBUTION OF THE MEAN (STRICTLY #F29400)
             ==================================================================== */}
          <g id="bottom-sampling-group">
            {/* Title & Info - Updated exact wording requested by user */}
            <text x={margin.left} y={bottomPlot.top - 16} fill="#D37E00" className="text-xs font-bold tracking-tight">
              2. Rozkład średnich z prób (Każdy punkt to średnia z jednej próby o n = {sampleSizeN})
            </text>
            <text x={margin.left + 470} y={bottomPlot.top - 16} fill="#64748b" className="text-[11px] font-medium">
              Liczba wylosowanych prób (K) = <tspan className="font-bold text-slate-800">{sampleMeans.length}</tspan> | Teoretyczny SE = <tspan fill="#D37E00" className="font-bold">{formatNum(theoreticalSE, 2)}</tspan>
            </text>

            {/* Background Box */}
            <rect
              x={margin.left}
              y={bottomPlot.top}
              width={plotWidth}
              height={bottomPlot.height}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1"
              rx="8"
            />

            {/* Standard Error Bands in #F29400 (± 1 SE, ± 2 SE) */}
            {displaySettings.showStandardErrorBands && theoreticalSE > 0 && (
              <g>
                <rect
                  x={Math.max(margin.left, scaleX(population.mean - 2 * theoreticalSE))}
                  y={bottomPlot.top}
                  width={Math.min(
                    plotWidth,
                    scaleX(population.mean + 2 * theoreticalSE) - scaleX(population.mean - 2 * theoreticalSE)
                  )}
                  height={bottomPlot.height}
                  fill="#F29400"
                  fillOpacity="0.04"
                />
                <rect
                  x={Math.max(margin.left, scaleX(population.mean - theoreticalSE))}
                  y={bottomPlot.top}
                  width={Math.min(
                    plotWidth,
                    scaleX(population.mean + theoreticalSE) - scaleX(population.mean - theoreticalSE)
                  )}
                  height={bottomPlot.height}
                  fill="#F29400"
                  fillOpacity="0.08"
                />
              </g>
            )}

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac) => {
              const y = bottomPlot.bottom - frac * bottomPlot.height;
              return (
                <line
                  key={`bottom-grid-${frac}`}
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* Vertical Tick lines */}
            {xTicks.map((xVal) => {
              const xPos = scaleX(xVal);
              return (
                <line
                  key={`bottom-xtick-${xVal}`}
                  x1={xPos}
                  y1={bottomPlot.top}
                  x2={xPos}
                  y2={bottomPlot.bottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* PERMANENT STACKED POINTS IN #F29400 */}
            <g id="persistent-dots-layer">
              {persistentDots.map((dot) => {
                return (
                  <circle
                    key={`dot-${dot.id}`}
                    cx={dot.cx}
                    cy={dot.cy}
                    r={dot.r}
                    fill={dot.isLatest ? '#FBBF24' : '#F29400'}
                    stroke={dot.isLatest ? '#ffffff' : '#b45309'}
                    strokeWidth={dot.isLatest ? 1.5 : 0.6}
                    opacity={dot.isLatest ? 1 : 0.88}
                  />
                );
              })}
            </g>

            {/* Theoretical CLT Normal Curve - STRICTLY #F29400 */}
            {displaySettings.showTheoreticalCurve && cltAreaD && (
              <path d={cltAreaD} fill="url(#cltAreaGrad)" />
            )}
            {displaySettings.showTheoreticalCurve && cltPathD && (
              <path
                d={cltPathD}
                fill="none"
                stroke="#F29400"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Target Mean Vertical Line (μ) */}
            {population.mean >= minX && population.mean <= maxX && (
              <g>
                <line
                  x1={scaleX(population.mean)}
                  y1={bottomPlot.top}
                  x2={scaleX(population.mean)}
                  y2={bottomPlot.bottom}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x={scaleX(population.mean)}
                  y={bottomPlot.top + 14}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-slate-600"
                >
                  μ = {formatNum(population.mean, 1)}
                </text>
              </g>
            )}

            {/* Empirical Mean of Means Line (x̄̄) in #F29400 */}
            {sampleMeans.length > 0 && cltStats.meanOfMeans >= minX && cltStats.meanOfMeans <= maxX && (
              <g>
                <line
                  x1={scaleX(cltStats.meanOfMeans)}
                  y1={bottomPlot.top}
                  x2={scaleX(cltStats.meanOfMeans)}
                  y2={bottomPlot.bottom}
                  stroke="#D37E00"
                  strokeWidth="2"
                />
                <text
                  x={scaleX(cltStats.meanOfMeans)}
                  y={bottomPlot.bottom - 10}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-[#b45309] bg-white"
                >
                  x̄̄ = {formatNum(cltStats.meanOfMeans, 2)}
                </text>
              </g>
            )}

            {/* Landing ripple effect when the latest mean has landed */}
            {animationPhase === 'landing' && currentSampleMean !== null && (
              <g>
                <circle
                  cx={scaleX(currentSampleMean)}
                  cy={bottomPlot.bottom - 8}
                  r="14"
                  fill="none"
                  stroke="#F29400"
                  strokeWidth="2"
                  opacity="0.8"
                />
              </g>
            )}

            {/* X-axis ticks & labels for bottom plot */}
            {xTicks.map((xVal) => {
              const xPos = scaleX(xVal);
              return (
                <g key={`bottom-label-${xVal}`}>
                  <line x1={xPos} y1={bottomPlot.bottom} x2={xPos} y2={bottomPlot.bottom + 4} stroke="#94a3b8" strokeWidth="1" />
                  <text
                    x={xPos}
                    y={bottomPlot.bottom + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-600 font-mono"
                  >
                    {xVal}
                  </text>
                </g>
              );
            })}

            {/* Axis Title */}
            <text
              x={margin.left + plotWidth / 2}
              y={bottomPlot.bottom + 33}
              textAnchor="middle"
              fill="#9a3412"
              className="text-xs font-semibold"
            >
              Wartość cechy / Średnia z próby (x̄)
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Clean Scientific Labels (NO technical hex codes in text) */}
      <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#009EE0] border border-[#007BB0]"></span>
            <span>Górny wykres: Obserwacje w wylosowanej próbie (xᵢ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F29400] border border-[#b45309]"></span>
            <span>Dolny wykres: Każdy punkt to średnia z jednej próby (x̄)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#F29400]"></span>
            <span>Teoretyczna krzywa CTG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#D37E00]"></span>
            <span>Średnia ze wszystkich prób (x̄̄)</span>
          </div>
        </div>

        {currentSample && (
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <span className="text-slate-500">Ostatnia próba:</span>
            <span className="font-mono bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-bold">
              x̄ = {formatNum(currentSample.mean, 2)}
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-600">
              s = {formatNum(currentSample.sd, 2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
