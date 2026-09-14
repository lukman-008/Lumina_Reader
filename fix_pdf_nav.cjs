const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const regex = /\{\/\* Zen Mode \/ Full Screen Exit Overlay \*\/\}[\s\S]*?\{\/\* Click zones for desktop page turning \*\/\}/;

const newNav = `{/* Zen Mode / Full Screen Exit Overlay */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 transition-opacity duration-300 opacity-30 hover:opacity-100 flex items-center gap-2">
          <button
            onClick={onToggleZenMode}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700/50 backdrop-blur-md shadow-lg cursor-pointer"
            title="Exit Zen Mode (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Exit Fullscreen <kbd className="ml-1 opacity-60 font-sans">Esc</kbd></span>
          </button>
        </div>
      )}

      {/* Top Nav Bar */}
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
              onClick={() => {
                const colors: ('white' | 'black' | 'transparent')[] = ['white', 'black', 'transparent'];
                const idx = colors.indexOf(pdfPaperColor);
                setPdfPaperColor(colors[(idx + 1) % colors.length]);
              }}
              className={\`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${themeStyle.text}\`}
              title={\`PDF Paper Color: \${pdfPaperColor}\`}
            >
              <div className="w-4 h-4 rounded-sm border border-gray-400" style={{ background: pdfPaperColor === 'transparent' ? 'repeating-conic-gradient(#80808033 0% 25%, transparent 0% 50%) 50% / 8px 8px' : pdfPaperColor }}></div>
            </button>

            <button
              onClick={() => setForceTextVisible(!forceTextVisible)}
              className={\`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 border \${themeStyle.border} \${forceTextVisible ? 'bg-indigo-500/20 text-indigo-500' : \`hover:bg-black/5 dark:hover:bg-white/10 \${themeStyle.text}\`}\`}
              title="Force High-Contrast Text Layer (Use if PDF canvas is unreadable)"
            >
              <Eye className="w-4 h-4" />
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
      </div>

      {/* Click zones for desktop page turning */}`;

content = content.replace(regex, newNav);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
