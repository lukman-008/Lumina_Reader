import React, { useState, useMemo } from 'react';
import {
  X,
  List,
  Highlighter,
  Bookmark as BookmarkIcon,
  Download,
  Trash2,
  Clock,
  Search,
  Copy,
  Check,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import type { Book, BookChapter, Highlight, Bookmark } from '../types';
import { estimateReadingTimeMinutes } from '../services/bookParser';

interface TOCDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: BookChapter[];
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
}

export const TOCDrawer: React.FC<TOCDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterIndex,
  onSelectChapter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredChapters = chapters
    .map((ch, idx) => ({ ch, idx }))
    .filter(({ ch }) => ch.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <aside
        className="fixed left-0 top-0 bottom-0 w-80 sm:w-96 bg-slate-900 border-r border-slate-800 z-40 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 select-none"
        aria-label="Table of Contents"
      >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Table of Contents</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Search Chapters */}
      <div className="p-2 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter chapters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredChapters.map(({ ch, idx }) => {
          const isActive = idx === currentChapterIndex;
          const readTime = estimateReadingTimeMinutes(ch.wordCount);
          return (
            <button
              key={ch.id || idx}
              onClick={() => {
                onSelectChapter(idx);
                onClose();
              }}
              className={`w-full text-left p-3 rounded-xl transition flex items-start justify-between gap-3 cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs line-clamp-2 leading-relaxed">{ch.title}</span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {ch.wordCount.toLocaleString()} words
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 mt-0.5 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{readTime}m</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
    </>
  );
};

interface AnnotationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  bookmarks: Bookmark[];
  onDeleteHighlight: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onJumpToBookmark: (bm: Bookmark) => void;
  onJumpToHighlight?: (h: Highlight) => void;
  onUpdateBookmark?: (id: string, label: string) => void;
  bookTitle: string;
}

export const AnnotationsDrawer: React.FC<AnnotationsDrawerProps> = ({
  isOpen,
  onClose,
  highlights,
  bookmarks,
  onDeleteHighlight,
  onDeleteBookmark,
  onJumpToBookmark,
  onJumpToHighlight,
  onUpdateBookmark,
  bookTitle,
}) => {
  const [tab, setTab] = useState<'highlights' | 'notes' | 'bookmarks'>('highlights');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState('');

  if (!isOpen) return null;

  const exportAnnotationsToMarkdown = () => {
    let md = `# Annotations for ${bookTitle}\n*Generated by Lumina Reader*\n\n`;

    if (highlights.length > 0) {
      md += `## Highlights & Notes (${highlights.length})\n\n`;
      highlights.forEach((h) => {
        md += `> "${h.selectedText}"\n\n`;
        if (h.note) md += `*Note: ${h.note}*\n\n`;
        md += `---\n\n`;
      });
    }

    if (bookmarks.length > 0) {
      md += `## Bookmarks (${bookmarks.length})\n\n`;
      bookmarks.forEach((b) => {
        md += `- **${b.label}**: "${b.snippet}" (${new Date(b.createdAt).toLocaleDateString()})\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.replace(/\s+/g, '_')}_annotations.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLOR_CLASSES: Record<Highlight['color'], string> = {
    yellow: 'bg-amber-400/20 border-amber-400/40 text-amber-200',
    emerald: 'bg-emerald-400/20 border-emerald-400/40 text-emerald-200',
    sky: 'bg-sky-400/20 border-sky-400/40 text-sky-200',
    rose: 'bg-rose-400/20 border-rose-400/40 text-rose-200',
    amber: 'bg-orange-400/20 border-orange-400/40 text-orange-200',
    violet: 'bg-purple-400/20 border-purple-400/40 text-purple-200',
  };

  const handleCopyQuote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  // Filter highlights
  const filteredHighlights = highlights.filter((h) => {
    if (selectedColorFilter !== 'all' && h.color !== selectedColorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        h.selectedText.toLowerCase().includes(q) ||
        (h.note && h.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter bookmarks
  const filteredBookmarks = bookmarks.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.label.toLowerCase().includes(q) || b.snippet.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <aside
        className="fixed left-0 top-0 bottom-0 w-80 sm:w-96 bg-slate-900 border-r border-slate-800 z-40 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 select-none text-slate-200"
        aria-label="Annotations & Highlights"
      >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Notebook & Annotations</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1">
        <button
          onClick={() => setTab('highlights')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            tab === 'highlights'
              ? 'bg-slate-800 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span>Highlights ({highlights.length})</span>
        </button>
        <button
          onClick={() => setTab('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            tab === 'notes'
              ? 'bg-slate-800 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Notes ({highlights.filter(h => h.note).length})</span>
        </button>
        <button
          onClick={() => setTab('bookmarks')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            tab === 'bookmarks'
              ? 'bg-slate-800 text-amber-300 font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookmarkIcon className="w-3.5 h-3.5" />
          <span>Bookmarks ({bookmarks.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={tab === 'highlights' ? 'Search quotes...' : tab === 'notes' ? 'Search notes...' : 'Search bookmarks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {(tab === 'highlights' || tab === 'notes') && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedColorFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium cursor-pointer ${
                selectedColorFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedColorFilter('yellow')}
              className={`w-4 h-4 rounded-full bg-amber-400 cursor-pointer ${
                selectedColorFilter === 'yellow' ? 'ring-2 ring-white' : 'opacity-70'
              }`}
              title="Gold"
            />
            <button
              onClick={() => setSelectedColorFilter('emerald')}
              className={`w-4 h-4 rounded-full bg-emerald-400 cursor-pointer ${
                selectedColorFilter === 'emerald' ? 'ring-2 ring-white' : 'opacity-70'
              }`}
              title="Mint"
            />
            <button
              onClick={() => setSelectedColorFilter('sky')}
              className={`w-4 h-4 rounded-full bg-sky-400 cursor-pointer ${
                selectedColorFilter === 'sky' ? 'ring-2 ring-white' : 'opacity-70'
              }`}
              title="Sky"
            />
            <button
              onClick={() => setSelectedColorFilter('rose')}
              className={`w-4 h-4 rounded-full bg-rose-400 cursor-pointer ${
                selectedColorFilter === 'rose' ? 'ring-2 ring-white' : 'opacity-70'
              }`}
              title="Rose"
            />
            <button
              onClick={() => setSelectedColorFilter('amber')}
              className={`w-4 h-4 rounded-full bg-orange-400 cursor-pointer ${
                selectedColorFilter === 'amber' ? 'ring-2 ring-white' : 'opacity-70'
              }`}
              title="Orange"
            />
            <button
              onClick={() => setSelectedColorFilter('violet')}
              className={`w-4 h-4 rounded-full bg-purple-400 cursor-pointer ${
                selectedColorFilter === 'violet' ? 'ring-2 ring-white' : 'opacity-70'
              }`}
              title="Purple"
            />
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {(tab === 'highlights' || tab === 'notes') && (
          <>
            {filteredHighlights.filter(h => tab === 'notes' ? !!h.note : true).length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                {highlights.length === 0
                  ? 'Select any text while reading to highlight passages, attach thoughts, and export notes.'
                  : `No ${tab} match the current filter.`}
              </div>
            ) : (
              filteredHighlights.filter(h => tab === 'notes' ? !!h.note : true).map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    if (onJumpToHighlight) {
                      onJumpToHighlight(h);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-xl border relative group text-xs leading-relaxed transition cursor-pointer hover:border-amber-500/50 ${
                    COLOR_CLASSES[h.color] || COLOR_CLASSES.yellow
                  }`}
                >
                  <p className="italic font-serif">"{h.selectedText}"</p>
                  {h.note && (
                    <p className="mt-2 pt-2 border-t border-white/10 text-[11px] text-slate-200 font-sans">
                      💬 {h.note}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400 font-sans">
                    <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleCopyQuote(h.id, h.selectedText)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-black/20"
                        title="Copy quote"
                      >
                        {copiedId === h.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteHighlight(h.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-black/20"
                        title="Delete highlight"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'bookmarks' && (
          <>
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                {bookmarks.length === 0
                  ? 'Click the bookmark icon or press Ctrl/⌘+B to save reading spots.'
                  : 'No bookmarks match the current search.'}
              </div>
            ) : (
              filteredBookmarks.map((b) => {
                const isEditing = editingBookmarkId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (!isEditing) {
                        onJumpToBookmark(b);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 cursor-pointer transition relative group"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-amber-300 mb-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingLabelText}
                          onChange={(e) => setEditingLabelText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateBookmark?.(b.id, editingLabelText.trim() || b.label);
                              setEditingBookmarkId(null);
                            }
                          }}
                          autoFocus
                          className="px-1.5 py-0.5 rounded bg-slate-950 border border-amber-500 text-xs text-white"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <BookmarkIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{b.label}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {isEditing ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBookmark?.(b.id, editingLabelText.trim() || b.label);
                              setEditingBookmarkId(null);
                            }}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBookmarkId(b.id);
                              setEditingLabelText(b.label);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-400"
                            title="Rename bookmark"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBookmark(b.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="Delete bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 italic">"{b.snippet}"</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-sans">
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      <span className="text-amber-400 group-hover:underline flex items-center gap-0.5">
                        Jump to page <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Export footer */}
      {(highlights.length > 0 || bookmarks.length > 0) && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={exportAnnotationsToMarkdown}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Notes as Markdown (.md)</span>
          </button>
        </div>
      )}
    </aside>
    </>
  );
};
