import React from 'react';
import { CltStats, SampleItem } from '../types';
import { formatNum } from '../utils/statistics';
import { Calculator, Download, CheckCircle2 } from 'lucide-react';

interface CltStatsSummaryProps {
  cltStats: CltStats;
  currentSample: SampleItem | null;
  sampleSizeN: number;
}

export const CltStatsSummary: React.FC<CltStatsSummaryProps> = ({
  cltStats,
  currentSample,
  sampleSizeN,
}) => {
  const {
    kSamples,
    populationMean,
    populationSD,
    theoreticalSE,
    meanOfMeans,
    sdOfMeans,
    skewnessOfMeans,
    kurtosisOfMeans,
  } = cltStats;

  // Comparison differences
  const meanDiff = kSamples > 0 ? Math.abs(meanOfMeans - populationMean) : 0;
  const seDiff = kSamples > 1 ? Math.abs(sdOfMeans - theoreticalSE) : 0;
  const seErrorPercent = theoreticalSE > 0 && kSamples > 1 ? (seDiff / theoreticalSE) * 100 : 0;

  // Handle export sample means to CSV
  const handleExportCsv = () => {
    if (kSamples === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID_Proby,Srednia_z_Proby_xbar\n' +
      (window as unknown as { __lastSampleMeans?: number[] }).__lastSampleMeans
        ?.map((val, idx) => `${idx + 1},${val.toFixed(4)}`)
        .join('\n');
    const encodedUri = encodeURI(csvContent || '');
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CTG_Srednie_z_prob_K${kSamples}_N${sampleSizeN}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col gap-4">
      {/* Header with Title & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-2xs"
            style={{ backgroundColor: '#344B57' }}
          >
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              3. Zestawienie statystyk: Teoria vs Empiria
            </h2>
            <p className="text-[11px] text-slate-500">
              Weryfikacja założeń Centralnego Twierdzenia Granicznego na danych z wylosowanych prób
            </p>
          </div>
        </div>

        {kSamples > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Eksportuj wszystkie wylosowane średnie do pliku CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Pobierz dane (CSV)</span>
          </button>
        )}
      </div>

      {/* Main Comparative Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Średnia ze średnich */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">Średnia ze średnich:</span>
            <span className="text-[10px] font-mono text-slate-400">μ vs x̄̄</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-slate-900">
              {kSamples > 0 ? formatNum(meanOfMeans, 2) : '–'}
            </span>
            <span className="text-xs text-slate-500">
              (Teoria: <strong style={{ color: '#009EE0' }}>{formatNum(populationMean, 2)}</strong>)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            {kSamples > 0 && meanDiff <= 0.25 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zbieżność: różnica {formatNum(meanDiff, 3)}
              </span>
            ) : kSamples > 0 ? (
              <span>Różnica: {formatNum(meanDiff, 3)}</span>
            ) : (
              <span>Brak wylosowanych prób</span>
            )}
          </div>
        </div>

        {/* Metric 2: Błąd standardowy (SE) - Themed with #F29400 */}
        <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-950 mb-1">
            <span className="font-semibold">Błąd standardowy (SE):</span>
            <span className="text-[10px] font-mono text-amber-700">SE vs s_x̄</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono" style={{ color: '#D37E00' }}>
              {kSamples > 1 ? formatNum(sdOfMeans, 2) : '–'}
            </span>
            <span className="text-xs text-amber-800">
              (Teoria: <strong style={{ color: '#F29400' }}>{formatNum(theoreticalSE, 2)}</strong>)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-amber-900">
            {kSamples > 1 ? (
              <span>Różnica: {formatNum(seDiff, 3)} ({formatNum(seErrorPercent, 1)}%)</span>
            ) : (
              <span>Wymaga co najmniej 2 prób</span>
            )}
          </div>
        </div>

        {/* Metric 3: Skośność rozkładu średnich */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">Skośność rozkładu średnich:</span>
            <span className="text-[10px] font-mono text-slate-400">g1 (asymetria)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-slate-900">
              {kSamples > 2 ? formatNum(skewnessOfMeans, 2) : '–'}
            </span>
            <span className="text-xs text-slate-500">(Teoria: 0,00)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {kSamples > 2 && Math.abs(skewnessOfMeans) < 0.2 ? (
              <span className="text-emerald-700 font-semibold">Symetryczny (bliski 0)</span>
            ) : kSamples > 2 ? (
              <span>{skewnessOfMeans > 0 ? 'Prawoskośny' : 'Lewoskośny'}</span>
            ) : (
              <span>Wymaga ≥ 3 prób</span>
            )}
          </div>
        </div>

        {/* Metric 4: Kurtoza rozkładu średnich */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">Kurtoza rozkładu średnich:</span>
            <span className="text-[10px] font-mono text-slate-400">g2 (spłaszczenie)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-slate-900">
              {kSamples > 3 ? formatNum(kurtosisOfMeans, 2) : '–'}
            </span>
            <span className="text-xs text-slate-500">(Teoria: 0,00)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {kSamples > 3 && Math.abs(kurtosisOfMeans) < 0.3 ? (
              <span className="text-emerald-700 font-semibold">Mezokurtyczny (dzwon normalny)</span>
            ) : kSamples > 3 ? (
              <span>{kurtosisOfMeans > 0 ? 'Leptokurtyczny' : 'Platykurtyczny'}</span>
            ) : (
              <span>Wymaga ≥ 4 prób</span>
            )}
          </div>
        </div>
      </div>

      {/* Observation inspector of the latest sample */}
      {currentSample && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-bold text-slate-800">
              Szczegóły ostatnio pobranej próby (n = {currentSample.values.length}):
            </span>
            <div className="flex items-center gap-3 font-mono font-semibold">
              <span style={{ color: '#D37E00' }}>x̄ = {formatNum(currentSample.mean, 3)}</span>
              <span className="text-slate-600">s = {formatNum(currentSample.sd, 3)}</span>
            </div>
          </div>
          {/* Values list in #009EE0 accents */}
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            {currentSample.values.map((v, idx) => (
              <span
                key={`val-${idx}`}
                className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px]"
              >
                {formatNum(v, 1)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
