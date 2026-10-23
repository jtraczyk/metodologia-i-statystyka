/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { APPS_DATA } from './data/defaultTabs';
import { TabBar } from './components/TabBar';
import App1 from './apps/app1/App';
import App2 from './apps/app2/App';
import App3 from './apps/app3/App';
import App4 from './apps/app4/App';

const APP_NAVY = '#344B57';

export default function App() {
  const [activeTabNumber, setActiveTabNumber] = useState<1 | 2 | 3 | 4>(1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: APP_NAVY }}
              >
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  Metodologia badań psychologicznych i statystyka
                </h1>
                <span className="text-xs text-slate-500 font-medium">
                  Autor: Jakub Traczyk (Uniwersytet SWPS)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Tabs Bar */}
        <TabBar
          tabs={APPS_DATA}
          activeTabNumber={activeTabNumber}
          onSelectTab={(num) => setActiveTabNumber(num)}
        />
      </header>

      {/* Main Selected Content */}
      <main className="flex-1 w-full">
        {activeTabNumber === 1 && <App1 />}
        {activeTabNumber === 2 && <App2 />}
        {activeTabNumber === 3 && <App3 />}
        {activeTabNumber === 4 && <App4 />}
      </main>

      {/* Clean Academic Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-center sm:text-left">
            <span>
              <strong>Metodologia badań psychologicznych i statystyka</strong> · Uniwersytet SWPS · dr hab. Jakub Traczyk, prof. USWPS
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-slate-400">
              Ostatnia aktualizacja: październik 2026 r.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://cridm.edu.pl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
              title="Centrum Badań nad Poprawą Podejmowania Decyzji (CRIDM)"
            >
              <img
                src="https://cridm.edu.pl/wp-content/uploads/2019/05/logo-02.png"
                alt="CRIDM Logo"
                className="h-6 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <span className="font-medium group-hover:underline text-slate-700">
                www.cridm.edu.pl
              </span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
