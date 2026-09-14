import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Zap,
  List,
  Bookmark as BookmarkIcon,
} from 'lucide-react';
import type { Book, ReaderSettings } from '../types';
import { estimateReadingTimeMinutes } from '../services/bookParser';

interface ReadingProgressBarProps {
  book: Book;
  currentChapterIndex: number;
  currentPageIndex: number;
  totalPagesInChapter: number;
  wordsPerPage: number;
  onNavigatePage: (pageIndex: number) => void;
  onNavigateChapter: (chapterIndex: number) => void;
  onOpenTOC: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  accentClass: string;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  book,
  currentChapterIndex,
  currentPageIndex,
  totalPagesInChapter,
  wordsPerPage,
  onNavigatePage,
  onNavigateChapter,
  onOpenTOC,
  isBookmarked,
  onToggleBookmark,
  settings,
  onUpdateSettings,
  accentClass,
}) => {
  const [isHoveringBar, setIsHoveringBar] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<{
    percent: number;
    chapterIndex: number;
    x: number;
  } | null>(null);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const currentChapter = (book.chapters || [])[currentChapterIndex] || (book.chapters || [])[0];
  const totalChapters = (book.chapters || []).length;

  // Calculate book-wide progress
  const bookProgressPercent = Math.min(
    100,
    Math.round(
      ((currentChapterIndex + (currentPageIndex + 1) / Math.max(1, totalPagesInChapter)) /
        Math.max(1, totalChapters)) *
        100
    )
  );

  // Calculate chapter progress
  const chapterProgressPercent = Math.min(
    100,
    Math.round(((currentPageIndex + 1) / Math.max(1, totalPagesInChapter)) * 100)
  );

  // Time remaining estimates
  const wordsLeftInChapter = Math.max(0, (totalPagesInChapter - currentPageIndex - 1) * wordsPerPage);
  const minutesLeftInChapter = estimateReadingTimeMinutes(wordsLeftInChapter);

  // Total words left in book
  let remainingWordsInBook = wordsLeftInChapter;
  for (let i = currentChapterIndex + 1; i < totalChapters; i++) {
    remainingWordsInBook += (book.chapters || [])[i]?.wordCount || 0;
  }
  const totalHoursLeftInBook = (remainingWordsInBook / (220 * 60)).toFixed(1);

  const displayMode = settings.progressDisplayMode || 'chapter';

  const toggleDisplayMode = () => {
    onUpdateSettings({
      progressDisplayMode: displayMode === 'chapter' ? 'book' : 'chapter',
    });
  };

  // Scrub bar mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const targetChapter = Math.min(totalChapters - 1, Math.floor(percent * totalChapters));

    setHoverPosition({
      percent: Math.round(percent * 100),
      chapterIndex: targetChapter,
      x: e.clientX,
    });
  };

  // Scrub bar click handler (jump to location)
  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;

    // Calculate chapter and page within chapter
    const targetChapterFloat = percent * totalChapters;
    const targetChapterIndex = Math.min(totalChapters - 1, Math.floor(targetChapterFloat));
    onNavigateChapter(targetChapterIndex);
  };

  return (
    <footer
      className="h-12 border-t border-current/10 px-4 sm:px-6 flex items-center justify-between text-xs z-30 shrink-0 select-none backdrop-blur-xs relative"
      aria-label="Reading Navigation & Progress"
    >
      {/* Interactive Floating Hover Preview Tooltip */}
      {isHoveringBar && hoverPosition && (
        <div
          style={{
            left: `${Math.max(100, Math.min(hoverPosition.x - 90, window.innerWidth - 220))}px`,
          }}
          className="fixed bottom-14 z-50 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl text-[11px] text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex flex-col items-center gap-0.5"
        >
          <span className="font-semibold text-amber-400">
            {(book.chapters || [])[hoverPosition.chapterIndex]?.title || 'Chapter'}
          </span>
          <span className="text-[10px] text-slate-400">
            Click to jump · {hoverPosition.percent}% of book
          </span>
        </div>
      )}

      {/* Left: Table of Contents trigger & Chapter label */}
      <div className="flex items-center gap-2 max-w-[30%] sm:max-w-[35%] min-w-0">
        <button
          onClick={onOpenTOC}
          className="p-1 rounded-md hover:bg-current/10 transition flex items-center gap-1.5 text-xs text-inherit opacity-80 hover:opacity-100 cursor-pointer shrink-0"
          title="Open Table of Contents (Ctrl+T)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <span
          onClick={onOpenTOC}
          className="truncate text-xs opacity-75 hover:opacity-100 cursor-pointer font-medium"
          title={currentChapter.title}
        >
          {currentChapter.title}
        </span>
      </div>

      {/* Center: Interactive Scrub Bar & Progress Toggle */}
      <div className="flex-1 max-w-xl mx-4 flex flex-col items-center justify-center gap-1">
        {/* Scrubbable Multi-Chapter Progress Line */}
        <div
          ref={progressBarRef}
          onMouseEnter={() => setIsHoveringBar(true)}
          onMouseLeave={() => {
            setIsHoveringBar(false);
            setHoverPosition(null);
          }}
          onMouseMove={handleMouseMove}
          onClick={handleBarClick}
          className="w-full h-3 flex items-center cursor-pointer group relative py-1"
          title="Click or drag to jump to position"
        >
          {/* Base track */}
          <div className="w-full h-1 rounded-full bg-current/15 group-hover:h-2 transition-all relative overflow-hidden flex">
            {/* Chapter Notch separators if < 30 chapters */}
            {totalChapters > 1 && totalChapters <= 24 && (
              <div className="absolute inset-0 flex justify-between pointer-events-none z-10">
                {Array.from({ length: totalChapters - 1 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ left: `${((i + 1) / totalChapters) * 100}%` }}
                    className="absolute top-0 bottom-0 w-[1px] bg-black/40"
                  />
                ))}
              </div>
            )}

            {/* Active progress fill */}
            <div
              style={{
                width: `${displayMode === 'book' ? bookProgressPercent : chapterProgressPercent}%`,
              }}
              className={`h-full ${accentClass} rounded-full transition-all duration-150`}
            />
          </div>

          {/* Draggable thumb handle on hover */}
          <div
            style={{
              left: `${displayMode === 'book' ? bookProgressPercent : chapterProgressPercent}%`,
            }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          />
        </div>

        {/* Info stats pill below bar */}
        <div className="flex items-center gap-3 text-[11px] opacity-75">
          {/* Toggle mode button */}
          <button
            onClick={toggleDisplayMode}
            className="hover:underline flex items-center gap-1 font-mono cursor-pointer"
            title="Click to toggle between Book progress and Chapter progress"
          >
            {displayMode === 'chapter' ? (
              <span>
                Page {currentPageIndex + 1} of {totalPagesInChapter} ({chapterProgressPercent}%)
              </span>
            ) : (
              <span>
                Book: {bookProgressPercent}% · Ch {currentChapterIndex + 1}/{totalChapters}
              </span>
            )}
          </button>

          <span className="opacity-40">·</span>

          {/* Time Remaining */}
          <span className="flex items-center gap-1 font-sans">
            <Clock className="w-3 h-3 opacity-70" />
            {displayMode === 'chapter' ? (
              <span>{minutesLeftInChapter}m in ch</span>
            ) : (
              <span>~{totalHoursLeftInBook}h in book</span>
            )}
          </span>
        </div>
      </div>

      {/* Right: Quick Bookmark Ribbon & Step Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleBookmark}
          className={`p-1.5 rounded-lg hover:bg-current/10 transition cursor-pointer ${
            isBookmarked ? 'text-amber-500 opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
          title={isBookmarked ? 'Remove bookmark from this page' : 'Bookmark this page (Ctrl/⌘+B)'}
        >
          <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        <div className="hidden sm:flex items-center gap-0.5 ml-1">
          <button
            onClick={() => onNavigatePage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0 && currentChapterIndex === 0}
            className="p-1 rounded-md hover:bg-current/10 transition disabled:opacity-30 cursor-pointer"
            title="Previous Page (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigatePage(currentPageIndex + 1)}
            disabled={
              currentPageIndex >= totalPagesInChapter - 1 &&
              currentChapterIndex >= totalChapters - 1
            }
            className="p-1 rounded-md hover:bg-current/10 transition disabled:opacity-30 cursor-pointer"
            title="Next Page (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
