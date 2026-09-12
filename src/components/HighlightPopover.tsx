import React, { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  Copy,
  Check,
  Sparkles,
  X,
  Edit2,
} from 'lucide-react';
import type { Highlight } from '../types';

interface HighlightPopoverProps {
  highlight: Highlight | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUpdateHighlight: (id: string, updates: Partial<Highlight>) => void;
  onDeleteHighlight: (id: string) => void;
  onAskAI?: (text: string) => void;
}

const COLORS: { id: Highlight['color']; label: string; bg: string; ring: string }[] = [
  { id: 'yellow', label: 'Gold', bg: 'bg-amber-400', ring: 'ring-amber-500' },
  { id: 'emerald', label: 'Mint', bg: 'bg-emerald-400', ring: 'ring-emerald-500' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-400', ring: 'ring-sky-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-400', ring: 'ring-rose-500' },
  { id: 'amber', label: 'Orange', bg: 'bg-orange-400', ring: 'ring-orange-500' },
  { id: 'violet', label: 'Purple', bg: 'bg-purple-400', ring: 'ring-purple-500' },
];

export const HighlightPopover: React.FC<HighlightPopoverProps> = ({
  highlight,
  position,
  onClose,
  onUpdateHighlight,
  onDeleteHighlight,
  onAskAI,
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(highlight?.note || '');
  const [copied, setCopied] = useState(false);

  if (!highlight || !position) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(highlight.selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleSaveNote = () => {
    onUpdateHighlight(highlight.id, { note: noteText.trim() });
    setIsEditingNote(false);
  };

  return (
    <div
      style={{
        left: `${Math.max(10, Math.min(position.x - 140, window.innerWidth - 320))}px`,
        top: `${Math.max(10, position.y - 10)}px`,
      }}
      className="fixed z-50 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-3 text-slate-100 flex flex-col space-y-2.5 animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
    >
      {/* Header: Color Swatches & Quick Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onUpdateHighlight(highlight.id, { color: c.id })}
              className={`w-4 h-4 rounded-full ${c.bg} transition hover:scale-125 cursor-pointer ${
                highlight.color === c.id ? `ring-2 ${c.ring} scale-110 shadow-xs` : 'opacity-70 hover:opacity-100'
              }`}
              title={`Switch to ${c.label}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
            title="Copy quote"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onAskAI && (
            <button
              onClick={() => onAskAI(highlight.selectedText)}
              className="p-1 text-slate-400 hover:text-amber-400 rounded-md hover:bg-slate-800 transition"
              title="Discuss with AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => {
              onDeleteHighlight(highlight.id);
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition"
            title="Delete highlight"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quote Preview */}
      <p className="italic font-serif text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800">
        "{highlight.selectedText}"
      </p>

      {/* Note Section */}
      <div>
        {isEditingNote ? (
          <div className="space-y-1.5">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your reflection or notes..."
              autoFocus
              className="w-full h-16 p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-amber-500 text-slate-200 resize-none font-sans"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setIsEditingNote(false)}
                className="px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-semibold text-[11px] hover:bg-amber-400"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            {highlight.note ? (
              <p className="text-[11px] text-amber-200 font-sans leading-relaxed">
                💬 {highlight.note}
              </p>
            ) : (
              <span className="text-[11px] text-slate-500 italic">No notes attached</span>
            )}
            <button
              onClick={() => {
                setNoteText(highlight.note || '');
                setIsEditingNote(true);
              }}
              className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer pt-0.5"
            >
              <Edit2 className="w-3 h-3" />
              <span>{highlight.note ? 'Edit' : '+ Note'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
