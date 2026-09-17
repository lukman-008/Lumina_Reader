import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  X,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Book, SearchIndexResult } from '../types';
import { searchIndex } from '../services/searchIndexService';

interface SearchIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  currentBook?: Book | null;
  onNavigateToResult: (bookId: string, chapterIndex: number, matchSnippet: string) => void;
}

export const SearchIndexModal: React.FC<SearchIndexModalProps> = ({
  isOpen,
  onClose,
  books,
  currentBook,
  onNavigateToResult,
}) => {
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'all'>(
    currentBook ? 'current' : 'all'
  );
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Execute indexed search
  const results = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];

    let rawResults: SearchIndexResult[] = [];
    if (searchScope === 'current' && currentBook) {
      rawResults = searchIndex.searchInBook(currentBook, query, 100);
    } else {
      rawResults = searchIndex.searchLibrary(books, query, 120);
    }

    if (selectedChapterIndex !== 'all') {
      return rawResults.filter((r) => r.chapterIndex === selectedChapterIndex);
    }

    return rawResults;
  }, [query, searchScope, currentBook, books, selectedChapterIndex]);

  // Highlight matched term in snippet
  const renderHighlightedSnippet = (snippet: string, term: string) => {
    if (!term) return snippet;
    const parts = snippet.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-400/30 text-amber-300 font-semibold px-0.5 rounded-xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header & Search Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide">
                Full-Text Search Index
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Esc</kbd> to close
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchScope === 'current' && currentBook
                  ? `Search inside "${currentBook.title}"...`
                  : 'Search indexed chapters across all books...'
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700/90 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Bar: Scope & Chapter Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              {currentBook && (
                <button
                  onClick={() => setSearchScope('current')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    searchScope === 'current'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95/60'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Current Book</span>
                </button>
              )}

              <button
                onClick={() => setSearchScope('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  searchScope === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95/60'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>All Books ({books.length})</span>
              </button>
            </div>

            {/* Chapter filter if current book selected */}
            {searchScope === 'current' && currentBook && (currentBook.chapters?.length || 0) > 1 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Filter className="w-3 h-3" />
                <select
                  value={selectedChapterIndex}
                  onChange={(e) =>
                    setSelectedChapterIndex(
                      e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                    )
                  }
                  className="bg-slate-950 border border-slate-700/80 rounded-md px-2 py-0.5 text-slate-200 focus:outline-none"
                >
                  <option value="all">All Chapters ({(currentBook.chapters?.length || 0)})</option>
                  {(currentBook.chapters || []).map((ch, idx) => (
                    <option key={ch.id} value={idx}>
                      {ch.title.slice(0, 30)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-mono">
              {query.trim().length >= 2 ? (
                <span>
                  {results.length} {results.length === 1 ? 'match' : 'matches'}
                </span>
              ) : (
                <span>Type 2+ characters</span>
              )}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {query.trim().length < 2 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">
                Search passages, terminology, character names, or phrases across your offline books.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {['philosophy', 'chapter', 'light', 'mind', 'memory'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No indexed occurrences matching "{query}".</p>
              <span className="text-[11px] text-slate-600 block">
                Try searching for a partial word or switching search scope to All Books.
              </span>
            </div>
          ) : (
            results.map((res, index) => (
              <div
                key={`${res.bookId}-${res.chapterIndex}-${index}`}
                onClick={() => {
                  onNavigateToResult(res.bookId, res.chapterIndex, res.matchSnippet);
                  onClose();
                }}
                className="group p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 active:scale-95/80 active:scale-[0.98] border border-slate-800 hover:border-amber-500/40 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-amber-400 group-hover:underline">
                      {res.chapterTitle}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 text-[11px]">{res.bookTitle}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
                </div>

                <p className="text-xs text-slate-300 font-serif leading-relaxed line-clamp-3">
                  {renderHighlightedSnippet(res.matchSnippet, res.matchTerm)}
                </p>

                <div className="flex items-center justify-end text-[10px] text-slate-500 group-hover:text-amber-400/80 transition">
                  <span className="flex items-center gap-1">
                    Jump to chapter <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
