import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Volume2,
  CheckCircle2,
  Circle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Copy,
  Check,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  vocabularyService,
  VocabularyWord,
} from '../services/vocabularyService';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWord?: (word: string) => void;
}

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  onClose,
  onSelectWord,
}) => {
  useEscapeKey(isOpen, onClose);

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'list'>('flashcards');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'learning' | 'mastered'>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = vocabularyService.subscribe((updated) => {
      setWords(updated);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const filteredWords = words.filter((w) => {
    const matchesSearch =
      !searchQuery ||
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.definition.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'learning') return !w.mastered;
    if (filterMode === 'mastered') return w.mastered;
    return true;
  });

  const activeCard = filteredWords[currentCardIndex] || filteredWords[0];
  const masteredCount = words.filter((w) => w.mastered).length;

  const handleNextCard = () => {
    setIsFlipped(false);
    if (filteredWords.length > 0) {
      setCurrentCardIndex((prev) => (prev + 1) % filteredWords.length);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (filteredWords.length > 0) {
      setCurrentCardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }
  };

  const handleToggleMastered = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    vocabularyService.toggleMastered(id);
  };

  const handleDeleteWord = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    vocabularyService.deleteWord(id);
    if (currentCardIndex >= filteredWords.length - 1) {
      setCurrentCardIndex(Math.max(0, filteredWords.length - 2));
    }
  };

  const handleExportAnki = () => {
    const csv = vocabularyService.exportAsAnkiCSV();
    const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_vocabulary_anki_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = vocabularyService.exportAsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_vocabulary_deck_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    const text = vocabularyService.exportAsMarkdown();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header with Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 border-b border-slate-800 bg-slate-950/60 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Vocabulary Flashcard Deck</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 font-semibold">
                  {words.length} words
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {masteredCount} of {words.length} mastered · Learn as you read
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/80">
              <button
                type="button"
                onClick={() => setActiveTab('flashcards')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'flashcards'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                List ({words.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {words.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-600 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-slate-200">Your vocabulary deck is empty</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Select any word or phrase while reading and tap <strong className="text-amber-400">"Define"</strong> or <strong className="text-amber-400">"Add Card"</strong> to build your personalized personal lexicon!
            </p>
          </div>
        ) : activeTab === 'flashcards' ? (
          /* Interactive 3D Flip Flashcard Mode */
          <div className="flex-1 p-6 flex flex-col items-center justify-between overflow-y-auto space-y-4">
            {/* Progress pill */}
            <div className="flex items-center justify-between w-full max-w-md text-xs text-slate-400">
              <span>Card {filteredWords.length > 0 ? currentCardIndex + 1 : 0} of {filteredWords.length}</span>
              <span className="text-amber-400 font-mono">
                {activeCard?.mastered ? '✅ Mastered' : '⏳ In Review'}
              </span>
            </div>

            {/* Flashcard with 3D Flip */}
            {activeCard && (
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ perspective: '1000px' }}
                className="w-full max-w-md h-72 cursor-pointer select-none group"
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="relative w-full h-full"
                >
                  {/* Front Side */}
                  <div
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 p-6 flex flex-col justify-between shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        {activeCard.partOfSpeech || 'Word'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          vocabularyService.speak(activeCard.word);
                        }}
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-400 hover:text-amber-300 transition"
                        title="Pronounce word"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-3xl font-bold font-serif text-slate-100 tracking-wide">
                        {activeCard.word}
                      </h3>
                      {activeCard.phonetic && (
                        <p className="text-sm font-mono text-slate-400">
                          {activeCard.phonetic}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 opacity-75 group-hover:opacity-100 transition">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Click card to reveal definition</span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-950 border-2 border-amber-500/40 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold text-amber-300">
                        {activeCard.word}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeCard.bookTitle || 'Book'}
                      </span>
                    </div>

                    <div className="my-auto space-y-2">
                      <p className="text-sm text-slate-100 leading-relaxed font-sans">
                        {activeCard.definition}
                      </p>
                      {activeCard.example && (
                        <p className="text-xs italic text-slate-400 pl-3 border-l-2 border-amber-500/40">
                          “{activeCard.example}”
                        </p>
                      )}
                      {activeCard.contextQuote && (
                        <p className="text-[11px] text-amber-200/70 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          Context: “{activeCard.contextQuote}”
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Click to flip back</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper and Mastery Controls */}
            <div className="flex items-center gap-3 w-full max-w-md justify-between pt-2">
              <button
                type="button"
                onClick={handlePrevCard}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition cursor-pointer border border-slate-700"
                title="Previous Card"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => activeCard && handleToggleMastered(activeCard.id, e)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  activeCard?.mastered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {activeCard?.mastered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mastered! Tap to mark Review</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    <span>Mark as Mastered</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNextCard}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition cursor-pointer border border-slate-700"
                title="Next Card"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* List & Management Mode */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Filter Toolbar */}
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved vocabulary..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                {(['all', 'learning', 'mastered'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterMode(mode)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                      filterMode === mode
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Words List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredWords.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold font-serif text-amber-300">
                        {w.word}
                      </h4>
                      {w.phonetic && (
                        <span className="text-xs font-mono text-slate-400">
                          {w.phonetic}
                        </span>
                      )}
                      {w.partOfSpeech && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-mono uppercase bg-slate-700 text-slate-300">
                          {w.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {w.definition}
                    </p>
                    {w.example && (
                      <p className="text-[11px] italic text-slate-400">
                        “{w.example}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => vocabularyService.speak(w.word)}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-700 transition"
                      title="Pronounce"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleToggleMastered(w.id, e)}
                      className={`p-1.5 rounded-lg transition ${
                        w.mastered
                          ? 'text-emerald-400 hover:bg-emerald-500/20'
                          : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'
                      }`}
                      title={w.mastered ? 'Mark in progress' : 'Mark mastered'}
                    >
                      {w.mastered ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleDeleteWord(w.id, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
                      title="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer with Anki & Markdown Export Bar */}
        <div className="p-3.5 px-6 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAnki}
              disabled={words.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-40"
              title="Export as Anki flashcards TSV file"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Anki (.tsv)</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={words.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-40"
              title="Download as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Markdown</span>
            </button>
            <button
              onClick={handleCopyAll}
              disabled={words.length === 0}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition cursor-pointer border border-slate-700 disabled:opacity-40"
              title="Copy all words to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
