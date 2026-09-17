import React from 'react';
import { usePlatform } from '../hooks/usePlatform';
import { X, Keyboard, Laptop } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { modKey, altKey, fullscreenShortcut, platform } = usePlatform();

  if (!isOpen) return null;

  const shortcuts = [
    { key: '→ / Space / PageDown', desc: 'Next Page / Next Spread' },
    { key: '← / Shift+Space / PageUp', desc: 'Previous Page / Previous Spread' },
    { key: 'J / K', desc: 'Vim navigation (Scroll or Page down / up)' },
    { key: 'R', desc: 'Toggle Reading Ruler (Focus Guide)' },
    { key: 'V', desc: 'Open RSVP Rapid Serial Visual Presentation' },
    { key: 'P', desc: 'Toggle Auto-Pacing / Auto-Scroll' },
    { key: 'S', desc: 'Atmospheric Soundscapes & Circadian Warmth' },
    { key: 'H', desc: 'Reading Habits, Velocity & Pomodoro Dashboard' },
    { key: `${modKey} + K`, desc: 'Search Index across all books & chapters' },
    { key: `${modKey} + Shift + A`, desc: 'Open All Highlights & Annotations Manager' },
    { key: `${modKey} + B`, desc: 'Toggle Bookmark on current page' },
    { key: `${modKey} + F`, desc: 'Search text inside current book' },
    { key: `${modKey} + T`, desc: 'Open Table of Contents drawer' },
    { key: `${modKey} + H`, desc: 'Open Highlights & Notes drawer' },
    { key: `${modKey} + A`, desc: 'Open AI Literary Assistant' },
    { key: 'Z', desc: 'Toggle Distraction-Free Zen Reading Mode' },
    { key: fullscreenShortcut, desc: 'Toggle Native Fullscreen' },
    { key: 'Esc', desc: 'Exit Zen Mode / Close Drawers & Modals' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col max-h-[85dvh]">
        <div className="flex flex-wrap gap-2 items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Keyboard Shortcuts</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Optimized for <strong className="capitalize text-slate-300">{platform}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 py-4 space-y-2.5 pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700/80 transition"
            >
              <span className="text-sm text-slate-300">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300 shadow-xs whitespace-nowrap">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Works natively on Windows, macOS, and Linux</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
