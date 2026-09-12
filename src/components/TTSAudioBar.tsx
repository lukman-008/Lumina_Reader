import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  X,
  FastForward,
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
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-40 animate-in slide-in-from-bottom duration-200 text-slate-100 flex flex-col gap-2">
      {/* Current sentence preview */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-xs text-slate-300 italic truncate font-serif">
            "{currentSentence || 'Reading text aloud...'}"
          </p>
        </div>
        <button
          onClick={handleStop}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition shadow-xs"
            title={isPlaying ? 'Pause' : 'Resume'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={handleStop}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Stop Audio"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Speed rate button */}
        <button
          onClick={cycleRate}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-mono text-amber-300 transition"
          title="Change playback speed"
        >
          <FastForward className="w-3 h-3" />
          <span>{rate}x</span>
        </button>

        {/* Voice selector */}
        {voices.length > 0 && (
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none max-w-[160px] truncate"
          >
            {voices.slice(0, 10).map((v) => (
              <option key={v.name} value={v.name}>
                {v.name.slice(0, 24)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
