import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Book, ReaderSettings, Highlight } from '../types';
import { db } from '../services/db';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Maximize, Minimize2, Settings, List, X, Square, Columns2, ScrollText } from 'lucide-react';
import { SelectionPopup } from './SelectionPopup';
import { HighlightPopover } from './HighlightPopover';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { ttsService } from '../services/ttsService';
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
}

export const NativePdfReader: React.FC<NativePdfReaderProps> = ({
  book,
  onBackToLibrary,
  settings,
  onUpdateSettings,
  isZenMode,
  onToggleZenMode
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fileData, setFileData] = useState<ArrayBuffer | Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [scale, setScale] = useState<number>(1.0);
  
  // Selection popup states
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionOffsets, setSelectionOffsets] = useState<{startItemIndex: number, startOffset: number, endItemIndex: number, endOffset: number, pageIndex: number} | null>(null);

  // TOC States
  const [pdfOutline, setPdfOutline] = useState<any[] | null>(null);
  const [isTOCOpen, setIsTOCOpen] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<{ highlight: any, position: {x: number, y: number} } | null>(null);

  useEffect(() => {
    if (!fileData) return;
    const blob = fileData instanceof Blob ? fileData : new Blob([fileData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileData]);

  useEffect(() => {
    // If rawFile exists in memory, use it
    if (book.rawFile) {
      setFileData(book.rawFile);
    } else {
      // Fetch from DB if it wasn't passed in memory
      db.books.get(book.id).then((b) => {
        if (b?.rawFile) {
          setFileData(b.rawFile);
        }
      });
    }

    // Set initial page from reading progress
    if (book.readingProgress?.currentPageIndex) {
      setPageNumber(book.readingProgress.currentPageIndex + 1); // 1-indexed for react-pdf
    }
  }, [book.id]);

  useEffect(() => {
    // Resize observer to make the PDF fill the container properly
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const saveProgress = (pageIdx: number, total: number) => {
    if (!total) return;
    const progress = {
      ...book.readingProgress,
      currentPageIndex: pageIdx,
      currentChapterIndex: pageIdx,
      percentage: Math.round(((pageIdx + 1) / total) * 100),
      lastReadTimestamp: Date.now(),
    };
    db.books.update(book.id, { readingProgress: progress }).catch(console.error);
  };

  const onDocumentLoadSuccess = async (pdf: any) => {
    setNumPages(pdf.numPages);
    setPdfInstance(pdf);
    saveProgress(pageNumber - 1, pdf.numPages);
    try {
      const outline = await pdf.getOutline();
      setPdfOutline(outline || []);
    } catch (e) {
      console.warn('Failed to load PDF outline', e);
    }
  };

  const navigateToOutlineItem = async (item: any) => {
    if (!pdfInstance || !item.dest) return;
    try {
      let dest = item.dest;
      if (typeof dest === 'string') {
        dest = await pdfInstance.getDestination(dest);
      }
      if (Array.isArray(dest) && dest.length > 0) {
        const pageIndex = await pdfInstance.getPageIndex(dest[0]);
        const targetPage = pageIndex + 1;
        setPageNumber(targetPage);
        saveProgress(targetPage - 1, numPages);
        setIsTOCOpen(false);
      }
    } catch (e) {
      console.error('Failed to navigate', e);
    }
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const step = settings.layoutMode === 'double' ? 2 : 1;
      const next = Math.min(Math.max(1, prevPageNumber + (offset > 0 ? step : -step)), numPages || 1);
      saveProgress(next - 1, numPages);
      return next;
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      changePage(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changePage(-1);
    } else if (e.key === 'Escape') {
      if (isZenMode) onToggleZenMode();
      setIsTOCOpen(false);
      setIsAIOpen(false);
    } else if (e.key === 'z' || e.key === 'Z') {
      onToggleZenMode();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  useEffect(() => {
    const loadHighlights = async () => {
      const all = await db.highlights.where('bookId').equals(book.id).toArray();
      setHighlights(all);
    };
    loadHighlights();
  }, [book.id]);

  const highlightColors: Record<string, string> = {
    yellow: 'background-color: rgba(251, 191, 36, 0.4); border-bottom: 2px solid rgba(251, 191, 36, 0.9); color: inherit;',
    emerald: 'background-color: rgba(52, 211, 153, 0.4); border-bottom: 2px solid rgba(52, 211, 153, 0.9); color: inherit;',
    sky: 'background-color: rgba(56, 189, 248, 0.4); border-bottom: 2px solid rgba(56, 189, 248, 0.9); color: inherit;',
    rose: 'background-color: rgba(251, 113, 133, 0.4); border-bottom: 2px solid rgba(251, 113, 133, 0.9); color: inherit;',
    amber: 'background-color: rgba(251, 146, 60, 0.4); border-bottom: 2px solid rgba(251, 146, 60, 0.9); color: inherit;',
    violet: 'background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid rgba(192, 132, 252, 0.9); color: inherit;',
  };

  const customTextRenderer = useCallback((textItem: any) => {
    const { str, itemIndex } = textItem;
    // pageIndex isn't directly in textItem, but textItem is bound per page if we wanted.
    // Actually, we can just use the fact that itemIndex is unique per page.
    let result = str;
    
    // highlightColors from component scope
    const highlightColors: Record<Highlight['color'], string> = {
      yellow: 'background-color: rgba(251, 191, 36, 0.4); border-bottom: 2px solid rgba(251, 191, 36, 0.9); color: inherit;',
      emerald: 'background-color: rgba(52, 211, 153, 0.4); border-bottom: 2px solid rgba(52, 211, 153, 0.9); color: inherit;',
      sky: 'background-color: rgba(56, 189, 248, 0.4); border-bottom: 2px solid rgba(56, 189, 248, 0.9); color: inherit;',
      rose: 'background-color: rgba(251, 113, 133, 0.4); border-bottom: 2px solid rgba(251, 113, 133, 0.9); color: inherit;',
      amber: 'background-color: rgba(251, 146, 60, 0.4); border-bottom: 2px solid rgba(251, 146, 60, 0.9); color: inherit;',
      violet: 'background-color: rgba(192, 132, 252, 0.4); border-bottom: 2px solid rgba(192, 132, 252, 0.9); color: inherit;',
    };

    for (const h of highlights) {
      if (h.startItemIndex !== undefined && h.endItemIndex !== undefined) {
        // Assume matching page via the fact we only render current pages, but better if we had pageIndex
        // For simplicity, if itemIndex falls in range. (Note: itemIndex restarts at 0 per page)
        // Wait, if itemIndex restarts at 0 per page, and we show TWO pages on screen (double mode),
        // we need to be careful. But NativePdfReader renders <Page> which scopes customTextRenderer per page.
        // Wait, customTextRenderer doesn't know its pageNumber. We can pass it in via closure?
        // Yes, but react-pdf's customTextRenderer prop is shared. Let's just use itemIndex and hope highlights don't clash across visible pages.
        // Actually, if we just check if str is part of h.selectedText as a secondary guard!
        
        // Let's use the precise itemIndex logic:
        const style = highlightColors[h.color] || highlightColors.yellow;
        if (itemIndex === h.startItemIndex && itemIndex === h.endItemIndex) {
           const before = str.slice(0, h.startOffset);
           const marked = str.slice(h.startOffset, h.endOffset);
           const after = str.slice(h.endOffset);
           result = `${before}<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${marked}${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : ''}</mark>${after}`;
        } else if (itemIndex === h.startItemIndex) {
           const before = str.slice(0, h.startOffset);
           const marked = str.slice(h.startOffset);
           result = `${before}<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${marked}${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : ''}</mark>`;
        } else if (itemIndex === h.endItemIndex) {
           const marked = str.slice(0, h.endOffset);
           const after = str.slice(h.endOffset);
           result = `<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${marked}${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : ''}</mark>${after}`;
        } else if (itemIndex > h.startItemIndex && itemIndex < h.endItemIndex) {
           result = `<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${str}${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : ''}</mark>`;
        }
      } else {
        // Fallback for old highlights without itemIndex
        if (str.includes(h.selectedText)) {
          const style = highlightColors[h.color] || highlightColors.yellow;
          result = result.replace(
            h.selectedText,
            `<mark data-highlight-id="${h.id}" class="pdf-highlight-mark cursor-pointer transition hover:opacity-85" style="${style}">${h.selectedText}${h.note ? `<sup style="margin-left: 2px; padding: 0 4px; font-size: 10px; background: rgba(245,158,11,0.25); color: #d97706; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">💬</sup>` : ''}</mark>`
          );
        }
      }
    }
    
    // Always wrap in a span with data-item-index so we can extract it during selection!
    return `<span data-pdf-item-index="${itemIndex}">${result}</span>`;
  }, [highlights]);

  // Listen for text selection completion (mouseup/touchend) instead of selectionchange 
  // to avoid re-rendering the DOM while the user is actively dragging, which destroys the selection.
  useEffect(() => {
    const handleSelectionEnd = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          const container = document.querySelector('.react-pdf__Document');
          if (container && !container.contains(range.commonAncestorContainer)) {
            return;
          }

          // Extract pdf item indexes from the DOM
          const getPdfIndex = (node) => {
            const span = node.nodeType === 3 ? node.parentElement.closest('[data-pdf-item-index]') : node.closest('[data-pdf-item-index]');
            if (span) {
              return parseInt(span.getAttribute('data-pdf-item-index') || '-1', 10);
            }
            return -1;
          };

          const startItemIndex = getPdfIndex(range.startContainer);
          const endItemIndex = getPdfIndex(range.endContainer);
          
          if (startItemIndex !== -1 && endItemIndex !== -1) {
            setSelectionOffsets({
              startItemIndex: Math.min(startItemIndex, endItemIndex),
              startOffset: startItemIndex <= endItemIndex ? range.startOffset : range.endOffset,
              endItemIndex: Math.max(startItemIndex, endItemIndex),
              endOffset: startItemIndex <= endItemIndex ? range.endOffset : range.startOffset,
              pageIndex: pageNumber
            });
          } else {
            setSelectionOffsets(null);
          }

          setSelectedText(selection.toString().trim());
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      }, 50);
    };
    
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('keyup', (e) => {
      if (e.shiftKey && e.key.includes('Arrow')) {
        handleSelectionEnd();
      }
    });

    return () => {
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
    };
  }, []);



  // Listen for clicks on PDF highlight marks
  useEffect(() => {
    const handleMarkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark.pdf-highlight-mark');
      if (mark) {
        const id = mark.getAttribute('data-highlight-id');
        const h = highlights.find(x => x.id === id);
        if (h) {
          const rect = mark.getBoundingClientRect();
          setActiveHighlightPopover({
            highlight: h,
            position: { x: rect.left + rect.width / 2, y: rect.top - 10 }
          });
        }
      }
    };
    document.addEventListener('click', handleMarkClick);
    return () => document.removeEventListener('click', handleMarkClick);
  }, [highlights]);

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.fixed.z-50') && !target.closest('mark.pdf-highlight-mark')) {
        setActiveHighlightPopover(null);
        // Wait for browser to process the click/tap and potentially clear selection
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.toString().trim().length === 0) {
            setSelectionPosition(null);
          }
        }, 100);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Compute theme styles mapping based on Lumina's themes
  const themeStyle = useMemo(() => {
    switch (settings.theme) {
      case 'paper': return { border: 'border-stone-200', bg: 'bg-stone-100', text: 'text-stone-900', container: 'bg-white' };
      case 'sepia': return { border: 'border-[#e6dcc5]', bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', container: 'bg-[#fcf7ed]' };
      case 'dusk': return { border: 'border-slate-700', bg: 'bg-slate-800', text: 'text-slate-300', container: 'bg-slate-700' };
      case 'amoled': return { border: 'border-zinc-900', bg: 'bg-black', text: 'text-stone-400', container: 'bg-zinc-950' };
      case 'eink': return { border: 'border-gray-300', bg: 'bg-gray-200', text: 'text-black', container: 'bg-white' };
      case 'sage': return { border: 'border-[#c9dfd2]', bg: 'bg-[#e2efe6]', text: 'text-[#2c4c3b]', container: 'bg-[#f0f7f2]' };
      case 'nordic': return { border: 'border-[#d8dee9]', bg: 'bg-[#e5e9f0]', text: 'text-[#2e3440]', container: 'bg-white' };
      default: return { border: 'border-gray-200', bg: 'bg-white', text: 'text-black', container: 'bg-white' };
    }
  }, [settings.theme]);

  // Max width of the PDF canvas based on user setting
  const clampedContainer = Math.max(containerWidth, 300);
  const pdfMaxWidth = Math.max(200, Math.min(clampedContainer - (settings.marginWidth * 2), settings.layoutMode === 'double' ? 1200 : 800));

  const toggleLayoutMode = () => {
    const modes: ('single' | 'double' | 'scroll')[] = ['single', 'double', 'scroll'];
    const currentIdx = modes.indexOf(settings.layoutMode as any);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    onUpdateSettings({ layoutMode: nextMode });
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
      startItemIndex: selectionOffsets?.startItemIndex,
      startOffset: selectionOffsets?.startOffset,
      endItemIndex: selectionOffsets?.endItemIndex,
      endOffset: selectionOffsets?.endOffset,
      pdfPageIndex: selectionOffsets?.pageIndex,
      color: color as any,
      note,
      createdAt: Date.now(),
    });
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
    const all = await db.highlights.where('bookId').equals(book.id).toArray();
    setHighlights(all);
  };

  return (
    <div className={`w-full flex flex-col transition-colors duration-200 relative overflow-hidden ${themeStyle.bg} ${themeStyle.text} ${isZenMode ? 'h-screen' : 'h-[calc(100vh-2.75rem)]'}`}>
      
      {/* Zen Mode / Full Screen Exit Overlay */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 transition-opacity duration-300 opacity-30 hover:opacity-100">
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
      {!isZenMode && (
        <nav
          className={`h-12 border-b ${themeStyle.border} px-4 flex items-center justify-between z-30 shrink-0 select-none backdrop-blur-xs`}
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
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick layout toggle specifically for PDF reader */}
            <button
              onClick={toggleLayoutMode}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer mr-2 flex items-center gap-1 border ${themeStyle.border} ${themeStyle.text}`}
              title={`Layout: ${settings.layoutMode} (Click to toggle)`}
            >
              {settings.layoutMode === 'double' ? <Columns2 className="w-4 h-4" /> : 
               settings.layoutMode === 'scroll' ? <ScrollText className="w-4 h-4" /> : 
               <Square className="w-4 h-4" />}
              <span className="text-[10px] uppercase font-bold hidden md:inline opacity-80">{settings.layoutMode}</span>
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
      )}

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
        className={`flex-1 overflow-y-auto overflow-x-hidden w-full flex justify-center pt-8 pb-24 items-start`}
      >
        {!pdfUrl ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <p>Loading High-Fidelity PDF Engine...</p>
          </div>
        ) : (
          <div 
            className={`shadow-2xl transition-all duration-300 ${themeStyle.container} ${settings.layoutMode !== 'scroll' ? 'rounded-lg overflow-hidden' : ''}`}
            style={{ 
              maxWidth: pdfMaxWidth * scale,
              width: '100%' 
            }}
          >
            <Document suspense={false}
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
                    <div key={`page_${index + 1}`} className="shadow-xl bg-white max-w-full overflow-hidden">
                      <Page suspense={false} customTextRenderer={customTextRenderer}
                        pageNumber={index + 1}
                        width={pdfMaxWidth * scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                  ))}
                </div>
              ) : settings.layoutMode === 'double' ? (
                // Double Page Rendering
                <div className="flex w-full justify-center gap-1 md:gap-4 p-4 max-w-full overflow-hidden">
                  <div className="shadow-xl bg-white overflow-hidden flex-shrink-0" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                    <Page suspense={false} customTextRenderer={customTextRenderer}
                      pageNumber={pageNumber}
                      width={(pdfMaxWidth * scale) / 2}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                  {pageNumber + 1 <= numPages && (
                    <div className="shadow-xl bg-white overflow-hidden flex-shrink-0" style={{ width: (pdfMaxWidth * scale) / 2 }}>
                      <Page suspense={false} customTextRenderer={customTextRenderer}
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
                <div className="max-w-full overflow-hidden flex justify-center">
                  <Page suspense={false} customTextRenderer={customTextRenderer}
                    pageNumber={pageNumber}
                    width={pdfMaxWidth * scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              )}
            </Document>
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

      {/* TOC Drawer Overlay */}
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
    </div>
  );
}
