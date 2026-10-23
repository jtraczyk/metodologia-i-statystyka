import React from 'react';
import { X, BookOpen, CheckCircle2, TrendingUp, Lightbulb, HelpCircle, Layers } from 'lucide-react';

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
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guide-modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Przewodnik dydaktyczny: Centralne Twierdzenie Graniczne (CTG)
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
          {/* Section 1: Czym jest CTG? */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              1. Czym jest Centralne Twierdzenie Graniczne?
            </h3>
            <p className="text-slate-600">
              Centralne Twierdzenie Graniczne (ang. <em>Central Limit Theorem</em>, CTG) to jeden z najważniejszych filarów całej statystyki wnioskowania.
              Mówi ono, że jeśli pobieramy niezależne próby losowe o liczebności <strong>n</strong> z <strong>dowolnej populacji</strong> o skończonej średniej <em>μ</em> i odchyleniu standardowym <em>σ</em>, to rozkład średnich z tych prób (<em>x̄</em>) przy rosnącym <em>n</em> dąży do <strong>rozkładu normalnego</strong>:
            </p>
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-center font-mono font-bold text-sky-900 text-sm sm:text-base">
              x̄ ~ N(μ, σ² / n) = N(μ, SE²)
            </div>
          </div>

          {/* Section 2: Dwie kluczowe własności */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Dwie kluczowe konsekwencje twierdzenia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs mb-1">A. Średnia ze średnich równa się średniej populacji</h4>
                <p className="text-xs text-slate-600">
                  Wartość oczekiwana średniej z próby jest dokładnie równa średniej populacyjnej: <strong>E(x̄) = μ</strong>. Średnia z próby jest <em>estymatorem nieobciążonym</em>.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs mb-1">B. Zmienność średnich maleje z pierwiastkiem z n</h4>
                <p className="text-xs text-slate-600">
                  Rozrzut średnich jest <strong>√n razy mniejszy</strong> niż rozrzut pojedynczych wyników w populacji: <strong>SE = σ / √n</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Błąd standardowy średniej (SE) */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              3. Błąd standardowy średniej (Standard Error, SE)
            </h3>
            <p className="text-slate-600">
              Częstym błędem studentów jest mylenie odchylenia standardowego (<em>σ</em>) z błędem standardowym (<em>SE</em>):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                <strong>Odchylenie standardowe (σ lub s):</strong> mierzy zmienność <em>pojedynczych obserwacji</em> osób/obiektów wokół średniej.
              </li>
              <li>
                <strong>Błąd standardowy (SE):</strong> mierzy zmienność <em>samej średniej</em> między różnymi badaniami (próbami). Określa precyzję, z jaką średnia z próby estymuje prawdziwą średnią populacji.
              </li>
              <li>
                <strong>Zależność pierwiastkowa (Prawo malejących przychodów):</strong> Aby zmniejszyć błąd pomiaru o połowę (2x), musisz zwiększyć liczebność próby <strong>4-krotnie</strong> (bo √4 = 2).
              </li>
            </ul>
          </div>

          {/* Section 4: Dlaczego rozkład wyjściowy nie musi być normalny? */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              4. Dlaczego CTG działa dla dowolnej populacji?
            </h3>
            <p className="text-slate-600">
              W tej aplikacji możesz wybrać populację skośną, płaską (jednostajną) lub dwumodalną.
              Zauważ, co dzieje się, gdy n = 30:
            </p>
            <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              Gdy losujesz 30 osób, niezwykle rzadko zdarza się, aby wszyscy mieli skrajnie wysokie lub skrajnie niskie wyniki. Wyniki wysokie i niskie w pojedynczej próbie <strong>wzajemnie się znoszą i uśredniają</strong> w okolicach centrum! W efekcie średnie zawsze tworzą symetryczny dzwon Gaussa.
            </p>
          </div>

          {/* Section 5: Dlaczego magiczna liczba to n ≥ 30? */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              5. Dlaczego w podręcznikach powtarza się n ≥ 30?
            </h3>
            <p className="text-slate-600 text-xs">
              Dla większości rozkładów spotykanych w psychologii i naukach społecznych (nawet z umiarkowaną skośnością) próba o wielkości <strong>n ≥ 30</strong> wystarcza, aby rozkład średniej z próby był praktycznie nieodróżnialny od idealnego rozkładu normalnego. Umożliwia to bezpieczne stosowanie testów parametrycznych (np. testu t-Studenta, analizy wariancji ANOVA) oraz konstruowanie przedziałów ufności.
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
