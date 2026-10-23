import React, { useState } from 'react';
import {
  DistributionCalculations,
  DisplaySettings,
} from '../types';
import { formatNum } from '../utils/statistics';
import { Table, ChevronDown, ChevronUp, Sparkles, Eye, EyeOff } from 'lucide-react';

interface SummaryTableProps {
  distACalc: DistributionCalculations;
  distBCalc: DistributionCalculations;
  distCCalc: DistributionCalculations;
  displaySettings: DisplaySettings;
  embedded?: boolean;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  distACalc,
  distBCalc,
  distCCalc,
  displaySettings,
  embedded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const isDual = displaySettings.comparisonMode === 'dual';
  const isTriple = displaySettings.comparisonMode === 'triple';

  // Współczynnik zmienności (CV): V = (sd / |mean|) * 100%
  const getCV = (sd: number, mean: number): number | null => {
    if (Math.abs(mean) < 0.001) return null;
    return (sd / Math.abs(mean)) * 100;
  };

  interface SummaryRow {
    category: string;
    label: string;
    symbol: string;
    isPercent?: boolean;
    aTeor: number | null;
    aEmp: number | null;
    bTeor: number | null;
    bEmp: number | null;
    cTeor: number | null;
    cEmp: number | null;
    note: string;
  }

  const rows: SummaryRow[] = [
    {
      category: 'Miary tendencji centralnej (położenia)',
      label: 'Średnia arytmetyczna',
      symbol: 'μ  /  M',
      aTeor: distACalc.theoretical.mean,
      aEmp: distACalc.empirical.sampleMean,
      bTeor: distBCalc.theoretical.mean,
      bEmp: distBCalc.empirical.sampleMean,
      cTeor: distCCalc.theoretical.mean,
      cEmp: distCCalc.empirical.sampleMean,
      note: 'Środek ciężkości rozkładu (parametr populacyjny μ, statystyka z próby M)',
    },
    {
      category: 'Miary tendencji centralnej (położenia)',
      label: 'Mediana (wartość środkowa)',
      symbol: 'Mdn',
      aTeor: distACalc.theoretical.median,
      aEmp: distACalc.empirical.sampleMedian,
      bTeor: distBCalc.theoretical.median,
      bEmp: distBCalc.empirical.sampleMedian,
      cTeor: distCCalc.theoretical.median,
      cEmp: distCCalc.empirical.sampleMedian,
      note: 'Dzieli rozkład dokładnie na 50% niższych i 50% wyższych (symbol: Mdn)',
    },
    {
      category: 'Miary tendencji centralnej (położenia)',
      label: 'Dominanta / Moda (wartość najczęstsza)',
      symbol: 'Mo  /  Mode',
      aTeor: distACalc.theoretical.mode,
      aEmp: distACalc.empirical.sampleMode,
      bTeor: distBCalc.theoretical.mode,
      bEmp: distBCalc.empirical.sampleMode,
      cTeor: distCCalc.theoretical.mode,
      cEmp: distCCalc.empirical.sampleMode,
      note: 'Szczyt krzywej gęstości / modalny słupek histogramu',
    },
    {
      category: 'Miary rozproszenia (zmienności)',
      label: 'Odchylenie standardowe',
      symbol: 'σ  /  SD',
      aTeor: distACalc.theoretical.sd,
      aEmp: distACalc.empirical.sampleSD,
      bTeor: distBCalc.theoretical.sd,
      bEmp: distBCalc.empirical.sampleSD,
      cTeor: distCCalc.theoretical.sd,
      cEmp: distCCalc.empirical.sampleSD,
      note: 'Przeciętne odchylenie od średniej (parametr populacyjny σ, statystyka z próby SD)',
    },
    {
      category: 'Miary rozproszenia (zmienności)',
      label: 'Wariancja',
      symbol: 'σ²  /  s²',
      aTeor: distACalc.theoretical.variance,
      aEmp: distACalc.empirical.sampleVariance,
      bTeor: distBCalc.theoretical.variance,
      bEmp: distBCalc.empirical.sampleVariance,
      cTeor: distCCalc.theoretical.variance,
      cEmp: distCCalc.empirical.sampleVariance,
      note: 'Kwadrat odchylenia standardowego (w próbie: s² = SD²)',
    },
    {
      category: 'Miary rozproszenia (zmienności)',
      label: 'Współczynnik zmienności',
      symbol: 'CV',
      isPercent: true,
      aTeor: getCV(distACalc.theoretical.sd, distACalc.theoretical.mean),
      aEmp: getCV(distACalc.empirical.sampleSD, distACalc.empirical.sampleMean),
      bTeor: getCV(distBCalc.theoretical.sd, distBCalc.theoretical.mean),
      bEmp: getCV(distBCalc.empirical.sampleSD, distBCalc.empirical.sampleMean),
      cTeor: getCV(distCCalc.theoretical.sd, distCCalc.theoretical.mean),
      cEmp: getCV(distCCalc.empirical.sampleSD, distCCalc.empirical.sampleMean),
      note: 'Względna miara zmienności CV = (SD / |M|) · 100% (<20% mała, 20–40% umiarkowana, >40% duża)',
    },
    {
      category: 'Miary kształtu rozkładu',
      label: 'Skośność (asymetria)',
      symbol: 'γ₁  /  Skew (g₁)',
      aTeor: distACalc.theoretical.skewness,
      aEmp: distACalc.empirical.sampleSkewness,
      bTeor: distBCalc.theoretical.skewness,
      bEmp: distBCalc.empirical.sampleSkewness,
      cTeor: distCCalc.theoretical.skewness,
      cEmp: distCCalc.empirical.sampleSkewness,
      note: '0 = symetria, >0 = prawostronna (dodatnia), <0 = lewostronna (ujemna)',
    },
    {
      category: 'Miary kształtu rozkładu',
      label: 'Kurtoza',
      symbol: 'γ₂  /  Kurt (g₂)',
      aTeor: distACalc.theoretical.excessKurtosis,
      aEmp: distACalc.empirical.sampleExcessKurtosis,
      bTeor: distBCalc.theoretical.excessKurtosis,
      bEmp: distBCalc.empirical.sampleExcessKurtosis,
      cTeor: distCCalc.theoretical.excessKurtosis,
      cEmp: distCCalc.empirical.sampleExcessKurtosis,
      note: '0 = rozkład mezokurtyczny (normalny), >0 = leptokurtyczny, <0 = platykurtyczny',
    },
  ];

  const formatCell = (val: number | null, isPercent?: boolean) => {
    if (val === null || val === undefined || isNaN(val)) return '— (μ≈0)';
    return isPercent ? `${formatNum(val, 1)}%` : formatNum(val, 2);
  };

  const renderDiff = (teor: number | null, emp: number | null, isPercent?: boolean) => {
    if (teor === null || emp === null || isNaN(teor) || isNaN(emp)) {
      return <span className="text-slate-400">—</span>;
    }
    const diff = emp - teor;
    const threshold = isPercent ? 1.0 : 0.2;
    const isClose = Math.abs(diff) < threshold;
    const formatted = formatNum(diff, isPercent ? 1 : 2);
    const suffix = isPercent ? ' pp' : '';
    const text = diff > 0 ? `+${formatted}${suffix}` : `${formatted}${suffix}`;

    return (
      <span className={isClose ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
        {text}
      </span>
    );
  };

  return (
    <div
      className={
        embedded
          ? 'bg-white border-t border-slate-200/80 overflow-hidden flex flex-col transition-all rounded-b-xl'
          : 'bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col transition-all'
      }
    >
      {/* Header bar / Toggle */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-3.5 sm:p-4 bg-slate-50/90 hover:bg-slate-100/90 transition-colors flex items-center justify-between cursor-pointer select-none"
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Tabela wartości teoretycznych o obserwowalnych
              </h3>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                ({isExpanded ? 'kliknij, aby zwinąć' : 'kliknij, aby rozwinąć'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isExpanded
                ? 'Szczegółowe porównanie wartości parametrów teoretycznych oraz statystyk z próby empirycznej'
                : 'Rozwiń tabelę, aby porównać parametry teoretyczne i dane obserwowalne z próby empirycznej'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs">
            {isExpanded ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Zwiń tabelę</span>
                <ChevronUp className="w-4 h-4 text-slate-500" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-sky-700 font-bold hidden sm:inline">Rozwiń tabelę</span>
                <ChevronDown className="w-4 h-4 text-sky-600" />
              </>
            )}
          </span>
        </div>
      </div>

      {/* Collapsible Table Content */}
      {isExpanded && (
        <div className="border-t border-slate-200/80 animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200/80">
                  <th className="py-2.5 px-4 font-bold">Parametr statystyczny</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  
                  {/* Distribution A Columns */}
                  <th className="py-2.5 px-3 text-sky-900 bg-sky-50/60 font-bold border-l border-slate-200/80">
                    {distACalc.config.name} (Teoria)
                  </th>
                  <th className="py-2.5 px-3 text-sky-900 bg-sky-50/30 font-bold">
                    {distACalc.config.name} (Próba <em>N</em> = {distACalc.config.sampleN})
                  </th>
                  <th className="py-2.5 px-3 text-sky-700 bg-sky-50/30">
                    Różnica (błąd próby)
                  </th>

                  {/* Distribution B Columns if Dual or Triple */}
                  {(isDual || isTriple) && (
                    <>
                      <th className="py-2.5 px-3 text-amber-900 bg-amber-50/60 font-bold border-l border-slate-200/80">
                        {distBCalc.config.name} (Teoria)
                      </th>
                      <th className="py-2.5 px-3 text-amber-900 bg-amber-50/30 font-bold">
                        {distBCalc.config.name} (Próba <em>N</em> = {distBCalc.config.sampleN})
                      </th>
                      <th className="py-2.5 px-3 text-amber-700 bg-amber-50/30">
                        Różnica (błąd)
                      </th>
                    </>
                  )}

                  {/* Distribution C Columns if Triple */}
                  {isTriple && (
                    <>
                      <th className="py-2.5 px-3 text-purple-900 bg-purple-50/60 font-bold border-l border-slate-200/80">
                        {distCCalc.config.name} (Teoria)
                      </th>
                      <th className="py-2.5 px-3 text-purple-900 bg-purple-50/30 font-bold">
                        {distCCalc.config.name} (Próba <em>N</em> = {distCCalc.config.sampleN})
                      </th>
                      <th className="py-2.5 px-3 text-purple-700 bg-purple-50/30">
                        Różnica (błąd)
                      </th>
                    </>
                  )}

                  <th className="py-2.5 px-4 text-slate-500 border-l border-slate-200/80 hidden lg:table-cell">
                    Interpretacja dydaktyczna
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  return (
                    <tr key={`row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {row.label}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">
                        {row.symbol}
                      </td>

                      {/* Dist A values */}
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-800 bg-sky-50/30 border-l border-slate-200/80">
                        {formatCell(row.aTeor, row.isPercent)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 bg-sky-50/10">
                        {formatCell(row.aEmp, row.isPercent)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs bg-sky-50/10">
                        {renderDiff(row.aTeor, row.aEmp, row.isPercent)}
                      </td>

                      {/* Dist B values if Dual or Triple */}
                      {(isDual || isTriple) && (
                        <>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-800 bg-amber-50/30 border-l border-slate-200/80">
                            {formatCell(row.bTeor, row.isPercent)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 bg-amber-50/10">
                            {formatCell(row.bEmp, row.isPercent)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs bg-amber-50/10">
                            {renderDiff(row.bTeor, row.bEmp, row.isPercent)}
                          </td>
                        </>
                      )}

                      {/* Dist C values if Triple */}
                      {isTriple && (
                        <>
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-800 bg-purple-50/30 border-l border-slate-200/80">
                            {formatCell(row.cTeor, row.isPercent)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800 bg-purple-50/10">
                            {formatCell(row.cEmp, row.isPercent)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs bg-purple-50/10">
                            {renderDiff(row.cTeor, row.cEmp, row.isPercent)}
                          </td>
                        </>
                      )}

                      <td className="py-2.5 px-4 text-slate-500 border-l border-slate-200/80 text-[11px] hidden lg:table-cell">
                        {row.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Educational Footer Insight */}
          <div className="p-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Wskazówka dydaktyczna:</strong> Statystyki z próby losowej różnią się nieznacznie od parametrów teoretycznych z powodu <em>błędu próbkobrania (losowości)</em>. Wraz ze wzrostem liczebności próby <em>N</em>, statystyki empiryczne dążą do wartości teoretycznych (Prawo Wielkich Liczb).
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
