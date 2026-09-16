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
  position: { x: number; y: number } | null;
  selectedText: string;
  onHighlight: (color: Highlight['color'], note?: string) => void;
  onAddNote?: () => void;
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
  onReadAloud,
  onAskAI,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [selectedColor, setSelectedColor] = useState<Highlight['color']>('yellow');

  // Detect selection scope automatically
  const selectionScope = useMemo(() => {
    const trimmed = selectedText.trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    if (words <= 2 && !trimmed.includes('\n')) {
      return { type: 'word' as const, label: 'Word Note' };
    }
    if (words <= 25 && !trimmed.includes('\n\n')) {
      return { type: 'line' as const, label: 'Line / Sentence Note' };
    }
    return { type: 'paragraph' as const, label: 'Paragraph Note' };
  }, [selectedText]);

  if (!position || !selectedText.trim()) return null;

  const copySelection = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleSaveWithNote = () => {
    onHighlight(selectedColor, noteInput.trim() || undefined);
    setIsAddingNote(false);
    setNoteInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveWithNote();
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => { if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return; e.preventDefault(); }}
      style={{
        left: `${Math.max(10, Math.min(position.x - 160, window.innerWidth - (window.innerWidth < 640 ? 300 : 360)))}px`,
        top: `${Math.max(10, position.y - (isAddingNote ? 140 : 54))}px`,
      }}
      className="fixed z-50 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-200 text-xs"
    >
      {isAddingNote ? (
        <div className="w-[280px] sm:w-80 p-2.5 space-y-2">
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
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-3.5 h-3.5 rounded-full ${c.bg} transition cursor-pointer ${
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
            placeholder={`Add reflection to this ${selectionScope.type}... (Cmd+Enter to save)`}
            autoFocus
            rows={3}
            className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
          />

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-500 font-mono">⌘+Enter to save</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAddingNote(false)}
                className="px-2.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWithNote}
                className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] cursor-pointer shadow-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {/* Color swatches */}
          <div className="flex items-center gap-1 px-1.5 border-r border-slate-800">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => onHighlight(c.id)}
                className={`w-4 h-4 rounded-full ${c.bg} hover:scale-125 transition shadow-xs cursor-pointer`}
                title={`Highlight in ${c.label}`}
              />
            ))}
          </div>

          {/* Add Note Button with Scope Preview */}
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer font-medium text-[11px]"
            title={`Attach note to selected ${selectionScope.type}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Note</span>
          </button>

          {/* Read aloud action */}
          <button
            onClick={onReadAloud}
            className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
            title="Read selection aloud (Offline TTS)"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          {/* AI Assistant */}
          <button
            onClick={onAskAI}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition cursor-pointer"
            title="Discuss selection with AI"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Ask AI</span>
          </button>

          {/* Copy */}
          <button
            onClick={copySelection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
            title="Copy selection"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

