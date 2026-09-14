import { ErrorBoundary } from './ErrorBoundary';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Book, ReaderSettings, Highlight } from '../types';
import { db } from '../services/db';
import { habitTracker } from '../services/habitTracker';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText, Moon, Sun, Palette, Eye, CloudRain, Flame, Volume2, Zap, Sliders, BookOpen } from 'lucide-react';
import { SelectionPopup } from './SelectionPopup';
import { HighlightPopover } from './HighlightPopover';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { AnnotationsDrawer } from './ReaderDrawers';
import { ttsService } from '../services/ttsService';
import { SoundscapeModal } from './SoundscapeModal';
import { ReadingHabitsDashboard } from './ReadingHabitsDashboard';
import { TTSAudioBar } from './TTSAudioBar';
import { RSVPModal } from './RSVPModal';
import { TypographyToolbar } from './TypographyToolbar';
import { ReadingProgressBar } from './ReadingProgressBar';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';



// Set up standard worker config
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface NativePdfReaderProps {
  book: Book;
  onBackToLibrary: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  targetHighlightId?: string | null;
  onClearTargetHighlight?: () => void;
}

export const NativePdfReader: React.FC<NativePdfReaderProps> = ({
  book,
  onBackToLibrary,
  settings,
  onUpdateSettings,
  isZenMode,
  onToggleZenMode,
  targetHighlightId,
  onClearTargetHighlight
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fileData, setFileData] = useState<ArrayBuffer | Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [zenNavVisible, setZenNavVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfFilterTheme, setPdfFilterTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const pageRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  
  useEffect(() => {
    if (settings.layoutMode !== 'scroll' || numPages === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          const page = Number(entry.target.getAttribute('data-page-number'));
          if (page && !isNaN(page)) {
            setPageNumber(page);
          }
        }
      });
    }, { threshold: 0.3, root: containerRef.current });

    Object.values(pageRefs.current).forEach(node => {
      if (node) observer.observe(node as Element);
    });

    return () => observer.disconnect();
  }, [settings.layoutMode, numPages, scale]);


  const [pdfViewMode, setPdfViewMode] = useState<'native' | 'reader'>('native');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const extractCurrentPages = useCallback(async () => {
    if (!pdfDoc) return;
    setIsExtracting(true);
    try {
      let combinedText = '';
      const pagesToExtract = [pageNumber];
      if (settings.layoutMode === 'double' && pageNumber + 1 <= numPages) {
        pagesToExtract.push(pageNumber + 1);
      }
      
      for (const p of pagesToExtract) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        
        let lastY;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === undefined || Math.abs(lastY - item.transform[5]) < 5) {
             text += item.str + ' ';
          } else {
             text += '\n' + item.str + ' ';
          }    
          lastY = item.transform[5];
        }
        
        let cleanText = text;
        
        // Clean hyphenation across lines
        cleanText = cleanText.replace(/([a-zA-Z])-\s*\n\s*([a-zA-Z])/g, '$1$2');
        
        // Join lines that shouldn't be broken (lowercase letter on next line implies continuation)
        cleanText = cleanText.replace(/([^\.?!\n])\s*\n\s*([a-z])/g, '$1 $2');
        
        // Clean up excessive spaces
        cleanText = cleanText.replace(/ {2,}/g, ' ');
        
        // Remove lines that are just a single number (often page numbers)
        cleanText = cleanText.replace(/^\s*[0-9]+\s*$/gm, '');
        
        // Standardize paragraphs
        cleanText = cleanText.replace(/\n{2,}/g, '\n\n');
        
        combinedText += cleanText.trim() + '\n\n\n';
      }
      setExtractedText(combinedText);
    } catch (e) {
      console.error(e);
      console.error('Extraction error:', e); setExtractedText("Failed to extract text from this page. This PDF might be an image without an OCR layer or the document was unmounted.");
    } finally {
      setIsExtracting(false);
    }
  }, [pdfDoc, pageNumber, settings.layoutMode, numPages]);

  useEffect(() => {
    if (pdfViewMode === 'reader' && pdfDoc) {
      extractCurrentPages();
    }
  }, [pdfViewMode, pageNumber, pdfDoc, settings.layoutMode, extractCurrentPages]);

  // Bionic reading word transformation helper
  const formatBionicText = (text: string) => {
    if (!settings.bionicReading) return text;
    return text.split(' ').map((word, i) => {
      const mid = Math.ceil(word.length * 0.45);
      const boldPart = word.slice(0, mid);
      const rest = word.slice(mid);
      return (
        <React.Fragment key={i}>
          <span className="font-extrabold opacity-95">{boldPart}</span>
          <span>{rest} </span>
        </React.Fragment>
      );
    });
  };


  


  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isTTSOpen, setIsTTSOpen] = useState(false);
  const [ttsCurrentSentence, setTtsCurrentSentence] = useState('');
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);

  // Selection popup states
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionOffsets, setSelectionOffsets] = useState<any>(null);

  // Highlight popover state
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<{
    highlight: Highlight;
    position: { x: number; y: number };
  } | null>(null);

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [pdfOutline, setPdfOutline] = useState<any[]>([]);
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isAnnotationsDrawerOpen, setIsAnnotationsDrawerOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [pendingHighlightScrollId, setPendingHighlightScrollId] = useState<string | null>(null);

  useEffect(() => {
    habitTracker.startSession(book.id, book.title);
    return () => {
      habitTracker.endSession();
      ttsService.stop();
    };
  }, [book.id, book.title]);

  useEffect(() => {
    const loadPdf = async () => {
      const bookData = await db.books.get(book.id);
      if (bookData?.rawFile) {
        setFileData(bookData.rawFile);
        const url = URL.createObjectURL(new Blob([bookData.rawFile], { type: 'application/pdf' }));
        setPdfUrl(url);
      }
    };
    loadPdf();

    db.highlights.where('bookId').equals(book.id).toArray().then(setHighlights);

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [book.id]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', updateWidth);
    updateWidth();
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = async (pdf: any) => {
    setNumPages(pdf.numPages);
    setPdfDoc(pdf);
    setPdfDoc(pdf);
    try {
      const outline = await pdf.getOutline();
      if (outline) setPdfOutline(outline);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') changePage(-1);
      else if (e.key === 'ArrowRight') changePage(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages || 1));
  };

  const getPdfFilterStyle = () => {
    switch (pdfFilterTheme) {
      case 'dark': return 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.1)';
      case 'sepia': return 'sepia(0.6) contrast(0.9) brightness(0.9)';
      default: return 'none';
    }
  };

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
  }), []);

  const themeStyle = useMemo(() => {
    switch (settings.theme) {
      case 'paper': return { border: 'border-stone-200', bg: 'bg-stone-100', text: 'text-stone-900', container: 'bg-white' };
      case 'sepia': return { border: 'border-[#e6dcc5]', bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', container: 'bg-[#fcf7ed]' };
      case 'dusk': return { border: 'border-slate-700', bg: 'bg-slate-800', text: 'text-slate-300', container: 'bg-slate-700' };
      case 'amoled': return { border: 'border-zinc-900', bg: 'bg-black', text: 'text-stone-400', container: 'bg-zinc-950' };
      default: return { border: 'border-stone-200', bg: 'bg-stone-50', text: 'text-stone-900', container: 'bg-white' };
    }
  }, [settings.theme]);

  const accentConfig = useMemo(() => {
    switch (settings.accentColor) {
      case 'blue': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' };
      case 'emerald': return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' };
      case 'rose': return { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500' };
      case 'amber': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' };
      case 'violet': return { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500' };
      default: return { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500' };
    }
  }, [settings.accentColor]);

  const pdfMaxWidth = 800;

  const navigateToOutlineItem = async (item: any) => {
    setIsTOCOpen(false);
    // Simple implementation for now. Proper implementation requires finding the page number from dest.
  };

  const toggleLayoutMode = () => {
    const modes: ('single' | 'double' | 'scroll')[] = ['single', 'double', 'scroll'];
    const idx = modes.indexOf(settings.layoutMode as any);
    onUpdateSettings({ layoutMode: modes[(idx + 1) % modes.length] as any });
  };

  const startTTS = (customText?: string) => {
    const textToSpeak = customText || selectedText || "Please highlight text to use Text-to-Speech in PDF mode.";
    ttsService.speakText(textToSpeak, { rate: 1.0 });
    setIsTTSOpen(true);
    setSelectionPosition(null);
  };

  const handleUpdateHighlight = async (id: string, updates: any) => {
    await db.highlights.update(id, updates);
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    if (activeHighlightPopover && activeHighlightPopover.highlight.id === id) {
      setActiveHighlightPopover({
        ...activeHighlightPopover,
        highlight: { ...activeHighlightPopover.highlight, ...updates },
      });
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    await db.highlights.delete(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setActiveHighlightPopover(null);
  };

  const handleCreateHighlight = async (color: string, note?: string) => {
    if (!selectedText) return;
    
    await db.highlights.put({
      id: `hl-${Date.now()}`,
      bookId: book.id,
      chapterIndex: pageNumber - 1,
      selectedText,
      color: color as any,
      note,
      createdAt: Date.now(),
    });
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
    const all = await db.highlights.where('bookId').equals(book.id).toArray();
    setHighlights(all);
  };

  // Selection detection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectedText(text);
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      } else {
        setSelectionPosition(null);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);


return (
    <div className={`w-full flex flex-col transition-colors duration-200 relative overflow-hidden ${themeStyle.bg} ${themeStyle.text} ${isZenMode ? 'h-screen' : 'h-[calc(100vh-2.75rem)]'}`}>
      <ErrorBoundary>
      

      <style dangerouslySetInnerHTML={{ __html: `
        .react-pdf__Page__textContent, .textLayer {
          color-scheme: only light;
          position: absolute;
          text-align: initial;
          inset: 0;
          overflow: clip;
          opacity: 1;
          line-height: 1;
          text-size-adjust: none;
          forced-color-adjust: none;
          transform-origin: 0 0;
          caret-color: CanvasText;
          z-index: 0;
          border-radius: 0;
        }
        .react-pdf__Page__textContent span, .textLayer :is(span, br) {
          color: transparent !important;
          position: absolute;
          white-space: pre;
          cursor: text;
          margin: 0;
          transform-origin: 0 0;
        }
        .react-pdf__Page__textContent span::selection, .textLayer :is(span, br)::selection {
          background: rgba(0, 102, 255, 0.25) !important;
          color: transparent !important;
        }
        .react-pdf__Page__textContent span::-moz-selection, .textLayer :is(span, br)::-moz-selection {
          background: rgba(0, 102, 255, 0.25) !important;
          color: transparent !important;
        }
        .react-pdf__Page__canvas {
          display: block !important;
          margin: 0 auto !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
      ` }} />


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
        className={`${isZenMode ? 'fixed top-0 left-0 right-0 z-50 transition-all duration-300' : 'relative z-30 shrink-0'} ${isZenMode && !zenNavVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <nav
          className={`h-12 border-b ${themeStyle.border} px-4 flex items-center justify-between select-none backdrop-blur-xs ${isZenMode ? themeStyle.bg : ''}`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLibrary}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer ${themeStyle.text}`}
              title="Return to Library"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </button>
            <button
              onClick={() => setIsTOCOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs cursor-pointer ${themeStyle.text}`}
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline truncate max-w-[140px]">{book.title}</span>
            </button>

            <button
              onClick={() => setIsAnnotationsDrawerOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs ${themeStyle.text}`}
              title="Notes & Highlights"
            >
              <ScrollText className="w-4 h-4" />
              <span className="hidden md:inline">Notes</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setIsTypographyOpen((prev) => !prev)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${isTypographyOpen ? 'text-amber-500 bg-amber-500/10' : themeStyle.text}`}
              title="Typography & Display Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSoundscapeOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.text}`}
              title="Soundscapes & Warmth (S)"
            >
              <CloudRain className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsHabitsOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.text}`}
              title="Reading Habits & Focus Timer (H)"
            >
              <Flame className="w-4 h-4 text-amber-500" />
            </button>

            <button
              onClick={() => startTTS()}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${isTTSOpen ? 'text-amber-500 bg-amber-500/10' : themeStyle.text}`}
              title="Read Aloud with Offline Text-to-Speech"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRSVPOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.text}`}
              title="RSVP Speed Reader (V)"
            >
              <Zap className="w-4 h-4 text-amber-500" />
            </button>
            
            <div className="w-px h-6 bg-slate-500/30 mx-1"></div>

            
            <button
              onClick={() => setPdfViewMode(m => m === 'native' ? 'reader' : 'native')}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border ${themeStyle.border} ${themeStyle.text}`}
              title={`Switch to ${pdfViewMode === 'native' ? 'Reader' : 'Native'} Mode`}
            >
              {pdfViewMode === 'native' ? <BookOpen className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs font-medium">{pdfViewMode === 'native' ? 'Reader' : 'Native'}</span>
            </button>
            
            <div className="w-px h-6 bg-slate-500/30 mx-1"></div>

            
            <button
              onClick={() => setPdfViewMode(m => m === 'native' ? 'reader' : 'native')}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border ${themeStyle.border} ${themeStyle.text}`}
              title={`Switch to ${pdfViewMode === 'native' ? 'Reader' : 'Native'} Mode`}
            >
              {pdfViewMode === 'native' ? <BookOpen className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs font-medium">{pdfViewMode === 'native' ? 'Reader' : 'Native'}</span>
            </button>
            
            <div className="w-px h-6 bg-slate-500/30 mx-1"></div>

            <button
              onClick={() => {
                const themes: ('light' | 'dark' | 'sepia')[] = ['light', 'dark', 'sepia'];
                const idx = themes.indexOf(pdfFilterTheme);
                setPdfFilterTheme(themes[(idx + 1) % themes.length]);
              }}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border ${themeStyle.border} ${themeStyle.text}`}
              title={`PDF Appearance: ${pdfFilterTheme}`}
            >
              {pdfFilterTheme === 'dark' ? <Moon className="w-4 h-4" /> : pdfFilterTheme === 'sepia' ? <Palette className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleLayoutMode}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1 border ${themeStyle.border} ${themeStyle.text}`}
              title={`Layout: ${settings.layoutMode}`}
            >
              {settings.layoutMode === 'double' ? <Columns2 className="w-4 h-4" /> : 
               settings.layoutMode === 'scroll' ? <ScrollText className="w-4 h-4" /> : 
               <Square className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.text}`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-10 text-center opacity-70">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(3.0, s + 0.1))}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.text}`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1.0)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ml-1 ${themeStyle.text}`}
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
        ) : pdfViewMode === 'reader' ? (
          <div className="w-full max-w-3xl px-8 py-12 md:py-16 mx-auto relative transition-all duration-300">
            {isExtracting ? (
               <div className="flex justify-center items-center h-64 opacity-50">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                 <p className="ml-3">Extracting text layout...</p>
               </div>
            ) : extractedText ? (
              <div 
                className={`prose prose-lg dark:prose-invert max-w-none ${
                  settings.fontFamily === 'literata' ? 'font-literata' :
                  settings.fontFamily === 'merriweather' ? 'font-merriweather' :
                  settings.fontFamily === 'dyslexic' ? 'font-dyslexic' :
                  'font-sans-ui'
                }`}
                style={{ 
                  fontSize: `${settings.fontSize}px`, 
                  lineHeight: settings.lineHeight,
                  textAlign: settings.textAlign as any
                }}
              >
                {extractedText.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-6 whitespace-pre-wrap">
                    {formatBionicText(paragraph)}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center">
                 <Eye className="w-12 h-12 mb-4 opacity-30" />
                 <p>No text could be extracted from this page.</p>
                 <p className="text-sm mt-2">This may be a scanned image without OCR text layer.</p>
                 <button onClick={() => setPdfViewMode('native')} className="mt-4 px-4 py-2 bg-black/10 rounded-md text-sm hover:bg-black/20 transition">Return to Native View</button>
              </div>
            )}
          </div>
        ) : (
          <div 

            className={`shadow-2xl transition-all duration-300 ${themeStyle.container} ${settings.layoutMode !== 'scroll' ? 'rounded-lg overflow-hidden' : ''}`}
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
                  <div className="flex flex-col gap-6 items-center w-full max-w-full pb-20">
                    {Array.from(new Array(numPages), (el, index) => {
                      const pNum = index + 1;
                      const isVisible = Math.abs(pNum - pageNumber) <= 2;
                      return (
                        <div 
                          key={`page_${pNum}`} 
                          data-page-number={pNum}
                          ref={(el) => pageRefs.current[pNum] = el as any}
                          className="shadow-xl max-w-full overflow-hidden bg-white relative flex justify-center"
                          style={{ minHeight: (pdfMaxWidth * scale) * 1.414, width: pdfMaxWidth * scale }}
                        >
                          {isVisible ? (
                            <Page suspense={false}
                              pageNumber={pNum}
                              width={pdfMaxWidth * scale}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50">
                              <span className="text-xl font-medium">Page {pNum}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : settings.layoutMode === 'double' && containerWidth > 800 ? (
                  // Double Page Rendering
                  <div className="flex w-full justify-center gap-1 md:gap-4 p-4 max-w-full overflow-hidden">
                    <div className="shadow-xl overflow-hidden flex-shrink-0 bg-white" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                      <Page suspense={false}
                        pageNumber={pageNumber}
                        width={(pdfMaxWidth * scale) / 2}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                    {pageNumber + 1 <= numPages && (
                      <div className="shadow-xl overflow-hidden flex-shrink-0 bg-white" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                        <Page suspense={false}
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
                    <Page suspense={false}
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
      <div className={`absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center text-xs opacity-60 backdrop-blur-md z-20 ${
        settings.theme === 'dusk' || settings.theme === 'amoled' ? 'bg-black/20' : 'bg-white/20'
      }`}>
        <div>{book.title}</div>
        <div className="flex items-center gap-2">
          <span>{pageNumber} of {numPages || '-'}</span>
          <div className="w-32 h-1 bg-current/20 rounded-full overflow-hidden ml-2">
            <div 
              className="h-full bg-current rounded-full" 
              style={{ width: `${numPages ? (pageNumber / numPages) * 100 : 0}%` }}
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
        currentChapter={{ id: 'pdf', title: `Page ${pageNumber}`, content: selectedText || '' }}
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
          <div className={`absolute inset-y-0 left-0 w-80 shadow-2xl z-50 border-r flex flex-col transform transition-transform ${themeStyle.container} ${themeStyle.border} ${themeStyle.text}`}>
            <div className={`p-4 border-b ${themeStyle.border} flex justify-between items-center`}>
              <h3 className="font-semibold text-sm">Table of Contents</h3>
              <button onClick={() => setIsTOCOpen(false)} className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${themeStyle.text}`}>
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
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10 rounded-md truncate ${themeStyle.text}`}
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
      </ErrorBoundary>
    </div>
  );
}
