const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const returnStart = content.indexOf('return (');
const renderBlock = content.substring(returnStart);

const newLogic = `
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

import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

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
      if (bookData?.fileData) {
        setFileData(bookData.fileData);
        const url = URL.createObjectURL(new Blob([bookData.fileData], { type: 'application/pdf' }));
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
    cMapUrl: \`https://unpkg.com/pdfjs-dist@\${pdfjs.version}/cmaps/\`,
    cMapPacked: true,
    standardFontDataUrl: \`https://unpkg.com/pdfjs-dist@\${pdfjs.version}/standard_fonts/\`,
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
      id: \`hl-\${Date.now()}\`,
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

  const makeCustomTextRenderer = (pageIdx: number) => {
    return (textItem: any) => {
      return textItem.str;
    };
  };

`;

fs.writeFileSync('src/components/NativePdfReader.tsx', newLogic + renderBlock);
