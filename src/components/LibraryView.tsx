import React, { useState, useRef, useEffect } from 'react';
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
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  onSelectBook,
  onRefreshBooks,
  onOpenExportGuide,
  settings,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' | 'reading' | 'favorites' | 'finished' | shelf.id
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk actions state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');
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
  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase();
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
    if (confirm('Remove this book from your offline library?')) {
      await db.books.delete(id);
      await db.highlights.where('bookId').equals(id).delete();
      await db.bookmarks.where('bookId').equals(id).delete();
      onRefreshBooks();
    }
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
    if (confirm('Delete this shelf? (Books on this shelf will remain in your library)')) {
      await db.shelves.delete(shelfId);
      // Remove shelfId from books
      const onShelf = books.filter((b) => b.shelfId === shelfId);
      for (const b of onShelf) {
        await db.books.update(b.id, { shelfId: undefined });
      }
      setShelves((prev) => prev.filter((s) => s.id !== shelfId));
      if (activeTab === shelfId) setActiveTab('all');
      onRefreshBooks();
    }
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

  const handleBulkDelete = async () => {
    if (confirm(`Remove ${selectedBookIds.size} selected books from your library?`)) {
      for (const id of selectedBookIds) {
        await db.books.delete(id);
        await db.highlights.where('bookId').equals(id).delete();
        await db.bookmarks.where('bookId').equals(id).delete();
      }
      setSelectedBookIds(new Set());
      setIsBulkMode(false);
      onRefreshBooks();
    }
  };

  // Stats calculation
  const totalWords = books.reduce((acc, b) => acc + (b.totalWords || 0), 0);
  const totalReadingHours = (totalWords / (220 * 60)).toFixed(1);

  return (
    <div className="min-h-[calc(100vh-2.75rem)] bg-slate-950 text-slate-100 p-6 sm:p-8 pb-28 sm:pb-36 max-w-7xl mx-auto flex flex-col space-y-8 animate-in fade-in duration-200">
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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

        {/* Right action group */}
        <div className="flex items-center gap-2">
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
            <span>{isBulkMode ? 'Done Selecting' : 'Select Books'}</span>
          </button>

          {/* Backup Button */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Backup & Restore Library (.lumina)"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Import Action */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".epub,.pdf,.txt,.md"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isImporting ? 'Importing...' : 'Import Book'}</span>
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

      {/* Books Shelf Grid */}
      {filteredBooks.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm space-y-2">
          <BookOpen className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
          <p>No books found in this shelf or search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const progress = book.readingProgress?.percentage || 0;
            const estMinutes = estimateReadingTimeMinutes(book.totalWords);
            const isSelected = selectedBookIds.has(book.id);

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
      )}

      {/* Bottom Library Summary & Navigation Controls */}
      {filteredBooks.length > 0 && (
        <footer className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Showing {filteredBooks.length} of {books.length} {books.length === 1 ? 'title' : 'titles'} · 100% offline Dexie database
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
