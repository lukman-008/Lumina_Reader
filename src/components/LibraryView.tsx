import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Search,
  Star,
  Trash2,
  Clock,
  FileText,
  Bookmark,
  CheckCircle2,
  HardDrive,
  Sparkles,
  Flame,
  Database,
  Tag,
  FolderPlus,
  Folder,
  CheckSquare,
  Square,
  X,
  Layers,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  RefreshCw,
  Highlighter,
  FileUp,
} from 'lucide-react';
import type { Book, Shelf, ReaderSettings } from '../types';
import { parseUploadedBook, estimateReadingTimeMinutes } from '../services/bookParser';
import { db } from '../services/db';
import { BackupRestoreModal } from './BackupRestoreModal';
import { ReadingHabitsDashboard } from './ReadingHabitsDashboard';
import { SoundscapeModal } from './SoundscapeModal';

interface LibraryViewProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onRefreshBooks: () => void;
  onOpenExportGuide: () => void;
  settings?: ReaderSettings;
  onUpdateSettings?: (newSettings: Partial<ReaderSettings>) => void;
  onOpenSearchIndex?: () => void;
  onOpenFileImporter?: () => void;
  onOpenSyncModal?: () => void;
  onOpenAnnotationManager?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  onSelectBook,
  onRefreshBooks,
  onOpenExportGuide,
  settings,
  onUpdateSettings,
  onOpenSearchIndex,
  onOpenFileImporter,
  onOpenSyncModal,
  onOpenAnnotationManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' | 'reading' | 'favorites' | 'finished' | shelf.id
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author' | 'progress' | 'words'>('recent');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk actions state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [shelfToDelete, setShelfToDelete] = useState<string | null>(null);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [isBulkShelfModalOpen, setIsBulkShelfModalOpen] = useState(false);

  // Modals state
  const [isNewShelfModalOpen, setIsNewShelfModalOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHabitsModalOpen, setIsHabitsModalOpen] = useState(false);
  const [isSoundscapeModalOpen, setIsSoundscapeModalOpen] = useState(false);

  // Load custom shelves
  useEffect(() => {
    const loadShelves = async () => {
      try {
        const list = await db.shelves.toArray();
        setShelves(list);
      } catch (err) {
        console.warn('Failed to load shelves:', err);
      }
    };
    loadShelves();
  }, []);

  // Filter books based on active tab and search query
  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.tags && book.tags.some((t) => t.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'reading') {
        const p = book.readingProgress?.percentage || 0;
        return p > 0 && p < 100;
      }
      if (activeTab === 'favorites') return !!book.isFavorite;
      if (activeTab === 'finished') {
        return (book.readingProgress?.percentage || 0) === 100;
      }
      // Specific shelf
      return book.shelfId === activeTab;
    });
  }, [books, searchQuery, activeTab]);

  // Sort filtered books
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      if (sortBy === 'recent') {
        const timeA = a.readingProgress?.lastReadTimestamp || a.addedAt || 0;
        const timeB = b.readingProgress?.lastReadTimestamp || b.addedAt || 0;
        return timeB - timeA;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'author') {
        return a.author.localeCompare(b.author);
      }
      if (sortBy === 'progress') {
        const progA = a.readingProgress?.percentage || 0;
        const progB = b.readingProgress?.percentage || 0;
        return progB - progA;
      }
      if (sortBy === 'words') {
        return b.totalWords - a.totalWords;
      }
      return 0;
    });
  }, [filteredBooks, sortBy]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newBook = await parseUploadedBook(file);
        await db.books.put(newBook);
      }
      onRefreshBooks();
    } catch (err) {
      console.error('Failed to import book:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteBook = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookToDelete(id);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    const updated = !book.isFavorite;
    await db.books.update(book.id, { isFavorite: updated });
    onRefreshBooks();
  };

  // Create custom shelf
  const handleCreateShelf = async () => {
    const trimmed = newShelfName.trim();
    if (!trimmed) return;
    const newShelf: Shelf = {
      id: 'shelf-' + Date.now(),
      name: trimmed,
      createdAt: Date.now(),
    };
    await db.shelves.put(newShelf);
    setShelves((prev) => [...prev, newShelf]);
    setNewShelfName('');
    setIsNewShelfModalOpen(false);
    setActiveTab(newShelf.id);
  };

  const handleDeleteShelf = async (shelfId: string) => {
    setShelfToDelete(shelfId);
  };

  // Bulk selection logic
  const handleToggleSelectBook = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedBookIds.size === filteredBooks.length) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(filteredBooks.map((b) => b.id)));
    }
  };

  const handleBulkAssignShelf = async (shelfId: string | null) => {
    for (const id of selectedBookIds) {
      await db.books.update(id, { shelfId: shelfId || undefined });
    }
    setIsBulkShelfModalOpen(false);
    setSelectedBookIds(new Set());
    setIsBulkMode(false);
    onRefreshBooks();
  };

  const handleBulkAddTag = async () => {
    const tag = bulkTagInput.trim();
    if (!tag) return;
    for (const id of selectedBookIds) {
      const book = books.find((b) => b.id === id);
      const existingTags = book?.tags || [];
      if (!existingTags.includes(tag)) {
        await db.books.update(id, { tags: [...existingTags, tag] });
      }
    }
    setBulkTagInput('');
    setIsBulkTagModalOpen(false);
    setSelectedBookIds(new Set());
    setIsBulkMode(false);
    onRefreshBooks();
  };

  const handleBulkMarkFinished = async () => {
    for (const id of selectedBookIds) {
      const book = books.find((b) => b.id === id);
      if (book) {
        await db.books.update(id, {
          readingProgress: {
            ...book.readingProgress,
            percentage: 100,
            currentPageIndex: 0,
            lastReadTimestamp: Date.now(),
          },
        });
      }
    }
    setSelectedBookIds(new Set());
    setIsBulkMode(false);
    onRefreshBooks();
  };

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleBulkDelete = async () => {
    setShowBulkDeleteConfirm(true);
  };

  // Stats calculation
  const totalWords = books.reduce((acc, b) => acc + (b.totalWords || 0), 0);
  const totalReadingHours = (totalWords / (220 * 60)).toFixed(1);

  // Confirmation action execution
  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    await db.books.delete(bookToDelete);
    await db.highlights.where('bookId').equals(bookToDelete).delete();
    await db.bookmarks.where('bookId').equals(bookToDelete).delete();
    setBookToDelete(null);
    onRefreshBooks();
  };

  const confirmDeleteShelf = async () => {
    if (!shelfToDelete) return;
    await db.shelves.delete(shelfToDelete);
    const onShelf = books.filter((b) => b.shelfId === shelfToDelete);
    for (const b of onShelf) {
      await db.books.update(b.id, { shelfId: undefined });
    }
    setShelves((prev) => prev.filter((s) => s.id !== shelfToDelete));
    if (activeTab === shelfToDelete) setActiveTab('all');
    setShelfToDelete(null);
    onRefreshBooks();
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedBookIds) {
      await db.books.delete(id);
      await db.highlights.where('bookId').equals(id).delete();
      await db.bookmarks.where('bookId').equals(id).delete();
    }
    setSelectedBookIds(new Set());
    setIsBulkMode(false);
    setShowBulkDeleteConfirm(false);
    onRefreshBooks();
  };

  return (
    <div className="w-full flex-1 min-h-[calc(100vh-2.75rem)] bg-slate-950 text-slate-100 p-6 sm:p-8 pb-36 sm:pb-44 max-w-7xl mx-auto flex flex-col space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Books Volume */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Books in Library
            </span>
            <div className="text-2xl font-bold text-slate-100 mt-1">{books.length} Titles</div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <HardDrive className="w-3 h-3" /> 100% Offline Dexie DB
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Word Volume */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Library Volume
            </span>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {totalWords.toLocaleString()} <span className="text-sm font-normal text-slate-400">words</span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> ~{totalReadingHours} hours of reading
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Habits, Velocity & Streaks */}
        <div
          onClick={() => setIsHabitsModalOpen(true)}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 hover:border-amber-500/40 shadow-xl flex items-center justify-between cursor-pointer transition group"
        >
          <div>
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Reading Habits
            </span>
            <div className="text-sm font-semibold text-slate-100 mt-1">Velocity & Heatmap</div>
            <span className="text-[11px] text-slate-400 group-hover:text-amber-400 flex items-center gap-1 mt-1 transition">
              View streaks & Pomodoro <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Backup & Export */}
        <div
          onClick={() => setIsBackupModalOpen(true)}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 hover:border-sky-500/40 shadow-xl flex items-center justify-between cursor-pointer transition group"
        >
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Data Sovereignty
            </span>
            <div className="text-sm font-semibold text-slate-100 mt-1">.lumina Full Backup</div>
            <span className="text-[11px] text-sky-400 group-hover:underline flex items-center gap-1 mt-1">
              <Database className="w-3 h-3" /> Export / Restore Library
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Library Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, authors, or tags..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500"
          />
        </div>

        {/* Action Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Deep Search Index Modal Launcher */}
          {onOpenSearchIndex && (
            <button
              onClick={onOpenSearchIndex}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Full-Text Deep Search across all books (Ctrl/Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Deep Search</span>
              <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Reading Progress Sync Modal Launcher */}
          {onOpenSyncModal && (
            <button
              onClick={onOpenSyncModal}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-400 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Sync reading positions & highlights across devices"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Sync Progress</span>
            </button>
          )}

          {/* Annotation & Notes Manager Launcher */}
          {onOpenAnnotationManager && (
            <button
              onClick={onOpenAnnotationManager}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="View, search, edit & export all highlights and notes"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-400" />
              <span>Annotations</span>
            </button>
          )}

          {/* Bulk Selection Mode Toggle */}
          <button
            onClick={() => {
              setIsBulkMode((prev) => !prev);
              setSelectedBookIds(new Set());
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
              isBulkMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isBulkMode ? 'Done Selecting' : 'Select'}</span>
          </button>

          {/* Backup Button */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Backup & Restore Library (.lumina)"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* File Importer Launcher */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".epub,.pdf,.txt,.md"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => {
              if (onOpenFileImporter) {
                onOpenFileImporter();
              } else {
                fileInputRef.current?.click();
              }
            }}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition cursor-pointer"
            title="Import EPUB, TXT, MD, PDF or Web Articles"
          >
            <FileUp className="w-4 h-4" />
            <span>{isImporting ? 'Importing...' : 'File Importer'}</span>
          </button>
        </div>
      </div>

      {/* Shelves & Collections Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All ({books.length})
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'reading'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Currently Reading
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeTab === 'favorites'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Star className="w-3 h-3 fill-current" />
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setActiveTab('finished')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeTab === 'finished'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Finished</span>
        </button>

        {/* User custom shelves */}
        {shelves.map((shelf) => {
          const count = books.filter((b) => b.shelfId === shelf.id).length;
          return (
            <div key={shelf.id} className="flex items-center">
              <button
                onClick={() => setActiveTab(shelf.id)}
                className={`px-3 py-1.5 rounded-l-xl text-xs font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeTab === shelf.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>
                  {shelf.name} ({count})
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteShelf(shelf.id);
                }}
                className={`px-1.5 py-1.5 rounded-r-xl text-[10px] transition cursor-pointer ${
                  activeTab === shelf.id
                    ? 'bg-amber-600 text-slate-950'
                    : 'text-slate-500 hover:text-rose-400 hover:bg-slate-900'
                }`}
                title="Delete shelf"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Add custom shelf button */}
        <button
          onClick={() => setIsNewShelfModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-900 border border-dashed border-slate-700/80 transition whitespace-nowrap flex items-center gap-1 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>New Shelf</span>
        </button>
      </div>

      {/* Layout Toolbar: View Mode & Sort Dropdown */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-200">{sortedBooks.length}</strong> books
          </span>
          {activeTab !== 'all' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-amber-400 font-medium">
              Filtered
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="recent">Recently Read</option>
              <option value="title">Title (A-Z)</option>
              <option value="author">Author (A-Z)</option>
              <option value="progress">Progress (%)</option>
              <option value="words">Length (Word Count)</option>
            </select>
          </div>

          {/* Grid vs List View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500/20 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500/20 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Compact List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar when 1+ books are selected */}
      {isBulkMode && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1.5 font-medium cursor-pointer"
            >
              {selectedBookIds.size === filteredBooks.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedBookIds.size === filteredBooks.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-xs text-slate-300 font-mono">
              {selectedBookIds.size} of {filteredBooks.length} books selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkShelfModalOpen(true)}
              disabled={selectedBookIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Assign Shelf</span>
            </button>

            <button
              onClick={() => setIsBulkTagModalOpen(true)}
              disabled={selectedBookIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Tag</span>
            </button>

            <button
              onClick={handleBulkMarkFinished}
              disabled={selectedBookIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Read</span>
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={selectedBookIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          isDragging
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-slate-800 text-slate-400">
            <Upload className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xs font-medium text-slate-200">
            Drop EPUB, PDF, Markdown, or TXT files here to add to your library
          </div>
          <div className="text-[11px] text-slate-400">
            Zero network transmission · Everything remains 100% encrypted in your local browser IndexedDB
          </div>
        </div>
      </div>

      {/* Books Shelf Grid or Compact List */}
      {sortedBooks.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm space-y-2">
          <BookOpen className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
          <p>No books found in this shelf or search filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedBooks.map((book) => {
            const progress = book.readingProgress?.percentage || 0;
            const estMinutes = estimateReadingTimeMinutes(book.totalWords);
            const isSelected = selectedBookIds.has(book.id);
            const shelfObj = shelves.find((s) => s.id === book.shelfId);

            return (
              <div
                key={book.id}
                onClick={() => {
                  if (isBulkMode) {
                    setSelectedBookIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(book.id)) next.delete(book.id);
                      else next.add(book.id);
                      return next;
                    });
                  } else {
                    onSelectBook(book);
                  }
                }}
                className={`group relative flex flex-col rounded-2xl bg-slate-900 border shadow-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/50'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Book Cover Aesthetic */}
                <div
                  className={`h-52 bg-gradient-to-br ${
                    book.coverGradient || 'from-slate-800 to-slate-950'
                  } p-5 flex flex-col justify-between relative select-none`}
                >
                  {/* Book Spine 3D simulation on left edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20 border-r border-white/10" />

                  {/* Top Badge: Format, Bulk Checkbox & Favorite */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      {isBulkMode && (
                        <div
                          onClick={(e) => handleToggleSelectBook(e, book.id)}
                          className="p-1 rounded-md bg-black/60 backdrop-blur-xs text-amber-400 hover:text-amber-300"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 fill-amber-500 text-slate-950" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-300 border border-white/10">
                        {book.format}
                      </span>
                      {shelfObj && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30 font-medium">
                          {shelfObj.name}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, book)}
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-slate-400 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          book.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title & Author on Cover */}
                  <div className="z-10 pl-2">
                    <h3 className="font-serif font-bold text-lg text-white leading-snug line-clamp-2 drop-shadow-md">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 font-medium drop-shadow-xs">
                      {book.author}
                    </p>
                  </div>

                  {/* Bottom decorative subtle lines */}
                  <div className="flex items-center gap-1 z-10 pl-2 opacity-60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] text-white/80 font-mono">Lumina Edition</span>
                  </div>
                </div>

                {/* Book Details & Reading Progress */}
                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>

                  {/* Tags */}
                  {book.tags && book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 border border-slate-700/60"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{progress > 0 ? `${progress}% Completed` : 'Not Started'}</span>
                      <span>~{estMinutes}m total</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-amber-400 font-semibold group-hover:underline flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{progress > 0 ? 'Resume Reading' : 'Start Reading'}</span>
                    </span>

                    <button
                      onClick={(e) => handleDeleteBook(e, book.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List / Table View */
        <div className="space-y-2">
          {sortedBooks.map((book) => {
            const progress = book.readingProgress?.percentage || 0;
            const estMinutes = estimateReadingTimeMinutes(book.totalWords);
            const isSelected = selectedBookIds.has(book.id);
            const shelfObj = shelves.find((s) => s.id === book.shelfId);

            return (
              <div
                key={book.id}
                onClick={() => {
                  if (isBulkMode) {
                    setSelectedBookIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(book.id)) next.delete(book.id);
                      else next.add(book.id);
                      return next;
                    });
                  } else {
                    onSelectBook(book);
                  }
                }}
                className={`group flex items-center justify-between p-3 rounded-2xl bg-slate-900 border transition cursor-pointer hover:border-slate-700 ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/40 bg-slate-900/90'
                    : 'border-slate-800'
                }`}
              >
                {/* Left: Checkbox + Mini Cover Thumbnail + Title/Author */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isBulkMode && (
                    <div
                      onClick={(e) => handleToggleSelectBook(e, book.id)}
                      className="p-1 rounded-md text-amber-400 hover:text-amber-300"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-amber-500 text-slate-950" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  )}

                  {/* Thumbnail Cover */}
                  <div
                    className={`w-10 h-14 shrink-0 rounded-lg bg-gradient-to-br ${
                      book.coverGradient || 'from-slate-800 to-slate-950'
                    } p-1 flex flex-col justify-between border border-white/10 shadow-sm relative overflow-hidden`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30" />
                    <span className="text-[8px] font-mono text-amber-300 font-bold uppercase pl-1">
                      {book.format}
                    </span>
                    <div className="pl-1">
                      <div className="w-4 h-0.5 bg-white/40 rounded-full" />
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-slate-100 group-hover:text-amber-400 transition truncate">
                        {book.title}
                      </h4>
                      {shelfObj && (
                        <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/20 font-medium shrink-0">
                          {shelfObj.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{book.author}</span>
                      <span className="text-slate-600">•</span>
                      <span>{book.totalWords.toLocaleString()} words</span>
                      <span className="text-slate-600 hidden md:inline">•</span>
                      <span className="hidden md:inline">~{estMinutes} min read</span>
                    </div>
                  </div>
                </div>

                {/* Center / Right: Progress Bar & Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Progress info */}
                  <div className="w-24 sm:w-32 hidden sm:block">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{progress}%</span>
                      <span>{progress === 100 ? 'Finished' : progress > 0 ? 'In Progress' : 'Unread'}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Favorite Star */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, book)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                    title={book.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        book.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Read / Resume button */}
                  <button
                    onClick={() => onSelectBook(book)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{progress > 0 ? 'Resume' : 'Read'}</span>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteBook(e, book.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Delete book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Library Summary & Navigation Controls */}
      {sortedBooks.length > 0 && (
        <footer className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Showing {sortedBooks.length} of {books.length} {books.length === 1 ? 'title' : 'titles'} · 100% offline Dexie database
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Book</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <span>Back to Top</span>
              <span>↑</span>
            </button>
          </div>
        </footer>
      )}

      {/* Modal: Create New Shelf */}
      {isNewShelfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-semibold">Create Custom Shelf</span>
              <button
                onClick={() => setIsNewShelfModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. Philosophy, Sci-Fi Classics, Work Research"
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateShelf()}
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNewShelfModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateShelf}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
              >
                Create Shelf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Assign Shelf */}
      {isBulkShelfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-semibold">Assign to Shelf</span>
              <button
                onClick={() => setIsBulkShelfModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <button
                onClick={() => handleBulkAssignShelf(null)}
                className="w-full text-left p-2 rounded-xl hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-2"
              >
                <span>None (Remove from shelf)</span>
              </button>
              {shelves.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleBulkAssignShelf(s.id)}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Add Tag */}
      {isBulkTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-semibold">Add Tag to Selected Books</span>
              <button
                onClick={() => setIsBulkTagModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. masterpiece, must-read, research"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBulkAddTag()}
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBulkTagModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddTag}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
              >
                Apply Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Book Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <h3 className="font-semibold text-slate-100">Remove from Library?</h3>
            <p className="text-xs text-slate-400">
              This action will permanently delete the book, highlights, and bookmarks from your offline library.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBook}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Shelf Modal */}
      {shelfToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <h3 className="font-semibold text-slate-100">Delete Shelf?</h3>
            <p className="text-xs text-slate-400">
              Books on this shelf will remain in your library, but the shelf itself will be deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShelfToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteShelf}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Bulk Delete Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <h3 className="font-semibold text-slate-100">Remove {selectedBookIds.size} Books?</h3>
            <p className="text-xs text-slate-400">
              This action will permanently delete these books, their highlights, and bookmarks from your library.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onLibraryChanged={onRefreshBooks}
      />

      {/* Reading Habits Dashboard */}
      <ReadingHabitsDashboard
        isOpen={isHabitsModalOpen}
        onClose={() => setIsHabitsModalOpen(false)}
      />

      {/* Soundscape & Warmth Modal */}
      {settings && onUpdateSettings && (
        <SoundscapeModal
          isOpen={isSoundscapeModalOpen}
          onClose={() => setIsSoundscapeModalOpen(false)}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}
    </div>
  );
};
