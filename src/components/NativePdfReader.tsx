import { ErrorBoundary } from './ErrorBoundary';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Book, ReaderSettings, Highlight } from '../types';
import { db } from '../services/db';
import { habitTracker } from '../services/habitTracker';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize2, Settings, List, X, Square, Columns2, ScrollText, Moon, Sun, Palette, Eye, CloudRain, Flame, Volume2, Zap, Sliders, BookOpen, Highlighter, Sparkles, Loader2, Layers, Search, Copy, Check, RotateCcw } from 'lucide-react';
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
  const initialPage = useMemo(() => {
    if (book.readingProgress?.currentPageIndex && book.readingProgress.currentPageIndex > 0) {
      return book.readingProgress.currentPageIndex;
    }
    if (book.readingProgress?.currentChapterIndex !== undefined && book.readingProgress.currentChapterIndex >= 0) {
      return book.readingProgress.currentChapterIndex + 1;
    }
    return 1;
  }, [book.readingProgress]);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [fileData, setFileData] = useState<ArrayBuffer | Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [zenNavVisible, setZenNavVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 800);
  const [scale, setScale] = useState<number>(1.0);
  const [pinchTransform, setPinchTransform] = useState<{ scale: number; originX: number; originY: number } | null>(null);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1.0);
  const pinchMidpoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync settings.fontSize to PDF scale (16px = 1.0x, scaling dynamically)
  const prevFontSizeRef = useRef(settings.fontSize);
  useEffect(() => {
    if (settings.fontSize && settings.fontSize !== prevFontSizeRef.current) {
      prevFontSizeRef.current = settings.fontSize;
      const targetScale = Math.min(3.5, Math.max(0.5, settings.fontSize / 16));
      setScale(parseFloat(targetScale.toFixed(2)));
    }
  }, [settings.fontSize]);

  // Persist reading progress to IndexedDB
  const saveReadingProgress = useCallback(async (targetPage: number, total: number) => {
    if (!book.id || total <= 0) return;
    const percentage = Math.round((targetPage / Math.max(1, total)) * 100);
    const updatedProgress = {
      currentChapterIndex: targetPage - 1,
      currentPageIndex: targetPage,
      percentage: Math.min(100, Math.max(1, percentage)),
      lastReadTimestamp: Date.now(),
    };
    try {
      await db.books.update(book.id, { readingProgress: updatedProgress });
      habitTracker.recordActivity(120);
    } catch (err) {
      console.warn('Failed to persist PDF reading progress:', err);
    }
  }, [book.id]);

  useEffect(() => {
    if (numPages > 0) {
      saveReadingProgress(pageNumber, numPages);
    }
  }, [pageNumber, numPages, saveReadingProgress]);

  const handleReturnToLibrary = async () => {
    if (numPages > 0) {
      await saveReadingProgress(pageNumber, numPages);
    }
    onBackToLibrary();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // 2-Finger Pinch Initiation
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchStartDist.current = dist;
      pinchStartScale.current = scale;
      pinchMidpoint.current = { x: midX, y: midY };
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

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

    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null && pinchStartDist.current > 0) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / pinchStartDist.current;
      // Ultra-smooth GPU accelerated transform without canvas re-rendering during pinch gesture!
      setPinchTransform({
        scale: factor,
        originX: pinchMidpoint.current.x,
        originY: pinchMidpoint.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Finish pinch gesture & commit final scale
    if (pinchStartDist.current !== null && e.touches.length < 2) {
      if (pinchTransform) {
        const rawScale = pinchStartScale.current * pinchTransform.scale;
        const targetScale = Math.min(3.5, Math.max(0.65, parseFloat(rawScale.toFixed(2))));
        setScale(targetScale);
        setPinchTransform(null);
      }
      pinchStartDist.current = null;
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const touchEndY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    const moveDist = Math.hypot(deltaX, deltaY);
    const touchDuration = Date.now() - touchStartTime.current;

    // Double-tap detection for quick zoom in / zoom reset
    if (moveDist < 15 && touchDuration < 320) {
      const now = Date.now();
      const timeDiff = now - lastTapTimeRef.current;
      const tapDist = Math.hypot(touchEndX - lastTapPosRef.current.x, touchEndY - lastTapPosRef.current.y);
      
      if (timeDiff < 350 && tapDist < 35) {
        // Double-tap triggered! Toggle between 2.0x and 1.0x
        if (scale <= 1.25) {
          setScale(2.0);
        } else {
          setScale(1.0);
        }
        lastTapTimeRef.current = 0;
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      lastTapTimeRef.current = now;
      lastTapPosRef.current = { x: touchEndX, y: touchEndY };
    }

    // When zoomed in, 1-finger swipes should pan horizontally/vertically without turning page!
    if (scale > 1.15) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    // If text is actively selected or user was selecting text, do not navigate pages
    const currentSelection = window.getSelection();
    if (currentSelection && currentSelection.toString().trim().length > 0) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    // Only register as swipe if horizontal distance is greater than vertical (allows scrolling)
    // and distance is significant (at least 48px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 48) {
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

  // Persistent per-page OCR cache
  const [ocrByPage, setOcrByPage] = useState<Record<number, string>>(() => {
    try {
      const cached = localStorage.getItem(`lumina_ocr_${book.id}`);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [ocrOverlayMode, setOcrOverlayMode] = useState<'transparent' | 'visible' | 'off'>('transparent');
  const [isOcrDrawerOpen, setIsOcrDrawerOpen] = useState(false);
  const [ocrSearchQuery, setOcrSearchQuery] = useState('');
  const [ocrCopied, setOcrCopied] = useState(false);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number>(pageNumber);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`lumina_ocr_${book.id}`);
      if (cached) {
        setOcrByPage(JSON.parse(cached));
      } else {
        setOcrByPage({});
      }
    } catch {
      setOcrByPage({});
    }
  }, [book.id]);

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
        // If OCR text was previously extracted for this page, use it directly!
        if (ocrByPage[p] && ocrByPage[p].trim().length > 0) {
          combinedText += ocrByPage[p].trim() + '\n\n\n';
          continue;
        }

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
      if (ocrByPage[pageNumber]) {
        setExtractedText(ocrByPage[pageNumber]);
      } else {
        setExtractedText("Failed to extract text from this page. This PDF might be an image without an OCR layer or the document was unmounted.");
      }
    } finally {
      setIsExtracting(false);
    }
  }, [pdfDoc, pageNumber, settings.layoutMode, numPages, ocrByPage]);

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
  const [isEditingNote, setIsEditingNote] = useState(false);
  const isEditingNoteRef = useRef(false);

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

  // High-fidelity offscreen OCR extraction directly from pdfDoc
  const handleOcrCurrentPage = async (targetPageNum = pageNumber) => {
    if (!pdfDoc) return;
    setIsOcrExtracting(true);
    try {
      const page = await pdfDoc.getPage(targetPageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not initialize offscreen canvas context");

      await page.render({ canvasContext: ctx, viewport }).promise;
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);

      const res = await aiService.extractTextFromImage(
        imageBase64,
        "Transcribe all readable text from this scanned book page accurately into clean paragraphs and sentences. Maintain original reading flow, headings, and paragraph breaks. Do not include markdown code fences or conversational filler—output only the transcribed text."
      );

      if (res.text && res.text.trim().length > 0) {
        const text = res.text.trim();
        setOcrByPage(prev => {
          const next = { ...prev, [targetPageNum]: text };
          try {
            localStorage.setItem(`lumina_ocr_${book.id}`, JSON.stringify(next));
          } catch (e) {
            console.warn('Failed to save OCR to localStorage:', e);
          }
          return next;
        });
        setExtractedText(text);
        setIsOcrDrawerOpen(true);
      } else {
        alert("No readable text could be recognized on this page.");
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      alert(`OCR Extraction Failed: ${err.message || 'Unable to extract text from page image'}`);
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
      try {
        const bookData = await db.books.get(book.id);
        const raw: any = bookData?.rawFile || book.rawFile;
        if (raw) {
          let buffer: ArrayBuffer | null = null;
          if (raw instanceof Blob) {
            buffer = await raw.arrayBuffer();
          } else if (raw instanceof Uint8Array) {
            buffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
          } else if (raw instanceof ArrayBuffer) {
            buffer = raw;
          } else if (typeof raw === 'string') {
            const res = await fetch(`data:application/octet-stream;base64,${raw.replace(/\s/g, '')}`);
            buffer = await res.arrayBuffer();
          }

          if (buffer && buffer.byteLength > 0) {
            setFileData(buffer);
            const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
            setPdfUrl(url);
          }
        }
      } catch (err) {
        console.error('Failed to load PDF document data:', err);
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
    const targetP = initialPage > 1 && initialPage <= pdf.numPages ? initialPage : 1;
    if (targetP !== 1) {
      setPageNumber(targetP);
      if (settings.layoutMode === 'scroll') {
        setTimeout(() => {
          const el = pageRefs.current[targetP];
          if (el && containerRef.current) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    }
    saveReadingProgress(targetP, pdf.numPages);
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
      if (numPages > 0) {
        saveReadingProgress(newPage, numPages);
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

  // Helper to render paragraph with embedded highlight marks and optional Bionic reading
  const renderHighlightedParagraph = (text: string, matchedHls: Highlight[], isBionic = false) => {
    if (!matchedHls || matchedHls.length === 0) {
      return isBionic ? formatBionicText(text) : text;
    }
    
    const sorted = [...matchedHls].sort((a, b) => {
      const idxA = text.indexOf(a.selectedText);
      const idxB = text.indexOf(b.selectedText);
      return (idxA === -1 ? 999999 : idxA) - (idxB === -1 ? 999999 : idxB);
    });

    const parts: React.ReactNode[] = [];
    let curIdx = 0;

    sorted.forEach((hl, i) => {
      const start = text.indexOf(hl.selectedText, curIdx);
      if (start === -1) return;

      if (start > curIdx) {
        const unhighlighted = text.slice(curIdx, start);
        parts.push(
          <React.Fragment key={`text-${i}-${curIdx}`}>
            {isBionic ? formatBionicText(unhighlighted) : unhighlighted}
          </React.Fragment>
        );
      }

      parts.push(
        <mark
          key={`hl-${hl.id}-${i}`}
          id={`hl-${hl.id}`}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveHighlightPopover({
              highlight: hl,
              position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
            });
          }}
          className={`cursor-pointer rounded-xs px-0.5 transition hover:opacity-80 inline select-text ${
            highlightColors[hl.color] || highlightColors.yellow
          }`}
          title={hl.note ? `[Note]: ${hl.note}` : 'Click to edit highlight'}
        >
          {isBionic ? formatBionicText(hl.selectedText) : hl.selectedText}
          {hl.note && (
            <sup className="ml-0.5 px-1 rounded text-[9px] font-sans font-medium select-none bg-amber-500/20 text-amber-500 border border-amber-500/40">
              note
            </sup>
          )}
        </mark>
      );

      curIdx = start + hl.selectedText.length;
    });

    if (curIdx < text.length) {
      const unhighlighted = text.slice(curIdx);
      parts.push(
        <React.Fragment key={`text-end-${curIdx}`}>
          {isBionic ? formatBionicText(unhighlighted) : unhighlighted}
        </React.Fragment>
      );
    }

    return parts;
  };

  // OCR selectable text overlay rendered directly over the native PDF canvas
  const renderOcrTextLayer = (pNum: number) => {
    const ocrText = ocrByPage[pNum];
    if (!ocrText || ocrOverlayMode === 'off') return null;

    const pageHighlights = highlights.filter(h => h.chapterIndex === pNum - 1);

    return (
      <div 
        key={`ocr-layer-${pNum}`}
        data-ocr-layer={`page-${pNum}`}
        className={`absolute inset-0 z-20 pointer-events-auto select-text font-serif leading-relaxed transition-all duration-200 ${
          ocrOverlayMode === 'transparent'
            ? 'bg-transparent cursor-text overflow-hidden'
            : 'bg-amber-50/96 dark:bg-slate-900/96 text-slate-900 dark:text-slate-100 p-6 sm:p-8 cursor-text backdrop-blur-md shadow-inner overflow-y-auto'
        }`}
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
        title={ocrOverlayMode === 'transparent' ? "Selectable OCR Layer: Click or drag over text to select, highlight, or copy" : "Visible Transcribed OCR Layer"}
      >
        {/* Floating Quick Action Pill for OCR page */}
        <div 
          className="sticky top-2 right-2 ml-auto z-30 mb-2 w-fit flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 hover:bg-slate-950 text-slate-200 text-[11px] font-sans shadow-lg border border-slate-700/80 backdrop-blur-md select-none pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400">OCR Ready</span>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOcrOverlayMode(m => m === 'visible' ? 'transparent' : 'visible');
            }}
            className="hover:text-amber-300 font-medium transition cursor-pointer text-slate-300"
          >
            {ocrOverlayMode === 'visible' ? 'Show PDF Scan' : 'Transcribed View'}
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOcrDrawerOpen(true);
            }}
            className="hover:text-amber-300 transition cursor-pointer text-slate-400 hover:text-slate-200"
            title="Open OCR Drawer with full tools"
          >
            Tools
          </button>
        </div>

        <div className="w-full flex flex-col justify-start select-text">
          {ocrText.split('\n\n').map((paragraph, pIdx) => {
            const matched = pageHighlights.filter(h => h.selectedText && paragraph.includes(h.selectedText));
            return (
              <p 
                key={pIdx} 
                className={`mb-4 whitespace-pre-wrap select-text selection:bg-amber-400 selection:text-slate-950 ${
                  ocrOverlayMode === 'transparent' 
                    ? 'text-transparent hover:text-slate-900/10 dark:hover:text-white/10' 
                    : 'text-slate-900 dark:text-slate-100 text-sm sm:text-base'
                }`}
                style={{
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                }}
              >
                {renderHighlightedParagraph(paragraph, matched, false)}
              </p>
            );
          })}
        </div>
      </div>
    );
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

  const handleCreateHighlight = async (color: string, note?: string, customText?: string) => {
    const textToSave = (customText || selectedText || '').trim();
    if (!textToSave) return;
    
    const targetPage = selectedPageNumber || pageNumber;
    await db.highlights.put({
      id: `hl-${Date.now()}`,
      bookId: book.id,
      chapterIndex: targetPage - 1,
      selectedText: textToSave,
      rects: selectionRects.length > 0 ? selectionRects : undefined,
      color: color as any,
      note,
      createdAt: Date.now(),
    });
    setSelectionPosition(null);
    setSelectedText('');
    setIsEditingNote(false);
    isEditingNoteRef.current = false;
    window.getSelection()?.removeAllRanges();
    const all = await db.highlights.where('bookId').equals(book.id).toArray();
    setHighlights(all);
  };

  // Selection detection
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const checkSelection = () => {
      if (isEditingNoteRef.current) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT' || activeEl.closest?.('[data-selection-popup], [data-highlight-popover], [role="dialog"]'))) {
        return;
      }

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

            const startNode = range.startContainer;
            const element = startNode.nodeType === Node.ELEMENT_NODE 
              ? (startNode as HTMLElement) 
              : startNode.parentElement;
            
            if (element?.closest('nav, button, input, select, textarea, [role="dialog"], [data-no-swipe="true"], [data-selection-popup]')) {
              if (!isEditingNoteRef.current) {
                setSelectionPosition(null);
              }
              return;
            }
            
            let normalizedRects: { left: number; top: number; width: number; height: number }[] = [];
            const anchorParent = (selection.anchorNode as Node)?.parentElement;
            const focusParent = (selection.focusNode as Node)?.parentElement;
            const pageContainer = anchorParent?.closest('.react-pdf__Page') || 
                                  focusParent?.closest('.react-pdf__Page') || 
                                  (range.commonAncestorContainer as HTMLElement)?.closest?.('.react-pdf__Page') ||
                                  anchorParent?.closest('[data-page-number]') ||
                                  focusParent?.closest('[data-page-number]') ||
                                  (range.commonAncestorContainer as HTMLElement)?.closest?.('[data-page-number]');
            
            if (pageContainer) {
               const pAttr = pageContainer.getAttribute('data-page-number');
               if (pAttr) {
                 const parsedP = parseInt(pAttr, 10);
                 if (!isNaN(parsedP)) setSelectedPageNumber(parsedP);
               } else {
                 setSelectedPageNumber(pageNumber);
               }
               const pageRect = pageContainer.getBoundingClientRect();
               const rects = Array.from(range.getClientRects());
               normalizedRects = rects.map(r => ({
                 left: Math.max(0, Math.min(100, ((r.left - pageRect.left) / pageRect.width) * 100)),
                 top: Math.max(0, Math.min(100, ((r.top - pageRect.top) / pageRect.height) * 100)),
                 width: Math.max(0.5, Math.min(100, (r.width / pageRect.width) * 100)),
                 height: Math.max(0.5, Math.min(100, (r.height / pageRect.height) * 100)),
               }));
            } else {
               setSelectedPageNumber(pageNumber);
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
        if (!isEditingNoteRef.current) {
          setSelectionPosition(null);
          setSelectionRects([]);
        }
      }
    };

    const handleSelectionEnd = () => {
      if (isEditingNoteRef.current) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkSelection, 30);
    };

    const handleSelectionChange = () => {
      if (isEditingNoteRef.current) return;
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
  }, [pageNumber]);

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.('[data-selection-popup], [data-highlight-popover], .fixed.z-50, [role="dialog"], [data-ocr-drawer]')) {
        return;
      }
      if (isEditingNoteRef.current) {
        return;
      }
      if (!target.closest('.pointer-events-auto.mix-blend-multiply') && !target.closest('mark')) {
        setActiveHighlightPopover(null);
      }
      setTimeout(() => {
        if (isEditingNoteRef.current) return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) {
          setSelectionPosition(null);
        }
      }, 120);
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
        [data-ocr-layer] {
          user-select: text !important;
          -webkit-user-select: text !important;
          pointer-events: auto !important;
        }
        [data-ocr-layer] p::selection, [data-ocr-layer] span::selection, [data-ocr-layer] *::selection {
          background: rgba(245, 158, 11, 0.75) !important;
          color: #020617 !important;
          text-shadow: none !important;
        }
        [data-ocr-layer] p::-moz-selection, [data-ocr-layer] span::-moz-selection, [data-ocr-layer] *::-moz-selection {
          background: rgba(245, 158, 11, 0.75) !important;
          color: #020617 !important;
          text-shadow: none !important;
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
              onClick={handleReturnToLibrary}
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

            {ocrByPage[pageNumber] ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOcrDrawerOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer border ${
                    isOcrDrawerOpen 
                      ? 'bg-amber-500/25 text-amber-600 dark:text-amber-400 border-amber-500/40 ring-1 ring-amber-500/30' 
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                  title="View and interact with page OCR text transcription"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline font-semibold">OCR Text</span>
                </button>
                <button
                  onClick={() => setOcrOverlayMode(m => m === 'transparent' ? 'visible' : m === 'visible' ? 'off' : 'transparent')}
                  className={`px-2 py-1 rounded-md border text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                    ocrOverlayMode !== 'off'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : `hover:bg-black/5 dark:hover:bg-white/10 ${themeStyle.border} ${themeStyle.text}`
                  }`}
                  title={`OCR Selectable Overlay Mode: ${ocrOverlayMode}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[11px] capitalize">{ocrOverlayMode}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOcrCurrentPage(pageNumber)}
                disabled={isOcrExtracting}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                title="Extract Text from Scanned Page / Image with AI OCR"
              >
                {isOcrExtracting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="hidden sm:inline">{isOcrExtracting ? 'Transcribing...' : 'AI OCR'}</span>
              </button>
            )}
            
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto overflow-x-auto w-full flex justify-center pt-8 pb-24 items-start"
        onScroll={(e) => {
          if (!isEditingNoteRef.current) {
            if (activeHighlightPopover) setActiveHighlightPopover(null);
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
              if (selectionPosition) setSelectionPosition(null);
            }
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
                  {extractedText.split('\n\n').map((paragraph, idx) => {
                    const pageHighlights = highlights.filter(h => h.chapterIndex === pageNumber - 1);
                    const matched = pageHighlights.filter(h => h.selectedText && paragraph.includes(h.selectedText));
                    return (
                      <p key={idx} className="mb-6 whitespace-pre-wrap select-text selection:bg-amber-400/40">
                        {renderHighlightedParagraph(paragraph, matched, settings.bionicReading)}
                      </p>
                    );
                  })}
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
                       onClick={() => handleOcrCurrentPage(pageNumber)} 
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
                width: '100%',
                transform: pinchTransform ? `scale(${pinchTransform.scale})` : undefined,
                transformOrigin: pinchTransform ? `${pinchTransform.originX}px ${pinchTransform.originY}px` : 'center center',
                transition: pinchTransform ? 'none' : 'transform 0.15s ease-out',
                willChange: pinchTransform ? 'transform' : 'auto',
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
                              {renderOcrTextLayer(pNum)}
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
                    <div data-page-number={pageNumber} className="shadow-xl flex-shrink-0 bg-white relative" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                      <Page suspense={false}
                        pageNumber={pageNumber}
                        width={(pdfMaxWidth * scale) / 2}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                        error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page</div>}
                      />
                      {renderHighlights(pageNumber)}
                      {renderOcrTextLayer(pageNumber)}
                    </div>
                    {pageNumber + 1 <= numPages && (
                      <div data-page-number={pageNumber + 1} className="shadow-xl flex-shrink-0 bg-white relative" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                        <Page suspense={false}
                          pageNumber={pageNumber + 1}
                          width={(pdfMaxWidth * scale) / 2}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                          error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page</div>}
                        />
                        {renderHighlights(pageNumber + 1)}
                        {renderOcrTextLayer(pageNumber + 1)}
                      </div>
                    )}
                  </div>
                ) : (
                  // Single Page Rendering
                  <div data-page-number={pageNumber} className="flex justify-center shadow-xl bg-white relative">
                    <Page suspense={false}
                      pageNumber={pageNumber}
                      width={pdfMaxWidth * scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      loading={<div className="h-96 flex items-center justify-center text-slate-400">Loading page...</div>}
                      error={<div className="h-96 flex items-center justify-center text-red-500">Error rendering page</div>}
                    />
                    {renderHighlights(pageNumber)}
                    {renderOcrTextLayer(pageNumber)}
                  </div>
                )}
              </Document>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Floating Zoom Control Pill with Quick Presets & Continuous Slider */}
      <div className="fixed bottom-14 sm:bottom-16 right-3 sm:right-5 z-30 flex flex-col items-end gap-2 select-none" data-no-swipe="true">
        {isZoomMenuOpen && (
          <div className="p-3 bg-slate-900/95 text-slate-100 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 text-xs w-64 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-300 font-sans">Zoom & Fit</span>
              <span className="font-mono text-amber-400 font-bold">{Math.round(scale * 100)}%</span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Fit', val: 1.0 },
                { label: '125%', val: 1.25 },
                { label: '150%', val: 1.5 },
                { label: '200%', val: 2.0 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => { setScale(preset.val); setIsZoomMenuOpen(false); }}
                  className={`py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    Math.abs(scale - preset.val) < 0.05
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Continuous Smooth Slider */}
            <div>
              <input
                type="range"
                min="0.65"
                max="3.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>65%</span>
                <span className="font-sans text-slate-400/80">Double-tap page for 2x</span>
                <span>300%</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 p-1 bg-slate-900/90 text-slate-200 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setScale(s => Math.max(0.65, parseFloat((s - 0.2).toFixed(2))))}
            className="p-1.5 hover:bg-slate-800 active:scale-90 rounded-xl transition cursor-pointer text-slate-400 hover:text-white"
            title="Zoom Out (-20%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsZoomMenuOpen(prev => !prev)}
            onDoubleClick={() => setScale(s => s > 1.25 ? 1.0 : 2.0)}
            className="px-2.5 py-1 hover:bg-slate-800 active:scale-95 rounded-xl transition cursor-pointer font-mono text-[11px] text-amber-400 font-bold flex items-center gap-1"
            title="Click for Zoom Presets & Slider, Double-click to toggle 100%/200%"
          >
            <span>{Math.round(scale * 100)}%</span>
            <Sliders className="w-3 h-3 opacity-60" />
          </button>
          <button
            type="button"
            onClick={() => setScale(s => Math.min(3.5, parseFloat((s + 0.2).toFixed(2))))}
            className="p-1.5 hover:bg-slate-800 active:scale-90 rounded-xl transition cursor-pointer text-slate-400 hover:text-white"
            title="Zoom In (+20%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1.0)}
            className="p-1.5 hover:bg-slate-800 active:scale-90 rounded-xl transition cursor-pointer text-slate-400 hover:text-white border-l border-slate-800 ml-0.5"
            title="Reset to Fit Width (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>


      <SelectionPopup
        position={selectionPosition}
        selectedText={selectedText}
        onHighlight={handleCreateHighlight}
        onActiveNoteChange={(active) => {
          setIsEditingNote(active);
          isEditingNoteRef.current = active;
        }}
        onReadAloud={() => {
          ttsService.speakText(selectedText, { rate: 1.0 });
          setSelectionPosition(null);
        }}
        onAskAI={() => {
          setIsAIOpen(true);
          setSelectionPosition(null);
        }}
        onClose={() => {
          setSelectionPosition(null);
          setIsEditingNote(false);
          isEditingNoteRef.current = false;
        }}
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

      {/* Interactive OCR Drawer */}
      {isOcrDrawerOpen && (
        <div
          data-ocr-drawer="true"
          className={`fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] flex flex-col rounded-t-2xl shadow-2xl border-t backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-5 ${themeStyle.bg} ${themeStyle.border} ${themeStyle.text}`}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-current/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">
                    OCR Transcription — Page {pageNumber}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    Gemini 3.8 Vision
                  </span>
                </div>
                <p className="text-[11px] opacity-60">
                  Select any word or sentence below to Highlight, attach Notes, or Listen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Overlay Mode Toggle */}
              <button
                onClick={() => setOcrOverlayMode(m => m === 'transparent' ? 'visible' : m === 'visible' ? 'off' : 'transparent')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                title="Toggle OCR Overlay on the PDF canvas (Transparent / Visible / Off)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overlay: <strong className="capitalize">{ocrOverlayMode}</strong></span>
              </button>

              {/* Copy Full OCR Text */}
              {ocrByPage[pageNumber] && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ocrByPage[pageNumber]);
                    setOcrCopied(true);
                    setTimeout(() => setOcrCopied(false), 1500);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-current/15 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Copy full page OCR text to clipboard"
                >
                  {ocrCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{ocrCopied ? 'Copied' : 'Copy All'}</span>
                </button>
              )}

              {/* Listen to page text */}
              {ocrByPage[pageNumber] && (
                <button
                  onClick={() => ttsService.speakText(ocrByPage[pageNumber], { rate: 1.0 })}
                  className="p-1.5 rounded-lg border border-current/15 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Read page aloud with offline speech"
                >
                  <Volume2 className="w-4 h-4 text-amber-500" />
                </button>
              )}

              {/* Re-run OCR */}
              <button
                onClick={() => handleOcrCurrentPage(pageNumber)}
                disabled={isOcrExtracting}
                className="p-1.5 rounded-lg border border-current/15 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
                title="Re-run OCR for this page"
              >
                {isOcrExtracting ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4" />}
              </button>

              {/* Close Drawer */}
              <button
                onClick={() => setIsOcrDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar inside drawer */}
          <div className="px-5 py-2 border-b border-current/10 flex items-center gap-2 bg-black/2 dark:bg-white/2">
            <Search className="w-3.5 h-3.5 opacity-50" />
            <input
              type="text"
              value={ocrSearchQuery}
              onChange={(e) => setOcrSearchQuery(e.target.value)}
              placeholder="Search words in transcribed text..."
              className="bg-transparent border-none outline-none text-xs w-full placeholder:opacity-50"
            />
            {ocrSearchQuery && (
              <button onClick={() => setOcrSearchQuery('')} className="opacity-50 hover:opacity-100 text-xs">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 select-text leading-relaxed font-serif text-sm">
            {isOcrExtracting ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm font-medium">Transcribing scanned page with AI Vision...</p>
                <p className="text-xs opacity-60">High-definition 2.0x offscreen rendering in progress</p>
              </div>
            ) : ocrByPage[pageNumber] ? (
              <div className="space-y-4 max-w-3xl mx-auto select-text">
                {ocrByPage[pageNumber].split('\n\n').map((para, pIdx) => {
                  const pageHighlights = highlights.filter(h => h.chapterIndex === pageNumber - 1);
                  const matched = pageHighlights.filter(h => h.selectedText && para.includes(h.selectedText));

                  return (
                    <p key={pIdx} className="whitespace-pre-wrap select-text selection:bg-amber-400/40 selection:text-current">
                      {renderHighlightedParagraph(para, matched, false)}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center max-w-md mx-auto space-y-3">
                <Eye className="w-8 h-8 mx-auto text-amber-500/80" />
                <h4 className="font-semibold text-sm">No OCR transcription for Page {pageNumber} yet</h4>
                <p className="text-xs opacity-70">
                  Transcribe this page using Gemini 3.8 Multimodal Vision to unlock text selection, highlighting, annotations, dictionary lookup, and read aloud.
                </p>
                <button
                  onClick={() => handleOcrCurrentPage(pageNumber)}
                  disabled={isOcrExtracting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI OCR for Page {pageNumber}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </ErrorBoundary>
    </div>
  );
}
