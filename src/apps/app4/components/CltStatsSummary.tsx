import React from 'react';
import { CiCoverageStats, CltStats, SampleItem } from '../types';
import { formatNum } from '../utils/statistics';
import {
  Calculator,
  Download,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface CltStatsSummaryProps {
  coverageStats: CiCoverageStats;
  cltStats: CltStats;
  currentSample: SampleItem | null;
  sampleSizeN: number;
  confidenceLevel: number;
  populationMean: number;
  populationSD: number;
  samples: SampleItem[];
}

export const CltStatsSummary: React.FC<CltStatsSummaryProps> = ({
  coverageStats,
  cltStats,
  currentSample,
  sampleSizeN,
  confidenceLevel,
  populationMean,
  populationSD,
  samples,
}) => {
  const {
    totalCount,
    coveredCount,
    missedCount,
    coverageRate,
    missedLeftCount,
    missedRightCount,
    significantCount,
    significantRate,
    meanPValue,
    meanCiWidth,
    theoreticalCiWidth,
  } = coverageStats;

  const confidencePercent = Math.round(confidenceLevel * 100);
  const alphaPercent = Math.round((1 - confidenceLevel) * 100);

  // Handle export sample means, CIs and p-values to CSV
  const handleExportCsv = () => {
    if (totalCount === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID_Proby,Liczebnosc_n,Srednia_xbar,Odchylenie_s,Blad_SE,Poziom_Ufnosci_CI,CI_Dolne,CI_Gorne,Zawiera_Prawdziwe_Mu,Statystyka_t,Wartosc_p,Istotny_Statystycznie\n' +
      samples
        .map(
          (s, idx) =>
            `${idx + 1},${s.n},${s.mean.toFixed(4)},${s.sd.toFixed(4)},${s.se.toFixed(4)},${(s.confidenceLevel * 100).toFixed(0)}%,${s.ciLower.toFixed(4)},${s.ciUpper.toFixed(4)},${s.containsMu ? 'TAK' : 'NIE'},${s.tStat.toFixed(4)},${s.pValue.toFixed(5)},${s.isSignificant ? 'TAK' : 'NIE'}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent || '');
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Taniec_CI_i_Wartosci_p_K${totalCount}_N${sampleSizeN}_CI${confidencePercent}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col gap-5 text-slate-800">
      {/* Header with Title & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs"
            style={{ backgroundColor: '#344B57' }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Statystyki pokrycia przedziałów ufności ({confidencePercent}% CI) i wartości p
            </h2>
            <p className="text-[11px] text-slate-500">
              Weryfikacja empirycznego odsetka przedziałów pokrywających prawdziwą średnią populacji μ = {formatNum(populationMean, 1)}
            </p>
          </div>
        </div>

        {totalCount > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Pobierz dane wszystkich wygenerowanych przedziałów i wartości p do pliku CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Pobierz dane (CSV)</span>
          </button>
        )}
      </div>

      {/* PRIMARY COVERAGE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Przedziały zawierające μ (SUKCES) */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-900 mb-1 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Zawierają prawdziwe μ:
              </span>
              <span className="text-[10px] font-mono text-emerald-700">Trafienia</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-800">
                {totalCount > 0 ? `${formatNum(coverageRate * 100, 1)}%` : '–'}
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                ({coveredCount} z {totalCount})
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-emerald-800">
            {totalCount > 0 ? (
              <span>Oczekiwano teoretycznie: <strong>{confidencePercent}%</strong></span>
            ) : (
              <span>Rozpocznij losowanie prób</span>
            )}
          </div>
        </div>

        {/* Card 2: Przedziały NIEzawierające μ (BŁĄD I RODZAJU) */}
        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-rose-900 mb-1 font-semibold">
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                NIE zawierają μ (błędy):
              </span>
              <span className="text-[10px] font-mono text-rose-700">Chybienia</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-rose-700">
                {totalCount > 0 ? `${formatNum((1 - coverageRate) * 100, 1)}%` : '–'}
              </span>
              <span className="text-xs text-rose-600 font-medium">
                ({missedCount} z {totalCount})
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-rose-800 flex justify-between">
            <span>Poniżej: {missedLeftCount}</span>
            <span>Powyżej: {missedRightCount}</span>
            <span>Teoria: {alphaPercent}%</span>
          </div>
        </div>

        {/* Card 3: Wartości p < alpha (Istotność testu t) */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-amber-950 mb-1 font-semibold">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Odsetek p &lt; {formatNum(1 - confidenceLevel, 2)}:
              </span>
              <span className="text-[10px] font-mono text-amber-700">Istotne H₀</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-amber-900">
                {totalCount > 0 ? `${formatNum(significantRate * 100, 1)}%` : '–'}
              </span>
              <span className="text-xs text-amber-700 font-medium">
                ({significantCount} z {totalCount})
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-800">
            {totalCount > 0 ? (
              <span>Średnia wart. p: <strong className="font-mono">{formatNum(meanPValue, 2)}</strong></span>
            ) : (
              <span>Czeka na próby</span>
            )}
          </div>
        </div>

        {/* Card 4: Szerokość przedziału (Empiryczna vs Teoretyczna) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1 font-semibold">
              <span className="flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-slate-500" />
                Średnia szerokość CI:
              </span>
              <span className="text-[10px] font-mono text-slate-400">Precyzja</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-slate-900">
                {totalCount > 0 ? formatNum(meanCiWidth, 2) : '–'}
              </span>
              <span className="text-xs text-slate-500">
                (Teoria: {formatNum(theoreticalCiWidth, 2)})
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Im większe n, tym węższy przedział przy stałym {confidencePercent}%
          </div>
        </div>
      </div>

      {/* Visual Convergence Progress Bar toward Target Level */}
      {totalCount > 0 && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">
              Zbieżność empirycznego pokrycia do nominalnego {confidencePercent}%:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {formatNum(coverageRate * 100, 1)}% / {confidencePercent}% (różnica: {formatNum(Math.abs(coverageRate * 100 - confidencePercent), 1)} pp)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex relative">
            <div
              className={`h-full transition-all duration-300 ${
                Math.abs(coverageRate * 100 - confidencePercent) <= 2
                  ? 'bg-emerald-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, coverageRate * 100)}%` }}
            />
            {/* Target line mark */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
              style={{ left: `${confidencePercent}%` }}
              title={`Nominalny poziom ufności: ${confidencePercent}%`}
            />
          </div>
        </div>
      )}

      {/* Observation Inspector of the Latest Drawn Sample (WYMÓG 4: POLICZONĄ WARTOŚĆ P) */}
      {currentSample && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-bold text-slate-800">
              Szczegółowa kalkulacja ostatnio pobranej próby (n = {currentSample.n}):
            </span>
            <div className="flex items-center gap-2 font-mono font-semibold">
              <span
                className="px-2 py-0.5 rounded border text-[11px]"
                style={
                  currentSample.containsMu
                    ? { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }
                    : { backgroundColor: '#f0f9ff', color: '#009EE0', borderColor: '#009EE0' }
                }
              >
                {currentSample.containsMu ? '✓ Pokrywa μ' : '✗ Nie zawiera μ'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 font-mono text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9.5px]">Średnia (x̄):</span>
              <strong className="text-slate-800 font-bold">{formatNum(currentSample.mean, 3)}</strong>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9.5px]">Błąd (SE = s/√n):</span>
              <strong className="text-slate-800">{formatNum(currentSample.se, 3)}</strong>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9.5px]">Statystyka t (df={currentSample.n - 1}):</span>
              <strong className="text-slate-800">{formatNum(currentSample.tStat, 3)}</strong>
            </div>
            <div
              className="p-2 rounded border"
              style={
                currentSample.isSignificant
                  ? { backgroundColor: '#f0f9ff', color: '#009EE0', borderColor: '#009EE0' }
                  : { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }
              }
            >
              <span className="text-slate-500 block text-[9.5px]">Wartość p (2-stronna):</span>
              <strong className="font-bold text-sm">p = {formatNum(currentSample.pValue, 4)}</strong>
            </div>
          </div>

          <div className="p-2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[11px]">
            {confidencePercent}% CI = x̄ ± t_crit · SE = {formatNum(currentSample.mean, 2)} ± ({formatNum(currentSample.tCrit, 3)} · {formatNum(currentSample.se, 2)}) = [{formatNum(currentSample.ciLower, 2)}, {formatNum(currentSample.ciUpper, 2)}]
          </div>
        </div>
      )}
    </div>
  );
};
