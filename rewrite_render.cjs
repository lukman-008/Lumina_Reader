const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const returnStart = content.indexOf('return (', 467);
const beforeReturn = content.substring(0, returnStart);

const newRender = `return (
    <div className={\`w-full flex flex-col transition-colors duration-200 relative overflow-hidden \${themeStyle.bg} \${themeStyle.text} \${isZenMode ? 'h-screen' : 'h-[calc(100vh-2.75rem)]'}\`}>
      {/* Zen Mode / Full Screen Exit Overlay */}
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

      {/* Click zones for desktop page turning */}
      <div 
        onClick={() => changePage(-1)} 
        className="absolute left-0 top-12 bottom-0 w-16 md:w-28 z-10 cursor-w-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition flex items-center justify-start pl-3 opacity-0 hover:opacity-100"
      >
        <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
          <ChevronLeft className="w-5 h-5 opacity-70" />
        </div>
      </div>
      
      <div 
        onClick={() => changePage(1)} 
        className="absolute right-0 top-12 bottom-0 w-16 md:w-28 z-10 cursor-e-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition flex items-center justify-end pr-3 opacity-0 hover:opacity-100"
      >
        <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
          <ChevronRight className="w-5 h-5 opacity-70" />
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden w-full flex justify-center pt-8 pb-24 items-start"
      >
        {!pdfUrl ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <p>Loading High-Fidelity PDF Engine...</p>
          </div>
        ) : (
          <div 
            className={\`shadow-2xl transition-all duration-300 \${themeStyle.container} \${settings.layoutMode !== 'scroll' ? 'rounded-lg overflow-hidden' : ''}\`}
            style={{ 
              maxWidth: pdfMaxWidth * scale,
              width: '100%' 
            }}
          >
            <div style={{ filter: getPdfFilterStyle(), transition: 'filter 0.3s ease' }}>
              <Document suspense={false} options={pdfOptions}
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                error={
                  <div className="flex justify-center items-center h-96 text-rose-500">
                    <p>Failed to load native PDF. The file may be corrupted.</p>
                  </div>
                }
              >
                {settings.layoutMode === 'scroll' ? (
                  // Continuous Scroll Rendering
                  <div className="flex flex-col gap-6 items-center w-full max-w-full">
                    {Array.from(new Array(numPages), (el, index) => (
                      <div key={\`page_\${index + 1}\`} className="shadow-xl max-w-full overflow-hidden bg-white">
                        <Page suspense={false} customTextRenderer={makeCustomTextRenderer(index + 1)}
                          pageNumber={index + 1}
                          width={pdfMaxWidth * scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </div>
                    ))}
                  </div>
                ) : settings.layoutMode === 'double' && containerWidth > 800 ? (
                  // Double Page Rendering
                  <div className="flex w-full justify-center gap-1 md:gap-4 p-4 max-w-full overflow-hidden">
                    <div className="shadow-xl overflow-hidden flex-shrink-0 bg-white" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                      <Page suspense={false} customTextRenderer={makeCustomTextRenderer(pageNumber)}
                        pageNumber={pageNumber}
                        width={(pdfMaxWidth * scale) / 2}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                    {pageNumber + 1 <= numPages && (
                      <div className="shadow-xl overflow-hidden flex-shrink-0 bg-white" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                        <Page suspense={false} customTextRenderer={makeCustomTextRenderer(pageNumber + 1)}
                          pageNumber={pageNumber + 1}
                          width={(pdfMaxWidth * scale) / 2}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Single Page Rendering
                  <div className="max-w-full overflow-hidden flex justify-center shadow-xl bg-white">
                    <Page suspense={false} customTextRenderer={makeCustomTextRenderer(pageNumber)}
                      pageNumber={pageNumber}
                      width={pdfMaxWidth * scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                )}
              </Document>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className={\`absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center text-xs opacity-60 backdrop-blur-md z-20 \${
        settings.theme === 'dusk' || settings.theme === 'amoled' ? 'bg-black/20' : 'bg-white/20'
      }\`}>
        <div>{book.title}</div>
        <div className="flex items-center gap-2">
          <span>{pageNumber} of {numPages || '-'}</span>
          <div className="w-32 h-1 bg-current/20 rounded-full overflow-hidden ml-2">
            <div 
              className="h-full bg-current rounded-full" 
              style={{ width: \`\${numPages ? (pageNumber / numPages) * 100 : 0}%\` }}
            />
          </div>
        </div>
      </div>

      <SelectionPopup
        position={selectionPosition}
        selectedText={selectedText}
        onHighlight={handleCreateHighlight}
        onAddNote={() => {}}
        onReadAloud={() => {
          ttsService.speakText(selectedText, { rate: 1.0 });
          setSelectionPosition(null);
        }}
        onAskAI={() => {
          setIsAIOpen(true);
          setSelectionPosition(null);
        }}
        onClose={() => setSelectionPosition(null)}
      />

      {activeHighlightPopover && (
        <HighlightPopover
          highlight={activeHighlightPopover.highlight}
          position={activeHighlightPopover.position}
          onClose={() => setActiveHighlightPopover(null)}
          onUpdateHighlight={handleUpdateHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          onAskAI={(text) => {
            setSelectedText(text);
            setIsAIOpen(true);
            setActiveHighlightPopover(null);
          }}
        />
      )}
      
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        selectedText={selectedText}
        book={book}
        currentChapter={{ id: 'pdf', title: \`Page \${pageNumber}\`, content: selectedText || '' }}
      />

      {/* Annotations Drawer */}
      <AnnotationsDrawer
        isOpen={isAnnotationsDrawerOpen}
        onClose={() => setIsAnnotationsDrawerOpen(false)}
        highlights={highlights}
        bookmarks={[]}
        onDeleteHighlight={handleDeleteHighlight}
        onDeleteBookmark={() => {}}
        onJumpToBookmark={() => {}}
        onJumpToHighlight={(h) => {
          setPendingHighlightScrollId(h.id);
        }}
        bookTitle={book.title}
      />

      {isTOCOpen && (
        <>
          <div className="absolute inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setIsTOCOpen(false)} />
          <div className={\`absolute inset-y-0 left-0 w-80 shadow-2xl z-50 border-r flex flex-col transform transition-transform \${themeStyle.container} \${themeStyle.border} \${themeStyle.text}\`}>
            <div className={\`p-4 border-b \${themeStyle.border} flex justify-between items-center\`}>
              <h3 className="font-semibold text-sm">Table of Contents</h3>
              <button onClick={() => setIsTOCOpen(false)} className={\`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 \${themeStyle.text}\`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {pdfOutline && pdfOutline.length > 0 ? (
                <ul className="space-y-1">
                  {pdfOutline.map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => navigateToOutlineItem(item)}
                        className={\`w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10 rounded-md truncate \${themeStyle.text}\`}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-xs opacity-50">
                  No Table of Contents available in this PDF.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Universal Reading Progress Bar at the bottom */}
      {!isZenMode && (
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <ReadingProgressBar
            book={book}
            currentChapterIndex={pageNumber - 1}
            currentPageIndex={0}
            totalPagesInChapter={1}
            wordsPerPage={250}
            onNavigatePage={() => {}}
            onNavigateChapter={(page) => changePage(page - pageNumber + 1)}
            onOpenTOC={() => setIsTOCOpen(true)}
            isBookmarked={false}
            onToggleBookmark={() => {}}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            accentClass={accentConfig.bg}
          />
        </div>
      )}

      {/* Typography Toolbar Popover */}
      <TypographyToolbar
        isOpen={isTypographyOpen}
        onClose={() => setIsTypographyOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Soundscape Modal */}
      <SoundscapeModal
        isOpen={isSoundscapeOpen}
        onClose={() => setIsSoundscapeOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Habits Dashboard */}
      <ReadingHabitsDashboard
        isOpen={isHabitsOpen}
        onClose={() => setIsHabitsOpen(false)}
      />

      {/* TTS Audio Player Bar */}
      <TTSAudioBar
        isOpen={isTTSOpen}
        currentSentence={ttsCurrentSentence}
        onClose={() => setIsTTSOpen(false)}
      />

      {/* RSVP Speed Reader Modal */}
      <RSVPModal
        isOpen={isRSVPOpen}
        onClose={() => setIsRSVPOpen(false)}
        text={selectedText || "Please highlight text to use RSVP Speed Reader in PDF mode."}
        title={book.title}
      />
    </div>
  );
}
`;

fs.writeFileSync('src/components/NativePdfReader.tsx', beforeReturn + newRender);
