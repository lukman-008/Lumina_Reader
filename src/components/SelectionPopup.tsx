import React from 'react';
import {
  Highlighter,
  MessageSquare,
  Sparkles,
  Volume2,
  Copy,
  Check,
} from 'lucide-react';
import type { Highlight } from '../types';

interface SelectionPopupProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onHighlight: (color: Highlight['color']) => void;
  onAddNote: () => void;
  onReadAloud: () => void;
  onAskAI: () => void;
  onClose: () => void;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
  position,
  selectedText,
  onHighlight,
  onAddNote,
  onReadAloud,
  onAskAI,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!position || !selectedText.trim()) return null;

  const copySelection = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const COLORS: { id: Highlight['color']; bg: string; border: string }[] = [
    { id: 'yellow', bg: 'bg-amber-400', border: 'border-amber-500' },
    { id: 'emerald', bg: 'bg-emerald-400', border: 'border-emerald-500' },
    { id: 'sky', bg: 'bg-sky-400', border: 'border-sky-500' },
    { id: 'rose', bg: 'bg-rose-400', border: 'border-rose-500' },
    { id: 'amber', bg: 'bg-orange-400', border: 'border-orange-500' },
  ];

  return (
    <div
      style={{
        left: `${Math.max(10, Math.min(position.x - 140, window.innerWidth - 320))}px`,
        top: `${Math.max(10, position.y - 50)}px`,
      }}
      className="fixed z-50 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none text-slate-200"
    >
      {/* Color dots */}
      <div className="flex items-center gap-1 px-1 border-r border-slate-800">
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => onHighlight(c.id)}
            className={`w-4 h-4 rounded-full ${c.bg} hover:scale-125 transition shadow-xs border ${c.border}`}
            title={`Highlight in ${c.id}`}
          />
        ))}
      </div>

      {/* Note action */}
      <button
        onClick={onAddNote}
        className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition"
        title="Add note"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>

      {/* Read aloud action */}
      <button
        onClick={onReadAloud}
        className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition"
        title="Read selection aloud (Offline TTS)"
      >
        <Volume2 className="w-3.5 h-3.5" />
      </button>

      {/* AI Assistant */}
      <button
        onClick={onAskAI}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition"
        title="Explain or discuss with AI"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Ask AI</span>
      </button>

      {/* Copy */}
      <button
        onClick={copySelection}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        title="Copy text"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
