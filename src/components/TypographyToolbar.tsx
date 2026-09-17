import React from 'react';
import {
  Type,
  AlignJustify,
  AlignLeft,
  Columns2,
  Square,
  ScrollText,
  Zap,
  Sliders,
  Sun,
  Moon,
  Coffee,
  TreePine,
  Sparkles,
  Palette,
  Eye,
} from 'lucide-react';
import type { ReaderSettings, ReadingTheme, FontFamilyChoice, LayoutMode, AccentColor } from '../types';

interface TypographyToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const TypographyToolbar: React.FC<TypographyToolbarProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const THEMES: { id: ReadingTheme; label: string; icon: React.ReactNode; bg: string; text: string }[] = [
    { id: 'paper', label: 'Paper', icon: <Sun className="w-3.5 h-3.5" />, bg: 'bg-[#faf8f5]', text: 'text-zinc-800' },
    { id: 'sepia', label: 'Sepia', icon: <Coffee className="w-3.5 h-3.5" />, bg: 'bg-[#f4ecd8]', text: 'text-amber-950' },
    { id: 'nordic', label: 'Nordic', icon: <Moon className="w-3.5 h-3.5" />, bg: 'bg-[#181b22]', text: 'text-slate-200' },
    { id: 'sage', label: 'Sage', icon: <TreePine className="w-3.5 h-3.5" />, bg: 'bg-[#111b15]', text: 'text-emerald-100' },
    { id: 'amoled', label: 'OLED', icon: <Moon className="w-3.5 h-3.5" />, bg: 'bg-[#000000]', text: 'text-zinc-200' },
    { id: 'eink', label: 'E-Ink', icon: <Sun className="w-3.5 h-3.5" />, bg: 'bg-[#ffffff]', text: 'text-black' },
  ];

  const ACCENT_COLORS: { id: AccentColor; label: string; bg: string; ring: string }[] = [
    { id: 'amber', label: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
    { id: 'sky', label: 'Azure', bg: 'bg-sky-500', ring: 'ring-sky-400' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
    { id: 'violet', label: 'Violet', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  ];

  const FONTS: { id: FontFamilyChoice; label: string; previewClass: string }[] = [
    { id: 'literata', label: 'Literata (Serif)', previewClass: 'font-literata' },
    { id: 'merriweather', label: 'Merriweather (Serif)', previewClass: 'font-merriweather' },
    { id: 'sans', label: 'Jakarta Sans (UI)', previewClass: 'font-sans-ui' },
    { id: 'dyslexic', label: 'Atkinson Hyperlegible', previewClass: 'font-dyslexic' },
    { id: 'mono', label: 'JetBrains Mono', previewClass: 'font-mono-reader' },
  ];

  const activeAccent = settings.accentColor || 'amber';

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 top-14 w-84 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4 select-none max-h-[85dvh] overflow-y-auto">
      {/* Smart Themes */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Smart Themes</span>
          <span className="capitalize text-amber-400 font-medium">{settings.theme}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => onUpdateSettings({ theme: th.id })}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 border text-xs transition cursor-pointer ${
                th.bg
              } ${th.text} ${
                settings.theme === th.id
                  ? 'ring-2 ring-amber-500 border-transparent shadow-xs scale-102'
                  : 'border-slate-700/60 opacity-80 hover:opacity-100'
              }`}
            >
              {th.icon}
              <span className="text-[10px] font-medium leading-none">{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reader Accent Color Palette */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Accent Color</span>
          <span className="capitalize text-slate-300 text-[11px]">{activeAccent}</span>
        </div>
        <div className="flex items-center gap-2">
          {ACCENT_COLORS.map((ac) => (
            <button
              key={ac.id}
              onClick={() => onUpdateSettings({ accentColor: ac.id })}
              className={`w-7 h-7 rounded-xl ${ac.bg} transition hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs ${
                activeAccent === ac.id ? `ring-2 ${ac.ring} ring-offset-2 ring-offset-slate-900 scale-105` : 'opacity-70 hover:opacity-100'
              }`}
              title={ac.label}
            />
          ))}
        </div>
      </div>

      {/* Font Family Choice */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2">Typography Face</div>
        <div className="grid grid-cols-1 gap-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => onUpdateSettings({ fontFamily: font.id })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                settings.fontFamily === font.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className={font.previewClass}>{font.label}</span>
              <span className={`text-[11px] ${settings.fontFamily === font.id ? 'text-slate-900' : 'text-slate-500'}`}>
                Aa
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders: Size, Line Height, Margins */}
      <div className="space-y-3 pt-1 border-t border-slate-800">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Font Size</span>
            <span className="font-mono text-slate-200">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min="14"
            max="32"
            step="1"
            value={settings.fontSize}
            onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Line Height</span>
            <span className="font-mono text-slate-200">{settings.lineHeight}x</span>
          </div>
          <input
            type="range"
            min="1.3"
            max="2.4"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Letter Spacing</span>
            <span className="font-mono text-slate-200">{settings.letterSpacing || 0}px</span>
          </div>
          <input
            type="range"
            min="-1"
            max="5"
            step="0.5"
            value={settings.letterSpacing || 0}
            onChange={(e) => onUpdateSettings({ letterSpacing: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Page Margins</span>
            <span className="font-mono text-slate-200">{settings.marginWidth}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="96"
            step="8"
            value={settings.marginWidth}
            onChange={(e) => onUpdateSettings({ marginWidth: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Layout & Text Alignment */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="text-xs font-semibold text-slate-400">Layout & Formatting</div>
        
        {/* Layout mode buttons */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onUpdateSettings({ layoutMode: 'single' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              settings.layoutMode === 'single'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Single</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ layoutMode: 'double' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              settings.layoutMode === 'double'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Book Spread</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ layoutMode: 'scroll' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              settings.layoutMode === 'scroll'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Scroll</span>
          </button>
        </div>

        {/* Alignment */}
        <div className="grid grid-cols-2 gap-1 pt-1">
          <button
            onClick={() => onUpdateSettings({ textAlign: 'justify' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              settings.textAlign === 'justify'
                ? 'bg-slate-800 text-amber-300 font-semibold border border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span>Justify</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ textAlign: 'left' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              settings.textAlign === 'left'
                ? 'bg-slate-800 text-amber-300 font-semibold border border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Left Align</span>
          </button>
        </div>
      </div>

      {/* Reading Ruler & Bionic Reading Toggles */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Reading Ruler (Focus Line)</span>
          </span>
          <input
            type="checkbox"
            checked={settings.readingRuler}
            onChange={(e) => onUpdateSettings({ readingRuler: e.target.checked })}
            className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Bionic Word Fixation</span>
          </span>
          <input
            type="checkbox"
            checked={settings.bionicReading}
            onChange={(e) => onUpdateSettings({ bionicReading: e.target.checked })}
            className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
          />
        </label>
      </div>
    </div>
    </>
  );
};
