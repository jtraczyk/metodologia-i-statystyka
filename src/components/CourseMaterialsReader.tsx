/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  Download,
  ChevronRight,
  ChevronLeft,
  Github,
  List,
  Sparkles,
  ExternalLink,
  CheckCircle,
  X,
  Bookmark,
} from 'lucide-react';
import { COURSE_CHAPTERS, CourseChapter } from '../data/courseChapters';

interface CourseMaterialsReaderProps {
  onSelectTab: (tabNumber: 1 | 2 | 3 | 4) => void;
}

const APP_NAVY = '#344B57';
const APP_AMBER = '#F29400';

export const CourseMaterialsReader: React.FC<CourseMaterialsReaderProps> = ({
  onSelectTab,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeChapter: CourseChapter = COURSE_CHAPTERS[activeChapterIndex] || COURSE_CHAPTERS[0];

  // Search filter across chapters
  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COURSE_CHAPTERS;
    return COURSE_CHAPTERS.filter((ch) => ch.searchableText.includes(q));
  }, [searchQuery]);

  // Scroll to top of reading area when chapter changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeChapterIndex]);

  // Handle click on embedded lab action buttons within HTML
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-switch-tab]') as HTMLElement | null;
    if (button) {
      const tabNum = Number(button.getAttribute('data-switch-tab'));
      if (tabNum >= 1 && tabNum <= 4) {
        onSelectTab(tabNum as 1 | 2 | 3 | 4);
      }
    }
  };

  const handlePrevChapter = () => {
    if (activeChapterIndex > 0) {
      setActiveChapterIndex(activeChapterIndex - 1);
    }
  };

  const handleNextChapter = () => {
    if (activeChapterIndex < COURSE_CHAPTERS.length - 1) {
      setActiveChapterIndex(activeChapterIndex + 1);
    }
  };

  const scrollToSubheading = (subId: string) => {
    setIsMobileTocOpen(false);
    const el = document.getElementById(subId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Reader Toolbar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-14 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: APP_NAVY }}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                    Materiały do zajęć: Konspekt i Podręcznik Kursu
                  </h2>
                  <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    2026
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate hidden sm:block">
                  dr hab. Jakub Traczyk, prof. USWPS · Uniwersytet SWPS
                </div>
              </div>
            </div>

            {/* Quick Actions (PDF, GitHub) */}
            <div className="flex items-center gap-2 ml-auto">
              <a
                href="https://raw.githubusercontent.com/jtraczyk/metodologia_statystyka/main/konspekt_2026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Pobierz pełną wersję konspektu w formacie PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Pobierz PDF</span>
                <span className="sm:hidden">PDF</span>
              </a>

              <a
                href="https://github.com/jtraczyk/metodologia_statystyka"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                title="Repozytorium GitHub materiałów dydaktycznych"
              >
                <Github className="w-3.5 h-3.5 text-slate-800" />
                <span className="hidden md:inline">metodologia_statystyka</span>
              </a>

              {/* Mobile TOC Trigger Button */}
              <button
                type="button"
                onClick={() => setIsMobileTocOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-bold text-white rounded-lg transition-colors cursor-pointer"
                style={{ backgroundColor: APP_NAVY }}
              >
                <List className="w-4 h-4" />
                <span>Rozdziały ({activeChapterIndex + 1}/11)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace (Sidebar + Reader Area) */}
      <div className="max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* LEWA KOLUMNA: Spis treści & Wyszukiwarka (4 kolumny na lg) */}
          <aside className="hidden lg:flex lg:col-span-4 flex-col bg-white rounded-2xl border border-slate-200 shadow-xs sticky top-32 max-h-[calc(100vh-160px)] overflow-hidden">
            {/* Search Box */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Szukaj pojęć (np. decepcja, d Cohena)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#344B57] text-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-1.5 text-[11px] text-slate-500 font-medium">
                  Znaleziono {filteredChapters.length} z {COURSE_CHAPTERS.length} rozdziałów
                </div>
              )}
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChapters.map((ch) => {
                const isSelected = ch.number === activeChapter.number;
                return (
                  <div key={ch.id} className="rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChapterIndex(ch.number - 1);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 text-left rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'rgba(52, 75, 87, 0.08)',
                              borderLeft: `4px solid ${APP_NAVY}`,
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-bold shrink-0 mt-0.5 ${
                          isSelected ? 'text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                        style={isSelected ? { backgroundColor: APP_NAVY } : undefined}
                      >
                        {ch.number}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${
                            isSelected ? 'font-bold' : ''
                          }`}
                          style={isSelected ? { color: APP_NAVY } : undefined}
                        >
                          {ch.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ch.subsections.length} podrozdziałów
                        </div>
                      </div>
                    </button>

                    {/* Subsections accordion for active chapter */}
                    {isSelected && ch.subsections.length > 0 && (
                      <div className="pl-9 pr-2 py-1.5 space-y-1 bg-slate-50/50 border-l border-slate-200 ml-4 my-1">
                        {ch.subsections.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => scrollToSubheading(sub.id)}
                            className="w-full text-left text-[11px] text-slate-600 hover:text-slate-900 truncate block py-0.5 cursor-pointer hover:underline"
                          >
                            • {sub.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* PRAWA KOLUMNA: Czytnik Treści Rozdziału (8 kolumn na lg) */}
          <main
            ref={contentRef}
            className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-8 flex flex-col min-h-[600px]"
          >
            {/* Chapter Header */}
            <div className="pb-5 border-b border-slate-200 mb-6">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2 font-mono">
                <span className="font-semibold text-slate-700 uppercase tracking-wider">
                  Rozdział {activeChapter.number} z 11
                </span>
                <span className="text-slate-400">
                  Konspekt Metodologii i Statystyki
                </span>
              </div>
              <h1
                className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight"
                style={{ color: APP_NAVY }}
              >
                {activeChapter.title}
              </h1>

              {/* Quick Jump Subsections Chips */}
              {activeChapter.subsections.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">
                    W rozdziale:
                  </span>
                  {activeChapter.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => scrollToSubheading(sub.id)}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter HTML Body Content */}
            <div
              onClick={handleContentClick}
              className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4
                prose-headings:text-slate-900 prose-headings:font-bold prose-h2:text-lg sm:prose-h2:text-xl prose-h2:mt-8 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-slate-100
                prose-h3:text-base sm:prose-h3:text-lg prose-h3:mt-6
                prose-table:w-full prose-table:border-collapse prose-table:text-xs sm:prose-table:text-sm prose-th:bg-slate-100 prose-th:p-2.5 prose-th:border prose-th:border-slate-200
                prose-td:p-2.5 prose-td:border prose-td:border-slate-200
                prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5
                prose-blockquote:border-l-4 prose-blockquote:border-[#344B57] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
                prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: activeChapter.htmlContent }}
            />

            {/* Bottom Chapter Navigation Bar */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrevChapter}
                disabled={activeChapterIndex === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeChapterIndex === 0
                    ? 'opacity-40 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Poprzedni rozdział</span>
              </button>

              <div className="text-xs font-medium text-slate-500 font-mono">
                {activeChapterIndex + 1} / {COURSE_CHAPTERS.length}
              </div>

              <button
                type="button"
                onClick={handleNextChapter}
                disabled={activeChapterIndex === COURSE_CHAPTERS.length - 1}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-white shadow-2xs active:scale-95 ${
                  activeChapterIndex === COURSE_CHAPTERS.length - 1
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: APP_NAVY }}
              >
                <span>Następny rozdział</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Table of Contents Modal/Sheet */}
      {isMobileTocOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl ml-auto animate-in slide-in-from-right duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#344B57]" />
                <h3 className="font-bold text-slate-900 text-sm">Spis Rozdziałów (1–11)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileTocOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search in Sheet */}
            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                placeholder="Szukaj pojęć..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            {/* Chapters in Sheet */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChapters.map((ch) => {
                const isSelected = ch.number === activeChapter.number;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setActiveChapterIndex(ch.number - 1);
                      setIsMobileTocOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-3 text-left rounded-xl transition-colors min-h-[48px] ${
                      isSelected
                        ? 'bg-slate-100 font-bold text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isSelected ? 'text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                      style={isSelected ? { backgroundColor: APP_NAVY } : undefined}
                    >
                      {ch.number}
                    </div>
                    <span className="text-xs flex-1 truncate">{ch.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
