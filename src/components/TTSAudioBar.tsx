import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  X,
  FastForward,
  Settings2,
} from 'lucide-react';
import { ttsService, type TTSVoiceOption } from '../services/ttsService';

interface TTSAudioBarProps {
  currentSentence: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TTSAudioBar: React.FC<TTSAudioBarProps> = ({
  currentSentence,
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<TTSVoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const updateVoices = () => {
      const v = ttsService.getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        const defaultVoice = v.find((voice) => voice.isDefault) || v[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    const unsubState = ttsService.onStateChange((playing, paused) => {
      setIsPlaying(playing);
      setIsPaused(paused);
    });

    return () => {
      unsubState();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlayPause = () => {
    if (isPaused) {
      ttsService.resume();
    } else if (isPlaying) {
      ttsService.pause();
    }
  };

  const handleStop = () => {
    ttsService.stop();
    onClose();
  };

  const cycleRate = () => {
    const rates = [0.8, 1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = rates.indexOf(rate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setRate(nextRate);
  };

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] p-3 z-50 animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-300 text-slate-100 flex flex-col gap-3">
      {/* Current sentence preview */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5 px-1">
        <div className="flex items-center gap-3 min-w-0">
          {isPlaying ? (
            <div className="flex items-end gap-[3px] h-4 w-4 shrink-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-400 rounded-full animate-pulse"
                  style={{
                    height: `${40 + Math.random() * 60}%`,
                    animationDuration: `${0.4 + i * 0.15}s`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          ) : (
            <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <p className="text-xs text-slate-300 italic truncate font-serif leading-relaxed">
            "{currentSentence || 'Reading text aloud...'}"
          </p>
        </div>
        <button
          onClick={handleStop}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center transition shadow-lg shadow-amber-500/20 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Resume'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 ml-1 fill-slate-950" />}
          </button>
          <button
            onClick={handleStop}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 active:scale-95 transition cursor-pointer"
            title="Stop Audio"
          >
            <Square className="w-4 h-4 fill-current opacity-70" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed rate button */}
          <button
            onClick={cycleRate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:scale-95 text-[11px] font-mono text-amber-300 border border-slate-700/50 transition cursor-pointer"
            title="Change playback speed"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{rate.toFixed(2)}x</span>
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-xl transition cursor-pointer active:scale-95 ${showSettings ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Settings */}
      {showSettings && voices.length > 0 && (
        <div className="pt-2 pb-1 px-1 border-t border-slate-800/80 animate-in slide-in-from-top-2 fade-in duration-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Narrator Voice</span>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 max-w-[180px] truncate appearance-none cursor-pointer"
          >
            {voices.slice(0, 15).map((v) => (
              <option key={v.name} value={v.name}>
                {v.name.replace(/Microsoft|Google|Siri/g, '').trim().slice(0, 24)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
