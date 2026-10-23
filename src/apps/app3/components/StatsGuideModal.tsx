import React, { useState } from 'react';
import { X, BookOpen, GraduationCap, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface StatsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsGuideModal: React.FC<StatsGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'skewness' | 'kurtosis' | 'empirical' | 'zscore'>('concepts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <GraduationCap className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 id="guide-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
                Przewodnik: Rozkład normalny, skośność i kurtoza
              </h2>
              <p className="text-xs text-slate-300">
                Podstawy metodologii i statystyki • Uniwersytet SWPS • autor: Jakub Traczyk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('concepts')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'concepts'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Rozkład Gaussa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skewness')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'skewness'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Skośność (M, Mdn, Mo)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kurtosis')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'kurtosis'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Kurtoza
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zscore')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'zscore'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Standaryzacja Z i P
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('empirical')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'empirical'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            5. Próba empiryczna (N)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {activeTab === 'concepts' && (
            <div className="space-y-5">
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-sky-900 space-y-2">
                <h3 className="font-bold text-base text-sky-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Czym jest rozkład normalny?
                </h3>
                <p className="text-xs sm:text-sm text-sky-800">
                  Rozkład normalny (zwany również <strong>krzywą Gaussa</strong>) to najważniejszy rozkład prawdopodobieństwa w psychologii, biologii i naukach społecznych. Opisuje zjawiska, na które wpływa wiele drobnych, niezależnych czynników losowych (zgodnie z Centralnym Twierdzeniem Granicznym).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                    Średnia (μ) — parametr położenia
                  </h4>
                  <p className="text-xs text-slate-600">
                    Określa środek symetrii rozkładu na osi poziomej. Zmiana średniej przesuwa cały dzwon w lewo lub w prawo, nie zmieniając jego kształtu ani rozpiętości.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                    Odchylenie standardowe (σ) — parametr rozproszenia
                  </h4>
                  <p className="text-xs text-slate-600">
                    Decyduje o szerokości i spłaszczeniu krzywej. Małe σ daje dzwon wąski i wysoki (duża koncentracja), a duże σ daje dzwon szeroki i spłaszczony (duża zmienność wyników).
                  </p>
                </div>
              </div>

              {/* 3-sigma rule */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Reguła trzech sigm (68 – 95 – 99.7)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5">
                    <div className="font-mono font-bold text-sky-800 text-base">68.27%</div>
                    <div className="text-xs text-sky-700 font-medium">przedział [μ - 1σ ; μ + 1σ]</div>
                  </div>
                  <div className="bg-sky-100/60 border border-sky-200 rounded-lg p-2.5">
                    <div className="font-mono font-bold text-sky-900 text-base">95.45%</div>
                    <div className="text-xs text-sky-800 font-medium">przedział [μ - 2σ ; μ + 2σ]</div>
                  </div>
                  <div className="bg-sky-200/50 border border-sky-300 rounded-lg p-2.5">
                    <div className="font-mono font-bold text-sky-950 text-base">99.73%</div>
                    <div className="text-xs text-sky-900 font-medium">przedział [μ - 3σ ; μ + 3σ]</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skewness' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 space-y-2">
                <h3 className="font-bold text-base text-amber-950">
                  Skośność (asymetria) i relacja: Średnia vs Mediana vs Dominanta
                </h3>
                <p className="text-xs sm:text-sm text-amber-800">
                  Skośność (współczynnik asymetrii γ₁) mierzy brak symetrii rozkładu wokół średniej. Gdy rozkład staje się skośny, trzy klasyczne miary tendencji centralnej przestają być równe i rozsuwają się w ściśle określonym porządku!
                </p>
              </div>

              <div className="space-y-4">
                {/* Symmetric */}
                <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/40">
                  <div className="flex items-center justify-between font-bold text-emerald-900 text-sm">
                    <span>1. Rozkład symetryczny (γ₁ = 0)</span>
                    <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Dominanta = Mediana = Średnia
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    W rozkładzie symetrycznym punkt najwyższej częstości (dominanta), wartość dzieląca próbę na pół (mediana) oraz środek ciężkości (średnia arytmetyczna) leżą dokładnie w tym samym punkcie.
                  </p>
                </div>

                {/* Positive skew */}
                <div className="border border-amber-200 rounded-xl p-3.5 bg-amber-50/40">
                  <div className="flex items-center justify-between font-bold text-amber-900 text-sm">
                    <span>2. Asymetria prawostronna / dodatnia (γ₁ &gt; 0)</span>
                    <span className="font-mono text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Dominanta &lt; Mediana &lt; Średnia
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Prawy ogon jest wydłużony (występują nieliczne, bardzo wysokie wartości skrajne, np. dochody w społeczeństwie czy czas reakcji). Te wysokie wartości „ciągną” średnią arytmetyczną mocno w prawo. Mediana przesuwa się mniej, a dominanta pozostaje na szczycie po lewej stronie.
                  </p>
                </div>

                {/* Negative skew */}
                <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/40">
                  <div className="flex items-center justify-between font-bold text-indigo-900 text-sm">
                    <span>3. Asymetria lewostronna / ujemna (γ₁ &lt; 0)</span>
                    <span className="font-mono text-xs bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                      Średnia &lt; Mediana &lt; Dominanta
                    </span>
                  </div>
                  <p className="text-xs text-indigo-800 mt-1">
                    Lewy ogon jest wydłużony (nieliczne niskie wyniki, np. bardzo łatwy egzamin, w którym większość osób ma max punktów, a tylko nieliczni oblali). Średnia jest zaniżona przez ogon lewy. Mediana jest wyższa, a dominanta najwyższa.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-700">
                <strong>Zasada wyboru miary:</strong> W rozkładach silnie skośnych to <em>mediana</em> (nie średnia) jest najbardziej odporną miarą „przeciętnego” wyniku, ponieważ nie jest wrażliwa na obserwacje odstające w wydłużonym ogonie.
              </div>
            </div>
          )}

          {activeTab === 'kurtosis' && (
            <div className="space-y-5">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-purple-900 space-y-2">
                <h3 className="font-bold text-base text-purple-950">
                  Kurtoza (γ₂) — koncentracja i grubość ogonów
                </h3>
                <p className="text-xs sm:text-sm text-purple-800">
                  Kurtoza określa stopień skupienia wartości wokół średniej w porównaniu ze standardowym rozkładem normalnym oraz grubość tzw. ogonów rozkładu (prawdopodobieństwo wystąpienia wartości skrajnych). Dla wzorcowego rozkładu normalnego kurtoza wynosi dokładnie <strong>γ₂ = 0</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="border border-teal-200 rounded-xl p-3 bg-teal-50/50 space-y-1.5">
                  <span className="font-bold text-teal-900 text-sm block">Platykurtyczny (γ₂ &lt; 0)</span>
                  <span className="text-teal-700 font-medium">Rozkład spłaszczony</span>
                  <p className="text-slate-600">
                    Wierzchołek krzywej jest bardziej płaski niż w rozkładzie Gaussa. Mniej wartości skupia się w centrum, a ogony są cienkie (mało wartości skrajnych).
                  </p>
                </div>

                <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/50 space-y-1.5">
                  <span className="font-bold text-emerald-900 text-sm block">Mezokurtyczny (γ₂ = 0)</span>
                  <span className="text-emerald-700 font-medium">Rozkład normalny</span>
                  <p className="text-slate-600">
                    Wzorcowa krzywa Gaussa (kurtoza γ₂ = 0). Optymalny balans między wierzchołkiem a ogonami.
                  </p>
                </div>

                <div className="border border-purple-200 rounded-xl p-3 bg-purple-50/50 space-y-1.5">
                  <span className="font-bold text-purple-900 text-sm block">Leptokurtyczny (γ₂ &gt; 0)</span>
                  <span className="text-purple-700 font-medium">Rozkład wysmukły</span>
                  <p className="text-slate-600">
                    Ostro zakończony, wysoki szczyt (silna koncentracja w centrum) oraz grube ogony (<em>fat tails</em>) — wyższe prawdopodobieństwo skrajnych zjawisk niż przewiduje rozkład normalny.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'zscore' && (
            <div className="space-y-5">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-900 space-y-2">
                <h3 className="font-bold text-base text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Standaryzacja Z i pole prawdopodobieństwa P
                </h3>
                <p className="text-xs sm:text-sm text-indigo-800">
                  Standaryzacja przekształca dowolny rozkład normalny o średniej μ i odchyleniu standardowym σ w <strong>standardowy rozkład normalny Z ~ N(0, 1)</strong>. Dzięki temu wyniki z różnych skal (np. punkty z testu wiedzy i IQ) stają się bezpośrednio porównywalne!
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Wzór na wartość z (Z-score):</h4>
                <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-center text-sm sm:text-base font-bold text-indigo-900">
                  z = (X - μ) / σ
                </div>
                <p className="text-xs text-slate-600">
                  Wartość <strong>z</strong> informuje, o ile odchyleń standardowych (σ) dany wynik <strong>X</strong> leży powyżej średniej (z &gt; 0) lub poniżej średniej (z &lt; 0). Wartość z = 0 oznacza wynik dokładnie równy średniej.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1">
                  <strong className="text-indigo-950 block">Dystrybuanta Φ(z) — Lewy ogon P(X ≤ x)</strong>
                  <p className="text-slate-600">
                    Odsetek osób w populacji uzyskujących wynik równy lub niższy niż dany punkt (jest to tzw. <strong>percentyl</strong>). Np. z = 0 odpowiada 50. percentylowi.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1">
                  <strong className="text-indigo-950 block">Prawy ogon P(X ≥ x) = 1 - Φ(z)</strong>
                  <p className="text-slate-600">
                    Odsetek osób przewyższających dany wynik. Przydatne przy określaniu progów selekcji, np. dla 5% najlepszych kandydatów.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1">
                  <strong className="text-indigo-950 block">Wartości krytyczne w testowaniu hipotez</strong>
                  <p className="text-slate-600">
                    |z| ≥ 1.96 odpowiada polu w ogonach równemu dokładnie <strong>5% (α = 0.05)</strong> dla testu dwustronnego. |z| ≥ 2.58 odpowiada <strong>1% (α = 0.01)</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1">
                  <strong className="text-indigo-950 block">Zablokowane osie a standaryzacja</strong>
                  <p className="text-slate-600">
                    Przełącznik „Osie: Stałe” blokuje współrzędne wykresu, dzięki czemu widać, że zmiana średniej rzeczywiście przesuwa całą populację, a zmiana SD spłaszcza lub zawęża krzywą.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'empirical' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 space-y-2">
                <h3 className="font-bold text-base text-emerald-950">
                  Rozkład teoretyczny a próba empiryczna (histogram)
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800">
                  W badaniach naukowych rzadko badamy całą nieskończoną populację — pobieramy <strong>próbę losową o liczebności N</strong>. Zobacz, jak wielkość próby wpływa na dopasowanie histogramu empirycznego do gładkiej krzywej teoretycznej.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Prawo Wielkich Liczb:</strong> W małej próbie (np. <em>N</em> = 50) histogram ma postrzępiony kształt, a średnia z próby <em>M</em> może różnić się od teoretycznej <em>μ</em>. Wraz ze wzrostem <em>N</em> (np. <em>N</em> = 1000) histogram idealnie wypełnia profil krzywej teoretycznej!
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Normalizacja gęstości:</strong> Wysokość słupków histogramu w aplikacji nie oznacza zwykłej liczby osób, lecz <em>gęstość prawdopodobieństwa</em>. Dzięki temu pole powierzchni wszystkich słupków wynosi dokładnie 1.0 — tak samo jak pole pod krzywą teoretyczną.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Materiały dydaktyczne dla studentów psychologii i nauk społecznych
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Rozumiem, wróć do analizy
          </button>
        </div>
      </div>
    </div>
  );
};
