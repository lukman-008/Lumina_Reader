import { ErrorBoundary } from './ErrorBoundary';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Book, ReaderSettings, Highlight } from '../types';
import { db } from '../services/db';
import { habitTracker } from '../services/habitTracker';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize2, Settings, List, X, Square, Columns2, ScrollText, Moon, Sun, Palette, Eye, CloudRain, Flame, Volume2, Zap, Sliders, BookOpen, Highlighter, Sparkles, Loader2 } from 'lucide-react';
import { SelectionPopup } from './SelectionPopup';
import { HighlightPopover } from './HighlightPopover';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { AnnotationsDrawer } from './ReaderDrawers';
import { ttsService } from '../services/ttsService';
import { aiService } from '../services/aiService';
import { ImageModal } from './ImageModal';
import { SoundscapeModal } from './SoundscapeModal';
import { ReadingHabitsDashboard } from './ReadingHabitsDashboard';
import { TTSAudioBar } from './TTSAudioBar';
import { RSVPModal } from './RSVPModal';
import { TypographyToolbar } from './TypographyToolbar';
import { ReadingProgressBar } from './ReadingProgressBar';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';



// import removed

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

const highlightColors: Record<string, string> = {
  yellow: 'bg-amber-400/35 border-b-2 border-amber-400/90',
  emerald: 'bg-emerald-400/35 border-b-2 border-emerald-400/90',
  sky: 'bg-sky-400/35 border-b-2 border-sky-400/90',
  rose: 'bg-rose-400/35 border-b-2 border-rose-400/90',
  amber: 'bg-orange-400/35 border-b-2 border-orange-400/90',
  violet: 'bg-violet-400/35 border-b-2 border-violet-400/90',
};

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
  const [containerWidth, setContainerWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 800);
  const [scale, setScale] = useState<number>(1.0);
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleSwipeStart = (e: React.TouchEvent) => {
    // Never trigger page-turn swipes if touch started on navigation bar, toolbars, buttons, sliders, or drawers
    const target = e.target as HTMLElement | null;
    if (target) {
      if (
        target.closest('nav') ||
        target.closest('header') ||
        target.closest('footer') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[role="slider"]') ||
        target.closest('[data-no-swipe="true"]') ||
        target.closest('.no-swipe') ||
        target.closest('.scrollbar-hide') ||
        target.closest('[role="dialog"]')
      ) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // If text is actively selected or user was selecting text, do not navigate pages
    const currentSelection = window.getSelection();
    if (currentSelection && currentSelection.toString().trim().length > 0) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    // Only register as swipe if horizontal distance is greater than vertical (allows scrolling)
    // and distance is significant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        changePage(-1); // Swipe right -> previous page
      } else {
        changePage(1); // Swipe left -> next page
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };
  const [pdfFilterTheme, setPdfFilterTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const pageRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

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
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number; bottom?: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRects, setSelectionRects] = useState<{ left: number; top: number; width: number; height: number }[]>([]);
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
  const [isOcrExtracting, setIsOcrExtracting] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<{ src: string; alt?: string } | null>(null);

  const handleOcrCurrentPage = async () => {
    setIsOcrExtracting(true);
    try {
      let targetCanvas: HTMLCanvasElement | null = null;
      if (containerRef.current) {
        const pageEl = containerRef.current.querySelector(`[data-page-number="${pageNumber}"]`);
        if (pageEl) {
          targetCanvas = pageEl.querySelector('canvas');
        }
        if (!targetCanvas) {
          targetCanvas = containerRef.current.querySelector('canvas');
        }
      }

      if (!targetCanvas) {
        throw new Error("Page canvas not ready yet. Please wait a moment for the page to render.");
      }

      const imageBase64 = targetCanvas.toDataURL('image/jpeg', 0.92);
      const res = await aiService.extractTextFromImage(
        imageBase64,
        "Transcribe all readable text from this scanned book page accurately. Maintain original paragraphs and line structure. Do not include markdown code fences or conversational filler—output only the transcribed text."
      );

      if (res.text && res.text.trim().length > 0) {
        setExtractedText(res.text.trim());
        setPdfViewMode('reader');
      } else {
        setExtractedText("No readable text could be recognized on this page.");
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setExtractedText(`OCR Failed: ${err.message || 'Unable to extract text from page image'}`);
    } finally {
      setIsOcrExtracting(false);
    }
  };

  useEffect(() => {
    if (pendingHighlightScrollId && pdfViewMode === 'reader') {
      const el = document.getElementById(`hl-${pendingHighlightScrollId}`);
      if (el) {
        if (settings.layoutMode === 'scroll') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const origStyle = el.style.boxShadow;
        el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.5)';
        setTimeout(() => {
          if (el) el.style.boxShadow = origStyle;
        }, 1500);
        setPendingHighlightScrollId(null);
      } else {
        const timer = setTimeout(() => {
          const retryEl = document.getElementById(`hl-${pendingHighlightScrollId}`);
          if (retryEl) {
            if (settings.layoutMode === 'scroll') {
               retryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            const origStyle = retryEl.style.boxShadow;
            retryEl.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.5)';
            setTimeout(() => {
              if (retryEl) retryEl.style.boxShadow = origStyle;
            }, 1500);
            setPendingHighlightScrollId(null);
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [pendingHighlightScrollId, pageNumber, pdfViewMode, settings.layoutMode]);

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
    setPageNumber(prev => {
      const newPage = Math.min(Math.max(1, prev + offset), numPages || 1);
      if (settings.layoutMode === 'scroll') {
        const el = pageRefs.current[newPage];
        if (el && containerRef.current) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
      return newPage;
    });
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
      case 'sky': return { bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500' };
      case 'emerald': return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' };
      case 'rose': return { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500' };
      case 'amber': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' };
      case 'violet': return { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500' };
      default: return { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500' };
    }
  }, [settings.accentColor]);

  // On mobile (narrow container), bound the max width to the container size (minus padding).
  const pdfMaxWidth = Math.min(800, Math.max(300, containerWidth - 32));

  const navigateToOutlineItem = async (item: any) => {
    setIsTOCOpen(false);
    // Simple implementation for now. Proper implementation requires finding the page number from dest.
  };

  const toggleLayoutMode = () => {
    const modes: ('single' | 'double' | 'scroll')[] = ['single', 'double', 'scroll'];
    const idx = modes.indexOf(settings.layoutMode as any);
    onUpdateSettings({ layoutMode: modes[(idx + 1) % modes.length] as any });
  };

  const startTTS = async (customText?: string) => {
    if (customText) {
      ttsService.speakText(customText, { rate: 1.0 });
      setIsTTSOpen(true);
      setSelectionPosition(null);
      return;
    }
    if (selectedText) {
      ttsService.speakText(selectedText, { rate: 1.0 });
      setIsTTSOpen(true);
      setSelectionPosition(null);
      return;
    }

    // Full audio book mode for PDF
    if (pdfDoc) {
      setIsExtracting(true);
      let fullText = '';
      const endPage = Math.min(pageNumber + 20, numPages); // Extract next 20 pages max at once to prevent freezing
      for (let i = pageNumber; i <= endPage; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((s: any) => s.str).join(' ');
          fullText += pageText + ' \n\n';
        } catch (e) {
          console.error("Error extracting page", i, e);
        }
      }
      setIsExtracting(false);
      ttsService.speakText(fullText || "No readable text found.", { rate: 1.0 });
      setIsTTSOpen(true);
      setSelectionPosition(null);
    }
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

  const renderHighlights = (pNum: number) => {
    const pageHighlights = highlights.filter(h => h.chapterIndex === pNum - 1);
    if (pageHighlights.length === 0) return null;
    return pageHighlights.map((hl) => {
      if (!hl.rects) return null;
      return (
        <div 
          key={hl.id} 
          className="absolute inset-0 pointer-events-none z-10"
        >
          {hl.rects.map((rect, i) => (
            <div
              key={i}
              className={`absolute pointer-events-auto cursor-pointer mix-blend-multiply dark:mix-blend-screen transition-opacity hover:opacity-80 ${highlightColors[hl.color] || highlightColors.yellow}`}
              style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveHighlightPopover({ highlight: hl, position: { x: e.clientX, y: e.clientY } });
              }}
            />
          ))}
        </div>
      );
    });
  };

  const handleCreateHighlight = async (color: string, note?: string) => {
    if (!selectedText) return;
    
    await db.highlights.put({
      id: `hl-${Date.now()}`,
      bookId: book.id,
      chapterIndex: pageNumber - 1,
      selectedText,
      rects: selectionRects.length > 0 ? selectionRects : undefined,
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
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const checkSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text) {
          try {
            const range = selection.getRangeAt(0);
            let rect = range.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) {
              const clientRects = range.getClientRects();
              if (clientRects.length > 0) {
                rect = clientRects[0];
              }
            }
            
            let normalizedRects: { left: number; top: number; width: number; height: number }[] = [];
            const anchorParent = (selection.anchorNode as Node)?.parentElement;
            const focusParent = (selection.focusNode as Node)?.parentElement;
            const pageContainer = anchorParent?.closest('.react-pdf__Page') || focusParent?.closest('.react-pdf__Page') || (range.commonAncestorContainer as HTMLElement)?.closest?.('.react-pdf__Page');
            if (pageContainer) {
               const pageRect = pageContainer.getBoundingClientRect();
               const rects = Array.from(range.getClientRects());
               normalizedRects = rects.map(r => ({
                 left: ((r.left - pageRect.left) / pageRect.width) * 100,
                 top: ((r.top - pageRect.top) / pageRect.height) * 100,
                 width: (r.width / pageRect.width) * 100,
                 height: (r.height / pageRect.height) * 100,
               }));
            }

            setSelectedText(text);
            setSelectionRects(normalizedRects);
            setSelectionPosition({
              x: rect.left + rect.width / 2,
              y: rect.top,
              bottom: rect.bottom,
            });
          } catch {
            // Ignore range errors during mid-drag
          }
        }
      } else {
        setSelectionPosition(null);
        setSelectionRects([]);
      }
    };

    const handleSelectionEnd = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkSelection, 30);
    };

    const handleSelectionChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkSelection, 40);
    };

    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('pointerup', handleSelectionEnd);
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
      document.removeEventListener('pointerup', handleSelectionEnd);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.fixed.z-50') && !target.closest('.pointer-events-auto.mix-blend-multiply')) {
        setActiveHighlightPopover(null);
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
            setSelectionPosition(null);
          }
        }, 120);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

return (
    <div className={`w-full flex flex-col transition-colors duration-200 relative  ${themeStyle.bg} ${themeStyle.text} ${isZenMode ? 'h-[100dvh]' : 'h-[calc(100dvh-2.75rem)]'}`}>
      <ErrorBoundary>
      

      <style dangerouslySetInnerHTML={{ __html: `
        .react-pdf__Page {
          position: relative !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .react-pdf__Page__canvas {
          display: block !important;
          margin: 0 auto !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
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
          z-index: 5 !important;
          border-radius: 0;
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .react-pdf__Page__textContent span, .textLayer :is(span, br) {
          color: transparent !important;
          position: absolute;
          white-space: pre;
          cursor: text;
          margin: 0;
          transform-origin: 0 0;
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .react-pdf__Page__textContent span::selection, .textLayer :is(span, br)::selection {
          background: rgba(0, 102, 255, 0.3) !important;
          color: transparent !important;
        }
        .react-pdf__Page__textContent span::-moz-selection, .textLayer :is(span, br)::-moz-selection {
          background: rgba(0, 102, 255, 0.3) !important;
          color: transparent !important;
        }
      ` }} />


      {/* Zen Mode / Full Screen Exit Overlay */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 transition-opacity duration-300 opacity-30 hover:opacity-100 flex items-center gap-2">
          <button
            onClick={onToggleZenMode}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 rounded-lg border border-slate-700/50 backdrop-blur-md shadow-lg cursor-pointer"
            title="Exit Zen Mode (Esc)"
          >
            <Minimize2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Exit Fullscreen <kbd className="ml-1 opacity-60 font-sans">Esc</kbd></span>
          </button>
        </div>
      )}

      {/* Top Nav Bar */}
      <div 
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`${isZenMode ? 'fixed top-0 left-0 right-0 z-50 transition-all duration-300' : 'relative z-30 shrink-0'} ${isZenMode && !zenNavVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <nav
          data-no-swipe="true"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`h-12 border-b ${themeStyle.border} px-2 sm:px-4 flex items-center gap-2 select-none backdrop-blur-xs w-full overflow-hidden ${isZenMode ? themeStyle.bg : ''}`}
        >
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

            {/* Highlights & Notes */}
            <button
              onClick={() => setIsAnnotationsDrawerOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition relative cursor-pointer ${themeStyle.text}`}
              title="Notebook & Highlights"
            >
              <Highlighter className="w-4 h-4" />
              {highlights.length > 0 && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${accentConfig.bg}`} />
              )}
            </button>

            {/* AI Assistant */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
              title="Open AI Reading Companion"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>

          <div className="flex-1 min-w-0 h-full flex items-center justify-end">
            <div 
              data-no-swipe="true"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ touchAction: 'pan-x', overscrollBehavior: 'contain' }}
              className="flex items-center overflow-x-auto scrollbar-hide w-full h-full mask-fade-right touch-pan-x overscroll-contain"
            >
              <div className="ml-auto flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0 pr-2 [&>button]:shrink-0">
            <button
              onClick={() => setIsTypographyOpen((prev) => !prev)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${isTypographyOpen ? 'text-amber-500 bg-amber-500/10' : themeStyle.text}`}
              title="Typography & Display Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSoundscapeOpen(true)}
              className={`p-1.5 rounded-lg transition cursor-pointer relative ${
                settings.soundscape && settings.soundscape !== 'none'
                  ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 ring-1 ring-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : `hover:bg-black/5 dark:hover:bg-white/10 ${themeStyle.text}`
              }`}
              title="Soundscapes & Warmth (S)"
            >
              <CloudRain className="w-4 h-4" />
              {settings.soundscape && settings.soundscape !== 'none' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
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
              className={`p-1.5 rounded-lg transition cursor-pointer relative ${
                isTTSOpen ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:bg-amber-500/30' : `hover:bg-black/5 dark:hover:bg-white/10 ${themeStyle.text}`
              }`}
              title="Read Aloud with Offline Text-to-Speech"
            >
              <Volume2 className="w-4 h-4" />
              {isTTSOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
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

            <button
              onClick={handleOcrCurrentPage}
              disabled={isOcrExtracting}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              title="Extract Text from Scanned Page / Image with AI OCR"
            >
              {isOcrExtracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">AI OCR</span>
            </button>
            
            <div className="w-px h-6 bg-slate-500/30 mx-1"></div>

            <button
              onClick={onToggleZenMode}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.text}`}
              title="Distraction-Free Zen Mode (Z)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

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
          </div></div></div>
        </nav>
      </div>

      {/* Floating page turning buttons (pointer-events-none on container so margins stay selectable) */}
      <div 
        className="hidden md:flex pointer-events-none absolute left-0 top-12 bottom-0 w-16 md:w-24 z-10 items-center justify-start pl-3"
      >
        <button
          type="button"
          onClick={() => changePage(-1)} 
          className="pointer-events-auto p-2 rounded-full bg-black/20 dark:bg-white/20 hover:bg-black/35 dark:hover:bg-white/35 backdrop-blur-xs transition cursor-pointer opacity-30 hover:opacity-100 shadow-md"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5 opacity-80" />
        </button>
      </div>
      
      <div 
        className="hidden md:flex pointer-events-none absolute right-0 top-12 bottom-0 w-16 md:w-24 z-10 items-center justify-end pr-3"
      >
        <button
          type="button"
          onClick={() => changePage(1)} 
          className="pointer-events-auto p-2 rounded-full bg-black/20 dark:bg-white/20 hover:bg-black/35 dark:hover:bg-white/35 backdrop-blur-xs transition cursor-pointer opacity-30 hover:opacity-100 shadow-md"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5 opacity-80" />
        </button>
      </div>

      <div 
        ref={containerRef}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        className="flex-1 overflow-y-auto overflow-x-auto w-full flex justify-center pt-8 pb-24 items-start"
        onScroll={(e) => {
          if (activeHighlightPopover) setActiveHighlightPopover(null);
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
            if (selectionPosition) setSelectionPosition(null);
          }
          if (settings.layoutMode === 'scroll') {
            const container = e.currentTarget as HTMLDivElement;
            const pageElements = container.querySelectorAll('[data-page-number]');
            let bestPage = pageNumber;
            let minDistance = Infinity;
            const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;
            pageElements.forEach(el => {
              const rect = el.getBoundingClientRect();
              const center = rect.top + rect.height / 2;
              const dist = Math.abs(center - containerCenter);
              if (dist < minDistance) {
                minDistance = dist;
                bestPage = Number(el.getAttribute('data-page-number'));
              }
            });
            if (bestPage && bestPage !== pageNumber) {
              setPageNumber(bestPage);
            }
          }
        }}
      >

        {!pdfUrl ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <p>Loading High-Fidelity PDF Engine...</p>
          </div>
        ) : (
          <>
            <div className={`w-full max-w-3xl px-8 py-12 md:py-16 mx-auto relative transition-all duration-300 ${pdfViewMode === 'reader' ? 'block' : 'hidden'}`}>
              {isExtracting ? (
                 <div className="flex justify-center items-center h-64 opacity-50">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                   <p className="ml-3">Extracting text layout...</p>
                 </div>
              ) : extractedText ? (
                <div 
                  className={`prose prose-lg dark:prose-invert max-w-none pb-20 ${
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
                  <div className="mt-12 pt-8 border-t border-current/10 flex flex-wrap gap-4 items-center justify-between">
                    <button
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm font-medium ${
                        pageNumber <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      ← Previous Page
                    </button>
                    <button
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                      className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm font-medium ${
                        pageNumber >= numPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Next Page →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-64 opacity-95 text-center max-w-md mx-auto p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10">
                   <Eye className="w-10 h-10 mb-3 text-amber-500/80" />
                   <h3 className="font-semibold text-base mb-1">Scanned Page or Image</h3>
                   <p className="text-xs text-current/70 mb-4">No embedded digital text was found on this PDF page. Use AI OCR to transcribe the page and make text selectable, readable, and highlightable.</p>
                   <div className="flex flex-wrap gap-2 justify-center">
                     <button 
                       onClick={handleOcrCurrentPage} 
                       disabled={isOcrExtracting}
                       className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-medium rounded-xl text-xs hover:bg-amber-400 active:scale-95 transition cursor-pointer shadow-md disabled:opacity-50"
                     >
                       {isOcrExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                       <span>{isOcrExtracting ? 'Transcribing...' : 'Extract Text with AI OCR'}</span>
                     </button>
                     <button 
                       onClick={() => setPdfViewMode('native')} 
                       className="px-3.5 py-2 bg-black/10 dark:bg-white/10 rounded-xl text-xs hover:bg-black/20 dark:hover:bg-white/20 transition cursor-pointer"
                     >
                       Return to Native View
                     </button>
                   </div>
                </div>
              )}
            </div>
            
            <div 
              className={`shadow-2xl transition-all duration-300 ${themeStyle.container} ${settings.layoutMode !== 'scroll' ? 'rounded-lg ' : ''} ${pdfViewMode === 'native' ? 'block' : 'hidden'}`}
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
                          className="shadow-xl  bg-white relative flex justify-center"
                          style={{ minHeight: (pdfMaxWidth * scale) * 1.414, width: pdfMaxWidth * scale }}
                        >
                          {isVisible ? (
                            <>
                              <Page suspense={false}
                                pageNumber={pNum}
                                width={pdfMaxWidth * scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                                error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page {pNum}</div>}
                              />
                              {renderHighlights(pNum)}
                            </>
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
                  <div className="flex w-full justify-center gap-1 md:gap-4 p-4 ">
                    <div className="shadow-xl flex-shrink-0 bg-white relative" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                      <Page suspense={false}
                        pageNumber={pageNumber}
                        width={(pdfMaxWidth * scale) / 2}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                        error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page</div>}
                      />
                      {renderHighlights(pageNumber)}
                    </div>
                    {pageNumber + 1 <= numPages && (
                      <div className="shadow-xl flex-shrink-0 bg-white relative" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                        <Page suspense={false}
                          pageNumber={pageNumber + 1}
                          width={(pdfMaxWidth * scale) / 2}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                          error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page</div>}
                        />
                        {renderHighlights(pageNumber + 1)}
                      </div>
                    )}
                  </div>
                ) : (
                  // Single Page Rendering
                  <div className="flex justify-center shadow-xl bg-white relative">
                    <Page suspense={false}
                      pageNumber={pageNumber}
                      width={pdfMaxWidth * scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                      error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page</div>}
                    />
                    {renderHighlights(pageNumber)}
                  </div>
                )}
              </Document>
            </div>
          </div>
          </>
        )}
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
        currentChapter={{ id: 'pdf', title: `Page ${pageNumber}`, content: selectedText || '', wordCount: 0 }}
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
          setPageNumber(h.chapterIndex + 1);
          if (settings.layoutMode === 'scroll') {
            const el = pageRefs.current[h.chapterIndex + 1];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          setPendingHighlightScrollId(h.id);
          setIsAnnotationsDrawerOpen(false);
        }}
        bookTitle={book.title}
      />

      {isTOCOpen && (
        <>
          <div className="absolute inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setIsTOCOpen(false)} />
          <div className={`absolute inset-y-0 left-0 w-[80%] max-w-sm sm:w-80 shadow-2xl z-50 border-r flex flex-col transform transition-transform ${themeStyle.container} ${themeStyle.border} ${themeStyle.text}`}>
            <div className={`p-4 border-b ${themeStyle.border} flex flex-wrap gap-4 justify-between items-center`}>
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
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <ReadingProgressBar
            book={book}
            currentChapterIndex={0}
            currentPageIndex={pageNumber - 1}
            totalPagesInChapter={numPages || 1}
            wordsPerPage={250}
            onNavigatePage={(page) => setPageNumber(page + 1)}
            onNavigateChapter={() => {}}
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
        chapterTitle={book.title}
      />

      {/* Interactive Image Lightbox & OCR Modal */}
      {activeImageModal && (
        <ImageModal
          isOpen={Boolean(activeImageModal)}
          src={activeImageModal.src}
          alt={activeImageModal.alt}
          bookId={book.id}
          chapterIndex={pageNumber - 1}
          onClose={() => setActiveImageModal(null)}
        />
      )}
      </ErrorBoundary>
    </div>
  );
}
