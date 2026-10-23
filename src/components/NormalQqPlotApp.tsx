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
  LineChart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type SampleType = 'normal' | 'skewed' | 'heavy_tail' | 'uniform' | 'outlier';

export const NormalQqPlotApp: React.FC = () => {
  const [sampleType, setSampleType] = useState<SampleType>('normal');
  const [sampleSize, setSampleSize] = useState<number>(40);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [randomSeed, setRandomSeed] = useState<number>(1);

  // Generate data based on selected distribution
  const data = useMemo(() => {
    // pseudo-random generation with seed dependency
    const rand = () => Math.random();
    const vals: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      let v = 0;
      switch (sampleType) {
        case 'normal': {
          const u1 = Math.max(0.0001, rand());
          const u2 = rand();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          v = 100 + z * 15;
          break;
        }
        case 'skewed': {
          // Log-normal or exponential
          const exp = -Math.log(1 - Math.max(0.0001, Math.min(0.9999, rand())));
          v = 70 + exp * 25;
          break;
        }
        case 'heavy_tail': {
          // Student-t with df=3
          const u1 = Math.max(0.0001, rand());
          const u2 = rand();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const chi = (Math.pow(rand(), 2) + Math.pow(rand(), 2) + Math.pow(rand(), 2));
          v = 100 + (z / Math.sqrt(chi / 3)) * 14;
          break;
        }
        case 'uniform': {
          v = 60 + rand() * 80;
          break;
        }
        case 'outlier': {
          const u1 = Math.max(0.0001, rand());
          const u2 = rand();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          v = 100 + z * 12;
          if (i === 0) v = 175; // strong outlier
          if (i === 1) v = 35;
          break;
        }
      }
      vals.push(v);
    }

    return vals.sort((a, b) => a - b);
  }, [sampleType, sampleSize, randomSeed]);

  // Inverse normal CDF (Acklam algorithm approximation)
  const normSInv = (p: number): number => {
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680199438818788e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

    const q = p < 0.5 ? p : 1 - p;
    let r: number;
    if (q > 0.02425) {
      const u = q - 0.5;
      const u2 = u * u;
      r =
        (((((a[0] * u2 + a[1]) * u2 + a[2]) * u2 + a[3]) * u2 + a[4]) * u2 + a[5]) * u /
        (((((b[0] * u2 + b[1]) * u2 + b[2]) * u2 + b[3]) * u2 + b[4]) * u2 + 1);
    } else {
      const u = Math.sqrt(-2 * Math.log(q));
      r =
        ((((c[0] * u + c[1]) * u + c[2]) * u + c[3]) * u + c[4]) * u + c[5] /
        ((((d[0] * u + d[1]) * u + d[2]) * u + d[3]) * u + 1);
    }
    return p < 0.5 ? -Math.abs(r) : Math.abs(r);
  };

  // Compute Q-Q pairs and statistics
  const qqData = useMemo(() => {
    const n = data.length;
    if (n === 0) return { pairs: [], mean: 0, sd: 0, skewness: 0, rSquared: 0 };

    const sum = data.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;
    const variance = n > 1 ? data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
    const sd = Math.sqrt(variance);

    // Blom's plotting position: p_i = (i - 3/8) / (n + 1/4)
    const pairs = data.map((val, idx) => {
      const i = idx + 1;
      const p = (i - 0.375) / (n + 0.25);
      const theoreticalZ = normSInv(p);
      const empiricalZ = sd > 0 ? (val - mean) / sd : 0;
      return { val, p, theoreticalZ, empiricalZ };
    });

    // Correlation coefficient between theoreticalZ and empiricalZ
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    pairs.forEach((p) => {
      sumX += p.theoreticalZ;
      sumY += p.empiricalZ;
      sumXY += p.theoreticalZ * p.empiricalZ;
      sumX2 += p.theoreticalZ * p.theoreticalZ;
      sumY2 += p.empiricalZ * p.empiricalZ;
    });

    const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = denom > 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const rSquared = r * r;

    // Skewness
    const skewness =
      n > 2 && sd > 0
        ? (n / ((n - 1) * (n - 2))) *
          data.reduce((acc, v) => acc + Math.pow((v - mean) / sd, 3), 0)
        : 0;

    return { pairs, mean, sd, skewness, rSquared };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Selection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-lg">
                Wykres Normalny (Normal Q-Q Plot)
              </span>
              <span className="text-xs px-2 py-0.5 font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                Wbudowany moduł interaktywny
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Wizualna i statystyczna ocena normalności rozkładu danych empirycznych za pomocą kwantyli teoretycznych.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRandomSeed((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Wygeneruj nową próbę
            </button>
          </div>
        </div>

        {/* Distribution presets and N slider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 text-xs">
          {/* Preset buttons */}
          <div>
            <label className="font-semibold text-slate-700 block mb-2">
              Kształt rozkładu generowanych danych:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'normal', label: '1. Idealnie normalny' },
                { id: 'skewed', label: '2. Prawostronnie skośny' },
                { id: 'heavy_tail', label: '3. Grube ogony (leptokurtoza)' },
                { id: 'uniform', label: '4. Lekkie ogony (platykurtoza)' },
                { id: 'outlier', label: '5. Z wartościami odstającymi' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSampleType(item.id as SampleType)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                    sampleType === item.id
                      ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Size slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-slate-700">
                Liczebność próby (<span className="italic font-serif">N</span>):
              </label>
              <span className="font-mono font-bold text-indigo-600 text-sm">
                N = {sampleSize}
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="150"
              step="5"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>N=15 (mała próba)</span>
              <span>N=50 (standardowa)</span>
              <span>N=150 (duża próba)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Współczynnik dopasowania R²
          </span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              qqData.rSquared >= 0.96 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {(qqData.rSquared * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Liniowość punktów na Q-Q plot
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Skośność (g1)
          </span>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              Math.abs(qqData.skewness) < 0.5 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {qqData.skewness.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Wartość 0 = symetria Gaussa
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ocena normalności
          </span>
          <div
            className={`text-sm font-bold mt-2 ${
              qqData.rSquared >= 0.96 && Math.abs(qqData.skewness) < 0.6
                ? 'text-emerald-700'
                : 'text-amber-700'
            }`}
          >
            {qqData.rSquared >= 0.96 && Math.abs(qqData.skewness) < 0.6
              ? 'Zgodny z rozkładem normalnym'
              : 'Odstępstwo od normalności'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Kryterium diagnostyczne
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Średnia i SD
          </span>
          <div className="text-sm font-bold font-mono text-slate-800 mt-2">
            M = {qqData.mean.toFixed(1)}, SD = {qqData.sd.toFixed(1)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Zmienna standaryzowana Z
          </span>
        </div>
      </div>

      {/* SVG Q-Q Plot Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Wykres Kwantylowo-Kwantylowy (Normal Q-Q Plot)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-rose-500" />
              <span>Linia referencyjna (y = x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Punkty empiryczne próby</span>
            </div>
          </div>
        </div>

        {/* SVG Visualization */}
        {(() => {
          const size = 500;
          const pad = 60;
          const zLimit = 3.2; // -3.2 to +3.2

          const toSvgCoord = (val: number) => {
            return ((val + zLimit) / (2 * zLimit)) * (size - 2 * pad) + pad;
          };

          return (
            <div className="flex justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[540px] select-none">
                {/* Background Grid */}
                {[-2, -1, 0, 1, 2].map((tick) => (
                  <g key={tick}>
                    <line
                      x1={toSvgCoord(tick)}
                      y1={pad}
                      x2={toSvgCoord(tick)}
                      y2={size - pad}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <line
                      x1={pad}
                      y1={size - toSvgCoord(tick)}
                      x2={size - pad}
                      y2={size - toSvgCoord(tick)}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* Central axes */}
                <line
                  x1={toSvgCoord(0)}
                  y1={pad}
                  x2={toSvgCoord(0)}
                  y2={size - pad}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                <line
                  x1={pad}
                  y1={size - toSvgCoord(0)}
                  x2={size - pad}
                  y2={size - toSvgCoord(0)}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />

                {/* Outer frame */}
                <rect
                  x={pad}
                  y={pad}
                  width={size - 2 * pad}
                  height={size - 2 * pad}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />

                {/* 45-degree Reference line y = x */}
                <line
                  x1={toSvgCoord(-zLimit)}
                  y1={size - toSvgCoord(-zLimit)}
                  x2={toSvgCoord(zLimit)}
                  y2={size - toSvgCoord(zLimit)}
                  stroke="#e11d48"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />

                {/* Data Points */}
                {qqData.pairs.map((pt, idx) => {
                  const px = toSvgCoord(pt.theoreticalZ);
                  const py = size - toSvgCoord(pt.empiricalZ);
                  const diff = Math.abs(pt.theoreticalZ - pt.empiricalZ);
                  const isFar = diff > 0.6;

                  return (
                    <circle
                      key={idx}
                      cx={px}
                      cy={py}
                      r={isFar ? 4 : 3}
                      fill={isFar ? '#e11d48' : '#4f46e5'}
                      stroke="#ffffff"
                      strokeWidth="1"
                      className="cursor-pointer transition-transform hover:scale-150"
                    />
                  );
                })}

                {/* Axis Labels */}
                <text
                  x={size / 2}
                  y={size - 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#475569"
                >
                  Kwantyle teoretyczne rozkładu normalnego (Z_teor)
                </text>
                <text
                  x={18}
                  y={size / 2}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#475569"
                  transform={`rotate(-90 18 ${size / 2})`}
                >
                  Kwantyle empiryczne próby (Z_emp)
                </text>

                {/* Tick Numbers on X */}
                {[-2, -1, 0, 1, 2].map((tick) => (
                  <text
                    key={`tx-${tick}`}
                    x={toSvgCoord(tick)}
                    y={size - pad + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {tick}
                  </text>
                ))}

                {/* Tick Numbers on Y */}
                {[-2, -1, 0, 1, 2].map((tick) => (
                  <text
                    key={`ty-${tick}`}
                    x={pad - 12}
                    y={size - toSvgCoord(tick) + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {tick}
                  </text>
                ))}
              </svg>
            </div>
          );
        })()}
      </div>

      {/* Educational guide */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="font-semibold text-slate-900 text-sm block">
                Jak interpretować kształt wykresu Q-Q w badaniach psychologicznych?
              </span>
              <span className="text-xs text-slate-500">
                Wzorce zakrzywienia punktów: asymetria, grube ogony i identyfikacja odstępstw od normalności.
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
                  1. Punkty na linii prostej
                </h4>
                <p>
                  Gdy punkty układają się wzdłuż prostej przekątnej (y = x), rozkład empiryczny jest
                  zgodny z rozkładem normalnym. Wtedy bezpiecznie można stosować testy parametryczne.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-slate-900 mb-1 text-sm">
                  2. Kształt litery „U” lub banan
                </h4>
                <p>
                  Zakrzywienie w kształcie litery „U” wskazuje na silną skośność (asymetrię). Punkty
                  w jednym ogonie wznoszą się wysoko ponad linię, a w drugim opadają poniżej.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-slate-900 mb-1 text-sm">
                  3. Kształt litery „S”
                </h4>
                <p>
                  Punkty układające się w kształt litery „S” świadczą o kurtozie (grubych ogonach lub
                  zbyt spłaszczonym rozkładzie). Skrajne wartości są bardziej ekstremalne niż
                  przewiduje model Gaussa.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
