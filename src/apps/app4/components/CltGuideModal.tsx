import React from 'react';
import { X, BookOpen, CheckCircle2, TrendingUp, Lightbulb, HelpCircle, Layers, ShieldCheck, Activity } from 'lucide-react';

interface CltGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CltGuideModal: React.FC<CltGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guide-modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Przewodnik dydaktyczny: Taniec przedziałów ufności i wartości p
              </h2>
              <p className="text-xs text-slate-500">
                Podstawy metodologii i statystyki • Uniwersytet SWPS • Jakub Traczyk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Zamknij okno przewodnika"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 text-sm leading-relaxed">
          {/* Section 1: Czym jest przedział ufności (95% CI)? */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              1. Czym tak naprawdę jest przedział ufności (95% CI)?
            </h3>
            <p className="text-slate-600">
              Pojedyncza średnia z próby (<em>x̄</em>) niemal nigdy nie jest dokładnie równa prawdziwej średniej w populacji (<em>μ</em>). Przedział ufności (ang. <em>Confidence Interval</em>, CI) podaje zakres wartości, w którym z określoną ufnością znajduje się nieznany parametr populacji:
            </p>
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center font-mono font-bold text-amber-900 text-sm sm:text-base">
              95% CI = x̄ ± t_crit · SE = [x̄ - t_crit · (s / √n),  x̄ + t_crit · (s / √n)]
            </div>
            <p className="text-xs text-slate-500 italic">
              <strong>Prawidłowa interpretacja częstotliwościowa:</strong> Gdybyśmy powtórzyli to samo badanie nieskończenie wiele razy, to <strong>95% tak skonstruowanych przedziałów</strong> pokryłoby prawdziwą średnią populacji <em>μ</em>, a <strong>5%</strong> z nich by ją chybiło.
            </p>
          </div>

          {/* Section 2: Taniec przedziałów ufności (Geoff Cumming) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              2. Taniec przedziałów ufności („Dance of the Confidence Intervals”)
            </h3>
            <p className="text-slate-600">
              Koncepcja spopularyzowana przez prof. Geoffa Cumminga (autora <em>The New Statistics</em>) polega na obserwowaniu kolejnych niezależnych prób z tej samej populacji.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs mb-1">Żółte przedziały (Trafienia)</h4>
                <p className="text-xs text-slate-600">
                  Przedział przecina pionową linię prawdziwej średniej <em>μ = 50</em>. Stanowią one średnio <strong>95% wszystkich prób</strong>. W tych próbach test t-Studenta wykaże brak istotności (<em>p ≥ 0,05</em>).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                <h4 className="font-bold text-rose-900 text-xs mb-1">Czerwone przedziały (Chybienia / Błędy)</h4>
                <p className="text-xs text-rose-700">
                  Przedział leży w całości po lewej lub prawej stronie <em>μ</em>. Zdarza się to w około <strong>5% przypadków</strong> (1 na 20 prób). To naturalny błąd I rodzaju w losowaniu próby!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Taniec wartości p i jego zmienność */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              3. Taniec wartości p („Dance of the p-values”)
            </h3>
            <p className="text-slate-600">
              Jedno z najbardziej szokujących odkryć dla studentów metodologii: <strong>wartość p jest skrajnie niestabilna</strong>! Nawet jeśli pobierasz próby z dokładnie tej samej populacji:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                W jednej próbie otrzymasz <strong>p = 0,64</strong>, w kolejnej <strong>p = 0,02</strong>, a w trzeciej <strong>p = 0,18</strong>!
              </li>
              <li>
                Gdy hipoteza zerowa jest prawdziwa (badamy brak różnic względem μ), rozkład wartości <em>p</em> jest <strong>idealnie jednostajny</strong> w przedziale od 0 do 1.
              </li>
              <li>
                Dlatego współczesna metodologia (APA, Nature, Psych Science) kładzie nacisk na <strong>przedziały ufności i wielkości efektu</strong> zamiast samego ślepego patrzenia na <em>p &lt; 0,05</em>.
              </li>
            </ul>
          </div>

          {/* Section 4: Związek CI z wartością p */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              4. Złota zasada wnioskowania: Związek CI i p
            </h3>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                Dwustronny przedział (1 - α) CI zawiera wartość testowaną μ₀ wtedy i tylko wtedy, gdy p ≥ α.
              </p>
              <p>
                Dla 95% CI (gdzie α = 0,05):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gdy przedział <strong>zawiera μ₀</strong> → p ≥ 0,05 (brak podstaw do odrzucenia H₀).</li>
                <li>Gdy przedział <strong>nie zawiera μ₀</strong> (czerwony) → p &lt; 0,05 (odrzucamy H₀, wynik istotny statystycznie).</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Liczebność próby n i szerokość CI */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              5. Wpływ liczebności próby n na szerokość przedziału
            </h3>
            <p className="text-slate-600 text-xs">
              Szerokość przedziału ufności jest wprost proporcjonalna do błędu standardowego: <strong>SE = s / √n</strong>.
              Zwiększenie liczebności próby np. z n = 10 do n = 100 zwęża przedział ponad 3-krotnie, dając znacznie większą precyzję oszacowania, podczas gdy odsetek trafień wciąż wynosi nominalne 95%.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Rozumiem, wróć do symulacji
          </button>
        </div>
      </div>
    </div>
  );
};
