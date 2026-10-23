import React from 'react';
import { X, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface StatsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsGuideModal: React.FC<StatsGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Przewodnik dydaktyczny: Statystyka opisowa
              </h3>
              <p className="text-xs text-slate-500">
                Wykresy skrzynkowe (box plot), wykresy wiolinowe i punkty z szumem losowym
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Section 1: Box Plot Anatomy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-2 h-2 rounded-full bg-slate-800" />
              <span>Wykres skrzynkowy (Tukey, 1977)</span>
            </div>
            <p>
              Wykres skrzynkowy podsumowuje rozkład ciągły za pomocą <strong>pięciu liczb Tukeya</strong>:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <li className="p-2 rounded-md bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">Mediana (Q2):</span> Wartość środkowa (50. percentyl) dzieląca uporządkowany zbiór na dwie równe części.
              </li>
              <li className="p-2 rounded-md bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">Skrzynka / rozstęp ćwiartkowy (IQR):</span> Obejmuje zakres od Q1 (25%) do Q3 (75%), zawierając środkowe 50% obserwacji.
              </li>
              <li className="p-2 rounded-md bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900">Wąsy:</span> Sięgają do najbardziej skrajnych punktów w odległości nie większej niż 1,5 &times; IQR od krawędzi skrzynki.
              </li>
              <li className="p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-900">
                <span className="font-bold">Wartości odstające:</span> Punkty położone poza granicą 1,5 &times; IQR, zaznaczane indywidualnie jako kropki.
              </li>
            </ul>
          </div>

          {/* Section 2: Why add Individual Points? */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Warstwa 1: Punkty z szumem losowym (jitter)</span>
            </div>
            <p>
              Wykres skrzynkowy kompresuje setki obserwacji do 5 wskaźników sumarycznych. Nałożenie surowych punktów ujawnia:
            </p>
            <div className="flex items-start gap-2 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Liczebność próby i rzeczywiste zagęszczenie:</strong> Wykres skrzynkowy może wyglądać niemal identycznie przy N=100 jak i N=500. Warstwa punktów z szumem losowym pozwala studentom natychmiast dostrzec rzeczywistą gęstość obserwacji i skupiska danych.
              </div>
            </div>
          </div>

          {/* Section 3: Why add Violin Plots? */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Warstwa 2: Wykresy wiolinowe</span>
            </div>
            <p>
              Wykresy wiolinowe łączą metryki wykresu skrzynkowego z symetrycznym zarysem gęstości prawdopodobieństwa.
            </p>
            <div className="flex items-start gap-2 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Problem multimodalności:</strong> Rozkład bimodalny (np. mieszanina dwóch podpopulacji) oraz rozkład jednostajny mogą generować zbliżone skrzynki na tradycyjnym wykresie skrzynkowym! Wykres wiolinowy odsłania kształt rozkładu, demaskując wiele wierzchołków i asymetrię.
              </div>
            </div>
          </div>

          {/* Section 4: Sample Mean vs Median */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-2.5 h-2.5 rotate-45 bg-[#E2001A] border border-[#B30015]" />
              <span>Średnia (&mu;/M) a Mediana</span>
            </div>
            <p>
              W idealnie symetrycznym rozkładzie normalnym średnia arytmetyczna i mediana pokrywają się. Przy asymetrii lub obecności silnych wartości odstających średnia jest „ciągnięta” w stronę ogona rozkładu, podczas gdy mediana pozostaje odporna (rozkład skośny). Włącz znacznik średniej, aby zademonstrować to zjawisko na zajęciach.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer"
          >
            Zamknij przewodnik
          </button>
        </div>
      </div>
    </div>
  );
};
