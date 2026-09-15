import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  Users,
  BookMarked,
  Languages,
  Send,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import type { Book, BookChapter } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  currentChapter: BookChapter;
  selectedText?: string;
}

type AITab = 'ask' | 'character' | 'summarize' | 'vocabulary';

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  book,
  currentChapter,
  selectedText,
}) => {
  const [activeTab, setActiveTab] = useState<AITab>('ask');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ask tab state
  const [question, setQuestion] = useState('');
  const [askHistory, setAskHistory] = useState<{ q: string; a: string; offline?: boolean }[]>([]);

  // Character tab state
  const [characterName, setCharacterName] = useState(selectedText || '');
  const [characterDossier, setCharacterDossier] = useState<string | null>(null);

  // Summary tab state
  const [chapterSummary, setChapterSummary] = useState<string | null>(null);

  // Vocabulary tab state
  const [wordToExplain, setWordToExplain] = useState(selectedText || '');
  useEffect(() => {
    if (isOpen && selectedText) {
      const words = selectedText.trim().split(/\s+/).length;
      if (words <= 3) {
        setActiveTab('vocabulary');
        setWordToExplain(selectedText);
        setCharacterName(selectedText);
      } else {
        setActiveTab('ask');
        setQuestion(`Explain this passage: "${selectedText}"`);
      }
    }
  }, [isOpen, selectedText]);
  const [vocabResult, setVocabResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    const currentQ = question.trim();
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await aiService.askBook({
        question: currentQ,
        bookTitle: book.title,
        author: book.author,
        currentChapter: currentChapter.title,
        contextText: currentChapter.content,
      });

      setAskHistory((prev) => [...prev, { q: currentQ, a: res.answer, offline: res.isOfflineFallback }]);
    } catch (err: any) {
      setAskHistory((prev) => [
        ...prev,
        { q: currentQ, a: `Error: ${err.message || 'Unable to connect to AI server.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchCharacter = async () => {
    if (!characterName.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await aiService.getCharacterDossier({
        characterName: characterName.trim(),
        bookTitle: book.title,
        currentExcerpt: currentChapter.content,
      });
      setCharacterDossier(res.dossier);
    } catch (err: any) {
      setCharacterDossier(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeChapter = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await aiService.summarizeChapter({
        chapterTitle: currentChapter.title,
        chapterText: currentChapter.content,
        bookTitle: book.title,
      });
      setChapterSummary(res.summary);
    } catch (err: any) {
      setChapterSummary(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainWord = async () => {
    if (!wordToExplain.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await aiService.explainVocabulary({
        word: wordToExplain.trim(),
        sentenceContext: currentChapter.content.slice(0, 1000),
        bookTitle: book.title,
      });
      setVocabResult(res.result);
    } catch (err: any) {
      setVocabResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full sm:w-96 md:w-[420px] bg-slate-900 border-l border-slate-800 z-40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        aria-label="AI Reading Assistant"
      >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Lumina AI Companion
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {book.title} · {currentChapter.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
        <button
          onClick={() => setActiveTab('ask')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'ask'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
        <button
          onClick={() => setActiveTab('character')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'character'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Dossier</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('summarize');
            if (!chapterSummary) handleSummarizeChapter();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'summarize'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('vocabulary')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'vocabulary'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>Vocab</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200 text-sm">
        {activeTab === 'ask' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
              Ask questions about the plot, symbolism, historical context, or literary structure. Lumina respects current reading progress to stay spoiler-free.
            </div>

            {/* Q&A stream */}
            <div className="space-y-3">
              {askHistory.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Try asking:
                  <div className="mt-2 space-y-1.5">
                    <button
                      onClick={() => {
                        setQuestion('Explain the core philosophical argument in this chapter.');
                      }}
                      className="block w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-300 transition"
                    >
                      "Explain the core philosophical argument in this chapter."
                    </button>
                    <button
                      onClick={() => {
                        setQuestion('What does the Time Traveller notice about the Eloi?');
                      }}
                      className="block w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-300 transition"
                    >
                      "What does the Time Traveller notice about the society?"
                    </button>
                  </div>
                </div>
              )}

              {askHistory.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium">
                    {item.q}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs leading-relaxed whitespace-pre-wrap relative group">
                    <button
                      onClick={() => copyToClipboard(item.a)}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-700/50 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                      title="Copy response"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {item.a}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 text-xs text-amber-400 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing literary analysis...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'character' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter character or faction name..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleFetchCharacter}
                disabled={isLoading || !characterName.trim()}
                className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs disabled:opacity-50 hover:bg-amber-400 transition"
              >
                Analyze
              </button>
            </div>

            {characterDossier ? (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs leading-relaxed whitespace-pre-wrap">
                {characterDossier}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Enter any character from the book to retrieve an instant, spoiler-free biographical dossier and personality profile.
              </div>
            )}
          </div>
        )}

        {activeTab === 'summarize' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Chapter Summary</span>
              <button
                onClick={handleSummarizeChapter}
                disabled={isLoading}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                {isLoading ? 'Generating...' : 'Refresh Summary'}
              </button>
            </div>

            {chapterSummary ? (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs leading-relaxed whitespace-pre-wrap">
                {chapterSummary}
              </div>
            ) : (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={wordToExplain}
                onChange={(e) => setWordToExplain(e.target.value)}
                placeholder="Enter word to explain..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleExplainWord}
                disabled={isLoading || !wordToExplain.trim()}
                className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs disabled:opacity-50 hover:bg-amber-400 transition"
              >
                Explain
              </button>
            </div>

            {vocabResult ? (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs leading-relaxed whitespace-pre-wrap">
                {vocabResult}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Look up archaic words, literary terminology, or idioms in context.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar for Ask Tab */}
      {activeTab === 'ask' && (
        <form onSubmit={handleAsk} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this book..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="p-2 rounded-lg bg-amber-500 text-slate-950 disabled:opacity-40 hover:bg-amber-400 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </aside>
    </>
  );
};
