/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/jtraczyk/metodologia_statystyka/main/konspekt_2026.html', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const parts = raw.split(/<section id=\"([^\"]+)\" class=\"level1\">/);
    const chapters = [];
    
    for (let i = 1; i < parts.length; i += 2) {
      const id = parts[i];
      let body = parts[i+1];
      if (i === parts.length - 2) {
        body = body.split('</main>')[0];
      }
      
      // Extract title from h1
      const titleMatch = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : id;
      
      // Remove main h1
      body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
      
      // Remove interactive simulation sections completely
      body = body.replace(/<section id=\"interaktywna-symulacja-[^\"]*\"[\s\S]*?<\/section>/gi, '');
      
      // Remove script tags, OJS divs, quarto figures, anchors
      body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
      body = body.replace(/<div class=\"quarto-figure[\s\S]*?<\/div>/gi, '');
      body = body.replace(/<div class=\"observablehq[\s\S]*?<\/div>/gi, '');
      body = body.replace(/<div id=\"ojs-[^\"]*\"[\s\S]*?<\/div>/gi, '');
      body = body.replace(/<a class=\"anchorjs-link\"[\s\S]*?<\/a>/gi, '');
      
      // Convert common math formulas to clean HTML
      body = body.replace(/\\\(H_0\\\)/g, '<em>H</em><sub>0</sub>');
      body = body.replace(/\\\(H_1\\\)/g, '<em>H</em><sub>1</sub>');
      body = body.replace(/\\\(H_A\\\)/g, '<em>H</em><sub>A</sub>');
      body = body.replace(/\\\(H0\\\)/g, '<em>H</em><sub>0</sub>');
      body = body.replace(/\\\(H1\\\)/g, '<em>H</em><sub>1</sub>');
      body = body.replace(/\\\((\\mu|\\mu_0|\\mu_1)\\\)/g, 'μ');
      body = body.replace(/\\\((\\sigma|\\sigma_0)\\\)/g, 'σ');
      body = body.replace(/\\\((\\sigma\^2)\\\)/g, 'σ²');
      body = body.replace(/\\\((\\alpha)\\\)/g, 'α');
      body = body.replace(/\\\((\\beta)\\\)/g, 'β');
      body = body.replace(/\\\((\\rightarrow)\\\)/g, '→');
      body = body.replace(/\\\((\\bar\{x\}|\\bar\{X\})\\\)/g, 'x̄');
      body = body.replace(/\\\((\\pm)\\\)/g, '±');
      body = body.replace(/\\\((\\cdot)\\\)/g, '·');
      body = body.replace(/\\\((\\ge|\\geq)\\\)/g, '≥');
      body = body.replace(/\\\((\\le|\\leq)\\\)/g, '≤');
      body = body.replace(/\\\((\\neq)\\\)/g, '≠');
      body = body.replace(/\\\(p\s*(&lt;|<)\s*([0-9.]+)\\\)/g, '<em>p</em> &lt; $2');
      body = body.replace(/\\\(p\s*(&gt;|>)\s*([0-9.]+)\\\)/g, '<em>p</em> &gt; $2');
      body = body.replace(/\\\(p\s*=\s*([0-9.]+)\\\)/g, '<em>p</em> = $1');
      body = body.replace(/\\\(r\s*=\s*([0-9.]+)\\\)/g, '<em>r</em> = $1');
      body = body.replace(/\\\(d\s*=\s*([0-9.]+)\\\)/g, '<em>d</em> = $1');
      body = body.replace(/\\\((N|n)\\\)/g, '<em>$1</em>');
      body = body.replace(/\\\((r|R)\\\)/g, '<em>$1</em>');
      body = body.replace(/\\\((t|T)\\\)/g, '<em>$1</em>');
      body = body.replace(/\\\((p|P)\\\)/g, '<em>$1</em>');
      body = body.replace(/\\\((df|DF)\\\)/g, '<em>$1</em>');
      body = body.replace(/\\\((M|SD|IQR|SE)\\\)/g, '<strong>$1</strong>');
      // Clean up any remaining \( and \)
      body = body.replace(/\\\(|\\\)/g, '');
      
      // Inject interactive portal laboratory callouts
      const chapterNum = Math.floor(i / 2) + 1;
      
      if (chapterNum === 4) {
        // Statystyka opisowa
        body += `
        <div class="portal-app-callout my-8 p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-sky-50/70 shadow-xs">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-indigo-200">Laboratorium Interaktywne #1 i #3</span>
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">Eksploruj Statystyki Opisowe i Wykres Normalny</h4>
              <p class="text-xs text-slate-600 max-w-xl">
                W tym portalu masz bezpośredni dostęp do interaktywnego generatora wykresów skrzynkowych (Zakładka 1) oraz narzędzia do weryfikacji normalności rozkładu i wykresów Q-Q (Zakładka 3).
              </p>
            </div>
            <button data-switch-tab="1" class="portal-tab-btn shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer">
              Otwórz Aplikację 1 (Boxplot) →
            </button>
          </div>
        </div>
        `;
      } else if (chapterNum === 9 || chapterNum === 10) {
        // Porównywanie grup & Moc testu / Przedziały ufności
        body += `
        <div class="portal-app-callout my-8 p-5 rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50/90 to-orange-50/70 shadow-xs">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-white px-2.5 py-0.5 rounded-md border border-amber-200">Laboratorium Interaktywne #2 i #4</span>
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">Przetestuj Centralne Twierdzenie Graniczne i Przedziały Ufności</h4>
              <p class="text-xs text-slate-600 max-w-xl">
                Zobacz symulację losowania k prób i rozkładu średniej (Zakładka 2) oraz interaktywny taniec przedziałów ufności (95% CI) wokół prawdziwego parametru μ (Zakładka 4).
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button data-switch-tab="2" class="portal-tab-btn px-3 py-2 bg-[#344B57] hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer">
                Aplikacja 2 (CLT) →
              </button>
              <button data-switch-tab="4" class="portal-tab-btn px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer">
                Aplikacja 4 (CI) →
              </button>
            </div>
          </div>
        </div>
        `;
      }
      
      // Extract h2 subsections
      const subRegex = /<h2[^>]*data-anchor-id=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/h2>/gi;
      const subsections = [];
      let subMatch;
      while ((subMatch = subRegex.exec(body)) !== null) {
        subsections.push({
          id: subMatch[1],
          title: subMatch[2].replace(/<[^>]+>/g, '').trim()
        });
      }
      
      // Create clean plain-text excerpt for searching
      const plainText = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      
      chapters.push({
        id,
        number: chapterNum,
        title,
        subsections,
        excerpt: plainText.substring(0, 240) + '...',
        searchableText: (title + ' ' + plainText).toLowerCase(),
        htmlContent: body.trim()
      });
    }

    const fileContent = '/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n */\n\n' +
      'export interface SubsectionItem {\n  id: string;\n  title: string;\n}\n\n' +
      'export interface CourseChapter {\n  id: string;\n  number: number;\n  title: string;\n  subsections: SubsectionItem[];\n  excerpt: string;\n  searchableText: string;\n  htmlContent: string;\n}\n\n' +
      'export const COURSE_CHAPTERS: CourseChapter[] = ' + JSON.stringify(chapters, null, 2) + ';\n';

    fs.writeFileSync('src/data/courseChapters.ts', fileContent, 'utf-8');
    console.log('Successfully wrote src/data/courseChapters.ts with', chapters.length, 'chapters!');
  });
});
