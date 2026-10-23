import React, { useMemo } from 'react';
import {
  PopulationConfig,
  SampleItem,
  CltStats,
  CiCoverageStats,
  CltDisplaySettings,
} from '../types';
import { formatNum } from '../utils/statistics';

interface CltCanvasProps {
  population: PopulationConfig;
  sampleSizeN: number;
  confidenceLevel: number;
  samples: SampleItem[];
  currentSample: SampleItem | null;
  cltStats: CltStats;
  coverageStats: CiCoverageStats;
  displaySettings: CltDisplaySettings;
  onUpdateDisplaySettings?: (updates: Partial<CltDisplaySettings>) => void;
  animationPhase?: 'idle' | 'sampling' | 'averaging' | 'falling' | 'landing';
  animatedPoints?: { id: number; value: number; currentX: number; currentY: number; opacity: number }[];
  fallingPoints?: unknown[];
  minX: number;
  maxX: number;
}

export const CltCanvas: React.FC<CltCanvasProps> = ({
  population,
  sampleSizeN,
  confidenceLevel,
  samples,
  currentSample,
  coverageStats,
  minX,
  maxX,
}) => {
  // SVG Canvas geometry - dedicated full-stage view with narrowed CI area and wide p-value display
  const width = 960;
  const height = 560;
  const margin = { left: 45, right: 180, top: 48, bottom: 42 };
  const plotWidth = width - margin.left - margin.right;
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const plotHeight = plotBottom - plotTop;

  // Maximum visible rows in the waterfall
  const maxRows = 20;
  const rowHeight = (plotHeight - 16) / maxRows;

  // Shared horizontal scaling function: val -> X pixel coordinate
  const scaleX = (val: number) => {
    return margin.left + ((val - minX) / (maxX - minX)) * plotWidth;
  };

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

  // Display the last maxRows samples with newest at the top
  const recentSamples = useMemo(() => {
    return samples.slice(-maxRows).reverse();
  }, [samples]);

  const latestSampleId = currentSample ? currentSample.id : null;
  const confidencePercent = Math.round(confidenceLevel * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Visual Canvas Area */}
      <div className="relative w-full bg-slate-50/50 p-2 sm:p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-sans block"
          style={{ maxHeight: '720px' }}
        >
          <defs>
            {/* Visual glow filters for confidence intervals */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="amberGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ====================================================================
              CONFIDENCE INTERVALS DANCE CANVAS (TANIEC PRZEDZIAŁÓW CI)
             ==================================================================== */}
          <g id="ci-dance-group">
            {/* Header Title & Live Counter */}
            <text x={margin.left} y={plotTop - 18} fill="#D37E00" className="text-xs font-bold tracking-tight">
              Taniec przedziałów ufności ({confidencePercent}% CI)
            </text>
            <text x={margin.left + 270} y={plotTop - 18} fill="#64748b" className="text-[11px] font-medium">
              Liczba prób: <tspan className="font-bold text-slate-800">{samples.length}</tspan> | Pokrycie μ:{' '}
              <tspan
                className="font-bold font-mono"
                fill={coverageStats.coverageRate >= confidenceLevel - 0.05 ? '#15803d' : '#009EE0'}
              >
                {coverageStats.coveredCount}/{coverageStats.totalCount || 0} ({formatNum(coverageStats.coverageRate * 100, 1)}%)
              </tspan>
            </text>

            {/* Background Plot Frame (Narrowed confidence intervals field) */}
            <rect
              x={margin.left}
              y={plotTop}
              width={plotWidth}
              height={plotHeight}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1"
              rx="8"
            />

            {/* Right Information Panel Box for p-values & coverage */}
            {(() => {
              const rightBoxX = margin.left + plotWidth + 8;
              const rightBoxWidth = margin.right - 14;
              return (
                <g id="p-value-panel-container">
                  <rect
                    x={rightBoxX}
                    y={plotTop}
                    width={rightBoxWidth}
                    height={plotHeight}
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    rx="6"
                  />
                  {/* Panel subheadings */}
                  <text
                    x={rightBoxX + 22}
                    y={plotTop + 16}
                    textAnchor="middle"
                    className="text-[9.5px] font-bold fill-slate-500 uppercase tracking-wider"
                  >
                    Status
                  </text>
                  <text
                    x={rightBoxX + 46}
                    y={plotTop + 16}
                    className="text-[10.5px] font-bold fill-slate-700 uppercase tracking-wider"
                  >
                    Wartość p
                  </text>
                  <line
                    x1={rightBoxX + 6}
                    y1={plotTop + 23}
                    x2={rightBoxX + rightBoxWidth - 6}
                    y2={plotTop + 23}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                </g>
              );
            })()}

            {/* Vertical Tick Grid Lines */}
            {xTicks.map((xVal) => {
              const xPos = scaleX(xVal);
              return (
                <line
                  key={`xtick-line-${xVal}`}
                  x1={xPos}
                  y1={plotTop}
                  x2={xPos}
                  y2={plotBottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              );
            })}

            {/* TRUE POPULATION MEAN REFERENCE LINE (μ = 50) */}
            {population.mean >= minX && population.mean <= maxX && (
              <g id="mu-true-reference-line">
                {/* Thick vertical dashed line through the entire chart */}
                <line
                  x1={scaleX(population.mean)}
                  y1={plotTop}
                  x2={scaleX(population.mean)}
                  y2={plotBottom}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <circle
                  cx={scaleX(population.mean)}
                  cy={plotTop + 8}
                  r="3.5"
                  fill="#334155"
                />
                {/* μ Label Badge at top */}
                <rect
                  x={scaleX(population.mean) - 52}
                  y={plotTop + 1}
                  width="104"
                  height="16"
                  rx="4"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                <text
                  x={scaleX(population.mean)}
                  y={plotTop + 12}
                  textAnchor="middle"
                  className="text-[10px] font-extrabold fill-slate-800"
                >
                  Prawdziwe μ = {formatNum(population.mean, 1)}
                </text>
              </g>
            )}

            {/* ================================================================
                SMOOTH WATERFALL LADDER (DANCE OF CONFIDENCE INTERVALS)
                Hardware-accelerated CSS transition on translateY for each row
               ================================================================ */}
            <g id="waterfall-ci-ladder">
              {recentSamples.map((sample, idx) => {
                const rowY = plotTop + 24 + idx * rowHeight;
                const isLatest = sample.id === latestSampleId;
                const isCovered = sample.containsMu;
                const xMean = scaleX(sample.mean);
                const xLow = scaleX(sample.ciLower);
                const xUp = scaleX(sample.ciUpper);

                const barColor = isCovered ? '#F29400' : '#009EE0';
                const dotColor = isCovered ? (isLatest ? '#FBBF24' : '#F29400') : '#009EE0';

                return (
                  <g
                    key={`ci-sample-${sample.id}`}
                    style={{
                      transform: `translate(0px, ${rowY}px)`,
                      transition: 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms ease-out',
                    }}
                  >
                    {/* Row alternating light background */}
                    <rect
                      x={margin.left + 1}
                      y={-rowHeight / 2}
                      width={plotWidth - 2}
                      height={rowHeight}
                      fill={isLatest ? (isCovered ? '#fffbeb' : '#f0f9ff') : (idx % 2 === 0 ? '#fafafa' : '#ffffff')}
                      opacity={isLatest ? 0.95 : 0.6}
                      rx="3"
                    />

                    {/* Sample Number Label on left margin */}
                    <text
                      x={margin.left + 8}
                      y={3.5}
                      className="text-[9.5px] font-mono fill-slate-400 font-semibold"
                    >
                      #{samples.length - idx}
                    </text>

                    {/* Confidence Interval Error Bar */}
                    <line
                      x1={xLow}
                      y1={0}
                      x2={xUp}
                      y2={0}
                      stroke={barColor}
                      strokeWidth={isLatest ? 3.2 : 2.2}
                      strokeLinecap="round"
                      className={isLatest ? 'animate-ci-expand' : undefined}
                    />

                    {/* Left Whisker Cap */}
                    <line
                      x1={xLow}
                      y1={-(isLatest ? 6.5 : 5)}
                      x2={xLow}
                      y2={isLatest ? 6.5 : 5}
                      stroke={barColor}
                      strokeWidth={isLatest ? 2.6 : 2}
                    />

                    {/* Right Whisker Cap */}
                    <line
                      x1={xUp}
                      y1={-(isLatest ? 6.5 : 5)}
                      x2={xUp}
                      y2={isLatest ? 6.5 : 5}
                      stroke={barColor}
                      strokeWidth={isLatest ? 2.6 : 2}
                    />

                    {/* Center Mean Dot (x̄) */}
                    <circle
                      cx={xMean}
                      cy={0}
                      r={isLatest ? 4.8 : 3.4}
                      fill={dotColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className={isLatest ? 'animate-ci-pulse' : undefined}
                    />

                    {/* Subtle pulse ring for latest drawn sample */}
                    {isLatest && (
                      <circle
                        cx={xMean}
                        cy={0}
                        r="12"
                        fill="none"
                        stroke={barColor}
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                    )}

                    {/* Right Margin Stats Info: status icon and enlarged p-value */}
                    {(() => {
                      const rightBoxX = margin.left + plotWidth + 8;
                      const isSignificantP05 = sample.pValue < 0.05;
                      return (
                        <g transform={`translate(${rightBoxX}, 0)`}>
                          {/* Status Icon Indicator: Green (p >= 0.05) or Red (p < 0.05) */}
                          <circle
                            cx={22}
                            cy={0}
                            r={7.5}
                            fill={isSignificantP05 ? '#fee2e2' : '#dcfce7'}
                            stroke={isSignificantP05 ? '#dc2626' : '#16a34a'}
                            strokeWidth="1.5"
                          />
                          <text
                            x={22}
                            y={3.5}
                            textAnchor="middle"
                            fill={isSignificantP05 ? '#b91c1c' : '#15803d'}
                            className="text-[10px] font-extrabold"
                          >
                            {isSignificantP05 ? '✗' : '✓'}
                          </text>

                          {/* Unified p-value text in consistent dark font */}
                          <text
                            x={46}
                            y={4.5}
                            fill="#0f172a"
                            className="text-[13px] font-mono font-bold"
                          >
                            p = {formatNum(sample.pValue, 3)}
                            {isSignificantP05 && ' *'}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Empty state prompt if no samples drawn yet */}
              {samples.length === 0 && (
                <g transform={`translate(${margin.left + plotWidth / 2}, ${plotTop + plotHeight / 2})`}>
                  <rect
                    x="-180"
                    y="-20"
                    width="360"
                    height="40"
                    rx="10"
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    className="shadow-xs"
                  />
                  <text textAnchor="middle" y="5" fill="#64748b" className="text-xs font-medium">
                    Brak prób. Kliknij „Wylosuj 1 próbkę” lub „Automatyczne losowanie” →
                  </text>
                </g>
              )}
            </g>

            {/* X-axis ticks & labels for plot */}
            {xTicks.map((xVal) => {
              const xPos = scaleX(xVal);
              return (
                <g key={`axis-label-${xVal}`}>
                  <line
                    x1={xPos}
                    y1={plotBottom}
                    x2={xPos}
                    y2={plotBottom + 5}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={xPos}
                    y={plotBottom + 18}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-600 font-mono font-medium"
                  >
                    {xVal}
                  </text>
                </g>
              );
            })}

            {/* Bottom Axis Title */}
            <text
              x={margin.left + plotWidth / 2}
              y={plotBottom + 35}
              textAnchor="middle"
              fill="#9a3412"
              className="text-xs font-semibold"
            >
              Wartość cechy / Średnia z próby (x̄) wraz z przedziałem {confidencePercent}% CI
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Bottom Toolbar: Educational Legend & Latest Readout */}
      <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Dynamic Color Legend */}
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full bg-[#F29400] inline-block"></span>
            <span>Zawiera prawdziwe μ (sukces, p ≥ α)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#009EE0' }}></span>
            <span className="font-semibold" style={{ color: '#009EE0' }}>
              Chybił μ (brak pokrycia, p &lt; α)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-700"></span>
            <span className="font-medium text-slate-800">Prawdziwe μ = {formatNum(population.mean, 1)}</span>
          </div>
        </div>

        {/* Latest Sample Readout */}
        {currentSample && (
          <div className="flex items-center gap-2 text-slate-700 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-sans">Ostatnia:</span>
            <span className="font-mono font-bold text-slate-900">
              x̄ = {formatNum(currentSample.mean, 2)}
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-700">
              {confidencePercent}% CI: [{formatNum(currentSample.ciLower, 1)}, {formatNum(currentSample.ciUpper, 1)}]
            </span>
            <span className="text-slate-400">·</span>
            <span
              className="font-mono font-bold px-1.5 py-0.5 rounded border"
              style={
                !currentSample.containsMu
                  ? { backgroundColor: '#f0f9ff', color: '#009EE0', borderColor: '#009EE0' }
                  : { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
              }
            >
              p = {formatNum(currentSample.pValue, 3)}
              {!currentSample.containsMu && ' *'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
