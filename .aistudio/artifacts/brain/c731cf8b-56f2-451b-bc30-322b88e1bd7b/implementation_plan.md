# Plan Integracji Materiałów do Zajęć (Konspekt 2026) jako Nowej Zakładki

## Cel
Rozszerzenie portalu o nową, piątą główną zakładkę: **„Materiały do zajęć”** (obok 4 interaktywnych aplikacji), w postaci nowoczesnego czytnika akademickiego z 11 rozdziałami i wyszukiwarką, oczyszczonego ze starych aplikacji Shiny i skryptów OJS.

---

## 1. Architektura Zakładek Portalu
Główny pasek nawigacyjny (`TabBar`) zostanie rozszerzony o wyróżnioną zakładkę podręcznika:
- **Zakładka 0 / Główna:** 📖 **Materiały do zajęć (Konspekt)**  
  *(Oficjalny podręcznik kursu: 11 rozdziałów, studia przypadków, etyka badań, wzory)*
- **Zakładka 1:** 📊 **Statystyki opisowe i boxplot**
- **Zakładka 2:** ⚡ **Centralne twierdzenie graniczne**
- **Zakładka 3:** 📈 **Wykres normalny (Q-Q)**
- **Zakładka 4:** 🎯 **Przedziały ufności (CI)**

---

## 2. Zawartość i Oczyszczenie Materiałów (z repozytorium `metodologia_statystyka`)
Z dokumentu `konspekt_2026.html` pobierzemy pełną treść 11 rozdziałów i **usuniemy wszystkie stare, zewnętrzne aplikacje Shiny/OJS**:
- Usunięcie sekcji *„Interaktywna symulacja: rozkład normalny”* (zastąpionej dedykowaną aplikacją w Zakładce 3).
- Usunięcie sekcji *„Interaktywna symulacja: Kształt rozkładu”* (zastąpionej Zakładką 1).
- Usunięcie sekcji *„Interaktywna symulacja: Siła związku i r-Pearsona”*.
- Zachowanie pełnej treści merytorycznej:
  1. *Epistemologiczne podstawy psychologii: nauka a wiedza potoczna*
  2. *Architektura procesu badawczego: Od teorii do empirycznej weryfikacji*
  3. *Operacjonalizacja zmiennych i teoria pomiaru (skale Stevensa)*
  4. *Statystyka opisowa: redukcja danych i charakterystyka rozkładu*
  5. *Dwa nurty psychologii naukowej: model eksperymentalny a korelacyjny*
  6. *Analiza współzmienności i predykcja: korelacja i regresja*
  7. *Jakość planu badawczego: trafność wewnętrzna, zewnętrzna i procedury kontrolne*
  8. *Jakość pomiaru psychologicznego: rzetelność*
  9. *Procedury porównywania grup (test t-Studenta)*
  10. *Moc testu, wielkość efektu (d Cohena) i kryzys replikacyjny*
  11. *Etyka badań psychologicznych: standardy i dylematy (decepcja, debriefing)*

---

## 3. Komponent Czytnika Akademickiego (`CourseMaterialsReader.tsx`)
Stworzymy elegancki czytnik akademicki dostosowany do czytania na desktopie i telefonach:
- **Pasek wyszukiwania pojęć i fraz** w czasie rzeczywistym (np. wyszukiwanie haseł *„decepcja”*, *„kwartyle”*, *„d Cohena”*, *„trafność”*).
- **Boczny pasek spisu treści (TOC):**
  - Lista 11 ponumerowanych rozdziałów ze wskaźnikiem aktywnego rozdziału.
  - Szybkie skakanie do podrozdziałów.
  - Na telefonach: rozwijany przycisk *„Spis treści rozdziałów”* na samej górze.
- **Odnośniki kontekstowe do laboratoriów:**
  - W rozdziałach poświęconych statystykom opisowym, rozkładowi normalnemu czy przedziałom ufności umieścimy estetyczne przyciski akcji:  
    *„Otwórz interaktywną symulację w Zakładce 1”* – co pozwala studentowi natychmiast przejść od teorii do laboratorium!
- **Przycisk pobrania wersji PDF:**
  - Bezpośredni link do oryginalnego pliku `konspekt_2026.pdf`.

---

## 4. Spójność Wizualna i Mobilna
- Kolorystyka: `#344B57` (nagłówki, aktywne pozycje spisu treści) oraz `#F29400` (wyróżnienia, ramki dydaktyczne „Uwaga”, „Ważne pojęcie”).
- Skalowanie typograficzne zoptymalizowane pod kątem długiego czytania tekstu naukowego (font inter/sans, wysoki kontrast, odstępy międzyakapitowe).
- Pełna responsywność na ekranach smartfonów (duże strefy klikalne, brak poziomego rozpychania).

---

## Plan Weryfikacji
1. Zbudowanie danych i komponentu `CourseMaterialsReader.tsx`.
2. Aktualizacja `TabBar.tsx` i `App.tsx` w celu obsługi nowej zakładki.
3. Weryfikacja kompilacji za pomocą `compile_applet`.
4. Sprawdzenie lintera za pomocą `lint_applet`.
5. Przetestowanie nawigacji między rozdziałami, wyszukiwarki i linków do laboratoriów.
