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
} from 'lucide-react';
import type { ReaderSettings, ReadingTheme, FontFamilyChoice, LayoutMode } from '../types';

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
    { id: 'dusk', label: 'Dusk', icon: <Moon className="w-3.5 h-3.5" />, bg: 'bg-[#1e222d]', text: 'text-slate-200' },
    { id: 'amoled', label: 'Black', icon: <Moon className="w-3.5 h-3.5" />, bg: 'bg-[#000000]', text: 'text-zinc-200' },
    { id: 'eink', label: 'E-Ink', icon: <Sun className="w-3.5 h-3.5" />, bg: 'bg-[#ffffff]', text: 'text-black' },
  ];

  const FONTS: { id: FontFamilyChoice; label: string; previewClass: string }[] = [
    { id: 'literata', label: 'Literata (Serif)', previewClass: 'font-literata' },
    { id: 'merriweather', label: 'Merriweather (Serif)', previewClass: 'font-merriweather' },
    { id: 'sans', label: 'Jakarta Sans', previewClass: 'font-sans-ui' },
    { id: 'dyslexic', label: 'Hyperlegible (Accessible)', previewClass: 'font-dyslexic' },
    { id: 'mono', label: 'JetBrains Mono', previewClass: 'font-mono-reader' },
  ];

  return (
    <div className="absolute right-4 top-14 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4 select-none">
      {/* Themes */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Theme & Lighting</span>
          <span className="capitalize text-amber-400 font-medium">{settings.theme}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => onUpdateSettings({ theme: th.id })}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 border text-xs transition ${
                th.bg
              } ${th.text} ${
                settings.theme === th.id
                  ? 'ring-2 ring-amber-500 border-transparent shadow-xs scale-105'
                  : 'border-slate-700/60 opacity-80 hover:opacity-100'
              }`}
            >
              {th.icon}
              <span className="text-[10px] font-medium leading-none">{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2">Typography Face</div>
        <div className="grid grid-cols-1 gap-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => onUpdateSettings({ fontFamily: font.id })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
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

      {/* Font Size & Line Height Sliders */}
      <div className="space-y-3 pt-1 border-t border-slate-800">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Font Size</span>
            <span className="font-mono text-amber-400">{settings.fontSize}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">A</span>
            <input
              type="range"
              min="14"
              max="28"
              step="1"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-sm font-semibold text-slate-200">A</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Line Spacing</span>
            <span className="font-mono text-amber-400">{settings.lineHeight.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.3"
            max="2.2"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Reading Margins</span>
            <span className="font-mono text-amber-400">{settings.marginWidth}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="96"
            step="8"
            value={settings.marginWidth}
            onChange={(e) => onUpdateSettings({ marginWidth: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Layout & Alignment */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="text-xs font-semibold text-slate-400">Layout Format</div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onUpdateSettings({ layoutMode: 'double' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${
              settings.layoutMode === 'double'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
            title="Two-column book spread"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Dual Page</span>
          </button>
          <button
            onClick={() => onUpdateSettings({ layoutMode: 'single' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${
              settings.layoutMode === 'single'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
            title="Single page view"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Single</span>
          </button>
          <button
            onClick={() => onUpdateSettings({ layoutMode: 'scroll' })}
            className={`py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${
              settings.layoutMode === 'scroll'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
            title="Continuous scroll"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Scroll</span>
          </button>
        </div>

        {/* Text Justification & Bionic Reading */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => onUpdateSettings({ textAlign: 'justify' })}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                settings.textAlign === 'justify' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Justified text alignment"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUpdateSettings({ textAlign: 'left' })}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                settings.textAlign === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Left text alignment"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bionic speed reading */}
          <button
            onClick={() => onUpdateSettings({ bionicReading: !settings.bionicReading })}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              settings.bionicReading
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Emphasizes word fixation points to increase reading speed"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Bionic Reading</span>
          </button>
        </div>

        {/* Reading Focus Ruler Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="font-medium">Reading Ruler (Focus Guide)</span>
            <span className="text-[10px] text-amber-400 font-mono">[R]</span>
          </div>
          <button
            onClick={() => onUpdateSettings({ readingRuler: !settings.readingRuler })}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              settings.readingRuler ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.readingRuler ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Screen Warmth Slider */}
        <div className="pt-2 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Warmth (Blue Light Filter)</span>
            <span className="font-mono text-amber-400">{settings.warmth || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="2"
            value={settings.warmth || 0}
            onChange={(e) => onUpdateSettings({ warmth: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gradient-to-r from-sky-400 via-amber-300 to-amber-600 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
