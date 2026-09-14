const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// There's a stray {pdfUrl ? ... inside a {pdfUrl ? ... block.
// Wait, the error is at line 710, `</nav> </div>`
// What's wrong with that?
// <nav> -> </div> -> </div>
// Let's trace it.
// `className="flex items-center gap-2"` -> `</nav>` -> `</div>`
// Oh, the top nav has:
/*
      {/* Top Nav Bar *\/}
      <div 
        className={\`...
      >
        <nav
          className={\`...
        >
          <div className="flex items-center gap-2">
            <button ...
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button ...
          </div>
        </nav>
      </div>
*/
// It seems fine. But wait, in the replacement of `fix_pdf_reader_mode.cjs`, I used:
// `const oldButton = /<button[\s\S]*?onClick=\{\(\) => setForceTextVisible\(!forceTextVisible\)\}[\s\S]*?<\/button>/;`
// That might have replaced the wrong button or left a dangling tag.
// Let's just fix the whole top nav.

const navRegex = /\{\/\* Top Nav Bar \*\/\}[\s\S]*?<\/nav>\s*<\/div>/;

const cleanNav = `{/* Top Nav Bar */}
      <div 
        className={\`\${isZenMode ? 'fixed top-0 left-0 right-0 z-50 transition-all duration-300' : 'relative z-30 shrink-0'} \${isZenMode && !zenNavVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}\`}
      >
        <nav
          className={\`h-12 border-b \${themeStyle.border} px-4 flex items-center justify-between select-none backdrop-blur-xs \${isZenMode ? themeStyle.bg : ''}\`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLibrary}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer \${themeStyle.text}\`}
              title="Return to Library"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </button>
            <button
              onClick={() => setIsTOCOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs cursor-pointer \${themeStyle.text}\`}
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline truncate max-w-[140px]">{book.title}</span>
            </button>

            <button
              onClick={() => setIsAnnotationsDrawerOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs \${themeStyle.text}\`}
              title="Notes & Highlights"
            >
              <ScrollText className="w-4 h-4" />
              <span className="hidden md:inline">Notes</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setIsTypographyOpen((prev) => !prev)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${isTypographyOpen ? 'text-amber-500 bg-amber-500/10' : themeStyle.text}\`}
              title="Typography & Display Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSoundscapeOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="Soundscapes & Warmth (S)"
            >
              <CloudRain className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsHabitsOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="Reading Habits & Focus Timer (H)"
            >
              <Flame className="w-4 h-4 text-amber-500" />
            </button>

            <button
              onClick={() => startTTS()}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${isTTSOpen ? 'text-amber-500 bg-amber-500/10' : themeStyle.text}\`}
              title="Read Aloud with Offline Text-to-Speech"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRSVPOpen(true)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="RSVP Speed Reader (V)"
            >
              <Zap className="w-4 h-4 text-amber-500" />
            </button>
            
            <div className="w-px h-6 bg-slate-500/30 mx-1"></div>

            <button
              onClick={() => setPdfViewMode(prev => prev === 'canvas' ? 'reader' : 'canvas')}
              className={\`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${pdfViewMode === 'reader' ? 'bg-amber-500/20 text-amber-500' : \`hover:bg-black/5 dark:hover:bg-white/10 \${themeStyle.text}\`}\`}
              title="Reader Mode (Extract raw text for perfect readability)"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const themes: ('light' | 'dark' | 'sepia')[] = ['light', 'dark', 'sepia'];
                const idx = themes.indexOf(pdfFilterTheme);
                setPdfFilterTheme(themes[(idx + 1) % themes.length]);
              }}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`PDF Appearance: \${pdfFilterTheme}\`}
            >
              {pdfFilterTheme === 'dark' ? <Moon className="w-4 h-4" /> : pdfFilterTheme === 'sepia' ? <Palette className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleLayoutMode}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`Layout: \${settings.layoutMode}\`}
            >
              {settings.layoutMode === 'double' ? <Columns2 className="w-4 h-4" /> : 
               settings.layoutMode === 'scroll' ? <ScrollText className="w-4 h-4" /> : 
               <Square className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-10 text-center opacity-70">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(3.0, s + 0.1))}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer \${themeStyle.text}\`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1.0)}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ml-1 \${themeStyle.text}\`}
              title="Fit to Screen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>`;

content = content.replace(navRegex, cleanNav);
fs.writeFileSync('src/components/NativePdfReader.tsx', content);
