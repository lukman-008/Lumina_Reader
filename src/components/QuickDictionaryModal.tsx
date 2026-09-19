import React, { useState, useEffect } from 'react';
import {
  Volume2,
  BookmarkPlus,
  Check,
  Sparkles,
  X,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  vocabularyService,
  DictionaryLookupResult,
} from '../services/vocabularyService';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface QuickDictionaryModalProps {
  isOpen: boolean;
  word: string;
  contextQuote?: string;
  bookId?: string;
  bookTitle?: string;
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
  onOpenVocabularyDeck?: () => void;
}

export const QuickDictionaryModal: React.FC<QuickDictionaryModalProps> = ({
  isOpen,
  word,
  contextQuote,
  bookId,
  bookTitle,
  onClose,
  onAskAI,
  onOpenVocabularyDeck,
}) => {
  useEscapeKey(isOpen, onClose);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryLookupResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentWord, setCurrentWord] = useState(word);

  useEffect(() => {
    if (word) {
      setCurrentWord(word);
    }
  }, [word]);

  useEffect(() => {
    if (!isOpen || !currentWord) return;

    let isMounted = true;
    setLoading(true);
    setIsSaved(vocabularyService.isWordSaved(currentWord));

    vocabularyService.lookup(currentWord).then((res) => {
      if (isMounted) {
        setResult(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentWord]);

  if (!isOpen) return null;

  const cleanWord = currentWord.trim().replace(/^[^\w]+|[^\w]+$/g, '');

  const handlePronounce = () => {
    if (!cleanWord) return;
    setIsPlayingAudio(true);
    if (result?.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        vocabularyService.speak(cleanWord);
        setTimeout(() => setIsPlayingAudio(false), 800);
      };
      audio.play().catch(() => {
        vocabularyService.speak(cleanWord);
        setTimeout(() => setIsPlayingAudio(false), 800);
      });
    } else {
      vocabularyService.speak(cleanWord);
      setTimeout(() => setIsPlayingAudio(false), 800);
    }
  };

  const handleSaveToFlashcards = () => {
    if (!result) return;
    const primaryMeaning = result.meanings[0];
    const primaryDef = primaryMeaning?.definitions[0];

    vocabularyService.saveWord({
      word: result.word || cleanWord,
      phonetic: result.phonetic,
      partOfSpeech: primaryMeaning?.partOfSpeech,
      definition: primaryDef?.definition || 'Notable term from reading.',
      example: primaryDef?.example,
      synonyms: primaryDef?.synonyms,
      bookId,
      bookTitle,
      contextQuote,
    });

    setIsSaved(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Instant Lexicon & Dictionary
              </h3>
              {result?.source === 'online' && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Definition
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenVocabularyDeck && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVocabularyDeck();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-300 hover:bg-slate-800 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="View Saved Vocabulary & Flashcards"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">My Flashcards</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium">Looking up "{cleanWord}"...</p>
            </div>
          ) : result ? (
            <>
              {/* Word & Phonetic Banner */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-bold font-serif text-amber-300 tracking-wide">
                      {result.word}
                    </h2>
                    {result.phonetic && (
                      <span className="text-sm font-mono text-slate-400 font-normal">
                        {result.phonetic}
                      </span>
                    )}
                  </div>
                  {contextQuote && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      “{contextQuote}”
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={handlePronounce}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-slate-950 scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300'
                    }`}
                    title="Pronounce word"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSaveToFlashcards}
                    className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold'
                    }`}
                    title={isSaved ? 'Saved in Flashcards' : 'Save word to Flashcards'}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-[11px] hidden sm:inline">Saved</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-4 h-4" />
                        <span className="text-[11px] hidden sm:inline">Add Card</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Meanings & Definitions */}
              <div className="space-y-4">
                {result.meanings.map((meaning, mIdx) => (
                  <div key={mIdx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {meaning.partOfSpeech}
                      </span>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-slate-800">
                      {meaning.definitions.map((def, dIdx) => (
                        <div key={dIdx} className="space-y-1 text-xs">
                          <p className="text-slate-200 leading-relaxed font-sans">
                            <span className="text-slate-400 font-mono text-[10px] mr-1.5">
                              {dIdx + 1}.
                            </span>
                            {def.definition}
                          </p>

                          {def.example && (
                            <p className="text-slate-400 italic text-[11px] pl-4">
                              “{def.example}”
                            </p>
                          )}

                          {def.synonyms && def.synonyms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-1 pl-4">
                              <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">
                                Synonyms:
                              </span>
                              {def.synonyms.map((syn, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => setCurrentWord(syn)}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 cursor-pointer transition border border-slate-700/60"
                                >
                                  {syn}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p className="text-sm">No dictionary entry found for "{cleanWord}".</p>
              <p className="text-xs opacity-70">
                You can ask the AI assistant to analyze this term in the book's context.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 px-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {onAskAI ? (
            <button
              onClick={() => {
                onClose();
                onAskAI(`Explain the meaning and literary nuance of "${cleanWord}" in the context of this book.`);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask AI Nuance</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
