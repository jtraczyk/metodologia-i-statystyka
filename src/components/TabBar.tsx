/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart2, Activity, LineChart, GitCommit, LucideIcon } from 'lucide-react';
import { AppTab } from '../types/appTab';

interface TabBarProps {
  tabs: AppTab[];
  activeTabNumber: number;
  onSelectTab: (tabNumber: 1 | 2 | 3 | 4) => void;
}

const iconMap: Record<string, LucideIcon> = {
  BarChart2,
  Activity,
  LineChart,
  GitCommit,
};

// Dark blue primary color matching all 4 apps (#344B57)
const APP_NAVY = '#344B57';

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabNumber,
  onSelectTab,
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 py-2">
          {tabs.map((tab) => {
            const isActive = tab.tabNumber === activeTabNumber;
            const Icon = iconMap[tab.iconName] || BarChart2;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.tabNumber as 1 | 2 | 3 | 4)}
                className={`relative flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 rounded-xl text-left transition-all border min-h-[48px] cursor-pointer touch-manipulation active:scale-[0.98] ${
                  isActive
                    ? 'shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'rgba(52, 75, 87, 0.08)',
                        borderColor: APP_NAVY,
                      }
                    : undefined
                }
              >
                {/* Number Badge */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  style={isActive ? { backgroundColor: APP_NAVY } : undefined}
                >
                  {tab.tabNumber}
                </div>

                {/* Tab Title */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: isActive ? APP_NAVY : '#94a3b8' }}
                    />
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'font-bold' : 'text-slate-800'
                      }`}
                      style={isActive ? { color: APP_NAVY } : undefined}
                    >
                      {tab.shortName}
                    </span>
                  </div>
                </div>

                {/* Active Indicator bottom bar */}
                {isActive && (
                  <div
                    className="absolute -bottom-2 left-3 right-3 h-0.5 rounded-full"
                    style={{ backgroundColor: APP_NAVY }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
