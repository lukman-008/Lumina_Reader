import React, { useState, useEffect } from 'react';
import { db, loadSavedSettings, saveReaderSettings } from './services/db';
import { initializeDatabaseWithSeed } from './services/bookParser';
import type { Book, ReaderSettings } from './types';
import { DesktopTitleBar } from './components/DesktopTitleBar';
import { LibraryView } from './components/LibraryView';
import { ReaderView } from './components/ReaderView';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DesktopExportModal } from './components/DesktopExportModal';
import { ReadingHabitsDashboard } from './components/ReadingHabitsDashboard';
import { SoundscapeModal } from './components/SoundscapeModal';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [settings, setSettings] = useState<ReaderSettings | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportGuideOpen, setIsExportGuideOpen] = useState(false);
  const [isHabitsGlobalOpen, setIsHabitsGlobalOpen] = useState(false);
  const [isSoundscapeGlobalOpen, setIsSoundscapeGlobalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Initialize offline database & settings
  useEffect(() => {
    const initApp = async () => {
      const initialBooks = await initializeDatabaseWithSeed();
      setBooks(initialBooks);

      const savedSettings = await loadSavedSettings();
      setSettings(savedSettings);
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

  const refreshBooks = async () => {
    const all = await db.books.toArray();
    setBooks(all);
    if (selectedBook) {
      const refreshedSelected = all.find((b) => b.id === selectedBook.id);
      if (refreshedSelected) setSelectedBook(refreshedSelected);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ReaderSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveReaderSettings(updated);
  };

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
        isOnline={isOnline}
      />

      {/* Main View: Library or Reader */}
      {selectedBook ? (
        <ReaderView
          book={selectedBook}
          onBackToLibrary={() => {
            setSelectedBook(null);
            setIsZenMode(false);
            refreshBooks();
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
        />
      )}

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
