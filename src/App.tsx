import React, { useState, useEffect, useCallback } from 'react';
import { db, loadSavedSettings, saveReaderSettings } from './services/db';
import { initializeDatabaseWithSeed } from './services/bookParser';
import type { Book, Shelf, ReaderSettings } from './types';
import { DesktopTitleBar } from './components/DesktopTitleBar';
import { LibraryView } from './components/LibraryView';
import { ReaderView } from './components/ReaderView';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DesktopExportModal } from './components/DesktopExportModal';
import { ReadingHabitsDashboard } from './components/ReadingHabitsDashboard';
import { SoundscapeModal } from './components/SoundscapeModal';
import { SearchIndexModal } from './components/SearchIndexModal';
import { FileImporterModal } from './components/FileImporterModal';
import { ReadingProgressSyncModal } from './components/ReadingProgressSyncModal';
import { AnnotationManagerModal } from './components/AnnotationManagerModal';
import { WifiOff, Upload } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [settings, setSettings] = useState<ReaderSettings | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportGuideOpen, setIsExportGuideOpen] = useState(false);
  const [isHabitsGlobalOpen, setIsHabitsGlobalOpen] = useState(false);
  const [isSoundscapeGlobalOpen, setIsSoundscapeGlobalOpen] = useState(false);
  const [isSearchIndexOpen, setIsSearchIndexOpen] = useState(false);
  const [isFileImporterOpen, setIsFileImporterOpen] = useState(false);
  const [isProgressSyncOpen, setIsProgressSyncOpen] = useState(false);
  const [isAnnotationManagerOpen, setIsAnnotationManagerOpen] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [globalDroppedFiles, setGlobalDroppedFiles] = useState<FileList | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Global drag and drop interceptor
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsGlobalDragging(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsGlobalDragging(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsGlobalDragging(false);
      if (e.dataTransfer?.files?.length) {
        setGlobalDroppedFiles(e.dataTransfer.files);
        setIsFileImporterOpen(true);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Initialize offline database & settings
  useEffect(() => {
    const initApp = async () => {
      const initialBooks = await initializeDatabaseWithSeed();
      setBooks(initialBooks);

      const savedSettings = await loadSavedSettings();
      setSettings(savedSettings);

      const loadedShelves = await db.shelves.toArray();
      setShelves(loadedShelves);
    };

    initApp();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshBooks = async (forceClearSelection = false) => {
    try {
      const all = await db.books.toArray();
      setBooks(all);
      const allShelves = await db.shelves.toArray();
      setShelves(allShelves);
      
      // If we aren't explicitly clearing the selection, and one is currently active in the state closure, refresh it.
      if (!forceClearSelection && selectedBook) {
        const refreshedSelected = all.find((b) => b.id === selectedBook.id);
        if (refreshedSelected) setSelectedBook(refreshedSelected);
      }
    } catch (err) {
      console.warn('Failed to load library:', err);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ReaderSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveReaderSettings(updated);
  };

  // Global keyboard shortcuts (Cmd+K for Deep Search, Cmd+Shift+A for Annotations)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Search Index
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchIndexOpen((prev) => !prev);
      }
      // Cmd/Ctrl + Shift + A: Annotation Manager
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAnnotationManagerOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Jump directly to a book and chapter from Deep Search or Annotations
  const handleNavigateToResult = useCallback(
    async (bookId: string, chapterIndex: number, _snippetOrText?: string) => {
      const targetBook = books.find((b) => b.id === bookId);
      if (targetBook) {
        const clampedIndex = Math.min(
          Math.max(0, chapterIndex),
          Math.max(0, targetBook.chapters.length - 1)
        );
        const percentage = Math.round(
          ((clampedIndex + 1) / Math.max(1, targetBook.chapters.length)) * 100
        );

        const updatedProgress = {
          currentChapterIndex: clampedIndex,
          scrollOffset: 0,
          percentage,
          lastReadTimestamp: Date.now(),
          totalReadTimeSeconds: targetBook.readingProgress?.totalReadTimeSeconds || 0,
          readingVelocityWPM: targetBook.readingProgress?.readingVelocityWPM || 250,
        };

        const updatedBook: Book = {
          ...targetBook,
          readingProgress: updatedProgress,
        };

        await db.books.put(updatedBook);
        setSelectedBook(updatedBook);
        setIsSearchIndexOpen(false);
        setIsAnnotationManagerOpen(false);
        refreshBooks();
      }
    },
    [books]
  );

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Starting Lumina Reader...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans-ui selection:bg-amber-500/30 selection:text-amber-200">
      {/* Desktop Window Titlebar */}
      <DesktopTitleBar
        currentBookTitle={selectedBook ? `${selectedBook.title} — ${selectedBook.author}` : undefined}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenExportGuide={() => setIsExportGuideOpen(true)}
        onOpenHabits={() => setIsHabitsGlobalOpen(true)}
        onOpenSoundscape={() => setIsSoundscapeGlobalOpen(true)}
        onOpenSearchIndex={() => setIsSearchIndexOpen(true)}
        onOpenAnnotationManager={() => setIsAnnotationManagerOpen(true)}
        isOnline={isOnline}
        onNavigateHome={() => {
          setSelectedBook(null);
          setIsZenMode(false);
          refreshBooks(true);
        }}
      />

      {/* Main View: Library or Reader */}
      {selectedBook ? (
        <ReaderView
          book={selectedBook}
          onBackToLibrary={() => {
            setSelectedBook(null);
            setIsZenMode(false);
            refreshBooks(true);
          }}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode((prev) => !prev)}
        />
      ) : (
        <LibraryView
          books={books}
          onSelectBook={(book) => setSelectedBook(book)}
          onRefreshBooks={refreshBooks}
          onOpenExportGuide={() => setIsExportGuideOpen(true)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenSearchIndex={() => setIsSearchIndexOpen(true)}
          onOpenFileImporter={() => setIsFileImporterOpen(true)}
          onOpenSyncModal={() => setIsProgressSyncOpen(true)}
          onOpenAnnotationManager={() => setIsAnnotationManagerOpen(true)}
        />
      )}

      {/* Search Index Modal (Full-Text Search across library) */}
      <SearchIndexModal
        isOpen={isSearchIndexOpen}
        onClose={() => setIsSearchIndexOpen(false)}
        books={books}
        currentBook={selectedBook}
        onNavigateToResult={handleNavigateToResult}
      />

      {/* File Importer Modal (Batch EPUB, PDF, MD, TXT & Web Paste) */}
      <FileImporterModal
        isOpen={isFileImporterOpen}
        onClose={() => {
          setIsFileImporterOpen(false);
          setGlobalDroppedFiles(null);
        }}
        shelves={shelves}
        onBooksImported={refreshBooks}
        initialFiles={globalDroppedFiles}
      />

      {isGlobalDragging && (
        <div className="fixed inset-0 z-[100] bg-amber-500/10 backdrop-blur-[2px] border-4 border-amber-500 border-dashed flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900 shadow-2xl rounded-2xl p-8 flex flex-col items-center gap-4 text-amber-500 animate-in fade-in zoom-in-95 duration-200">
            <Upload className="w-12 h-12" />
            <h2 className="text-2xl font-semibold tracking-tight text-white">Drop files to import</h2>
            <p className="text-sm text-slate-400">EPUB, PDF, TXT, or Markdown</p>
          </div>
        </div>
      )}

      {/* Reading Progress & Annotation Sync Modal (JSON/Code cross-device) */}
      <ReadingProgressSyncModal
        isOpen={isProgressSyncOpen}
        onClose={() => setIsProgressSyncOpen(false)}
        onSyncCompleted={refreshBooks}
      />

      {/* Global Annotation & Notes Manager Modal */}
      <AnnotationManagerModal
        isOpen={isAnnotationManagerOpen}
        onClose={() => setIsAnnotationManagerOpen(false)}
        books={books}
        currentBook={selectedBook}
        onNavigateToHighlight={(bookId, chapterIndex, text) =>
          handleNavigateToResult(bookId, chapterIndex, text)
        }
        onRefreshData={refreshBooks}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Cross-Platform Desktop Packaging Guide Modal (Tauri/Electron for .exe, .dmg, .deb) */}
      <DesktopExportModal
        isOpen={isExportGuideOpen}
        onClose={() => setIsExportGuideOpen(false)}
      />

      {/* Global Reading Habits & Pomodoro Modal */}
      <ReadingHabitsDashboard
        isOpen={isHabitsGlobalOpen}
        onClose={() => setIsHabitsGlobalOpen(false)}
      />

      {/* Global Soundscape & Warmth Modal */}
      <SoundscapeModal
        isOpen={isSoundscapeGlobalOpen}
        onClose={() => setIsSoundscapeGlobalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Offline Toast Banner (non-intrusive) */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-400 text-xs font-medium shadow-2xl animate-in slide-in-from-bottom duration-200">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active — 100% Local IndexedDB</span>
        </div>
      )}
    </div>
  );
}
