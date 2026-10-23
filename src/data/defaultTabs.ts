/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppTab } from '../types/appTab';

export const APPS_DATA: AppTab[] = [
  {
    id: 'statystyki-opisowe',
    tabNumber: 1,
    title: 'Statystyki opisowe i wykres skrzynkowy',
    shortName: 'Statystyki opisowe & boxplot',
    subtitle: 'Wykresy skrzynkowe, wiolinowe i punkty z szumem losowym',
    description: 'Interaktywna aplikacja do generowania wykresów skrzynkowych (box plot), wiolinowych (violin plot) oraz punktów z szumem losowym.',
    githubUrl: 'https://github.com/jtraczyk/Metodologia-bada-psychologicznych-i-statystyka---statystyki-opisowe-i-wykres-skrzynkowy',
    liveUrl: 'https://jtraczyk.github.io/Metodologia-bada-psychologicznych-i-statystyka---statystyki-opisowe-i-wykres-skrzynkowy/',
    badge: 'Aplikacja 1',
    iconName: 'BarChart2',
    tags: ['Statystyki opisowe', 'Boxplot', 'Violin', 'SWPS'],
    author: 'dr hab. Jakub Traczyk, prof. USWPS',
  },
  {
    id: 'centralne-twierdzenie-graniczne',
    tabNumber: 2,
    title: 'Centralne twierdzenie graniczne',
    shortName: 'Centralne twierdzenie graniczne',
    subtitle: 'Rozkład średnich z prób a rozkład w populacji (CLT)',
    description: 'Interaktywna aplikacja do symulacji centralnego twierdzenia granicznego.',
    githubUrl: 'https://github.com/jtraczyk/Metodologia-bada-psychologicznych-i-statystyka---centralne-twierdzenie-graniczne-',
    liveUrl: 'https://jtraczyk.github.io/Metodologia-bada-psychologicznych-i-statystyka---centralne-twierdzenie-graniczne-/',
    badge: 'Aplikacja 2',
    iconName: 'Activity',
    tags: ['CLT', 'Rozkład średnich', 'Symulacja'],
    author: 'dr hab. Jakub Traczyk, prof. USWPS',
  },
  {
    id: 'wykres-normalny',
    tabNumber: 3,
    title: 'Rozkłady zmiennych',
    shortName: 'Rozkłady zmiennych',
    subtitle: 'Weryfikacja normalności rozkładu i parametry rozkładów',
    description: 'Interaktywna aplikacja do nauki o rozkładach zmiennych, parametrach rozkładu normalnego, skośności i kurtozie.',
    githubUrl: 'https://github.com/jtraczyk/Metodologia-bada-psychologicznych-i-statystyka---wykres-normalny',
    liveUrl: 'https://jtraczyk.github.io/Metodologia-bada-psychologicznych-i-statystyka---wykres-normalny/',
    badge: 'Aplikacja 3',
    iconName: 'LineChart',
    tags: ['Rozkłady zmiennych', 'Q-Q Plot', 'Kwantyle'],
    author: 'dr hab. Jakub Traczyk, prof. USWPS',
  },
  {
    id: 'przedzialy-ufnosci',
    tabNumber: 4,
    title: 'Przedziały ufności',
    shortName: 'Przedziały ufności (CI)',
    subtitle: 'Estymacja przedziałowa i pokrycie parametru μ',
    description: 'Interaktywna aplikacja do symulacji przedziałów ufności.',
    githubUrl: 'https://github.com/jtraczyk/Metodologia-bada-psychologicznych-i-statystyka---przedzia-y-ufno-ci',
    liveUrl: 'https://jtraczyk.github.io/Metodologia-bada-psychologicznych-i-statystyka---przedzia-y-ufno-ci/',
    badge: 'Aplikacja 4',
    iconName: 'GitCommit',
    tags: ['Przedziały ufności', 'Confidence Intervals', 'Estymacja'],
    author: 'dr hab. Jakub Traczyk, prof. USWPS',
  },
];
