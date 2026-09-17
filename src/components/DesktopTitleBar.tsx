import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Keyboard,
  Download,
  Sparkles,
  Monitor,
  Apple,
  Terminal,
  Flame,
  CloudRain,
  Search,
  Highlighter,
} from 'lucide-react';
import { usePlatform } from '../hooks/usePlatform';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ambientAudio } from '../services/ambientAudio';
import { habitTracker } from '../services/habitTracker';

interface DesktopTitleBarProps {
  currentBookTitle?: string;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onOpenShortcuts: () => void;
  onOpenExportGuide: () => void;
  isOnline: boolean;
  onOpenAI?: () => void;
  onOpenHabits?: () => void;
  onOpenSoundscape?: () => void;
  onOpenSearchIndex?: () => void;
  onOpenAnnotationManager?: () => void;
  onNavigateHome?: () => void;
}

export const DesktopTitleBar: React.FC<DesktopTitleBarProps> = ({
  currentBookTitle,
  isZenMode,
  onToggleZenMode,
  onOpenShortcuts,
  onOpenExportGuide,
  isOnline,
  onOpenAI,
  onOpenHabits,
  onOpenSoundscape,
  onOpenSearchIndex,
  onOpenAnnotationManager,
  onNavigateHome,
}) => {
  const { platform, isStandalone, isMobile } = usePlatform();
  const { isInstallable, install } = usePWAInstall();
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(ambientAudio.isPlaying());
  const [streak, setStreak] = React.useState<number>(0);

  React.useEffect(() => {
    habitTracker.getHabitStats().then(stats => setStreak(stats.currentStreak));
    const unsub = ambientAudio.onStateChange((_t, playing) => {
      setIsPlayingAudio(playing);
    });
    return () => unsub();
  }, []);

  // If in pure Zen mode, hide the titlebar for zero distractions
  if (isZenMode) return null;

  return (
    <header 
      className="min-h-[44px] bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 flex items-center justify-between select-none z-30 shrink-0 sticky top-0"
      style={{ 
        WebkitAppRegion: 'drag',
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : undefined 
      } as React.CSSProperties}
    >
      {/* Left: Window identity & App branding */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Native Mac style traffic dots aesthetic when on desktop */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 pr-1">
            <span 
              onClick={onNavigateHome}
              className="w-2.5 h-2.5 rounded-full bg-rose-500/80 hover:bg-rose-400 cursor-pointer transition-colors" 
              title="Close / Back to Library" 
            />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 hover:bg-amber-400 cursor-pointer" title="Minimize" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-400 cursor-pointer" title="Expand" />
          </div>
        )}

        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onNavigateHome}
          title="Back to Library"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <span className="font-semibold text-xs tracking-wider text-slate-200 uppercase font-sans-ui">
            Lumina
          </span>
        </div>

        {/* OS compatibility badge */}
        {!isMobile && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            {platform === 'macos' && <Apple className="w-3 h-3 text-slate-300" />}
            {platform === 'windows' && <Monitor className="w-3 h-3 text-sky-400" />}
            {platform === 'linux' && <Terminal className="w-3 h-3 text-emerald-400" />}
            <span className="capitalize">{platform} Native</span>
            {isStandalone && <span className="text-amber-400 font-medium">· PWA</span>}
          </div>
        )}
      </div>

      {/* Center: Current book title if reading */}
      <div className="max-w-[35%] truncate text-center hidden sm:block" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {currentBookTitle ? (
          <span className="text-xs font-medium text-slate-300 tracking-wide">
            {currentBookTitle}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Personal Library</span>
        )}
      </div>

      {/* Right: Quick desktop controls */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap overflow-hidden justify-end" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Offline / Online indicator */}
        <div
          className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
          }`}
          title={isOnline ? 'Online with Cloud AI enabled' : '100% Offline Mode (Local DB Active)'}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden md:inline">{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
        </div>

        {/* AI Assistant button */}
        {onOpenAI && (
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
            title="Open AI Reading Companion"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Reader</span>
          </button>
        )}

        {/* Ambient Soundscapes & Warmth button */}
        {onOpenSoundscape && (
          <button
            onClick={onOpenSoundscape}
            className={`p-1.5 rounded-md transition relative cursor-pointer ${
              isPlayingAudio
                ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95'
            }`}
            title="Atmospheric Soundscapes & Circadian Warmth (S)"
          >
            <CloudRain className="w-3.5 h-3.5" />
            {isPlayingAudio && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        )}

        {/* Habits, Streaks & Velocity Dashboard button */}
        {onOpenHabits && (
          <button
            onClick={onOpenHabits}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-amber-400 hover:text-amber-300 hover:bg-slate-800 active:scale-95 transition cursor-pointer border border-transparent hover:border-slate-700"
            title="Reading Habits, Streaks & Pomodoro Timer (H)"
          >
            <div className="flex items-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {streak > 0 && <span className="text-[11px] font-bold font-mono">{streak}</span>}
            </div>
            <span className="text-xs font-medium hidden md:inline">Habits</span>
          </button>
        )}

        {/* PWA Install Button if available */}
        {isInstallable && !isMobile && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium shadow-xs transition cursor-pointer"
            title="Install as native desktop app on Windows, Mac, or Linux"
          >
            <Download className="w-3 h-3" />
            <span className="hidden md:inline">Install Desktop</span>
          </button>
        )}

        {/* Global Deep Search Index Launcher */}
        {onOpenSearchIndex && (
          <button
            onClick={onOpenSearchIndex}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            title="Search Index across entire library (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            {!isMobile && (
              <kbd className="hidden lg:inline text-[10px] bg-slate-900 px-1 py-0.5 rounded text-slate-400 font-mono">
                ⌘K
              </kbd>
            )}
          </button>
        )}

        {/* Global Annotations & Notes Manager Launcher */}
        {onOpenAnnotationManager && (
          <button
            onClick={onOpenAnnotationManager}
            className="p-1.5 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            title="Annotation & Notes Manager"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Packaging Guide modal */}
        {!isMobile && (
          <button
            onClick={onOpenExportGuide}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95 transition hidden sm:block"
            title="Cross-platform desktop build instructions"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Shortcuts modal */}
        {!isMobile && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95 transition hidden sm:block"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Zen mode toggle */}
        {!isMobile && (
          <button
            onClick={onToggleZenMode}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95 transition"
            title={isZenMode ? 'Exit Zen Mode (Esc)' : 'Zen Distraction-Free Reading (Z)'}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Windows native control spacer (prevents overlap with titleBarOverlay) */}
        {platform === 'windows' && <div className="w-[140px] shrink-0" />}
      </div>
    </header>
  );
};
