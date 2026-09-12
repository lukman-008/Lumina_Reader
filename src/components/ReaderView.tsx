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
import type { Book, ReaderSettings, Highlight, Bookmark, ReadingTheme } from '../types';
import { db } from '../services/db';
import { ttsService } from '../services/ttsService';
import { estimateReadingTimeMinutes } from '../services/bookParser';
import { habitTracker } from '../services/habitTracker';
import { TypographyToolbar } from './TypographyToolbar';
import { TOCDrawer, AnnotationsDrawer } from './ReaderDrawers';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { SelectionPopup } from './SelectionPopup';
import { TTSAudioBar } from './TTSAudioBar';
import { RSVPModal } from './RSVPModal';
import { SoundscapeModal } from './SoundscapeModal';
import { ReadingHabitsDashboard } from './ReadingHabitsDashboard';

interface ReaderViewProps {
  book: Book;
  onBackToLibrary: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
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

const FONT_CLASSES: Record<ReaderSettings['fontFamily'], string> = {
  literata: 'font-literata',
  merriweather: 'font-merriweather',
  sans: 'font-sans-ui',
  dyslexic: 'font-dyslexic',
  mono: 'font-mono-reader',
};

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  onBackToLibrary,
  settings,
  onUpdateSettings,
  isZenMode,
  onToggleZenMode,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    book.readingProgress.currentChapterIndex || 0
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(
    book.readingProgress.currentPageIndex || 0
  );

  // Drawers & toolbars
  const [isTOCDrawerOpen, setIsTOCDrawerOpen] = useState(false);
  const [isAnnotationsDrawerOpen, setIsAnnotationsDrawerOpen] = useState(false);
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
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  // TTS current sentence state
  const [ttsCurrentSentence, setTtsCurrentSentence] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const currentChapter = book.chapters[currentChapterIndex] || book.chapters[0];
  const themeStyle = THEME_STYLES[settings.theme];

  // Start habit tracking session on book open, end on unmount
  useEffect(() => {
    habitTracker.startSession(book.id, book.title);
    return () => {
      habitTracker.endSession();
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
    const result: string[][] = [];
    let currentPage: string[] = [];
    let currentWordCount = 0;

    for (const p of paragraphs) {
      const words = p.split(/\s+/).length;
      if (currentWordCount + words > wordsPerPage && currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [p];
        currentWordCount = words;
      } else {
        currentPage.push(p);
        currentWordCount += words;
      }
    }

    if (currentPage.length > 0) {
      result.push(currentPage);
    }

    return result.length > 0 ? result : [[currentChapter.content]];
  }, [currentChapter.content, wordsPerPage]);

  const totalPagesInChapter = pages.length;
  const safePageIndex = Math.min(currentPageIndex, Math.max(0, totalPagesInChapter - 1));
  const activePageParagraphs = pages[safePageIndex] || [];

  // Save reading progress on page or chapter change & record activity
  useEffect(() => {
    const saveProgress = async () => {
      const percentage = Math.round(
        ((currentChapterIndex + (currentPageIndex + 1) / totalPagesInChapter) / book.chapters.length) * 100
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
  }, [currentChapterIndex, currentPageIndex, totalPagesInChapter, book.id, book.chapters.length, wordsPerPage]);

  // TTS sentence listener
  useEffect(() => {
    const unsub = ttsService.onSentenceChange((sentence) => {
      setTtsCurrentSentence(sentence);
    });
    return () => unsub();
  }, []);

  // Navigation handlers
  const handleNextPage = () => {
    if (safePageIndex < totalPagesInChapter - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex < book.chapters.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setCurrentPageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Reached the end of book
      setIsAutoPacing(false);
    }
  };

  const handlePrevPage = () => {
    if (safePageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex > 0) {
      const prevChIndex = currentChapterIndex - 1;
      setCurrentChapterIndex(prevChIndex);
      setCurrentPageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 1) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  // Add highlight
  const handleCreateHighlight = async (color: Highlight['color']) => {
    if (!selectedText) return;
    const newHighlight: Highlight = {
      id: 'hl-' + Date.now(),
      bookId: book.id,
      chapterIndex: currentChapterIndex,
      selectedText,
      color,
      createdAt: Date.now(),
    };

    await db.highlights.put(newHighlight);
    setHighlights((prev) => [...prev, newHighlight]);
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
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
      const snippet = activePageParagraphs[0]?.slice(0, 90) || currentChapter.title;
      const newBm: Bookmark = {
        id: 'bm-' + Date.now(),
        bookId: book.id,
        chapterIndex: currentChapterIndex,
        pageIndex: safePageIndex,
        label: `${currentChapter.title} (Page ${safePageIndex + 1})`,
        snippet,
        createdAt: Date.now(),
      };
      await db.bookmarks.put(newBm);
      setBookmarks((prev) => [...prev, newBm]);
    }
  };

  // TTS Start
  const startTTS = (customText?: string) => {
    const textToSpeak = customText || activePageParagraphs.join(' ');
    ttsService.speakText(textToSpeak, { rate: 1.0 });
    setIsTTSOpen(true);
    setSelectionPosition(null);
  };

  // Bionic reading word transformation
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
    book.chapters.forEach((ch, idx) => {
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
  }, [searchQuery, book.chapters]);

  const estimatedMinutesLeft = estimateReadingTimeMinutes(
    (totalPagesInChapter - safePageIndex) * wordsPerPage
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`min-h-screen w-full flex flex-col transition-colors duration-200 relative ${themeStyle.bg} ${themeStyle.text}`}
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

      {/* Reader Navigation & Controls Bar (Auto-hidden in Zen Mode) */}
      {!isZenMode && (
        <nav
          className={`h-12 border-b ${themeStyle.border} px-4 flex items-center justify-between z-20 shrink-0 select-none backdrop-blur-xs`}
          aria-label="Reading Controls"
        >
          {/* Left: Back & Table of Contents */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLibrary}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs font-medium ${themeStyle.text}`}
              title="Return to Library"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </button>

            <button
              onClick={() => setIsTOCDrawerOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs ${themeStyle.subtext}`}
              title="Table of Contents (Ctrl/⌘+T)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline truncate max-w-[140px]">{currentChapter.title}</span>
            </button>
          </div>

          {/* Center: Book Progress & Quick Search */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${themeStyle.border} text-xs ${themeStyle.subtext} hover:opacity-100 transition`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search in book</span>
            </button>
          </div>

          {/* Right: Ambient, Speed, AI, Typography, Zen */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Auto-Pacing toggle */}
            <button
              onClick={() => setIsAutoPacing((prev) => !prev)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${
                isAutoPacing ? 'text-amber-500 bg-amber-500/10' : themeStyle.subtext
              }`}
              title={isAutoPacing ? 'Pause Auto-Pacing (P)' : 'Start Auto-Pacing (P)'}
            >
              {isAutoPacing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* RSVP Speed Reader */}
            <button
              onClick={() => setIsRSVPOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${themeStyle.subtext}`}
              title="RSVP Speed Reader (V)"
            >
              <Zap className="w-4 h-4 text-amber-500" />
            </button>

            {/* Reading Ruler Toggle */}
            <button
              onClick={() => onUpdateSettings({ readingRuler: !settings.readingRuler })}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${
                settings.readingRuler ? 'text-amber-500 bg-amber-500/10' : themeStyle.subtext
              }`}
              title="Toggle Reading Ruler (R)"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Ambient Soundscapes */}
            <button
              onClick={() => setIsSoundscapeOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${themeStyle.subtext}`}
              title="Soundscapes & Warmth (S)"
            >
              <CloudRain className="w-4 h-4" />
            </button>

            {/* Reading Habits & Pomodoro */}
            <button
              onClick={() => setIsHabitsOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${themeStyle.subtext}`}
              title="Reading Habits & Focus Timer (H)"
            >
              <Flame className="w-4 h-4 fill-amber-500/20 text-amber-500" />
            </button>

            {/* TTS Audio Player button */}
            <button
              onClick={() => startTTS()}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${
                isTTSOpen ? 'text-amber-500' : themeStyle.subtext
              }`}
              title="Read Aloud with Offline Text-to-Speech"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${
                isCurrentPageBookmarked ? 'text-amber-500' : themeStyle.subtext
              }`}
              title={isCurrentPageBookmarked ? 'Remove Bookmark' : 'Bookmark Page (Ctrl/⌘+B)'}
            >
              <BookmarkIcon
                className={`w-4 h-4 ${isCurrentPageBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
              />
            </button>

            {/* Highlights & Notes */}
            <button
              onClick={() => setIsAnnotationsDrawerOpen(true)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition relative ${themeStyle.subtext}`}
              title="Notebook & Highlights (Ctrl/⌘+H)"
            >
              <Highlighter className="w-4 h-4" />
              {highlights.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
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
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${
                isTypographyOpen ? 'text-amber-500' : themeStyle.subtext
              }`}
              title="Typography & Display Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Zen Mode */}
            <button
              onClick={onToggleZenMode}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition ${themeStyle.subtext}`}
              title="Distraction-Free Zen Mode (Z)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </nav>
      )}

      {/* Floating Auto-Pacing Status Badge */}
      {isAutoPacing && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 text-amber-300 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in">
          <Play className="w-3 h-3 fill-amber-400 text-amber-400 animate-pulse" />
          <span>Auto-Pacing active ({settings.autoPagingWpm || 240} WPM)</span>
          <button
            onClick={() => setIsAutoPacing(false)}
            className="p-1 text-slate-400 hover:text-white"
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
        chapters={book.chapters}
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
        onDeleteHighlight={async (id) => {
          await db.highlights.delete(id);
          setHighlights((prev) => prev.filter((h) => h.id !== id));
        }}
        onDeleteBookmark={async (id) => {
          await db.bookmarks.delete(id);
          setBookmarks((prev) => prev.filter((b) => b.id !== id));
        }}
        onJumpToBookmark={(bm) => {
          setCurrentChapterIndex(bm.chapterIndex);
          setCurrentPageIndex(bm.pageIndex);
        }}
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
        title={currentChapter.title}
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
        onAddNote={() => {
          const note = prompt('Add note for selection:');
          if (note) {
            handleCreateHighlight('yellow');
          }
        }}
        onReadAloud={() => startTTS(selectedText)}
        onAskAI={() => setIsAIOpen(true)}
        onClose={() => setSelectionPosition(null)}
      />

      {/* TTS Audio Player Bar */}
      <TTSAudioBar
        isOpen={isTTSOpen}
        currentSentence={ttsCurrentSentence}
        onClose={() => setIsTTSOpen(false)}
      />

      {/* Search in Book Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-100 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold">Search in "{book.title}"</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type keyword or phrase..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No occurrences found.</div>
              ) : (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setCurrentChapterIndex(res.chapterIndex);
                      setCurrentPageIndex(0);
                      setIsSearchOpen(false);
                    }}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 cursor-pointer transition border border-slate-700/60"
                  >
                    <span className="font-semibold text-amber-400 block mb-1">{res.chapterTitle}</span>
                    <p className="text-slate-300 italic">{res.snippet}</p>
                  </div>
                ))
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
        {/* Click zones for desktop page turning */}
        <div
          onClick={handlePrevPage}
          className="absolute left-0 top-0 bottom-0 w-16 md:w-28 z-10 cursor-w-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition flex items-center justify-start pl-3 opacity-0 hover:opacity-100"
          title="Previous Page (← / Space)"
        >
          <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
            <ChevronLeft className="w-5 h-5 opacity-70" />
          </div>
        </div>

        <div
          onClick={handleNextPage}
          className="absolute right-0 top-0 bottom-0 w-16 md:w-28 z-10 cursor-e-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition flex items-center justify-end pr-3 opacity-0 hover:opacity-100"
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
            paddingLeft: `${settings.marginWidth}px`,
            paddingRight: `${settings.marginWidth}px`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            textAlign: settings.textAlign,
          }}
          className={`mx-auto w-full pt-8 pb-16 reading-content ${FONT_CLASSES[settings.fontFamily]}`}
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
                  .map((p, idx) => (
                    <p key={idx} className="indent-6">
                      {formatBionicText(p)}
                    </p>
                  ))}
              </div>
              <div className="space-y-4 md:border-l md:border-current/10 md:pl-12">
                {activePageParagraphs
                  .slice(Math.ceil(activePageParagraphs.length / 2))
                  .map((p, idx) => (
                    <p key={idx} className="indent-6">
                      {formatBionicText(p)}
                    </p>
                  ))}
              </div>
            </div>
          ) : settings.layoutMode === 'scroll' ? (
            <div className="space-y-5 leading-relaxed">
              {currentChapter.content.split('\n\n').map((p, idx) => (
                <p key={idx} className="indent-6">
                  {formatBionicText(p)}
                </p>
              ))}
            </div>
          ) : (
            <div className="space-y-5 leading-relaxed">
              {activePageParagraphs.map((p, idx) => (
                <p key={idx} className="indent-6">
                  {formatBionicText(p)}
                </p>
              ))}
            </div>
          )}
        </article>

        {/* Persistent Bottom Reading Navigation Bar */}
        <footer
          className={`h-11 border-t ${themeStyle.border} px-6 flex items-center justify-between text-xs ${themeStyle.subtext} z-20 shrink-0 select-none font-sans`}
        >
          <div className="flex items-center gap-3">
            <span>
              Chapter {currentChapterIndex + 1} of {book.chapters.length}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{estimatedMinutesLeft} mins left in chapter</span>
          </div>

          {/* Visual Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="font-mono">
              Page {safePageIndex + 1} / {totalPagesInChapter}
            </span>
            <div className="w-24 sm:w-36 h-1.5 rounded-full bg-current/15 overflow-hidden">
              <div
                style={{
                  width: `${Math.round(((safePageIndex + 1) / totalPagesInChapter) * 100)}%`,
                }}
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
