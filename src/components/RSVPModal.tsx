import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  X,
  Zap,
  Sliders,
} from 'lucide-react';

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  chapterTitle: string;
  initialWpm?: number;
}

export const RSVPModal: React.FC<RSVPModalProps> = ({
  isOpen,
  onClose,
  text,
  chapterTitle,
  initialWpm = 300,
}) => {
  const [wpm, setWpm] = useState(initialWpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  // Parse words from text
  const words = React.useMemo(() => {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter((w) => w.length > 0);
  }, [text]);

  const timerRef = useRef<any>(null);

  // Calculate Optimal Recognition Point (ORP)
  const currentWord = words[wordIndex] || '';
  const orpIndex = React.useMemo(() => {
    const len = currentWord.length;
    if (len <= 1) return 0;
    if (len <= 5) return 1;
    if (len <= 9) return 2;
    if (len <= 13) return 3;
    return 4;
  }, [currentWord]);

  const prefix = currentWord.slice(0, orpIndex);
  const focalLetter = currentWord[orpIndex] || '';
  const suffix = currentWord.slice(orpIndex + 1);

  // Timing delay per word (with slight pause on punctuation)
  const getDelayForWord = (w: string) => {
    const baseMs = (60 / wpm) * 1000;
    if (/[.!?]$/.test(w)) return baseMs * 2.1; // longer pause at end of sentence
    if (/[,;:]$/.test(w)) return baseMs * 1.5; // slight pause at comma
    return baseMs;
  };

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      const delay = getDelayForWord(currentWord);
      timerRef.current = setTimeout(() => {
        setWordIndex((prev) => {
          if (prev < words.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, isPlaying, wordIndex, wpm, currentWord, words.length]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWordIndex((prev) => Math.max(0, prev - 15));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWordIndex((prev) => Math.min(words.length - 1, prev + 15));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, words.length, onClose]);

  if (!isOpen) return null;

  const progressPercent = Math.round(((wordIndex + 1) / words.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none" onClick={onClose}>
      <div className="w-full max-w-xl rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col space-y-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              RSVP Speed Reader · {chapterTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RSVP Display Box */}
        <div 
          onClick={() => setIsPlaying((prev) => !prev)}
          className="h-44 rounded-2xl bg-slate-900 border border-slate-800 relative flex flex-col items-center justify-center px-4 overflow-hidden cursor-pointer"
        >
          {/* Top and Bottom Alignment Marker Guides */}
          <div className="absolute top-2 w-1.5 h-3 bg-amber-500/80 rounded-full" />
          <div className="absolute bottom-2 w-1.5 h-3 bg-amber-500/80 rounded-full" />
          <div className="absolute inset-y-0 w-px bg-amber-500/20" />

          {/* Word Presentation with Focal Point */}
          <div className="text-3xl sm:text-4xl font-mono tracking-wide flex items-center z-10">
            <span className="text-right w-32 sm:w-44 text-slate-200">{prefix}</span>
            <span className="text-amber-400 font-bold px-0.5">{focalLetter}</span>
            <span className="text-left w-32 sm:w-44 text-slate-200">{suffix}</span>
          </div>

          {/* Micro context snippet */}
          <p className="absolute bottom-3 text-[11px] text-slate-500 italic max-w-sm truncate text-center">
            "{words.slice(Math.max(0, wordIndex - 4), wordIndex + 5).join(' ')}"
          </p>
        </div>

        {/* Progress Bar & Word Counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Word {wordIndex + 1} of {words.length}
            </span>
            <span className="text-amber-400">{progressPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max={words.length - 1}
            value={wordIndex}
            onChange={(e) => {
              setWordIndex(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Controls: Play/Pause, Rewind, Fast Forward, WPM */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Playback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWordIndex((prev) => Math.max(0, prev - 15))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition"
              title="Rewind 15 words (←)"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              <span className="text-xs">{isPlaying ? 'Pause' : 'Start (Space)'}</span>
            </button>
            <button
              onClick={() => setWordIndex((prev) => Math.min(words.length - 1, prev + 15))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition"
              title="Fast forward 15 words (→)"
            >
              <FastForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setWordIndex(0);
                setIsPlaying(false);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Preset Chips & Slider */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[250, 350, 450, 600].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setWpm(speed)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono transition ${
                    wpm === speed
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <span>{wpm}</span>
              <span className="text-slate-500 text-[10px]">WPM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
