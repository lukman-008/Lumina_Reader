import React, { useState, useEffect, useMemo } from 'react';
import {
  Highlighter,
  MessageSquare,
  Bookmark as BookmarkIcon,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  Download,
  Edit2,
  X,
  FileText,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { Book, Highlight, Bookmark } from '../types';
import { db } from '../services/db';

interface AnnotationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  currentBook?: Book | null;
  onNavigateToHighlight?: (bookId: string, chapterIndex: number, text: string, highlightId?: string) => void;
  onRefreshData?: () => void;
}

const COLOR_MAP: Record<Highlight['color'], { label: string; bg: string; border: string; text: string }> = {
  yellow: { label: 'Gold', bg: 'bg-amber-400/15', border: 'border-amber-400/40', text: 'text-amber-300' },
  emerald: { label: 'Mint', bg: 'bg-emerald-400/15', border: 'border-emerald-400/40', text: 'text-emerald-300' },
  sky: { label: 'Sky', bg: 'bg-sky-400/15', border: 'border-sky-400/40', text: 'text-sky-300' },
  rose: { label: 'Rose', bg: 'bg-rose-400/15', border: 'border-rose-400/40', text: 'text-rose-300' },
  amber: { label: 'Orange', bg: 'bg-orange-400/15', border: 'border-orange-400/40', text: 'text-orange-300' },
  violet: { label: 'Purple', bg: 'bg-purple-400/15', border: 'border-purple-400/40', text: 'text-purple-300' },
};

export const AnnotationManagerModal: React.FC<AnnotationManagerModalProps> = ({
  isOpen,
  onClose,
  books,
  currentBook,
  onNavigateToHighlight,
  onRefreshData,
}) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(currentBook ? currentBook.id : 'all');
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'highlights' | 'bookmarks'>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [copiedBatch, setCopiedBatch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const allHls = await db.highlights.toArray();
    const allBms = await db.bookmarks.toArray();
    setHighlights(allHls);
    setBookmarks(allBms);
  };

  const booksMap = useMemo(() => {
    const map = new Map<string, Book>();
    books.forEach((b) => map.set(b.id, b));
    return map;
  }, [books]);

  // Combined filtered items
  const filteredHighlights = useMemo(() => {
    return highlights.filter((h) => {
      // Book filter
      if (selectedBookId !== 'all' && h.bookId !== selectedBookId) return false;

      // Type filter
      if (filterType === 'notes' && !h.note) return false;
      if (filterType === 'highlights' && h.note) return false;
      if (filterType === 'bookmarks') return false;

      // Color filter
      if (filterColor !== 'all' && h.color !== filterColor) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = h.selectedText.toLowerCase().includes(q);
        const noteMatch = h.note ? h.note.toLowerCase().includes(q) : false;
        if (!textMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [highlights, selectedBookId, filterType, filterColor, searchQuery]);

  const filteredBookmarks = useMemo(() => {
    if (filterType === 'highlights' || filterType === 'notes') return [];
    return bookmarks.filter((b) => {
      if (selectedBookId !== 'all' && b.bookId !== selectedBookId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const labelMatch = b.label.toLowerCase().includes(q);
        const snippetMatch = b.snippet.toLowerCase().includes(q);
        if (!labelMatch && !snippetMatch) return false;
      }
      return true;
    });
  }, [bookmarks, selectedBookId, filterType, searchQuery]);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredHighlights.length + filteredBookmarks.length) {
      setSelectedIds(new Set());
    } else {
      const all = new Set<string>();
      filteredHighlights.forEach((h) => all.add(h.id));
      filteredBookmarks.forEach((b) => all.add(b.id));
      setSelectedIds(all);
    }
  };

  // Delete single highlight
  const handleDeleteHighlight = async (id: string) => {
    await db.highlights.delete(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    onRefreshData?.();
  };

  // Delete single bookmark
  const handleDeleteBookmark = async (id: string) => {
    await db.bookmarks.delete(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    onRefreshData?.();
  };

  // Batch delete selected
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await db.highlights.delete(id);
      await db.bookmarks.delete(id);
    }
    setSelectedIds(new Set());
    loadData();
    onRefreshData?.();
  };

  // Save edited note
  const handleSaveNote = async (id: string) => {
    await db.highlights.update(id, { note: editNoteText.trim() || undefined, updatedAt: Date.now() });
    setEditingHighlightId(null);
    loadData();
    onRefreshData?.();
  };

  // Batch copy formatted quotes to clipboard
  const handleBatchCopy = () => {
    const selectedHls = highlights.filter((h) => selectedIds.has(h.id));
    if (selectedHls.length === 0) return;

    const formatted = selectedHls
      .map((h) => {
        const book = booksMap.get(h.bookId);
        const bookTitle = book ? book.title : 'Book';
        return `> "${h.selectedText}"\n— *${bookTitle}*, Chapter ${h.chapterIndex + 1}${
          h.note ? `\nNote: ${h.note}` : ''
        }\n`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(formatted);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  // Batch export to Markdown
  const handleExportMarkdown = () => {
    const targetHls =
      selectedIds.size > 0
        ? highlights.filter((h) => selectedIds.has(h.id))
        : filteredHighlights;

    let md = `# Lumina Reader — Annotations & Reading Notes\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    targetHls.forEach((h, i) => {
      const book = booksMap.get(h.bookId);
      md += `### ${i + 1}. ${book?.title || 'Unknown Book'} (Chapter ${h.chapterIndex + 1})\n`;
      md += `> "${h.selectedText}"\n\n`;
      if (h.note) {
        md += `**Reflection Note**: ${h.note}\n\n`;
      }
      md += `*Saved on ${new Date(h.createdAt).toLocaleDateString()}* · Tag: ${h.color}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_annotations_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Highlighter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                <span>Annotation & Notes Manager</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-normal text-slate-300">
                  {highlights.length} highlights · {highlights.filter((h) => h.note).length} notes
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Organize, search, edit, and export in-text passages and reflections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Export to Markdown for Notion or Obsidian"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quotes or personal notes..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            {/* Book Selector */}
            <div className="relative">
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Books ({books.length})</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Selector */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="notes">Notes Only 📝</option>
                <option value="highlights">Plain Highlights</option>
                <option value="bookmarks">Bookmarks 🔖</option>
              </select>
            </div>
          </div>

          {/* Color filter chips & Batch actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Color:</span>
              <button
                onClick={() => setFilterColor('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] transition ${
                  filterColor === 'all'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {Object.entries(COLOR_MAP).map(([cKey, cVal]) => (
                <button
                  key={cKey}
                  onClick={() => setFilterColor(cKey)}
                  className={`px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 transition ${
                    filterColor === cKey ? `${cVal.bg} ${cVal.text} font-medium border ${cVal.border}` : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cVal.bg.replace('/15', '')}`} />
                  <span>{cVal.label}</span>
                </button>
              ))}
            </div>

            {/* Batch actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                <span className="text-amber-400 font-medium">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleBatchCopy}
                  className="hover:text-white text-slate-300 flex items-center gap-1 transition"
                >
                  {copiedBatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={handleBatchDelete}
                  className="hover:text-rose-400 text-slate-300 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredHighlights.length === 0 && filteredBookmarks.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Highlighter className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No annotations matching the active filters.</p>
              <p className="text-[11px] text-slate-600">
                Select text in any book to highlight passages or attach reflection notes.
              </p>
            </div>
          ) : (
            <>
              {/* Highlights & Notes */}
              {filteredHighlights.map((hl) => {
                const book = booksMap.get(hl.bookId);
                const colorInfo = COLOR_MAP[hl.color] || COLOR_MAP.yellow;
                const isEditing = editingHighlightId === hl.id;
                const isSelected = selectedIds.has(hl.id);

                return (
                  <div
                    key={hl.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isSelected
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-xs'
                        : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(hl.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                        >
                          {colorInfo.label}
                        </span>
                        {hl.scope && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                            {hl.scope}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium truncate">
                          {book?.title || 'Book'} · Ch. {hl.chapterIndex + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        {onNavigateToHighlight && (
                          <button
                            onClick={() => {
                              onNavigateToHighlight(hl.bookId, hl.chapterIndex, hl.selectedText, hl.id);
                              onClose();
                            }}
                            className="p-1 hover:text-amber-400 rounded transition cursor-pointer"
                            title="Jump to reading position"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingHighlightId(hl.id);
                            setEditNoteText(hl.note || '');
                          }}
                          className="p-1 hover:text-white rounded transition cursor-pointer"
                          title="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHighlight(hl.id)}
                          className="p-1 hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete highlight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quote Text */}
                    <blockquote className="text-xs text-slate-200 font-serif leading-relaxed mt-2 pl-3 border-l-2 border-amber-500/50 italic">
                      "{hl.selectedText}"
                    </blockquote>

                    {/* Note Box */}
                    {isEditing ? (
                      <div className="mt-2.5 p-2 rounded-lg bg-slate-900 border border-slate-700 space-y-2">
                        <textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          placeholder="Type personal reflection note..."
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-md p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
                        />
                        <div className="flex justify-end gap-1.5 text-xs">
                          <button
                            onClick={() => setEditingHighlightId(null)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(hl.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-md"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : hl.note ? (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-200/95 font-sans bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{hl.note}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {/* Bookmarks */}
              {filteredBookmarks.map((bm) => {
                const book = booksMap.get(bm.bookId);
                const isSelected = selectedIds.has(bm.id);

                return (
                  <div
                    key={bm.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isSelected
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-xs'
                        : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(bm.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        <BookmarkIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-slate-200">
                          {bm.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {book?.title} · Page {bm.pageIndex + 1}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteBookmark(bm.id)}
                        className="p-1 hover:text-rose-400 text-slate-500 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {bm.snippet && (
                      <p className="text-xs text-slate-400 font-serif italic mt-1.5 line-clamp-2 pl-3 border-l-2 border-slate-700">
                        "{bm.snippet}"
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
