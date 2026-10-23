import React, { useState } from 'react';
import { Table, Copy, Check, Download, Info } from 'lucide-react';
import { DatasetConfig, StatisticalSummary } from '../types';
import { formatStat } from '../utils/statistics';

interface SummaryTableProps {
  datasets: DatasetConfig[];
  summaries: Record<string, StatisticalSummary>;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  datasets,
  summaries,
}) => {
  const [copied, setCopied] = useState(false);

  // Copy as TSV (Tab-Separated Values) for pasting straight into Excel or Sheets
  const handleCopyTSV = () => {
    const headers = [
      'Grupa',
      'N',
      'Średnia zadana (μ)',
      'Średnia z próby (M)',
      'SD zadane (σ)',
      'Odchylenie standardowe z próby (SD)',
      'Mediana',
      'Q1 (25%)',
      'Q3 (75%)',
      'IQR',
      'Min',
      'Max',
      'Dolny wąs',
      'Górny wąs',
      'Liczba wartości odstających',
    ];

    const rows = datasets.map((d) => {
      const s = summaries[d.id];
      if (!s) return [];
      return [
        d.name,
        s.n,
        formatStat(s.targetMean, 2),
        formatStat(s.sampleMean, 2),
        formatStat(s.targetSD, 2),
        formatStat(s.sampleSD, 2),
        formatStat(s.median, 2),
        formatStat(s.q1, 2),
        formatStat(s.q3, 2),
        formatStat(s.iqr, 2),
        formatStat(s.min, 2),
        formatStat(s.max, 2),
        formatStat(s.lowerWhisker, 2),
        formatStat(s.upperWhisker, 2),
        s.outliers.length,
      ];
    });

    const tsvContent = [
      headers.join('\t'),
      ...rows.map((r) => r.join('\t')),
    ].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    const headers = [
      'Grupa',
      'N',
      'Srednia_zadana',
      'Srednia_z_proby',
      'SD_zadane',
      'SD_z_proby',
      'Mediana',
      'Q1',
      'Q3',
      'IQR',
      'Min',
      'Max',
      'Dolny_was',
      'Gorny_was',
      'Wartosci_odstajace_liczba',
    ];

    const rows = datasets.map((d) => {
      const s = summaries[d.id];
      if (!s) return [];
      return [
        `"${d.name}"`,
        s.n,
        s.targetMean,
        s.sampleMean.toFixed(3),
        s.targetSD,
        s.sampleSD.toFixed(3),
        s.median.toFixed(3),
        s.q1.toFixed(3),
        s.q3.toFixed(3),
        s.iqr.toFixed(3),
        s.min.toFixed(3),
        s.max.toFixed(3),
        s.lowerWhisker.toFixed(3),
        s.upperWhisker.toFixed(3),
        s.outliers.length,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'statystyki-opisowe-tabela.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/50 backdrop-blur-md border-t border-slate-200/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Tabela statystyk opisowych
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (Średnia, mediana, odchylenie standardowe oraz kwartyle obliczone z wylosowanej próby)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="copy-summary-tsv-button"
            type="button"
            onClick={handleCopyTSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/80 rounded-md transition cursor-pointer backdrop-blur-xs shadow-2xs"
            title="Kopiuj tabelę do schowka (dla Excel / Arkusze Google)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Skopiowano!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopiuj do Excela</span>
              </>
            )}
          </button>

          <button
            id="download-summary-csv-button"
            type="button"
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/80 rounded-md transition cursor-pointer backdrop-blur-xs shadow-2xs"
            title="Pobierz plik CSV dla programów R, SPSS lub Python"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksportuj CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/70 bg-white/60 backdrop-blur-xs shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/60 text-slate-700 font-bold border-b border-slate-200/80">
              <th className="py-2.5 px-3">Grupa</th>
              <th className="py-2.5 px-3 font-mono">N</th>
              <th className="py-2.5 px-3 font-mono bg-slate-200/40 text-slate-900 border-x border-slate-200/60">
                Średnia (M)
              </th>
              <th className="py-2.5 px-3 font-mono">Zadana &mu;</th>
              <th className="py-2.5 px-3 font-mono bg-emerald-50/50 text-emerald-950 border-x border-emerald-100/70">
                Mediana
              </th>
              <th className="py-2.5 px-3 font-mono bg-amber-50/50 text-amber-950 border-x border-amber-100/70">
                Odchylenie standardowe z próby (SD)
              </th>
              <th className="py-2.5 px-3 font-mono">Zadane &sigma;</th>
              <th className="py-2.5 px-3 font-mono">Q1 (25%)</th>
              <th className="py-2.5 px-3 font-mono">Q3 (75%)</th>
              <th className="py-2.5 px-3 font-mono">IQR</th>
              <th className="py-2.5 px-3 font-mono">Min / Max</th>
              <th className="py-2.5 px-3 font-mono">Wąsy</th>
              <th className="py-2.5 px-3 text-center">Odstające</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 font-mono text-slate-700">
            {datasets.map((d) => {
              const s = summaries[d.id];
              if (!s) return null;

              const meanDiff = s.sampleMean - s.targetMean;
              const distLabels: Record<string, string> = {
                normal: 'normalny',
                bimodal: 'bimodalny',
                skewed: 'prawoskośny',
                uniform: 'jednostajny',
              };

              return (
                <tr key={d.id} className="hover:bg-white/60 transition-colors">
                  {/* Name badge */}
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color.primary }}
                      />
                      <span>{d.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-normal text-slate-600 bg-slate-200/50">
                        {distLabels[d.distributionType] || d.distributionType}
                      </span>
                    </div>
                  </td>

                  {/* N */}
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {s.n}
                  </td>

                  {/* Sample Mean */}
                  <td className="py-2.5 px-3 font-bold text-slate-900 bg-slate-100/30 border-x border-slate-200/50">
                    {formatStat(s.sampleMean, 2)}
                    <span className="block text-[10px] font-normal text-slate-400">
                      {meanDiff >= 0 ? `+${formatStat(meanDiff, 2)}` : formatStat(meanDiff, 2)} błąd
                    </span>
                  </td>

                  {/* Target Mean */}
                  <td className="py-2.5 px-3 text-slate-600">
                    {formatStat(s.targetMean, 1)}
                  </td>

                  {/* Median */}
                  <td className="py-2.5 px-3 font-bold text-emerald-800 bg-emerald-50/20 border-x border-emerald-100/50">
                    {formatStat(s.median, 2)}
                  </td>

                  {/* Sample SD */}
                  <td className="py-2.5 px-3 font-bold text-amber-800 bg-amber-50/20 border-x border-amber-100/50">
                    {formatStat(s.sampleSD, 2)}
                  </td>

                  {/* Target SD */}
                  <td className="py-2.5 px-3 text-slate-600">
                    {formatStat(s.targetSD, 1)}
                  </td>

                  {/* Q1 */}
                  <td className="py-2.5 px-3 text-slate-600">
                    {formatStat(s.q1, 2)}
                  </td>

                  {/* Q3 */}
                  <td className="py-2.5 px-3 text-slate-600">
                    {formatStat(s.q3, 2)}
                  </td>

                  {/* IQR */}
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {formatStat(s.iqr, 2)}
                  </td>

                  {/* Min / Max */}
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {formatStat(s.min, 1)} / {formatStat(s.max, 1)}
                  </td>

                  {/* Whiskers */}
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    [{formatStat(s.lowerWhisker, 1)}, {formatStat(s.upperWhisker, 1)}]
                  </td>

                  {/* Outliers */}
                  <td className="py-2.5 px-3 text-center">
                    {s.outliers.length > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100/80 text-rose-800 border border-rose-200">
                        {s.outliers.length}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Classroom Discussion Prompt */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>
          <strong>Wskazówka dydaktyczna:</strong> Zwróć uwagę, jak zwiększenie wielkości próby <span className="font-mono text-slate-800 font-semibold">N</span> ze 100 w stronę 500 przybliża średnią z próby <span className="font-mono font-semibold">M</span> do wartości oczekiwanej <span className="font-mono font-semibold">&mu;</span> (Prawo Wielkich Liczb) i stabilizuje granice wąsów wykresu skrzynkowego.
        </span>
      </div>
    </div>
  );
};
