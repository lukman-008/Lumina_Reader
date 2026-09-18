import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Flame,
  Coffee,
  Radio,
  Waves,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  X,
  Play,
  Square,
  Clock,
} from 'lucide-react';
import { ambientAudio } from '../services/ambientAudio';
import type { SoundscapeType, ReaderSettings } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface SoundscapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

export const SoundscapeModal: React.FC<SoundscapeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  useEscapeKey(isOpen, onClose);
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>(
    ambientAudio.getCurrentSoundscape()
  );
  const [volume, setVolume] = useState<number>(ambientAudio.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const unsub = ambientAudio.onStateChange((type, _isPlaying, vol) => {
      setActiveSoundscape(type);
      setVolume(vol);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const SOUNDSCAPES: {
    id: SoundscapeType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'rain',
      label: 'Rain on Window',
      description: 'Gentle raindrops & soft distant thunder',
      icon: <CloudRain className="w-5 h-5 text-sky-400" />,
      color: 'hover:border-sky-500/50 hover:bg-sky-500/10',
    },
    {
      id: 'fireplace',
      label: 'Cozy Fireplace',
      description: 'Warm hearth with crackling embers',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-500/10',
    },
    {
      id: 'cafe',
      label: 'Rainy Café',
      description: 'Soft ceramic clinks & muffled ambience',
      icon: <Coffee className="w-5 h-5 text-orange-400" />,
      color: 'hover:border-orange-500/50 hover:bg-orange-500/10',
    },
    {
      id: 'brown-noise',
      label: 'Deep Brown Noise',
      description: '1/f² warm low rumble for deep focus & ADHD',
      icon: <Radio className="w-5 h-5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10',
    },
    {
      id: 'waves',
      label: 'Ocean Waves',
      description: 'Rhythmic tides surging & receding',
      icon: <Waves className="w-5 h-5 text-cyan-400" />,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10',
    },
    {
      id: 'crickets',
      label: 'Summer Crickets',
      description: 'Dusk garden evening chirping',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10',
    },
  ];

  const handleSelectSoundscape = (type: SoundscapeType) => {
    if (activeSoundscape === type) {
      ambientAudio.stop();
      onUpdateSettings({ soundscape: 'none' });
    } else {
      ambientAudio.setSoundscape(type);
      onUpdateSettings({ soundscape: type });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientAudio.setVolume(newVol);
    onUpdateSettings({ soundscapeVolume: newVol });
  };

  const handleToggleMute = () => {
    const muted = ambientAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col space-y-6 max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex flex-wrap gap-2 items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Atmospheric Environment</h3>
              <p className="text-xs text-slate-400">
                100% Offline procedural soundscapes & circadian lighting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Soundscapes Grid */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Procedural Soundscape
            </span>
            {activeSoundscape !== 'none' && (
              <button
                onClick={() => handleSelectSoundscape('none')}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <Square className="w-3 h-3" /> Stop Sound
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SOUNDSCAPES.map((sc) => {
              const isActive = activeSoundscape === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectSoundscape(sc.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 active:scale-95'
                  } ${sc.color}`}
                >
                  <div className="flex items-center justify-between w-full">
                    {sc.icon}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-slate-200">
                      {sc.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                      {sc.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-xs font-mono text-slate-400 w-10 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>

        {/* Blue Light / Circadian Warmth Section */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Blue Light Filter & Warmth
              </span>
            </div>
            <span className="text-xs font-mono text-amber-400">{settings.warmth}% Warm</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Softens harsh blue pixels into warm amber candlelight (1900K) to relieve night eye strain and preserve melatonin.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-sky-400">6500K</span>
            <input
              type="range"
              min="0"
              max="80"
              step="2"
              value={settings.warmth || 0}
              onChange={(e) => onUpdateSettings({ warmth: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-gradient-to-r from-sky-400 via-amber-300 to-amber-600 rounded-lg"
            />
            <span className="text-[11px] text-amber-500">1900K</span>
          </div>

          {/* Auto-Circadian Sunset Mode */}
          <div className="flex flex-wrap gap-2 items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-300">Auto-Circadian (Evening Warming)</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoCircadian: !settings.autoCircadian })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                settings.autoCircadian ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  settings.autoCircadian ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
