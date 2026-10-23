/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
} from 'lucide-react';

type ParentDist = 'uniform' | 'skewed' | 'bimodal' | 'normal';

export const CltSimulatorApp: React.FC = () => {
  const [parentType, setParentType] = useState<ParentDist>('skewed');
  const [sampleSize, setSampleSize] = useState<number>(30); // n
  const [numReps, setNumReps] = useState<number>(1000); // k
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const [lastSample, setLastSample] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showTheory, setShowTheory] = useState<boolean>(false);

  // Generate a value from parent distribution
  const drawParentValue = useCallback((type: ParentDist): number => {
    switch (type) {
      case 'uniform':
        // Uniform [10, 90], mean = 50, sd = 80 / sqrt(12) = 23.09
        return 10 + Math.random() * 80;

      case 'skewed': {
        // Highly skewed exponential: mean = 50, min ~ 20
        const exp = -Math.log(1 - Math.max(0.0001, Math.min(0.9999, Math.random())));
        return 20 + exp * 30;
      }

      case 'bimodal': {
        // Two distinct peaks around 30 and 70
        const isGroupB = Math.random() > 0.5;
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return isGroupB ? 70 + z * 8 : 30 + z * 8;
      }

      case 'normal': {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return 50 + z * 15;
      }
    }
  }, []);

  // Theoretical population moments
  const parentMoments = useMemo(() => {
    switch (parentType) {
      case 'uniform':
        return { mean: 50, sd: 80 / Math.sqrt(12), name: 'Rozkład jednostajny' };
      case 'skewed':
        return { mean: 50, sd: 30, name: 'Rozkład silnie skośny (np. czasy reakcji RT)' };
      case 'bimodal':
        return { mean: 50, sd: 21.5, name: 'Rozkład dwumodalny (bimodalny)' };
      case 'normal':
        return { mean: 50, sd: 15, name: 'Rozkład normalny' };
    }
  }, [parentType]);

  // Run Monte Carlo simulation of sample means
  const runSimulation = useCallback(() => {
    const means: number[] = [];
    let recentSample: number[] = [];

    for (let rep = 0; rep < numReps; rep++) {
      let sum = 0;
      const currentSample: number[] = [];
      for (let i = 0; i < sampleSize; i++) {
        const val = drawParentValue(parentType);
        sum += val;
        if (rep === numReps - 1) currentSample.push(val);
      }
      means.push(sum / sampleSize);
      if (rep === numReps - 1) recentSample = currentSample;
    }

    setSampleMeans(means);
    setLastSample(recentSample);
  }, [numReps, sampleSize, parentType, drawParentValue]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Empirical stats of sample means
  const meansStats = useMemo(() => {
    if (sampleMeans.length === 0) return null;
    const n = sampleMeans.length;
    const mean = sampleMeans.reduce((acc, v) => acc + v, 0) / n;
    const variance = sampleMeans.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);

    // Skewness
    const skewness =
      (n / ((n - 1) * (n - 2))) *
      sampleMeans.reduce((acc, v) => acc + Math.pow((v - mean) / sd, 3), 0);

    const theoreticalSE = parentMoments.sd / Math.sqrt(sampleSize);

    return {
      mean,
      sd, // this is the empirical standard error!
      theoreticalSE,
      skewness,
      min: Math.min(...sampleMeans),
      max: Math.max(...sampleMeans),
    };
  }, [sampleMeans, parentMoments, sampleSize]);

  // Histogram bins for sample means
  const histogramBins = useMemo(() => {
    if (sampleMeans.length === 0) return [];
    const min = 20;
    const max = 80;
    const numBins = 30;
    const binWidth = (max - min) / numBins;
    const bins = Array(numBins).fill(0);

    sampleMeans.forEach((m) => {
      const idx = Math.min(numBins - 1, Math.max(0, Math.floor((m - min) / binWidth)));
      bins[idx]++;
    });

    const maxCount = Math.max(...bins, 1);
    return bins.map((count, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      count,
      pct: (count / sampleMeans.length) * 100,
      heightRatio: count / maxCount,
    }));
  }, [sampleMeans]);

  return (
    <div className="space-y-6">
      {/* Top Controls Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-lg">
                Centralne Twierdzenie Graniczne (CLT)
              </span>
              <span className="text-xs px-2 py-0.5 font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                Wbudowany moduł interaktywny
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Obserwacja dążenia rozkładu średnich z prób do rozkładu normalnego wraz ze wzrostem wielkości próby N.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Losuj ponownie {numReps} prób
            </button>
          </div>
        </div>

        {/* Sliders & Population Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs">
          {/* Parent Distribution Choice */}
          <div>
            <label className="font-semibold text-slate-700 block mb-2">
              1. Kształt rozkładu w populacji (wyjściowy):
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'skewed', label: 'Silnie skośny (RT)' },
                { id: 'bimodal', label: 'Dwumodalny' },
                { id: 'uniform', label: 'Jednostajny (kostka)' },
                { id: 'normal', label: 'Normalny (Gauss)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setParentType(item.id as ParentDist)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                    parentType === item.id
                      ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">
              Parametry: μ = {parentMoments.mean.toFixed(1)}, σ = {parentMoments.sd.toFixed(1)}
            </span>
          </div>

          {/* Sample Size N */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-slate-700">
                2. Wielkość próby (<span className="italic font-serif">N</span>):
              </label>
              <span className="font-mono font-bold text-indigo-600 text-sm">
                N = {sampleSize}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="100"
              step="2"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between gap-1 mt-2 text-[10px] text-slate-400">
              <button onClick={() => setSampleSize(2)} className="hover:text-indigo-600 underline">N=2</button>
              <button onClick={() => setSampleSize(5)} className="hover:text-indigo-600 underline">N=5</button>
              <button onClick={() => setSampleSize(15)} className="hover:text-indigo-600 underline">N=15</button>
              <button onClick={() => setSampleSize(30)} className="hover:text-indigo-600 underline font-bold text-indigo-600">N=30 (CLT)</button>
              <button onClick={() => setSampleSize(60)} className="hover:text-indigo-600 underline">N=60</button>
            </div>
            <span className="text-[11px] text-slate-500 block mt-2">
              Zauważ, jak przy N ≥ 30 asymetria całkowicie znika!
            </span>
          </div>

          {/* Number of repetitions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-slate-700">
                3. Liczba wylosowanych prób (<span className="italic font-serif">k</span>):
              </label>
              <span className="font-mono font-bold text-slate-700 text-sm">
                k = {numReps}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[200, 500, 1000].map((k) => (
                <button
                  key={k}
                  onClick={() => setNumReps(k)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    numReps === k
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  k = {k}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">
              Każda z {numReps} prób ma dokładnie N={sampleSize} obserwacji.
            </span>
          </div>
        </div>
      </div>

      {meansStats && (
        <>
          {/* Empirical vs Theoretical Comparison KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Średnia średnich (M)
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                {meansStats.mean.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Teoria: μ = {parentMoments.mean.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Błąd standardowy (SE)
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {meansStats.sd.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Wzór σ/√N = {meansStats.theoreticalSE.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Skośność rozkładu średnich
              </span>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  Math.abs(meansStats.skewness) < 0.2 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {meansStats.skewness.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {Math.abs(meansStats.skewness) < 0.2 ? 'Idealnie symetryczny' : 'Lekka asymetria'}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Status normalności
              </span>
              <div className="text-sm font-bold text-emerald-700 mt-2">
                {sampleSize >= 30 ? 'Rozkład Normalny N(μ, SE)' : 'Dąży do normalnego'}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Przy N={sampleSize} warunek CLT spełniony
              </span>
            </div>
          </div>

          {/* Histogram Chart with Normal Curve Overlay */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Rozkład Średnich z Prób (Sampling Distribution of the Mean)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-indigo-500 rounded-xs" />
                  <span>Histogram {numReps} średnich</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-rose-500" />
                  <span>Krzywa teoretyczna Gaussa</span>
                </div>
              </div>
            </div>

            {/* SVG Histogram */}
            {(() => {
              const svgWidth = 800;
              const svgHeight = 260;
              const padX = 60;
              const padY = 30;
              const chartWidth = svgWidth - 2 * padX;
              const chartHeight = svgHeight - 2 * padY;

              const minX = 20;
              const maxX = 80;

              const toX = (val: number) => {
                return ((val - minX) / (maxX - minX)) * chartWidth + padX;
              };

              // Generate points for theoretical normal curve
              const curvePoints: string[] = [];
              const se = meansStats.theoreticalSE;
              const mu = parentMoments.mean;

              for (let x = minX; x <= maxX; x += 0.5) {
                const z = (x - mu) / se;
                const pdf = (1 / (se * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
                // scale pdf to match peak histogram bar height
                const maxPdf = 1 / (se * Math.sqrt(2 * Math.PI));
                const py = svgHeight - padY - (pdf / maxPdf) * (chartHeight * 0.9);
                const px = toX(x);
                curvePoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }

              return (
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto select-none min-w-[600px]"
                  >
                    {/* Horizontal Baseline */}
                    <line
                      x1={padX}
                      y1={svgHeight - padY}
                      x2={svgWidth - padX}
                      y2={svgHeight - padY}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />

                    {/* Bars of Histogram */}
                    {histogramBins.map((bin, idx) => {
                      const barX = toX(bin.binStart);
                      const barW = Math.max(1, toX(bin.binEnd) - barX - 1);
                      const barH = bin.heightRatio * (chartHeight * 0.85);
                      const barY = svgHeight - padY - barH;

                      return (
                        <rect
                          key={idx}
                          x={barX}
                          y={barY}
                          width={barW}
                          height={barH}
                          fill="rgba(99, 102, 241, 0.45)"
                          stroke="#4f46e5"
                          strokeWidth="1"
                          rx="2"
                        />
                      );
                    })}

                    {/* Theoretical Normal Curve */}
                    <polyline
                      points={curvePoints.join(' ')}
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="2.5"
                    />

                    {/* Vertical line for population mean mu */}
                    <line
                      x1={toX(mu)}
                      y1={padY - 10}
                      x2={toX(mu)}
                      y2={svgHeight - padY}
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                    />
                    <text
                      x={toX(mu)}
                      y={padY - 15}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#0f172a"
                    >
                      μ = {mu}
                    </text>

                    {/* Ticks on X-axis */}
                    {[20, 30, 40, 50, 60, 70, 80].map((tick) => (
                      <g key={tick}>
                        <line
                          x1={toX(tick)}
                          y1={svgHeight - padY}
                          x2={toX(tick)}
                          y2={svgHeight - padY + 6}
                          stroke="#64748b"
                        />
                        <text
                          x={toX(tick)}
                          y={svgHeight - padY + 18}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          {tick}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}
          </div>

          {/* Theory card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowTheory(!showTheory)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">
                    Dlaczego Centralne Twierdzenie Graniczne jest fundamentem statystyki?
                  </span>
                  <span className="text-xs text-slate-500">
                    Rozwiązanie zagadki, dlaczego możemy stosować testy parametryczne (t-Studenta, ANOVA) nawet dla skośnych zmiennych.
                  </span>
                </div>
              </div>
              {showTheory ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showTheory && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900 mb-1 text-sm">
                      Kluczowa treść twierdzenia
                    </h4>
                    <p>
                      Niezależnie od tego, jak wygląda rozkład badanej cechy w populacji (może być
                      skrajnie skośny, dwumodalny lub jednostajny), rozkład <strong>średnich z prób</strong>{' '}
                      o liczebności N dąży do rozkładu normalnego o parametrach{' '}
                      <span className="font-mono">N(μ, σ / √N)</span> gdy N rośnie.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900 mb-1 text-sm">
                      Praktyczna reguła N ≥ 30 w psychologii
                    </h4>
                    <p>
                      W badaniach empirycznych reguła kciuka mówi, że przy próbach N ≥ 30 błąd
                      standardowy średniej jest na tyle mały, a rozkład średnich na tyle zbliżony do
                      krzywej Gaussa, że procedury statystyczne oparte na średnich zachowują wysoką
                      odporność na odstępstwa od normalności cechy pierwotnej.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
