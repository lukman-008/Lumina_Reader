import React, { useState, useEffect } from 'react';
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
  X,
  RotateCcw,
  Minus,
  Plus,
  Check,
  Volume2,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import type { ReaderSettings, ReadingTheme, FontFamilyChoice, LayoutMode, AccentColor } from '../types';
import { DEFAULT_SETTINGS } from '../services/db';

interface TypographyToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

type TabMode = 'typography' | 'theme' | 'layout';

export const TypographyToolbar: React.FC<TypographyToolbarProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('typography');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const THEMES: { id: ReadingTheme; label: string; icon: React.ReactNode; bg: string; text: string; ringColor: string }[] = [
    { id: 'paper', label: 'Paper', icon: <Sun className="w-3.5 h-3.5" />, bg: 'bg-[#faf8f5]', text: 'text-zinc-800', ringColor: 'ring-amber-600' },
    { id: 'sepia', label: 'Sepia', icon: <Coffee className="w-3.5 h-3.5" />, bg: 'bg-[#f4ecd8]', text: 'text-amber-950', ringColor: 'ring-amber-700' },
    { id: 'nordic', label: 'Nordic', icon: <Moon className="w-3.5 h-3.5" />, bg: 'bg-[#181b22]', text: 'text-slate-200', ringColor: 'ring-sky-500' },
    { id: 'sage', label: 'Sage', icon: <TreePine className="w-3.5 h-3.5" />, bg: 'bg-[#111b15]', text: 'text-emerald-100', ringColor: 'ring-emerald-500' },
    { id: 'amoled', label: 'OLED', icon: <Moon className="w-3.5 h-3.5" />, bg: 'bg-[#000000]', text: 'text-zinc-200', ringColor: 'ring-zinc-400' },
    { id: 'eink', label: 'E-Ink', icon: <Sun className="w-3.5 h-3.5" />, bg: 'bg-[#ffffff]', text: 'text-black', ringColor: 'ring-slate-900' },
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

  const handleResetDefaults = () => {
    onUpdateSettings({
      fontSize: DEFAULT_SETTINGS.fontSize,
      lineHeight: DEFAULT_SETTINGS.lineHeight,
      letterSpacing: DEFAULT_SETTINGS.letterSpacing,
      marginWidth: DEFAULT_SETTINGS.marginWidth,
      fontFamily: DEFAULT_SETTINGS.fontFamily,
      textAlign: DEFAULT_SETTINGS.textAlign,
      layoutMode: DEFAULT_SETTINGS.layoutMode,
      bionicReading: DEFAULT_SETTINGS.bionicReading,
      readingRuler: DEFAULT_SETTINGS.readingRuler,
    });
  };

  return (
    <>
      {/* Dimmed backdrop for easy dismissal */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Dialog: Mobile bottom sheet / Desktop floating popover */}
      <div
        data-no-swipe="true"
        role="dialog"
        aria-modal="true"
        aria-label="Typography and display settings"
        className="fixed bottom-3 left-3 right-3 sm:bottom-auto sm:left-auto sm:right-6 sm:top-14 w-auto sm:w-[410px] max-h-[84dvh] sm:max-h-[78dvh] bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-2xl shadow-2xl text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col overflow-hidden"
      >
        {/* Fixed Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-100">Typography & Display</h2>
              <span className="text-[10px] text-slate-400">Customized reading environment</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px]"
              title="Reset typography settings to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>

            <button
              id="close-typography-dialog-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close settings"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 pt-2.5 pb-1 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'typography'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Type</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'theme'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'layout'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Layout</span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* TAB 1: TYPOGRAPHY */}
          {activeTab === 'typography' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Typeface choices */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Font Family</span>
                  <span className="text-amber-400 font-medium text-[11px] capitalize">
                    {settings.fontFamily}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => onUpdateSettings({ fontFamily: font.id })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer border ${
                        settings.fontFamily === font.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-semibold shadow-xs'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className={font.previewClass}>{font.label}</span>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                        settings.fontFamily === font.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Aa
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size with Steppers */}
              <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-medium">Font Size</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">{settings.fontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: Math.max(12, settings.fontSize - 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Decrease font size"
                    aria-label="Decrease font size"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="12"
                    max="36"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: Math.min(36, settings.fontSize + 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Increase font size"
                    aria-label="Increase font size"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Letter Spacing with Steppers */}
              <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-medium">Letter Spacing</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {(settings.letterSpacing || 0) > 0 ? `+${settings.letterSpacing}` : (settings.letterSpacing || 0)}px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ letterSpacing: Number(Math.max(-1, (settings.letterSpacing || 0) - 0.5).toFixed(1)) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Decrease letter spacing"
                    aria-label="Decrease letter spacing"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="-1"
                    max="5"
                    step="0.5"
                    value={settings.letterSpacing || 0}
                    onChange={(e) => onUpdateSettings({ letterSpacing: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ letterSpacing: Number(Math.min(5, (settings.letterSpacing || 0) + 0.5).toFixed(1)) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Increase letter spacing"
                    aria-label="Increase letter spacing"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  Live Preview
                </span>
                <p
                  className={`text-slate-200 transition-all ${
                    FONTS.find((f) => f.id === settings.fontFamily)?.previewClass || 'font-literata'
                  }`}
                  style={{
                    fontSize: `${Math.min(22, Math.max(14, settings.fontSize))}px`,
                    letterSpacing: `${settings.letterSpacing || 0}px`,
                    lineHeight: settings.lineHeight || 1.6,
                  }}
                >
                  The quick brown fox jumps over the lazy dog. 12345
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: THEME & COLOR */}
          {activeTab === 'theme' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Smart Reading Themes */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Reading Environment</span>
                  <span className="capitalize text-amber-400 font-medium text-[11px]">{settings.theme}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((th) => {
                    const isSelected = settings.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => onUpdateSettings({ theme: th.id })}
                        className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 border text-xs transition cursor-pointer relative ${
                          th.bg
                        } ${th.text} ${
                          isSelected
                            ? `ring-2 ${th.ringColor} border-transparent shadow-md scale-102`
                            : 'border-slate-700/60 opacity-80 hover:opacity-100 hover:scale-101'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        {th.icon}
                        <span className="text-[11px] font-semibold leading-none">{th.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reader Accent Color Palette */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Accent Tone</span>
                  <span className="capitalize text-slate-300 text-[11px]">{activeAccent}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ACCENT_COLORS.map((ac) => {
                    const isSelected = activeAccent === ac.id;
                    return (
                      <button
                        key={ac.id}
                        type="button"
                        onClick={() => onUpdateSettings({ accentColor: ac.id })}
                        className={`h-9 rounded-xl ${ac.bg} transition hover:scale-105 flex items-center justify-center cursor-pointer shadow-xs relative ${
                          isSelected ? `ring-2 ${ac.ring} ring-offset-2 ring-offset-slate-900 scale-105` : 'opacity-70 hover:opacity-100'
                        }`}
                        title={ac.label}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT & TOOLS */}
          {activeTab === 'layout' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Layout mode buttons */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Display Mode</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ layoutMode: 'single' })}
                    className={`py-2 px-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                      settings.layoutMode === 'single'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Single</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ layoutMode: 'double' })}
                    className={`py-2 px-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                      settings.layoutMode === 'double'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Spread</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ layoutMode: 'scroll' })}
                    className={`py-2 px-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                      settings.layoutMode === 'scroll'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                    }`}
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Scroll</span>
                  </button>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Text Alignment</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ textAlign: 'justify' })}
                    className={`py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                      settings.textAlign === 'justify'
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border-amber-500/50 shadow-xs'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                    <span>Justify</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ textAlign: 'left' })}
                    className={`py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                      settings.textAlign === 'left'
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border-amber-500/50 shadow-xs'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Left Align</span>
                  </button>
                </div>
              </div>

              {/* Line Height with Steppers */}
              <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-medium">Line Height</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">{settings.lineHeight}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ lineHeight: Number(Math.max(1.2, settings.lineHeight - 0.1).toFixed(1)) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Decrease line height"
                    aria-label="Decrease line height"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ lineHeight: Number(Math.min(2.5, settings.lineHeight + 0.1).toFixed(1)) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Increase line height"
                    aria-label="Increase line height"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Page Margins with Steppers */}
              <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-medium">Page Margins</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">{settings.marginWidth}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ marginWidth: Math.max(16, settings.marginWidth - 8) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Decrease margins"
                    aria-label="Decrease margins"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="16"
                    max="96"
                    step="8"
                    value={settings.marginWidth}
                    onChange={(e) => onUpdateSettings({ marginWidth: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ marginWidth: Math.min(96, settings.marginWidth + 8) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition cursor-pointer border border-slate-700 shrink-0"
                    title="Increase margins"
                    aria-label="Increase margins"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Page Flip Style */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Page Turn Transition</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'slide', label: 'Slide', desc: 'Smooth horizontal glide' },
                      { id: 'curl', label: 'Book Curl', desc: 'Tactile page curl' },
                      { id: 'fade', label: 'Fade', desc: 'Minimal soft fade' },
                    ] as const
                  ).map((anim) => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => onUpdateSettings({ pageTurnAnimation: anim.id })}
                      className={`p-2 rounded-xl text-center transition cursor-pointer border ${
                        (settings.pageTurnAnimation || 'slide') === anim.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs">{anim.label}</div>
                      <div className="text-[9px] opacity-75 truncate">{anim.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensory & Tactile Feedback */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Sensory & Tactile Experience</span>
                
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/80 transition">
                  <span className="text-xs text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Tactile Sound Effects</div>
                      <div className="text-[10px] text-slate-400">Procedural paper rustle on page turn & cues</div>
                    </div>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.soundEffects ?? true}
                    onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/80 transition">
                  <span className="text-xs text-slate-200 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Haptic Vibration Feedback</div>
                      <div className="text-[10px] text-slate-400">Tactile pulse on page flips and notes</div>
                    </div>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.hapticFeedback ?? true}
                    onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 accent-amber-500"
                  />
                </label>
              </div>

              {/* Focus & Accessibility Toggles */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Focus & Accessibility</span>
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/80 transition">
                  <span className="text-xs text-slate-200 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Reading Ruler</div>
                      <div className="text-[10px] text-slate-400">Horizontal guide tracking line</div>
                    </div>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.readingRuler}
                    onChange={(e) => onUpdateSettings({ readingRuler: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800/80 transition">
                  <span className="text-xs text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium">Bionic Reading</div>
                      <div className="text-[10px] text-slate-400">Bold first letters to guide eye fixation</div>
                    </div>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.bionicReading}
                    onChange={(e) => onUpdateSettings({ bionicReading: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 accent-amber-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Done Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 truncate">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> or tap outside to close
          </span>
          <button
            id="done-typography-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </>
  );
};
