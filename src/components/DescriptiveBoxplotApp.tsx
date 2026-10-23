/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  BarChart2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Preset datasets for psychology students
const PRESETS = [
  {
    name: 'Wyniki egzaminu ze statystyki (punkty 0-100)',
    values: [42, 55, 60, 62, 65, 68, 70, 72, 73, 75, 76, 78, 80, 82, 85, 88, 91, 95, 98, 28, 100],
  },
  {
    name: 'Czasy reakcji w zadaniu decyzyjnym RT (ms - asymetria)',
    values: [320, 345, 350, 362, 370, 375, 380, 395, 410, 420, 435, 450, 470, 510, 560, 640, 780, 920],
  },
  {
    name: 'Poziom lęku jako stanu (skala STAI 20-80)',
    values: [28, 31, 33, 35, 36, 38, 40, 41, 42, 44, 45, 46, 48, 50, 52, 55, 59, 64, 72],
  },
];

export const DescriptiveBoxplotApp: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [rawInput, setRawInput] = useState<string>(
    PRESETS[0].values.join(', ')
  );
  const [showJitter, setShowJitter] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Parse numbers from input
  const data = useMemo(() => {
    return rawInput
      .split(/[,;\s]+/)
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v) && isFinite(v))
      .sort((a, b) => a - b);
  }, [rawInput]);

  // Generate random data
  const generateRandomData = () => {
    const n = 35;
    const base = 50;
    const sd = 12;
    const vals: number[] = [];
    for (let i = 0; i < n; i++) {
      // Box-Muller normal with slight skew
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let v = Math.round(base + z * sd);
      if (Math.random() < 0.05) v += Math.round(sd * 2.8); // occasional outlier
      vals.push(v);
    }
    setRawInput(vals.join(', '));
  };

  // Compute statistics
  const stats = useMemo(() => {
    const n = data.length;
    if (n === 0) return null;

    const sum = data.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Variance & SD
    const variance = n > 1 ? data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
    const sd = Math.sqrt(variance);

    // Median & Quartiles
    const getPercentile = (p: number) => {
      const idx = (n - 1) * p;
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const weight = idx - lower;
      return data[lower] * (1 - weight) + data[upper] * weight;
    };

    const q1 = getPercentile(0.25);
    const median = getPercentile(0.5);
    const q3 = getPercentile(0.75);
    const iqr = q3 - q1;

    // Whiskers (Tukey criteria: 1.5 * IQR)
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const nonOutliers = data.filter((v) => v >= lowerFence && v <= upperFence);
    const whiskerLower = nonOutliers.length > 0 ? Math.min(...nonOutliers) : data[0];
    const whiskerUpper = nonOutliers.length > 0 ? Math.max(...nonOutliers) : data[n - 1];

    const outliers = data.filter((v) => v < lowerFence || v > upperFence);

    const min = data[0];
    const max = data[n - 1];
    const range = max - min;

    // Skewness approximation
    let skewness = 0;
    if (n > 2 && sd > 0) {
      skewness =
        (n / ((n - 1) * (n - 2))) *
        data.reduce((acc, v) => acc + Math.pow((v - mean) / sd, 3), 0);
    }

    return {
      n,
      mean,
      sd,
      median,
      q1,
      q3,
      iqr,
      whiskerLower,
      whiskerUpper,
      lowerFence,
      upperFence,
      outliers,
      min,
      max,
      range,
      skewness,
    };
  }, [data]);

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    setRawInput(PRESETS[idx].values.join(', '));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-lg">
                Statystyki Opisowe & Wykres Skrzynkowy (Boxplot)
              </span>
              <span className="text-xs px-2 py-0.5 font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                Wbudowany moduł interaktywny
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Obliczanie miar tendencji centralnej, miar rozproszenia (IQR, SD) oraz identyfikacja wartości odstających.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateRandomData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Wylosuj nowe dane
            </button>
            <button
              onClick={() => handleSelectPreset(selectedPresetIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zresetuj zestaw
            </button>
          </div>
        </div>

        {/* Data selector & presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-5 space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Przykładowe zestawy danych psychologicznych:
            </label>
            <div className="flex flex-col gap-1.5">
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                    selectedPresetIndex === idx
                      ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Wprowadź lub edytuj wartości (oddzielone przecinkami lub spacjami):
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Liczba obserwacji: N = {data.length}
              </span>
            </div>
            <textarea
              rows={3}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="np. 12, 15, 18, 20, 22, 25..."
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showJitter}
                  onChange={(e) => setShowJitter(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pokaż surowe punkty danych (jitter overlay)</span>
              </label>
              <span>Zakres: [{stats ? `${stats.min} – ${stats.max}` : '–'}]</span>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Średnia (M)
              </span>
              <div className="text-xl font-bold font-mono text-indigo-600 mt-1">
                {stats.mean.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                SD = {stats.sd.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Mediana (Me)
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {stats.median.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                50. percentyl (Q2)
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Rozstęp IQR
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {stats.iqr.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Q3 - Q1
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Kwartyle Q1 - Q3
              </span>
              <div className="text-xs font-bold font-mono text-slate-800 mt-2">
                [{stats.q1.toFixed(1)} – {stats.q3.toFixed(1)}]
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Środkowe 50% danych
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Skośność (g1)
              </span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  Math.abs(stats.skewness) < 0.5
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {stats.skewness.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {Math.abs(stats.skewness) < 0.5
                  ? 'Symetryczny'
                  : stats.skewness > 0
                  ? 'Prawostronna'
                  : 'Lewostronna'}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Odstające (Outliers)
              </span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  stats.outliers.length > 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {stats.outliers.length}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.outliers.length > 0 ? `${stats.outliers.join(', ')}` : 'Brak'}
              </span>
            </div>
          </div>

          {/* Interactive SVG Boxplot Canvas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Wykres Skrzynkowy Tukey'a z Naniesionymi Obserwacjami
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-indigo-500 rounded-xs" />
                  <span>Pudełko [Q1, Q3]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-indigo-900" />
                  <span>Mediana</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Wartości odstające</span>
                </div>
              </div>
            </div>

            {/* SVG Plot */}
            {(() => {
              const svgWidth = 800;
              const svgHeight = 220;
              const paddingX = 60;
              const boxY = 85;
              const boxHeight = 55;

              // Domain with margin
              const valMin = Math.min(stats.min, stats.lowerFence) - (stats.range * 0.1 || 5);
              const valMax = Math.max(stats.max, stats.upperFence) + (stats.range * 0.1 || 5);

              const toX = (val: number) => {
                return (
                  ((val - valMin) / (valMax - valMin)) * (svgWidth - 2 * paddingX) + paddingX
                );
              };

              const xQ1 = toX(stats.q1);
              const xMedian = toX(stats.median);
              const xQ3 = toX(stats.q3);
              const xMean = toX(stats.mean);
              const xWLower = toX(stats.whiskerLower);
              const xWUpper = toX(stats.whiskerUpper);

              return (
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto select-none min-w-[600px]"
                  >
                    {/* Background Grid & Axis Lines */}
                    <line
                      x1={paddingX}
                      y1={170}
                      x2={svgWidth - paddingX}
                      y2={170}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />

                    {/* Ticks on axis */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct, idx) => {
                      const tickVal = valMin + pct * (valMax - valMin);
                      const xTick = toX(tickVal);
                      return (
                        <g key={idx}>
                          <line
                            x1={xTick}
                            y1={170}
                            x2={xTick}
                            y2={176}
                            stroke="#64748b"
                            strokeWidth="1"
                          />
                          <text
                            x={xTick}
                            y={192}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#64748b"
                            fontFamily="monospace"
                          >
                            {tickVal.toFixed(0)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Whisker left line (horizontal) */}
                    <line
                      x1={xWLower}
                      y1={boxY + boxHeight / 2}
                      x2={xQ1}
                      y2={boxY + boxHeight / 2}
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    {/* Whisker left cap (vertical) */}
                    <line
                      x1={xWLower}
                      y1={boxY + boxHeight / 4}
                      x2={xWLower}
                      y2={boxY + (3 * boxHeight) / 4}
                      stroke="#475569"
                      strokeWidth="2.5"
                    />

                    {/* Whisker right line (horizontal) */}
                    <line
                      x1={xQ3}
                      y1={boxY + boxHeight / 2}
                      x2={xWUpper}
                      y2={boxY + boxHeight / 2}
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    {/* Whisker right cap (vertical) */}
                    <line
                      x1={xWUpper}
                      y1={boxY + boxHeight / 4}
                      x2={xWUpper}
                      y2={boxY + (3 * boxHeight) / 4}
                      stroke="#475569"
                      strokeWidth="2.5"
                    />

                    {/* The Box [Q1, Q3] */}
                    <rect
                      x={xQ1}
                      y={boxY}
                      width={Math.max(2, xQ3 - xQ1)}
                      height={boxHeight}
                      fill="rgba(99, 102, 241, 0.2)"
                      stroke="#4f46e5"
                      strokeWidth="2"
                      rx="3"
                    />

                    {/* Median Line (Bold) */}
                    <line
                      x1={xMedian}
                      y1={boxY}
                      x2={xMedian}
                      y2={boxY + boxHeight}
                      stroke="#312e81"
                      strokeWidth="3.5"
                    />

                    {/* Mean Diamond */}
                    <polygon
                      points={`${xMean},${boxY + boxHeight / 2 - 6} ${xMean + 6},${boxY + boxHeight / 2} ${xMean},${boxY + boxHeight / 2 + 6} ${xMean - 6},${boxY + boxHeight / 2}`}
                      fill="#047857"
                      stroke="#064e3b"
                      strokeWidth="1"
                    />

                    {/* Labels above key points */}
                    <text
                      x={xMedian}
                      y={boxY - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#312e81"
                    >
                      Me = {stats.median.toFixed(1)}
                    </text>
                    <text
                      x={xQ1}
                      y={boxY + boxHeight + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#475569"
                    >
                      Q1: {stats.q1.toFixed(1)}
                    </text>
                    <text
                      x={xQ3}
                      y={boxY + boxHeight + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#475569"
                    >
                      Q3: {stats.q3.toFixed(1)}
                    </text>
                    <text
                      x={xMean}
                      y={boxY - 26}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#047857"
                      fontWeight="600"
                    >
                      M = {stats.mean.toFixed(1)}
                    </text>

                    {/* Jittered raw points overlay */}
                    {showJitter &&
                      data.map((val, idx) => {
                        const isOutlier = val < stats.whiskerLower || val > stats.whiskerUpper;
                        const px = toX(val);
                        // pseudo jitter based on index
                        const jitterOffset = ((idx % 7) - 3) * 6;
                        const py = boxY + boxHeight / 2 + jitterOffset;

                        return (
                          <circle
                            key={idx}
                            cx={px}
                            cy={py}
                            r={isOutlier ? 4.5 : 3}
                            fill={isOutlier ? '#e11d48' : '#6366f1'}
                            opacity={isOutlier ? 1 : 0.65}
                            stroke={isOutlier ? '#881337' : '#ffffff'}
                            strokeWidth={isOutlier ? 1.5 : 0.75}
                          />
                        );
                      })}

                    {/* Explicit Outlier Markers above whiskers if any */}
                    {stats.outliers.map((outVal, idx) => {
                      const px = toX(outVal);
                      return (
                        <g key={`outlier-${idx}`}>
                          <circle
                            cx={px}
                            cy={boxY + boxHeight / 2}
                            r={5.5}
                            fill="#e11d48"
                            stroke="#881337"
                            strokeWidth="1.5"
                          />
                          <text
                            x={px}
                            y={boxY + boxHeight / 2 - 9}
                            fontSize="9"
                            fontWeight="bold"
                            fill="#e11d48"
                            textAnchor="middle"
                          >
                            {outVal}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
          </div>

          {/* Collapsible Explanatory Guide */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">
                    Interpretacja Statystyk Opisowych & Wykresu Skrzynkowego
                  </span>
                  <span className="text-xs text-slate-500">
                    Kiedy stosować medianę zamiast średniej? Jak wykrywać wartości odstające?
                  </span>
                </div>
              </div>
              {showExplanation ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showExplanation && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900 mb-1 text-sm">
                      Średnia vs Mediana (Miary odporne)
                    </h4>
                    <p>
                      Średnia arytmetyczna jest wrażliwa na wartości skrajne (outliers). Pojedynczy
                      błąd pomiaru lub ekstremalny wynik badanej osoby potrafi silnie przesunąć
                      średnią. Mediana jest miarą odporną (robust) – dzieli próbę dokładnie na pół.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900 mb-1 text-sm">
                      Kryterium Tukey'a (Wąsy boxplota)
                    </h4>
                    <p>
                      Wąsy boxplota sięgają do najbardziej skrajnych punktów leżących w granicach{' '}
                      <span className="font-mono">1.5 × IQR</span> od kwartyli. Punkty poza tymi
                      granicami są definiowane jako wartości odstające (outliers).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900 mb-1 text-sm">
                      Skośność rozkładu (Asymetria)
                    </h4>
                    <p>
                      Gdy <span className="font-mono">Średnia &gt; Mediana</span>, rozkład ma skośność
                      prawostronną (długi prawy ogon, częsty w czasach reakcji). Gdy{' '}
                      <span className="font-mono">Średnia &lt; Mediana</span>, skośność jest lewostronna.
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
