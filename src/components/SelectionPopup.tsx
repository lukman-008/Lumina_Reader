import React, { useState, useMemo } from 'react';
import {
  Highlighter,
  MessageSquare,
  Sparkles,
  Volume2,
  Copy,
  Check,
  X,
  FileEdit,
} from 'lucide-react';
import type { Highlight } from '../types';

interface SelectionPopupProps {
  position: { x: number; y: number; bottom?: number } | null;
  selectedText: string;
  onHighlight: (color: Highlight['color'], note?: string, text?: string) => void;
  onAddNote?: () => void;
  onActiveNoteChange?: (isActive: boolean) => void;
  onReadAloud: () => void;
  onAskAI: () => void;
  onClose: () => void;
}

const COLORS: { id: Highlight['color']; label: string; bg: string; ring: string }[] = [
  { id: 'yellow', label: 'Gold', bg: 'bg-amber-400', ring: 'ring-amber-500' },
  { id: 'emerald', label: 'Mint', bg: 'bg-emerald-400', ring: 'ring-emerald-500' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-400', ring: 'ring-sky-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-400', ring: 'ring-rose-500' },
  { id: 'amber', label: 'Orange', bg: 'bg-orange-400', ring: 'ring-orange-500' },
  { id: 'violet', label: 'Purple', bg: 'bg-purple-400', ring: 'ring-purple-500' },
];

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
  position,
  selectedText,
  onHighlight,
  onActiveNoteChange,
  onReadAloud,
  onAskAI,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [selectedColor, setSelectedColor] = useState<Highlight['color']>('yellow');

  // Lock position & text when entering note mode so the popup never disappears even if selection collapses on focus
  const [lockedPosition, setLockedPosition] = useState<{ x: number; y: number; bottom?: number } | null>(null);
  const [lockedText, setLockedText] = useState('');

  const activePosition = isAddingNote ? (lockedPosition || position) : position;
  const activeText = isAddingNote ? (lockedText || selectedText) : selectedText;

  // Detect selection scope automatically
  const selectionScope = useMemo(() => {
    const trimmed = (activeText || selectedText || '').trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    if (words <= 2 && !trimmed.includes('\n')) {
      return { type: 'word' as const, label: 'Word Note' };
    }
    if (words <= 25 && !trimmed.includes('\n\n')) {
      return { type: 'line' as const, label: 'Line / Sentence Note' };
    }
    return { type: 'paragraph' as const, label: 'Paragraph Note' };
  }, [activeText, selectedText]);

  if (!activePosition || !activeText.trim()) return null;

  const copySelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleOpenNote = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (position) setLockedPosition(position);
    if (selectedText) setLockedText(selectedText);
    setIsAddingNote(true);
    onActiveNoteChange?.(true);
  };

  const handleCancelNote = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAddingNote(false);
    onActiveNoteChange?.(false);
    setNoteInput('');
    setLockedPosition(null);
    setLockedText('');
    onClose();
  };

  const handleSaveWithNote = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const textToSave = activeText || selectedText;
    onHighlight(selectedColor, noteInput.trim() || undefined, textToSave);
    setIsAddingNote(false);
    onActiveNoteChange?.(false);
    setNoteInput('');
    setLockedPosition(null);
    setLockedText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveWithNote();
    }
  };

  // Mobile-aware adaptive layout dimensions
  const windowW = typeof window !== 'undefined' ? window.innerWidth : 360;
  const windowH = typeof window !== 'undefined' ? window.innerHeight : 640;

  const popupWidth = isAddingNote 
    ? Math.min(340, windowW - 24) 
    : Math.min(330, windowW - 24);
  const popupHeight = isAddingNote ? 170 : 46;

  // If selection is near top of screen, flip below so it doesn't collide with top bar
  const showBelow = (activePosition.y - popupHeight) < 68;
  const calculatedTop = showBelow
    ? (activePosition.bottom ? activePosition.bottom + 10 : activePosition.y + 36)
    : (activePosition.y - popupHeight - 10);

  // Safely clamp within visible viewport, keeping clear of top header (54px) and bottom progress bar (64px)
  const safeLeft = Math.max(12, Math.min(activePosition.x - popupWidth / 2, windowW - popupWidth - 12));
  const safeTop = Math.max(54, Math.min(calculatedTop, windowH - popupHeight - 68));

  return (
    <div
      data-selection-popup="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
        e.preventDefault();
      }}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{
        left: `${safeLeft}px`,
        top: `${safeTop}px`,
        width: isAddingNote ? `${popupWidth}px` : undefined,
        maxWidth: 'calc(100vw - 24px)',
      }}
      className="fixed z-50 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-200 text-xs"
    >
      {isAddingNote ? (
        <div className="w-full p-2.5 space-y-2 select-text">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {selectionScope.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(c.id);
                  }}
                  className={`w-4 h-4 rounded-full ${c.bg} transition cursor-pointer ${
                    selectedColor === c.id ? `ring-2 ${c.ring} scale-110` : 'opacity-60 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            placeholder={`Add reflection to this ${selectionScope.type}...`}
            autoFocus
            rows={3}
            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none font-sans select-text"
          />

          <div className="flex flex-wrap gap-2 items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">⌘+Enter to save</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleCancelNote}
                className="px-2.5 py-1.5 rounded-md text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleSaveWithNote}
                className="px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-[11px] cursor-pointer shadow-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 max-w-full overflow-x-auto">
          {/* Color swatches */}
          <div className="flex items-center gap-1 px-1.5 border-r border-slate-800 shrink-0">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlight(c.id, undefined, activeText);
                }}
                className={`w-4 h-4 rounded-full ${c.bg} hover:scale-125 transition shadow-xs cursor-pointer`}
                title={`Highlight in ${c.label}`}
              />
            ))}
          </div>

          {/* Add Note Button with Scope Preview */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleOpenNote}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 transition cursor-pointer font-medium text-[11px] shrink-0 border border-amber-500/30"
            title={`Attach note to selected ${selectionScope.type}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Note</span>
          </button>

          {/* Read aloud action */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onReadAloud();
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 active:scale-95 transition cursor-pointer shrink-0"
            title="Read selection aloud (Offline TTS)"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          {/* AI Assistant */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAskAI();
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition cursor-pointer shrink-0"
            title="Discuss selection with AI"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Copy */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={copySelection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:scale-95 transition cursor-pointer shrink-0"
            title="Copy selection"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

