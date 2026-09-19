import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Layers,
  FileCode,
  FileSpreadsheet,
  Trash2,
  ArrowRight,
  Globe,
  Database,
} from 'lucide-react';
import type { Book, Shelf, ImportQueueItem } from '../types';
import { parseUploadedBook, countWords } from '../services/bookParser';
import { backupService } from '../services/backupService';
import { db } from '../services/db';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface FileImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelves: Shelf[];
  onBooksImported: () => void;
  initialFiles?: FileList | null;
}

export const FileImporterModal: React.FC<FileImporterModalProps> = ({
  isOpen,
  onClose,
  shelves,
  onBooksImported,
  initialFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [queue, setQueue] = useState<ImportQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Paste Tab States
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteAuthor, setPasteAuthor] = useState('');
  const [pasteContent, setPasteContent] = useState('');

  const handleClose = () => {
    setQueue([]);
    setPasteTitle('');
    setPasteAuthor('');
    setPasteContent('');
    setActiveTab('upload');
    onClose();
  };

  useEscapeKey(isOpen, handleClose);

  // Handle passed-in initial files
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0) {
      handleFileSelect(initialFiles);
    }
  }, [isOpen, initialFiles]);

  if (!isOpen) return null;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: ImportQueueItem[] = Array.from(files).map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let format: ImportQueueItem['format'] = 'other';
      if (ext === 'epub') format = 'epub';
      else if (ext === 'pdf') format = 'pdf';
      else if (ext === 'txt') format = 'txt';
      else if (ext === 'md') format = 'md';
      else if (ext === 'lumina' || file.name.includes('lumina_library_backup')) format = 'lumina';

      return {
        id: 'queue-' + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        format,
        status: 'pending',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);

    // Parse files sequentially
    for (const item of newItems) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'parsing' } : q))
      );

      if (item.format === 'lumina') {
        try {
          const parsedBackup = await backupService.parseBackupFile(item.file);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: 'success', parsedBackup } : q
            )
          );
        } catch (err: any) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'error', errorMessage: err.message || 'Failed to parse .lumina backup' }
                : q
            )
          );
        }
        continue;
      }

      try {
        const parsed = await parseUploadedBook(item.file);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'success', parsedBook: parsed } : q
          )
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: err.message || 'Failed to parse file' }
              : q
          )
        );
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveAllToLibrary = async () => {
    const readyItems = queue.filter(
      (item) => item.status === 'success' && (item.parsedBook || item.parsedBackup)
    );
    if (readyItems.length === 0) return;

    setIsProcessing(true);
    try {
      for (const item of readyItems) {
        if (item.parsedBackup) {
          await backupService.restoreBackup(item.parsedBackup, 'merge');
        } else if (item.parsedBook) {
          const bookToSave: Book = {
            ...item.parsedBook,
            shelfId: selectedShelfId || undefined,
          };
          await db.books.put(bookToSave);
        }
      }
    } catch (err) {
      console.error('Failed to import items:', err);
    } finally {
      setIsProcessing(false);
    }

    onBooksImported();
    handleClose();
  };

  const handleImportPastedArticle = async () => {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;

    const words = countWords(pasteContent);
    const newBook: Book = {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      title: pasteTitle.trim(),
      author: pasteAuthor.trim() || 'Imported Web Article',
      description: pasteContent.slice(0, 240).trim() + '...',
      format: 'txt',
      totalWords: words,
      coverGradient: 'from-amber-700 via-orange-800 to-stone-900',
      chapters: [
        {
          id: 'ch-1',
          title: pasteTitle.trim(),
          content: pasteContent.trim(),
          wordCount: words,
        },
      ],
      category: 'Web Articles',
      addedAt: Date.now(),
      shelfId: selectedShelfId || undefined,
      readingProgress: {
        currentChapterIndex: 0,
        currentPageIndex: 0,
        percentage: 0,
        lastReadTimestamp: Date.now(),
      },
    };

    await db.books.put(newBook);
    onBooksImported();
    handleClose();
  };

  const successfulCount = queue.filter((i) => i.status === 'success').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150 cursor-pointer"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90dvh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide">File & Book Importer</h2>
              <p className="text-[11px] text-slate-400">
                Import EPUB, Markdown, TXT, or PDF into your private offline library
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Files Drag & Drop</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-2.5 font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'text'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Article / Direct Text</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Target Shelf Selector */}
          {shelves.length > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Assign to Shelf upon import:</span>
              </div>
              <select
                value={selectedShelfId}
                onChange={(e) => setSelectedShelfId(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value="">No Shelf (General Library)</option>
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                    : 'border-slate-700/80 hover:border-amber-500/50 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".epub,.txt,.md,.pdf,.lumina"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Click to browse or drag & drop files here
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Batch import multiple files simultaneously. Supports standard EPUB, Markdown (.md), Plain Text (.txt), PDF, and .lumina library archives.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-400 border border-slate-700">
                    EPUB
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-sky-400 border border-slate-700">
                    MARKDOWN
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700">
                    TXT
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-rose-400 border border-slate-700">
                    PDF
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                    .LUMINA BACKUP
                  </span>
                </div>
              </div>

              {/* Import Queue List */}
              {queue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 px-1">
                    <span>Import Queue ({queue.length} files)</span>
                    <button
                      onClick={() => setQueue([])}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      Clear Queue
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-md bg-slate-800 text-slate-300 shrink-0">
                            {item.format === 'lumina' ? (
                              <Database className="w-3.5 h-3.5 text-amber-400" />
                            ) : item.format === 'epub' ? (
                              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            ) : item.format === 'md' ? (
                              <FileCode className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate text-[11px]">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {(item.size / 1024).toFixed(1)} KB •{' '}
                              {item.parsedBackup
                                ? `Lumina Archive (${item.parsedBackup.books.length} books, ${item.parsedBackup.highlights.length} highlights, ${item.parsedBackup.shelves.length} shelves)`
                                : item.parsedBook
                                ? `${(item.parsedBook.chapters?.length || 0)} chapters, ${item.parsedBook.totalWords.toLocaleString()} words`
                                : item.status}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'parsing' && (
                            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          )}
                          {item.status === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          {item.status === 'error' && (
                            <span className="flex items-center gap-1 text-rose-400 text-[10px]" title={item.errorMessage}>
                              <AlertCircle className="w-3.5 h-3.5" /> Error
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveQueueItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Article / Book Title *
                  </label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="e.g. Meditations on First Philosophy"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Author / Source
                  </label>
                  <input
                    type="text"
                    value={pasteAuthor}
                    onChange={(e) => setPasteAuthor(e.target.value)}
                    placeholder="e.g. René Descartes"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Text or Markdown Content *
                </label>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste article, essay, notes, or chapter text here..."
                  rows={8}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none font-serif leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-slate-500 pt-1">
                <span>{countWords(pasteContent).toLocaleString()} words estimated</span>
                <button
                  onClick={handleImportPastedArticle}
                  disabled={!pasteTitle.trim() || !pasteContent.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-slate-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import into Library</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'upload' && (
          <div className="p-4 border-t border-slate-800 flex flex-wrap gap-3 items-center justify-between shrink-0 bg-slate-950/40">
            <span className="text-xs text-slate-400">
              {successfulCount > 0 ? `${successfulCount} files ready to save` : 'Select files to import'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAllToLibrary}
                disabled={successfulCount === 0 || isProcessing}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                {isProcessing ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>Add {successfulCount} Books to Library</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
