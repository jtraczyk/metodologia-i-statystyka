import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Download, Maximize2, Sparkles } from 'lucide-react';
import { DatasetConfig, LayerSettings, StatisticalSummary } from '../types';
import { formatStat } from '../utils/statistics';

interface BoxPlotCanvasProps {
  datasets: DatasetConfig[];
  summaries: Record<string, StatisticalSummary>;
  layers: LayerSettings;
}

interface HoverState {
  type: 'box' | 'point' | 'mean' | 'violin' | 'outlier';
  datasetName: string;
  datasetColor: string;
  x: number;
  y: number;
  data: {
    value?: number;
    median?: number;
    mean?: number;
    q1?: number;
    q3?: number;
    iqr?: number;
    lowerWhisker?: number;
    upperWhisker?: number;
    outliersCount?: number;
    n?: number;
    pointIndex?: number;
  };
}

export const BoxPlotCanvas: React.FC<BoxPlotCanvasProps> = ({
  datasets,
  summaries,
  layers,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hover, setHover] = useState<HoverState | null>(null);

  // ResizeObserver for fluid responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.max(width, 400),
            height: Math.max(height, 380),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute common Y domain covering all datasets
  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    datasets.forEach((dataset) => {
      const summary = summaries[dataset.id];
      if (!summary) return;

      dataset.rawPoints.forEach((p) => {
        if (p < min) min = p;
        if (p > max) max = p;
      });

      // Also consider KDE evaluation endpoints
      summary.kde.forEach((k) => {
        if (k.value < min) min = k.value;
        if (k.value > max) max = k.value;
      });
    });

    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 100 };
    }

    // Add 8% padding to top and bottom
    const span = Math.max(max - min, 10);
    const paddedMin = Math.floor(min - span * 0.08);
    const paddedMax = Math.ceil(max + span * 0.08);

    return { min: paddedMin, max: paddedMax };
  }, [datasets, summaries]);

  // Layout margins
  const margin = { top: 40, right: 30, bottom: 50, left: 60 };
  const innerWidth = Math.max(dimensions.width - margin.left - margin.right, 200);
  const innerHeight = Math.max(dimensions.height - margin.top - margin.bottom, 200);

  // Linear Y scale
  const yScale = (val: number) => {
    const range = yDomain.max - yDomain.min || 1;
    return margin.top + innerHeight - ((val - yDomain.min) / range) * innerHeight;
  };

  // Generate 7-8 readable ticks
  const yTicks = useMemo(() => {
    const span = yDomain.max - yDomain.min;
    const tickCount = 7;
    const rawStep = span / tickCount;
    // Round step to neat number (1, 2, 5, 10, 20, 25, 50)
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    let neatStep = magnitude;
    if (normalized > 5) neatStep = 10 * magnitude;
    else if (normalized > 2) neatStep = 5 * magnitude;
    else if (normalized > 1) neatStep = 2 * magnitude;

    const ticks: number[] = [];
    const firstTick = Math.ceil(yDomain.min / neatStep) * neatStep;
    for (let t = firstTick; t <= yDomain.max; t += neatStep) {
      ticks.push(t);
    }
    return ticks;
  }, [yDomain]);

  // Column positioning for each dataset
  const numDatasets = datasets.length;
  const colWidth = innerWidth / (numDatasets || 1);
  const maxHalfWidth = Math.min(colWidth * 0.38, 90);
  const boxWidth = Math.min(colWidth * 0.28, 56);

  // Export SVG function
  const handleExportSVG = () => {
    const svgElem = containerRef.current?.querySelector('svg');
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wykres-rozkladu-statystyka.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
      {/* Top Chart Toolbar */}
      <div className="px-4 py-2.5 bg-white/60 backdrop-blur-xs border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Legend */}
        <div className="flex items-center flex-wrap gap-4 text-slate-600">
          <span className="font-semibold text-slate-800">Warstwy i oznaczenia:</span>

          {layers.showBoxPlot && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3 bg-white/90 border-2 border-slate-700 rounded-2xs" />
              <span>IQR (Q1 - Q3)</span>
            </div>
          )}

          {layers.showBoxPlot && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-1 bg-slate-900 rounded-full" />
              <span>Mediana</span>
            </div>
          )}

          {layers.showMeanMarker && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[#E2001A] border border-[#B30015]" />
              <span>Średnia próby (M)</span>
            </div>
          )}

          {layers.showViolin && (
            <div className="flex items-center gap-1.5">
              <span 
                className="inline-block w-3.5 h-3.5 rounded-full border" 
                style={{ 
                  backgroundColor: 'rgba(0, 158, 224, 0.3)', 
                  borderColor: '#009EE0' 
                }} 
              />
              <span>Wykres wiolinowy (rozkład gęstości)</span>
            </div>
          )}

          {layers.showBoxPlot && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#009EE0] border border-black" />
              <span>Wartość odstająca (outlier)</span>
            </div>
          )}

          {layers.showPoints && (
            <div className="flex items-center gap-1.5">
              <span 
                className="inline-block w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: '#344B57' }} 
              />
              <span>Punkty z szumem losowym (jitter)</span>
            </div>
          )}
        </div>

        {/* Export SVG Button */}
        <div className="flex items-center gap-2">
          <button
            id="export-svg-button"
            type="button"
            onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white rounded-md border border-slate-200/80 transition cursor-pointer backdrop-blur-xs shadow-2xs"
            title="Eksportuj wykres jako wektorowy plik SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksportuj SVG</span>
          </button>
        </div>
      </div>

      {/* Main Plot Area */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full relative overflow-hidden select-none p-2 sm:p-4 flex items-center justify-center min-h-[380px]"
      >
        <svg
          id="stats-plot-svg"
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full overflow-visible font-sans"
        >
          {/* DEFINITIONS FOR GRADIENTS AND FILTERS */}
          <defs>
            {datasets.map((dataset) => (
              <linearGradient
                key={`grad-${dataset.id}`}
                id={`grad-${dataset.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={dataset.color.primary} stopOpacity={0.22} />
                <stop offset="50%" stopColor={dataset.color.primary} stopOpacity={0.15} />
                <stop offset="100%" stopColor={dataset.color.primary} stopOpacity={0.22} />
              </linearGradient>
            ))}
          </defs>

          {/* GRID LINES & Y-AXIS LABELS */}
          <g id="grid-lines" className="transition-all duration-300">
            {yTicks.map((tick) => {
              const y = yScale(tick);
              return (
                <g key={`tick-${tick}`}>
                  {/* Subtle grid line */}
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={dimensions.width - margin.right}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Y-axis label */}
                  <text
                    x={margin.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="monospace"
                    fill="#64748b"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Left Y Axis Spine */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={margin.top + innerHeight}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
          </g>

          {/* DATASET GROUPS */}
          {datasets.map((dataset, idx) => {
            const summary = summaries[dataset.id];
            if (!summary) return null;

            const cx = margin.left + (idx + 0.5) * colWidth;

            // Compute SVG path for violin KDE
            let violinPath = '';
            if (layers.showViolin && summary.kde.length > 0) {
              const rightPoints: [number, number][] = [];
              const leftPoints: [number, number][] = [];

              summary.kde.forEach((pt) => {
                const y = yScale(pt.value);
                const w = pt.density * maxHalfWidth;
                rightPoints.push([cx + w, y]);
                leftPoints.push([cx - w, y]);
              });

              // Construct mirrored polygon path
              const forward = rightPoints.map(([x, y]) => `${x},${y}`).join(' L ');
              const backward = leftPoints.reverse().map(([x, y]) => `${x},${y}`).join(' L ');
              violinPath = `M ${forward} L ${backward} Z`;
            }

            // Whisker Y positions
            const yLowerWhisker = yScale(summary.lowerWhisker);
            const yUpperWhisker = yScale(summary.upperWhisker);
            const yQ1 = yScale(summary.q1);
            const yQ3 = yScale(summary.q3);
            const yMedian = yScale(summary.median);
            const yMean = yScale(summary.sampleMean);

            return (
              <g key={dataset.id} id={`group-render-${dataset.id}`}>
                {/* 1. LAYER 2: VIOLIN PLOT (KDE DENSITY CURVE) */}
                {layers.showViolin && violinPath && (
                  <path
                    d={violinPath}
                    fill={`url(#grad-${dataset.id})`}
                    stroke={dataset.color.primary}
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    className="transition-all duration-200 cursor-pointer hover:opacity-95"
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      setHover({
                        type: 'violin',
                        datasetName: dataset.name,
                        datasetColor: dataset.color.primary,
                        x: e.clientX - (rect?.left || 0),
                        y: e.clientY - (rect?.top || 0),
                        data: {
                          n: dataset.n,
                          mean: summary.sampleMean,
                          median: summary.median,
                        },
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  />
                )}

                {/* 2. LAYER 1: INDIVIDUAL POINTS (JITTER STRIP PLOT) */}
                {layers.showPoints && (
                  <g id={`points-${dataset.id}`}>
                    {dataset.rawPoints.map((val, pIdx) => {
                      // If box plot is shown, outlier points are already plotted as distinct outlier markers on top
                      if (layers.showBoxPlot && (val < summary.lowerWhisker || val > summary.upperWhisker)) {
                        return null;
                      }

                      const jitter = dataset.jitterOffsets[pIdx] || 0;
                      // Jitter spread scales with jitterWidth setting
                      const pointX = cx + jitter * (maxHalfWidth * layers.jitterWidth);
                      const pointY = yScale(val);

                      return (
                        <circle
                          key={`pt-${dataset.id}-${pIdx}`}
                          cx={pointX}
                          cy={pointY}
                          r={layers.pointSize}
                          fill={dataset.color.primary}
                          fillOpacity={layers.pointOpacity}
                          stroke="#ffffff"
                          strokeWidth="0.5"
                          className="transition-transform hover:scale-175 hover:stroke-slate-900 hover:stroke-2 cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            setHover({
                              type: 'point',
                              datasetName: dataset.name,
                              datasetColor: dataset.color.primary,
                              x: e.clientX - (rect?.left || 0),
                              y: e.clientY - (rect?.top || 0),
                              data: {
                                value: val,
                                pointIndex: pIdx + 1,
                              },
                            });
                          }}
                          onMouseLeave={() => setHover(null)}
                        />
                      );
                    })}
                  </g>
                )}

                {/* 3. BASE BOX PLOT LAYER (Tukey's Standard) */}
                {layers.showBoxPlot && (
                  <g 
                    id={`boxplot-${dataset.id}`} 
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      setHover({
                        type: 'box',
                        datasetName: dataset.name,
                        datasetColor: dataset.color.primary,
                        x: e.clientX - (rect?.left || 0),
                        y: e.clientY - (rect?.top || 0),
                        data: {
                          median: summary.median,
                          mean: summary.sampleMean,
                          q1: summary.q1,
                          q3: summary.q3,
                          iqr: summary.iqr,
                          lowerWhisker: summary.lowerWhisker,
                          upperWhisker: summary.upperWhisker,
                          outliersCount: summary.outliers.length,
                          n: dataset.n,
                        },
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    {/* Whisker Line (Vertical) */}
                    <line
                      x1={cx}
                      y1={yLowerWhisker}
                      x2={cx}
                      y2={yUpperWhisker}
                      stroke="#1e293b"
                      strokeWidth="2"
                      strokeDasharray="none"
                    />

                    {/* Lower Whisker Cap (Horizontal) */}
                    <line
                      x1={cx - 14}
                      y1={yLowerWhisker}
                      x2={cx + 14}
                      y2={yLowerWhisker}
                      stroke="#1e293b"
                      strokeWidth="2"
                    />

                    {/* Upper Whisker Cap (Horizontal) */}
                    <line
                      x1={cx - 14}
                      y1={yUpperWhisker}
                      x2={cx + 14}
                      y2={yUpperWhisker}
                      stroke="#1e293b"
                      strokeWidth="2"
                    />

                    {/* IQR Box (Q1 to Q3) */}
                    <rect
                      x={cx - boxWidth / 2}
                      y={Math.min(yQ1, yQ3)}
                      width={boxWidth}
                      height={Math.max(Math.abs(yQ1 - yQ3), 2)}
                      fill="#ffffff"
                      fillOpacity={layers.showPoints || layers.showViolin ? 0.88 : 0.98}
                      stroke={dataset.color.border}
                      strokeWidth="2.5"
                      rx="3"
                      className="transition-all hover:stroke-slate-900"
                    />

                    {/* Median Line (Bold) */}
                    <line
                      x1={cx - boxWidth / 2}
                      y1={yMedian}
                      x2={cx + boxWidth / 2}
                      y2={yMedian}
                      stroke="#0f172a"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* 3b. OUTLIERS LAYER (Rendered above box & jitter points with dedicated hover) */}
                {layers.showBoxPlot && summary.outliers.length > 0 && (
                  <g id={`outliers-${dataset.id}`} className="z-10">
                    {summary.outliers.map((outlierVal, oIdx) => (
                      <circle
                        key={`outlier-${dataset.id}-${oIdx}`}
                        cx={cx}
                        cy={yScale(outlierVal)}
                        r="4"
                        fill={dataset.color.primary}
                        stroke="#000000"
                        strokeWidth="1.5"
                        className="transition-all hover:scale-150 hover:stroke-2 cursor-pointer drop-shadow-xs"
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          const rect = containerRef.current?.getBoundingClientRect();
                          setHover({
                            type: 'outlier',
                            datasetName: dataset.name,
                            datasetColor: dataset.color.primary,
                            x: e.clientX - (rect?.left || 0),
                            y: e.clientY - (rect?.top || 0),
                            data: {
                              value: outlierVal,
                              lowerWhisker: summary.lowerWhisker,
                              upperWhisker: summary.upperWhisker,
                            },
                          });
                        }}
                        onMouseLeave={() => setHover(null)}
                      />
                    ))}
                  </g>
                )}

                {/* 4. MEAN MARKER (DIAMOND) */}
                {layers.showMeanMarker && (
                  <g
                    id={`mean-marker-${dataset.id}`}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      setHover({
                        type: 'mean',
                        datasetName: dataset.name,
                        datasetColor: dataset.color.primary,
                        x: e.clientX - (rect?.left || 0),
                        y: e.clientY - (rect?.top || 0),
                        data: {
                          mean: summary.sampleMean,
                          median: summary.median,
                        },
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    {/* Diamond Symbol */}
                    <polygon
                      points={`
                        ${cx},${yMean - 6} 
                        ${cx + 6},${yMean} 
                        ${cx},${yMean + 6} 
                        ${cx - 6},${yMean}
                      `}
                      fill="#E2001A"
                      stroke="#B30015"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* X-AXIS GROUP LABELS & METRICS */}
                <g id={`x-label-${dataset.id}`} transform={`translate(${cx}, ${margin.top + innerHeight + 18})`}>
                  {/* Color pill */}
                  <rect
                    x="-6"
                    y="-12"
                    width="12"
                    height="12"
                    rx="3"
                    fill={dataset.color.primary}
                  />
                  <text
                    y="14"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill="#1e293b"
                  >
                    {dataset.name}
                  </text>
                  <text
                    y="28"
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="monospace"
                    fill="#64748b"
                  >
                    N = {dataset.n}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* FLOATING INTERACTIVE TOOLTIP */}
        {hover && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900 text-white rounded-lg shadow-xl p-3 text-xs border border-slate-700/80 transition-transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${hover.x}px`,
              top: `${hover.y}px`,
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-800">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: hover.datasetColor }}
              />
              <span className="font-bold text-slate-100">{hover.datasetName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-slate-800 text-slate-400 capitalize">
                {hover.type === 'box'
                  ? 'Wykres skrzynkowy (Box plot)'
                  : hover.type === 'mean'
                  ? 'Średnia'
                  : hover.type === 'violin'
                  ? 'Wykres wiolinowy'
                  : hover.type === 'outlier'
                  ? 'Wartość odstająca (Outlier)'
                  : 'Punkt'}
              </span>
            </div>

            {/* Content for Outlier */}
            {hover.type === 'outlier' && (
              <div className="space-y-1 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">Wartość odstająca:</span>{' '}
                  <span className="font-bold text-amber-300">
                    {formatStat(hover.data.value || 0, 3)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Granice wąsów Tukeya: [{formatStat(hover.data.lowerWhisker || 0, 1)}, {formatStat(hover.data.upperWhisker || 0, 1)}]
                </div>
                <div className="text-[10px] text-slate-500">
                  Punkt leży poza 1.5 &times; IQR od krawędzi pudełka
                </div>
              </div>
            )}

            {/* Content for Point */}
            {hover.type === 'point' && (
              <div className="space-y-0.5 font-mono">
                <div>
                  <span className="text-slate-400">Wartość:</span>{' '}
                  <span className="font-bold text-indigo-300">
                    {formatStat(hover.data.value || 0, 3)}
                  </span>
                </div>
                {hover.data.pointIndex && (
                  <div className="text-[10px] text-slate-500">
                    Obserwacja #{hover.data.pointIndex}
                  </div>
                )}
              </div>
            )}

            {/* Content for Mean Marker */}
            {hover.type === 'mean' && (
              <div className="space-y-1 font-mono">
                <div>
                  <span className="text-red-400 font-bold">Średnia z próby (M):</span>{' '}
                  <span className="font-bold text-white">{formatStat(hover.data.mean || 0, 2)}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Mediana: {formatStat(hover.data.median || 0, 2)}
                </div>
              </div>
            )}

            {/* Content for Violin */}
            {hover.type === 'violin' && (
              <div className="space-y-1">
                <div className="text-emerald-300 font-semibold">Wykres wiolinowy</div>
                <div className="text-slate-300 text-[11px]">
                  Oszacowana gęstość prawdopodobieństwa dla N={hover.data.n}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  Średnia (M): {formatStat(hover.data.mean || 0, 1)} | Mediana: {formatStat(hover.data.median || 0, 1)}
                </div>
              </div>
            )}

            {/* Content for Box Plot (Five-number summary) */}
            {hover.type === 'box' && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">Mediana:</span>{' '}
                  <span className="font-bold text-white">{formatStat(hover.data.median || 0, 2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Średnia (M):</span>{' '}
                  <span className="font-bold text-red-300">{formatStat(hover.data.mean || 0, 2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Kwartyl dolny Q1 (25%):</span>{' '}
                  <span>{formatStat(hover.data.q1 || 0, 2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Kwartyl górny Q3 (75%):</span>{' '}
                  <span>{formatStat(hover.data.q3 || 0, 2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Rozstęp ćwiartkowy IQR:</span>{' '}
                  <span className="text-indigo-300">{formatStat(hover.data.iqr || 0, 2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Wartości odstające:</span>{' '}
                  <span className={hover.data.outliersCount ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {hover.data.outliersCount || 0}
                  </span>
                </div>
                <div className="col-span-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Wąsy Tukeya: [{formatStat(hover.data.lowerWhisker || 0, 1)}, {formatStat(hover.data.upperWhisker || 0, 1)}]
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
