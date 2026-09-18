import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark as BookmarkIcon,
  Highlighter,
  Sliders,
  List,
  Sparkles,
  Volume2,
  Search,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Flame,
  CloudRain,
  Play,
  Pause,
  Eye,
} from 'lucide-react';
import type { Book, ReaderSettings, Highlight, Bookmark, ReadingTheme, AccentColor } from '../types';
import { db } from '../services/db';
import { ttsService } from '../services/ttsService';
import { estimateReadingTimeMinutes } from '../services/bookParser';
import { habitTracker } from '../services/habitTracker';
import { TypographyToolbar } from './TypographyToolbar';
import { TOCDrawer, AnnotationsDrawer } from './ReaderDrawers';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { SelectionPopup } from './SelectionPopup';
import { HighlightPopover } from './HighlightPopover';
import { ReadingProgressBar } from './ReadingProgressBar';
import { TTSAudioBar } from './TTSAudioBar';
import { RSVPModal } from './RSVPModal';
import { SoundscapeModal } from './SoundscapeModal';
import { ReadingHabitsDashboard } from './ReadingHabitsDashboard';
import { NativePdfReader } from './NativePdfReader';

interface ReaderViewProps {
  book: Book;
  onBackToLibrary: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  targetHighlightId?: string | null;
  onClearTargetHighlight?: () => void;
}

const THEME_STYLES: Record<
  ReadingTheme,
  { bg: string; text: string; subtext: string; border: string; accent: string }
> = {
  paper: {
    bg: 'bg-[#faf8f5]',
    text: 'text-[#242426]',
    subtext: 'text-[#6b7280]',
    border: 'border-[#e5e0d8]',
    accent: 'text-amber-700',
  },
  sepia: {
    bg: 'bg-[#f4ecd8]',
    text: 'text-[#3d2f1f]',
    subtext: 'text-[#7d6b56]',
    border: 'border-[#dfd3bc]',
    accent: 'text-amber-800',
  },
  dusk: {
    bg: 'bg-[#1e222d]',
    text: 'text-[#e2e8f0]',
    subtext: 'text-[#94a3b8]',
    border: 'border-[#2d3344]',
    accent: 'text-amber-400',
  },
  nordic: {
    bg: 'bg-[#181b22]',
    text: 'text-[#e2e8f0]',
    subtext: 'text-[#94a3b8]',
    border: 'border-[#282d3b]',
    accent: 'text-sky-400',
  },
  sage: {
    bg: 'bg-[#111b15]',
    text: 'text-[#dceee3]',
    subtext: 'text-[#8ca697]',
    border: 'border-[#1d2f25]',
    accent: 'text-emerald-400',
  },
  amoled: {
    bg: 'bg-[#000000]',
    text: 'text-[#e4e4e7]',
    subtext: 'text-[#71717a]',
    border: 'border-[#27272a]',
    accent: 'text-amber-400',
  },
  eink: {
    bg: 'bg-[#ffffff]',
    text: 'text-[#000000]',
    subtext: 'text-[#525252]',
    border: 'border-[#e5e5e5]',
    accent: 'text-black font-bold',
  },
};

const ACCENT_MAP: Record<AccentColor, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-500', text: 'text-amber-500' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  sky: { bg: 'bg-sky-500', text: 'text-sky-500' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500' },
  violet: { bg: 'bg-purple-500', text: 'text-purple-500' },
};

const FONT_CLASSES: Record<ReaderSettings['fontFamily'], string> = {
  literata: 'font-literata',
  merriweather: 'font-merriweather',
  sans: 'font-sans-ui',
  dyslexic: 'font-dyslexic',
  mono: 'font-mono-reader',
};

export const ReaderView: React.FC<ReaderViewProps> = (props) => {
  if (props.book.format === 'pdf') {
    return <NativePdfReader {...props} />;
  }

  const {
    book,
    onBackToLibrary,
    settings,
    onUpdateSettings,
    isZenMode,
    onToggleZenMode,
    targetHighlightId,
    onClearTargetHighlight,
  } = props;
  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    book.readingProgress.currentChapterIndex || 0
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(
    book.readingProgress.currentPageIndex || 0
  );

  // Drawers & toolbars
  const [isTOCDrawerOpen, setIsTOCDrawerOpen] = useState(false);
  const [isAnnotationsDrawerOpen, setIsAnnotationsDrawerOpen] = useState(false);
  const [pendingHighlightScrollId, setPendingHighlightScrollId] = useState<string | null>(null);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTTSOpen, setIsTTSOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Modals: RSVP, Soundscape, Habits
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);

  // Auto-pacing mode
  const [isAutoPacing, setIsAutoPacing] = useState(false);

  // Reading Ruler cursor position
  const [rulerY, setRulerY] = useState<number | null>(null);

  // Highlights & Bookmarks state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Selection popup state
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number; bottom?: number } | null>(null);
  const [selectionOffsets, setSelectionOffsets] = useState<{startOffset: number, endOffset: number, startItemIndex: number} | null>(null);
  const [selectedText, setSelectedText] = useState('');

  // Active clicked highlight popover state
  const [activeHighlightPopover, setActiveHighlightPopover] = useState<{
    highlight: Highlight;
    position: { x: number; y: number };
  } | null>(null);

  // TTS current sentence state
  const [ttsCurrentSentence, setTtsCurrentSentence] = useState('');

  const [zenNavVisible, setZenNavVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
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
        target.closest('[role="dialog"]') ||
        target.closest('.reading-progress-bar')
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

    // Only register as swipe if horizontal distance is greater than vertical (allows vertical scroll to work)
    // and distance is significant (at least 40px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handlePrevPage(); // Swipe right -> previous page
      } else {
        handleNextPage(); // Swipe left -> next page
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentChapter = (book.chapters || [])[currentChapterIndex] || (book.chapters || [])[0];
  const themeStyle = THEME_STYLES[settings.theme] || THEME_STYLES.paper;
  const activeAccent = settings.accentColor || 'amber';
  const accentConfig = ACCENT_MAP[activeAccent] || ACCENT_MAP.amber;

  // Start habit tracking session on book open, end on unmount
  useEffect(() => {
    habitTracker.startSession(book.id, book.title);
    return () => {
      habitTracker.endSession();
      ttsService.stop();
    };
  }, [book.id, book.title]);

  // Load annotations from indexedDB
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const hl = await db.highlights.where('bookId').equals(book.id).toArray();
        setHighlights(hl);
        const bm = await db.bookmarks.where('bookId').equals(book.id).toArray();
        setBookmarks(bm);
      } catch (err) {
        console.warn('Failed to load annotations:', err);
      }
    };
    loadAnnotations();
  }, [book.id]);

  // Words per page calculation
  const wordsPerPage = settings.layoutMode === 'double' ? 650 : 380;

  // Split chapter content into readable desktop pages
  const pages = useMemo(() => {
    const paragraphs = currentChapter.content.split('\n\n').filter(Boolean);
    const result: {text: string, globalIndex: number}[][] = [];
    let currentPage: {text: string, globalIndex: number}[] = [];
    let currentWordCount = 0;

    paragraphs.forEach((p, idx) => {
      const words = p.split(/\s+/).length;
      if (currentWordCount + words > wordsPerPage && currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [{text: p, globalIndex: idx}];
        currentWordCount = words;
      } else {
        currentPage.push({text: p, globalIndex: idx});
        currentWordCount += words;
      }
    });

    if (currentPage.length > 0) {
      result.push(currentPage);
    }

    return result.length > 0 ? result : [[{text: currentChapter.content, globalIndex: 0}]];
  }, [currentChapter.content, wordsPerPage]);

  const totalPagesInChapter = pages.length;

  useEffect(() => {
    const handleScroll = () => {
      // Close popups when scrolling
      if (activeHighlightPopover) setActiveHighlightPopover(null);
      if (selectionPosition) setSelectionPosition(null);

      // Only update reading progress in scroll mode
      if (!contentAreaRef.current || settings.layoutMode !== 'scroll') return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentAreaRef.current;
      const scrollRatio = scrollTop / (scrollHeight - clientHeight || 1);
      
      const estimatedPage = Math.floor(scrollRatio * totalPagesInChapter);
      setCurrentPageIndex(Math.min(Math.max(0, estimatedPage), totalPagesInChapter - 1));
    };

    const container = contentAreaRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [settings.layoutMode, totalPagesInChapter, activeHighlightPopover, selectionPosition]);

  const safePageIndex = Math.min(currentPageIndex, Math.max(0, totalPagesInChapter - 1));
  const activePageParagraphs = pages[safePageIndex] || [];

  // Save reading progress on page or chapter change & record activity
  useEffect(() => {
    const saveProgress = async () => {
      const percentage = Math.round(
        ((currentChapterIndex + (currentPageIndex + 1) / totalPagesInChapter) / (book.chapters || []).length) * 100
      );
      const updatedProgress = {
        currentChapterIndex,
        currentPageIndex,
        percentage: Math.min(100, Math.max(0, percentage)),
        lastReadTimestamp: Date.now(),
      };
      await db.books.update(book.id, { readingProgress: updatedProgress });
      habitTracker.recordActivity(wordsPerPage);
    };
    saveProgress();
  }, [currentChapterIndex, currentPageIndex, totalPagesInChapter, book.id, (book.chapters || []).length, wordsPerPage]);

  // TTS sentence listener
  useEffect(() => {
    const unsub = ttsService.onSentenceChange((sentence) => {
      setTtsCurrentSentence(sentence);
    });
    return () => unsub();
  }, []);


  // Handle global jump to highlight
  useEffect(() => {
    if (targetHighlightId) {
      setPendingHighlightScrollId(targetHighlightId);
      if (onClearTargetHighlight) onClearTargetHighlight();
    }
  }, [targetHighlightId, onClearTargetHighlight]);

  useEffect(() => {
    if (pendingHighlightScrollId) {
      const targetHighlight = highlights.find(h => h.id === pendingHighlightScrollId);
      
      if (targetHighlight && targetHighlight.chapterIndex === currentChapterIndex) {
        if (settings.layoutMode !== 'scroll') {
          const searchStr = targetHighlight.selectedText.split('\n')[0].trim();
          const foundPageIdx = pages.findIndex(page => page.some(p => p.text.includes(searchStr) || targetHighlight.selectedText.includes(p.text.trim())));
          if (foundPageIdx !== -1 && foundPageIdx !== safePageIndex) {
            setCurrentPageIndex(foundPageIdx);
            return; 
          }
        }
        
        const el = document.getElementById(`hl-${pendingHighlightScrollId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                retryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const origStyle = retryEl.style.boxShadow;
                retryEl.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.5)';
                setTimeout(() => {
                  if (retryEl) retryEl.style.boxShadow = origStyle;
                }, 1500);
                setPendingHighlightScrollId(null);
             }
           }, 500);
           return () => clearTimeout(timer);
        }
      }
    }
  }, [currentChapterIndex, safePageIndex, pendingHighlightScrollId, highlights, pages, settings.layoutMode]);

  // Navigation handlers
  const handleNextPage = () => {
    if (settings.layoutMode === 'scroll') {
      const container = contentAreaRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          if (currentChapterIndex < (book.chapters || []).length - 1) {
            setCurrentChapterIndex((prev) => prev + 1);
            setCurrentPageIndex(0);
            container.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setIsAutoPacing(false);
          }
        } else {
          container.scrollBy({ top: clientHeight * 0.85, behavior: 'smooth' });
        }
      }
      return;
    }

    if (safePageIndex < totalPagesInChapter - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex < (book.chapters || []).length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setCurrentPageIndex(0);
      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsAutoPacing(false);
    }
  };

  const handlePrevPage = () => {
    if (settings.layoutMode === 'scroll') {
      const container = contentAreaRef.current;
      if (container) {
        const { scrollTop, clientHeight } = container;
        if (scrollTop <= 10) {
          if (currentChapterIndex > 0) {
            setCurrentChapterIndex(currentChapterIndex - 1);
            setCurrentPageIndex(0);
            container.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          container.scrollBy({ top: -(clientHeight * 0.85), behavior: 'smooth' });
        }
      }
      return;
    }

    if (safePageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex > 0) {
      const prevChIndex = currentChapterIndex - 1;
      setCurrentChapterIndex(prevChIndex);
      setCurrentPageIndex(0);
      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Auto-Pacing timer
  useEffect(() => {
    if (!isAutoPacing) return;
    const wpm = settings.autoPagingWpm || 240;
    const durationMs = Math.max(4000, (wordsPerPage / wpm) * 60 * 1000);
    const timer = setInterval(() => {
      handleNextPage();
    }, durationMs);

    return () => clearInterval(timer);
  }, [isAutoPacing, safePageIndex, currentChapterIndex, totalPagesInChapter, wordsPerPage, settings.autoPagingWpm]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'j') {
        if (!e.shiftKey) {
          e.preventDefault();
          handleNextPage();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'z' || e.key === 'Z') {
        onToggleZenMode();
      } else if (e.key === 'r' || e.key === 'R') {
        onUpdateSettings({ readingRuler: !settings.readingRuler });
      } else if (e.key === 'v' || e.key === 'V') {
        setIsRSVPOpen(true);
      } else if (e.key === 'p' || e.key === 'P') {
        setIsAutoPacing((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        setIsSoundscapeOpen((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        if (!e.ctrlKey && !e.metaKey) {
          setIsHabitsOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        if (isZenMode) onToggleZenMode();
        setIsTOCDrawerOpen(false);
        setIsAnnotationsDrawerOpen(false);
        setIsTypographyOpen(false);
        setIsAIOpen(false);
        setIsSearchOpen(false);
        setIsRSVPOpen(false);
        setIsSoundscapeOpen(false);
        setIsHabitsOpen(false);
        setActiveHighlightPopover(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleBookmark();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setIsTOCDrawerOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setIsAnnotationsDrawerOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setIsAIOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, safePageIndex, totalPagesInChapter, isZenMode, settings.readingRuler]);

  // Track mouse position for reading ruler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!settings.readingRuler) return;
    setRulerY(e.clientY);
  };

  // Listen for text selection completion (mouseup/touchend/selectionchange)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const checkSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          const container = document.querySelector('.reading-content') || document.querySelector('.react-pdf__Document');
          if (container && !container.contains(range.commonAncestorContainer)) {
            return;
          }
          
          let sOffset = -1;
          let eOffset = -1;
          const pElem = range.commonAncestorContainer.nodeType === 3 
             ? range.commonAncestorContainer.parentElement?.closest('p')
             : (range.commonAncestorContainer as HTMLElement).closest('p');
             
          if (pElem) {
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(pElem);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            sOffset = preSelectionRange.toString().length;
            eOffset = sOffset + selection.toString().length;
            const itemIndex = parseInt(pElem.getAttribute('data-paragraph-index') || '0', 10);
            setSelectionOffsets({ startOffset: sOffset, endOffset: eOffset, startItemIndex: itemIndex });
          } else {
            setSelectionOffsets(null);
          }
          
          setSelectedText(selection.toString().trim());
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
            bottom: rect.bottom,
          });
        } catch {
          // Ignore range errors during mid-drag DOM mutation
        }
      }
    };

    const handleSelectionEnd = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkSelection, 80);
    };

    const handleSelectionChange = () => {
      // Debounce slightly longer for mobile handle dragging
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkSelection, 180);
    };
    
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    document.addEventListener('selectionchange', handleSelectionChange);
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.includes('Arrow')) {
        handleSelectionEnd();
      }
    };
    
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.fixed.z-50')) {
        if (!target.closest('mark')) {
          setActiveHighlightPopover(null);
        }
        // Wait for browser to process the click/tap and potentially clear selection
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.toString().trim().length === 0) {
            setSelectionPosition(null);
          }
        }, 120);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Create highlight
  const handleCreateHighlight = async (color: Highlight['color'], note?: string) => {
    if (!selectedText) return;

    const words = selectedText.trim().split(/\s+/).filter(Boolean).length;
    let scope: Highlight['scope'] = 'word';
    if (words > 25 || selectedText.includes('\n\n')) {
      scope = 'paragraph';
    } else if (words > 2 || selectedText.includes('.')) {
      scope = 'line';
    }

    const newHighlight: Highlight = {
      id: 'hl-' + Date.now(),
      bookId: book.id,
      chapterIndex: currentChapterIndex,
      selectedText,
      startItemIndex: selectionOffsets?.startItemIndex,
      startOffset: selectionOffsets?.startOffset,
      endOffset: selectionOffsets?.endOffset,
      color,
      note,
      scope,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.highlights.put(newHighlight);
    setHighlights((prev) => [...prev, newHighlight]);
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  // Update existing highlight (color or note)
  const handleUpdateHighlight = async (id: string, updates: Partial<Highlight>) => {
    await db.highlights.update(id, updates);
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    if (activeHighlightPopover && activeHighlightPopover.highlight.id === id) {
      setActiveHighlightPopover({
        ...activeHighlightPopover,
        highlight: { ...activeHighlightPopover.highlight, ...updates },
      });
    }
  };

  // Delete highlight
  const handleDeleteHighlight = async (id: string) => {
    await db.highlights.delete(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setActiveHighlightPopover(null);
  };

  // Toggle bookmark on active page
  const isCurrentPageBookmarked = bookmarks.some(
    (b) => b.chapterIndex === currentChapterIndex && b.pageIndex === safePageIndex
  );

  const toggleBookmark = async () => {
    if (isCurrentPageBookmarked) {
      const existing = bookmarks.find(
        (b) => b.chapterIndex === currentChapterIndex && b.pageIndex === safePageIndex
      );
      if (existing) {
        await db.bookmarks.delete(existing.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      }
    } else {
      const snippet = activePageParagraphs[0]?.text?.slice(0, 90) || currentChapter.title;
      const newBm: Bookmark = {
        id: 'bm-' + Date.now(),
        bookId: book.id,
        chapterIndex: currentChapterIndex,
        pageIndex: safePageIndex,
        label: `${currentChapter.title} (p. ${safePageIndex + 1})`,
        snippet,
        createdAt: Date.now(),
      };
      await db.bookmarks.put(newBm);
      setBookmarks((prev) => [...prev, newBm]);
    }
  };

  const handleUpdateBookmark = async (id: string, label: string) => {
    await db.bookmarks.update(id, { label });
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, label } : b)));
  };

  // TTS Start
  const startTTS = (customText?: string) => {
    let textToSpeak = customText;
    if (!textToSpeak) {
      if (settings.layoutMode === 'scroll') {
        textToSpeak = currentChapter.content;
      } else {
        const currentGlobalIndex = activePageParagraphs[0]?.globalIndex || 0;
        const paragraphs = currentChapter.content.split('\n\n').filter(Boolean);
        textToSpeak = paragraphs.slice(currentGlobalIndex).join(' ');
      }
    }
    ttsService.speakText(textToSpeak || '', { rate: 1.0 });
    setIsTTSOpen(true);
    setSelectionPosition(null);
  };


  // Track mouse for Zen Mode nav
  useEffect(() => {
    if (!isZenMode) {
      setZenNavVisible(false);
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      setZenNavVisible(e.clientY < 60);
    };
    window.addEventListener('mousemove', handleMouseMove);
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0].clientY < 60) setZenNavVisible(true);
      else setZenNavVisible(false);
    };
    window.addEventListener('touchstart', handleTouchStart);
    return () => window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
  }, [isZenMode]);
  
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

  // Renders paragraph text with actual clickable, multi-color highlights
  const renderParagraphContent = (paragraphText: string, globalIndex: number) => {
    const chapterHighlights = highlights.filter(
      (h) => h.chapterIndex === currentChapterIndex && (h.startItemIndex === undefined || h.startItemIndex === globalIndex) && paragraphText.includes(h.selectedText)
    );

    if (chapterHighlights.length === 0) {
      return formatBionicText(paragraphText);
    }

    // Sort highlights by where they appear
    const sorted = [...chapterHighlights].sort((a, b) => {
      const idxA = a.startOffset !== undefined ? a.startOffset : paragraphText.indexOf(a.selectedText);
      const idxB = b.startOffset !== undefined ? b.startOffset : paragraphText.indexOf(b.selectedText);
      return idxA - idxB;
    });

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    const highlightColors: Record<Highlight['color'], string> = {
      yellow: 'bg-amber-400/35 border-b-2 border-amber-400/90 text-inherit',
      emerald: 'bg-emerald-400/35 border-b-2 border-emerald-400/90 text-inherit',
      sky: 'bg-sky-400/35 border-b-2 border-sky-400/90 text-inherit',
      rose: 'bg-rose-400/35 border-b-2 border-rose-400/90 text-inherit',
      amber: 'bg-orange-400/35 border-b-2 border-orange-400/90 text-inherit',
      violet: 'bg-purple-400/35 border-b-2 border-purple-400/90 text-inherit',
    };

    sorted.forEach((h, i) => {
      let idx = h.startOffset !== undefined ? h.startOffset : paragraphText.indexOf(h.selectedText, lastIndex);
      // Fallback if offset doesn't match string (e.g. text changed or whitespace issues)
      if (h.startOffset !== undefined && paragraphText.substring(h.startOffset, h.endOffset).trim() !== h.selectedText.trim()) {
        idx = paragraphText.indexOf(h.selectedText, lastIndex);
      }
      if (idx === -1) return;

      if (idx > lastIndex) {
        elements.push(
          <span key={`t-${lastIndex}`}>{formatBionicText(paragraphText.slice(lastIndex, idx))}</span>
        );
      }

      elements.push(
        <mark
          id={`hl-${h.id}`}
          key={`hl-${h.id}-${i}`}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveHighlightPopover({
              highlight: h,
              position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
            });
          }}
          className={`cursor-pointer rounded-xs px-0.5 transition hover:opacity-85 relative inline ${
            highlightColors[h.color] || highlightColors.yellow
          }`}
          title={h.note ? `[${h.scope || 'note'}]: ${h.note}` : 'Click to edit highlight'}
        >
          {h.selectedText}
          {h.note && (
            <sup
              className="ml-0.5 inline-flex items-center justify-center px-1 py-0.2 rounded text-[10px] font-sans font-medium select-none bg-amber-500/25 text-amber-500 dark:text-amber-300 border border-amber-500/40 hover:scale-110 transition cursor-pointer"
              title={`Attached Note: ${h.note}`}
            >
              💬
            </sup>
          )}
        </mark>
      );

      lastIndex = idx + h.selectedText.length;
    });

    if (lastIndex < paragraphText.length) {
      elements.push(
        <span key={`t-end`}>{formatBionicText(paragraphText.slice(lastIndex))}</span>
      );
    }

    return elements;
  };

  // Circadian Warmth calculation
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 19 || currentHour < 7;
  const effectiveWarmth = settings.autoCircadian
    ? Math.max(settings.warmth || 0, isNight ? 45 : 10)
    : settings.warmth || 0;

  // Search in book results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const results: { chapterIndex: number; chapterTitle: string; snippet: string }[] = [];
    (book.chapters || []).forEach((ch, idx) => {
      const pos = ch.content.toLowerCase().indexOf(searchQuery.toLowerCase());
      if (pos !== -1) {
        const start = Math.max(0, pos - 40);
        const end = Math.min(ch.content.length, pos + searchQuery.length + 50);
        results.push({
          chapterIndex: idx,
          chapterTitle: ch.title,
          snippet: (start > 0 ? '...' : '') + ch.content.slice(start, end) + '...',
        });
      }
    });
    return results;
  }, [searchQuery, (book.chapters || [])]);

  const renderParagraphBlock = (p: {text: string, globalIndex: number}, idx: number) => {
    // 1. Markdown Images
    const imgMatch = p.text.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        <div key={idx} className="my-8 flex justify-center w-full">
          <img 
            src={imgMatch[2]} 
            alt={imgMatch[1]} 
            className="max-w-full max-h-[60dvh] object-contain rounded-xl shadow-lg border border-slate-700/50 bg-slate-800/50 p-1"
          />
        </div>
      );
    }
    
    // 2. Markdown Headings
    const headingMatch = p.text.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      
      const sizes = [
        'text-3xl font-bold mt-12 mb-6', 
        'text-2xl font-bold mt-10 mb-5',
        'text-xl font-bold mt-8 mb-4',
        'text-lg font-semibold mt-6 mb-3',
        'text-base font-semibold mt-4 mb-2',
        'text-base font-medium mt-4 mb-2 uppercase tracking-wide'
      ];
      const className = sizes[level - 1] || sizes[0];
      const HeadingTag = `h${level}` as any;
      
      return (
        <HeadingTag key={idx} data-paragraph-index={p.globalIndex} className={`${className} font-sans leading-tight`}>
          {renderParagraphContent(content, p.globalIndex)}
        </HeadingTag>
      );
    }
    
    // 3. Normal Paragraph
    return (
      <p key={idx} data-paragraph-index={p.globalIndex} className="indent-6">
        {renderParagraphContent(p.text, p.globalIndex)}
      </p>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      
      className={`${
        isZenMode ? 'h-[100dvh]' : 'h-[calc(100dvh-2.75rem)]'
      } w-full flex flex-col transition-colors duration-200 relative overflow-hidden ${themeStyle.bg} ${themeStyle.text}`}
    >
      {/* Circadian Blue Light Warmth Overlay */}
      {effectiveWarmth > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-35 transition-opacity duration-700"
          style={{
            backgroundColor: 'rgb(255, 140, 20)',
            opacity: (effectiveWarmth / 100) * 0.32,
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* Reading Ruler Focus Guide */}
      {settings.readingRuler && rulerY !== null && (
        <div
          className="pointer-events-none fixed left-0 right-0 z-30 transition-all duration-75"
          style={{ top: `${rulerY - 20}px` }}
        >
          <div className="h-10 w-full bg-amber-400/12 border-y border-amber-500/35 backdrop-contrast-125 shadow-xs" />
        </div>
      )}

      {/* Zen Mode / Full Screen Exit Overlay */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 transition-opacity duration-300 opacity-30 hover:opacity-100">
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

      {/* Reader Navigation & Controls Bar (Auto-hidden in Zen Mode, revealed on top hover) */}
      <div 
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`${isZenMode ? 'fixed top-0 left-0 right-0 z-50 transition-all duration-300' : 'relative z-20 shrink-0'} ${isZenMode && !zenNavVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <nav
          data-no-swipe="true"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`h-12 border-b ${themeStyle.border} px-2 sm:px-4 flex items-center gap-2 select-none backdrop-blur-xs w-full overflow-hidden ${isZenMode ? themeStyle.bg : ''}`}
          aria-label="Reading Controls"
        >
          {/* Left: Back & Table of Contents */}
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
              onClick={() => setIsTOCDrawerOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs cursor-pointer ${themeStyle.subtext}`}
              title="Table of Contents (Ctrl/⌘+T)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline truncate max-w-[140px]">{currentChapter.title}</span>
            </button>
          </div>

          {/* Center: Book Progress & Quick Search */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${themeStyle.border} text-xs ${themeStyle.subtext} hover:opacity-100 transition cursor-pointer`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search in book</span>
            </button>
          </div>

          {/* Right: Ambient, Speed, AI, Typography, Zen (Scrollable on mobile) */}
          <div className="flex-1 min-w-0 h-full flex items-center justify-end"><div className="flex items-center overflow-x-auto scrollbar-hide w-full h-full mask-fade-right"><div className="ml-auto flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0 pr-2 [&>button]:shrink-0">
            {/* Auto-Pacing toggle */}
            <button
              onClick={() => setIsAutoPacing((prev) => !prev)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                isAutoPacing ? `${accentConfig.text} bg-amber-500/10` : themeStyle.subtext
              }`}
              title={isAutoPacing ? 'Pause Auto-Pacing (P)' : 'Start Auto-Pacing (P)'}
            >
              {isAutoPacing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* RSVP Speed Reader */}
            <button
              onClick={() => setIsRSVPOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.subtext}`}
              title="RSVP Speed Reader (V)"
            >
              <Zap className={`w-4 h-4 ${accentConfig.text}`} />
            </button>

            {/* Reading Ruler Toggle */}
            <button
              onClick={() => onUpdateSettings({ readingRuler: !settings.readingRuler })}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                settings.readingRuler ? `${accentConfig.text} bg-amber-500/10` : themeStyle.subtext
              }`}
              title="Toggle Reading Ruler (R)"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Ambient Soundscapes */}
            <button
              onClick={() => setIsSoundscapeOpen(true)}
              className={`p-1.5 rounded-lg transition cursor-pointer relative ${
                settings.soundscape && settings.soundscape !== 'none'
                  ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 ring-1 ring-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : `hover:bg-black/5 dark:hover:bg-white/10 ${themeStyle.subtext}`
              }`}
              title="Soundscapes & Warmth (S)"
            >
              <CloudRain className="w-4 h-4" />
              {settings.soundscape && settings.soundscape !== 'none' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Reading Habits & Pomodoro */}
            <button
              onClick={() => setIsHabitsOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.subtext}`}
              title="Reading Habits & Focus Timer (H)"
            >
              <Flame className={`w-4 h-4 ${accentConfig.text}`} />
            </button>

            {/* TTS Audio Player button */}
            <button
              onClick={() => startTTS()}
              className={`p-1.5 rounded-lg transition cursor-pointer relative ${
                isTTSOpen ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:bg-amber-500/30' : `hover:bg-black/5 dark:hover:bg-white/10 ${themeStyle.subtext}`
              }`}
              title="Read Aloud with Offline Text-to-Speech"
            >
              <Volume2 className="w-4 h-4" />
              {isTTSOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                isCurrentPageBookmarked ? accentConfig.text : themeStyle.subtext
              }`}
              title={isCurrentPageBookmarked ? 'Remove Bookmark (Ctrl/⌘+B)' : 'Bookmark Page (Ctrl/⌘+B)'}
            >
              <BookmarkIcon
                className={`w-4 h-4 ${isCurrentPageBookmarked ? 'fill-current' : ''}`}
              />
            </button>

            {/* Highlights & Notes */}
            <button
              onClick={() => setIsAnnotationsDrawerOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition relative cursor-pointer ${themeStyle.subtext}`}
              title="Notebook & Highlights (Ctrl/⌘+H)"
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
              title="Open AI Reading Companion (Ctrl/⌘+A)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Typography Popover Toggle */}
            <button
              onClick={() => setIsTypographyOpen((prev) => !prev)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                isTypographyOpen ? accentConfig.text : themeStyle.subtext
              }`}
              title="Typography & Display Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Zen Mode */}
            <button
              onClick={onToggleZenMode}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${themeStyle.subtext}`}
              title="Distraction-Free Zen Mode (Z)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div></div></div>
        </nav>
      </div>

      {/* Floating Auto-Pacing Status Badge */}
      {isAutoPacing && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-300 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in">
          <Play className="w-3 h-3 fill-amber-400 text-amber-400 animate-pulse" />
          <span>Auto-Pacing active ({settings.autoPagingWpm || 240} WPM)</span>
          <button
            onClick={() => setIsAutoPacing(false)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            title="Stop Auto-Pacing (P)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Typography Toolbar Popover */}
      <TypographyToolbar
        isOpen={isTypographyOpen}
        onClose={() => setIsTypographyOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Table of Contents Drawer */}
      <TOCDrawer
        isOpen={isTOCDrawerOpen}
        onClose={() => setIsTOCDrawerOpen(false)}
        chapters={(book.chapters || [])}
        currentChapterIndex={currentChapterIndex}
        onSelectChapter={(idx) => {
          setCurrentChapterIndex(idx);
          setCurrentPageIndex(0);
        }}
      />

      {/* Annotations & Notebook Drawer */}
      <AnnotationsDrawer
        isOpen={isAnnotationsDrawerOpen}
        onClose={() => setIsAnnotationsDrawerOpen(false)}
        highlights={highlights}
        bookmarks={bookmarks}
        onDeleteHighlight={handleDeleteHighlight}
        onDeleteBookmark={async (id) => {
          await db.bookmarks.delete(id);
          setBookmarks((prev) => prev.filter((b) => b.id !== id));
        }}
        onJumpToBookmark={(bm) => {
          setCurrentChapterIndex(bm.chapterIndex);
          setCurrentPageIndex(bm.pageIndex);
        }}
        onJumpToHighlight={(h) => {
          setCurrentChapterIndex(h.chapterIndex);
          setPendingHighlightScrollId(h.id);
          setIsAnnotationsDrawerOpen(false);
        }}
        onUpdateBookmark={handleUpdateBookmark}
        bookTitle={book.title}
      />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        book={book}
        currentChapter={currentChapter}
        selectedText={selectedText}
      />

      {/* RSVP Speed Reader Modal */}
      <RSVPModal
        isOpen={isRSVPOpen}
        onClose={() => setIsRSVPOpen(false)}
        text={currentChapter.content}
        chapterTitle={currentChapter.title}
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

      {/* Floating Selection Popup */}
      <SelectionPopup
        position={selectionPosition}
        selectedText={selectedText}
        onHighlight={handleCreateHighlight}
        onAddNote={() => {}}
        onReadAloud={() => startTTS(selectedText)}
        onAskAI={() => setIsAIOpen(true)}
        onClose={() => setSelectionPosition(null)}
      />

      {/* Highlight Click / Edit Popover */}
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

      {/* TTS Audio Player Bar */}
      <TTSAudioBar
        isOpen={isTTSOpen}
        currentSentence={ttsCurrentSentence}
        onClose={() => setIsTTSOpen(false)}
      />

      {/* Spotlight Search in Book Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] text-slate-100 flex flex-col max-h-[80dvh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-4 py-3 border-b border-slate-800/80">
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in "${book.title}"...`}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none px-4 text-base placeholder:text-slate-500 text-slate-100 font-medium"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer shrink-0 text-[10px] font-mono border border-slate-700"
              >
                ESC
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-slate-950/40">
              {!searchQuery ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <Search className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">Find characters, quotes, or terminology.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                  <p className="text-xs opacity-70">Check spelling or try a different term.</p>
                </div>
              ) : (
                <div className="space-y-1 pb-4">
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setCurrentChapterIndex(res.chapterIndex);
                        setCurrentPageIndex(0);
                        setIsSearchOpen(false);
                      }}
                      className="group p-3 rounded-xl bg-transparent hover:bg-slate-800/80 active:scale-[0.98] cursor-pointer transition-all border border-transparent hover:border-slate-700/60"
                    >
                      <div className="text-amber-400 text-[11px] font-semibold mb-1 truncate flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                        {res.chapterTitle}
                      </div>
                      <div className="text-slate-300 text-xs font-serif line-clamp-2 leading-relaxed">
                        {(() => {
                          if (!searchQuery) return res.snippet;
                          const parts = res.snippet.split(new RegExp(`(${searchQuery})`, 'gi'));
                          return (
                            <span>
                              {parts.map((part, idx) => 
                                part.toLowerCase() === searchQuery.toLowerCase()
                                  ? <span key={idx} className="bg-amber-500/30 text-amber-200 font-medium rounded-sm px-0.5">{part}</span>
                                  : part
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Canvas */}
      <main
        ref={contentAreaRef}
        className="flex-1 flex flex-col justify-between relative overflow-y-auto"
      >
        {/* Visual Bookmark Ribbon on Corner of Page */}
        {isCurrentPageBookmarked && (
          <div
            onClick={toggleBookmark}
            className="absolute top-0 right-6 md:right-12 z-25 cursor-pointer group animate-in slide-in-from-top-4 duration-200"
            title="Page is Bookmarked · Click to remove"
          >
            <div
              className={`w-7 h-10 ${accentConfig.bg} shadow-xl flex items-end justify-center pb-1 text-slate-950 font-bold transition-all group-hover:h-12 rounded-b-sm`}
            >
              <BookmarkIcon className="w-4 h-4 fill-slate-950 text-slate-950" />
            </div>
          </div>
        )}

        {/* Click zones for desktop page turning (hidden on mobile to prevent blocking touch text selection) */}
        <div
          onClick={handlePrevPage}
          className="hidden md:flex absolute left-0 top-0 bottom-0 w-24 lg:w-28 z-10 cursor-w-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition items-center justify-start pl-3 opacity-0 hover:opacity-100"
          title="Previous Page (← / Space)"
        >
          <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
            <ChevronLeft className="w-5 h-5 opacity-70" />
          </div>
        </div>

        <div
          onClick={handleNextPage}
          className="hidden md:flex absolute right-0 top-0 bottom-0 w-24 lg:w-28 z-10 cursor-e-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition items-center justify-end pr-3 opacity-0 hover:opacity-100"
          title="Next Page (→ / Space)"
        >
          <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
            <ChevronRight className="w-5 h-5 opacity-70" />
          </div>
        </div>

        {/* Reading Content Viewport */}
        <article
          style={{
            maxWidth: settings.layoutMode === 'double' ? '1200px' : '780px',
            paddingLeft: `max(16px, min(${settings.marginWidth}px, 8vw))`,
            paddingRight: `max(16px, min(${settings.marginWidth}px, 8vw))`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing || 0}px`,
            textAlign: settings.textAlign,
          }}
          className={`mx-auto w-full pt-8 pb-24 reading-content ${FONT_CLASSES[settings.fontFamily]}`}
        >
          {/* Chapter header */}
          {safePageIndex === 0 && (
            <header className="text-center mb-10 pb-6 border-b border-current/10">
              <span className={`text-xs uppercase tracking-widest font-sans font-semibold ${themeStyle.accent}`}>
                {book.title}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">
                {currentChapter.title}
              </h1>
              <span className={`text-xs block mt-2 ${themeStyle.subtext} font-sans`}>
                Estimated {estimateReadingTimeMinutes(currentChapter.wordCount)} min chapter
              </span>
            </header>
          )}

          {/* Layout Mode: Double Spread vs Single Column vs Continuous Scroll */}
          {settings.layoutMode === 'double' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 page-spread leading-relaxed">
              <div className="space-y-4">
                {activePageParagraphs
                  .slice(0, Math.ceil(activePageParagraphs.length / 2))
                  .map((p, idx) => renderParagraphBlock(p, idx))}
              </div>
              <div className="space-y-4 md:border-l md:border-current/10 md:pl-12">
                {activePageParagraphs
                  .slice(Math.ceil(activePageParagraphs.length / 2))
                  .map((p, idx) => renderParagraphBlock(p, idx + Math.ceil(activePageParagraphs.length / 2)))}
              </div>
            </div>
          ) : settings.layoutMode === 'scroll' ? (
            <div className="space-y-5 leading-relaxed">
              {currentChapter.content.split('\n\n').map((text, idx) => renderParagraphBlock({text, globalIndex: idx}, idx))}
              <div className="mt-16 pt-8 border-t border-current/10 flex flex-wrap gap-4 items-center justify-between">
                <button
                  onClick={() => {
                    if (currentChapterIndex > 0) {
                      setCurrentChapterIndex(prev => prev - 1);
                      setCurrentPageIndex(0);
                      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={currentChapterIndex === 0}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm font-medium ${
                    currentChapterIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-current/5'
                  }`}
                >
                  ← Previous Chapter
                </button>
                <button
                  onClick={() => {
                    if (currentChapterIndex < (book.chapters || []).length - 1) {
                      setCurrentChapterIndex(prev => prev + 1);
                      setCurrentPageIndex(0);
                      contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={currentChapterIndex >= (book.chapters || []).length - 1}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer text-sm font-medium ${
                    currentChapterIndex >= (book.chapters || []).length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-current/5'
                  }`}
                >
                  Next Chapter →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 leading-relaxed">
              {activePageParagraphs.map((p, idx) => renderParagraphBlock(p, idx))}
            </div>
          )}
        </article>

        {/* World-class Scrubbable Reading Progress Bar */}
        <ReadingProgressBar
          book={book}
          currentChapterIndex={currentChapterIndex}
          currentPageIndex={safePageIndex}
          totalPagesInChapter={totalPagesInChapter}
          wordsPerPage={wordsPerPage}
          onNavigatePage={(idx) => setCurrentPageIndex(idx)}
          onNavigateChapter={(chIdx) => {
            setCurrentChapterIndex(chIdx);
            setCurrentPageIndex(0);
          }}
          onOpenTOC={() => setIsTOCDrawerOpen(true)}
          isBookmarked={isCurrentPageBookmarked}
          onToggleBookmark={toggleBookmark}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          accentClass={accentConfig.bg}
        />
      </main>
    </div>
  );
};
