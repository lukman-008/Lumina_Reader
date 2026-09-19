import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  X,
  FileText,
  BookOpen,
  Layers,
  Highlighter,
  Bookmark as BookmarkIcon,
  Clock,
  Settings,
  Sparkles,
  Check,
} from 'lucide-react';
import { backupService, type RestoreResult } from '../services/backupService';
import type { LuminaBackup } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLibraryChanged: () => void;
  initialFile?: File | null;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onLibraryChanged,
  initialFile,
}) => {
  useEscapeKey(isOpen, onClose);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ message: string; percent: number } | null>(null);
  const [importedBackup, setImportedBackup] = useState<LuminaBackup | null>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ message: string; percent: number } | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExportProgress(null);
      setRestoreProgress(null);
      setRestoreResult(null);
      setErrorMessage(null);
      setIsDraggingOver(false);

      if (initialFile) {
        processFile(initialFile);
      } else {
        setImportedBackup(null);
        setImportedFileName('');
      }
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setRestoreResult(null);
    try {
      const parsed = await backupService.parseBackupFile(file);
      setImportedBackup(parsed);
      setImportedFileName(file.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read backup file.');
      setImportedBackup(null);
      setImportedFileName('');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportProgress({ message: 'Gathering library data...', percent: 5 });
    try {
      await backupService.exportLibraryBackup((msg, pct) => {
        setExportProgress({ message: msg, percent: pct });
      });
      setTimeout(() => {
        setExportProgress(null);
      }, 2500);
    } catch (err: any) {
      setErrorMessage('Export failed: ' + (err.message || 'Unknown error'));
      setExportProgress(null);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRestore = async (mode: 'merge' | 'replace') => {
    if (!importedBackup) return;
    setIsRestoring(true);
    setErrorMessage(null);
    setRestoreProgress({ message: 'Preparing restore...', percent: 5 });

    try {
      const result = await backupService.restoreBackup(importedBackup, mode, (msg, pct) => {
        setRestoreProgress({ message: msg, percent: pct });
      });
      setRestoreResult(result);
      setImportedBackup(null);
      setImportedFileName('');
      setRestoreProgress(null);
      onLibraryChanged();
    } catch (err: any) {
      setErrorMessage('Restore failed: ' + (err.message || 'Unknown error'));
      setRestoreProgress(null);
    } finally {
      setIsRestoring(false);
    }
  };

  // Helper stats for preview
  const formatCounts = importedBackup ? importedBackup.books.reduce((acc, b) => {
    acc[b.format] = (acc[b.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const pdfCount = importedBackup?.books.filter(b => b.format === 'pdf' || b.rawFile || b.rawFileBase64).length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col space-y-6 cursor-default max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap gap-2 items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Library Backup & Cross-Device Transfer</h3>
              <p className="text-xs text-slate-400">
                Self-contained <code className="text-amber-400 font-mono">.lumina</code> offline data archive
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

        {/* Notifications */}
        {restoreResult && (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Library Successfully Restored & Ready!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 text-slate-300">
              <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/20">
                <span className="font-bold text-white block text-sm">{restoreResult.booksCount}</span>
                <span className="text-[10px] text-slate-400">Books Restored</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/20">
                <span className="font-bold text-white block text-sm">{restoreResult.highlightsCount}</span>
                <span className="text-[10px] text-slate-400">Highlights Restored</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-emerald-500/20">
                <span className="font-bold text-white block text-sm">{restoreResult.shelvesCount}</span>
                <span className="text-[10px] text-slate-400">Shelves Restored</span>
              </div>
            </div>
            {restoreResult.pdfsRestored > 0 && (
              <span className="text-[11px] text-emerald-300/90 mt-1">
                Included {restoreResult.pdfsRestored} native PDF binary document{restoreResult.pdfsRestored > 1 ? 's' : ''} with full pagination and annotations.
              </span>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Export Section */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Export Library to .lumina File
              </span>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Packaging...' : 'Export .lumina Backup'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Packages all books, embedded PDF documents, full text chapters, highlights, bookmarks, custom shelves, reading sessions, and theme preferences into a single portable <code className="text-amber-400 font-mono">.lumina</code> file for another device or offline cold storage.
          </p>

          {/* Export Progress Bar */}
          {exportProgress && (
            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-700">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>{exportProgress.message}</span>
                <span className="font-mono text-amber-400">{exportProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Import / Restore Section */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Import & Restore from Another Device
            </span>
          </div>

          {!importedBackup ? (
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                isDraggingOver
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 hover:border-amber-500/60 bg-slate-900/40'
              }`}
            >
              <FileCode className={`w-8 h-8 transition-transform ${isDraggingOver ? 'scale-110 text-amber-400' : 'text-slate-500'}`} />
              <span className="text-xs font-medium text-slate-200 text-center">
                Click to browse or drop your <code className="text-amber-400 font-mono">.lumina</code> backup file here
              </span>
              <span className="text-[10px] text-slate-400">
                Self-contained Lumina library archive with complete binary verification
              </span>
              <input
                type="file"
                accept=".lumina,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-700">
              {/* File details */}
              <div className="flex flex-wrap gap-2 items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-100 font-mono">
                    {importedFileName || 'library_backup.lumina'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  v{importedBackup.version} · Exported {new Date(importedBackup.exportedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px]">Books</span>
                  </div>
                  <span className="font-bold font-mono text-slate-100 text-sm block">
                    {importedBackup.books.length}
                  </span>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {Object.entries(formatCounts).map(([fmt, count]) => `${count} ${fmt.toUpperCase()}`).join(', ')}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Highlighter className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px]">Highlights</span>
                  </div>
                  <span className="font-bold font-mono text-slate-100 text-sm block">
                    {importedBackup.highlights.length}
                  </span>
                  <span className="text-[9px] text-slate-400">with notes & colors</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px]">Shelves</span>
                  </div>
                  <span className="font-bold font-mono text-slate-100 text-sm block">
                    {importedBackup.shelves.length}
                  </span>
                  <span className="text-[9px] text-slate-400">custom shelves</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px]">History</span>
                  </div>
                  <span className="font-bold font-mono text-slate-100 text-sm block">
                    {importedBackup.readingSessions.length}
                  </span>
                  <span className="text-[9px] text-slate-400">reading sessions</span>
                </div>
              </div>

              {/* Book title samples */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider block">
                  Archive Contents Preview
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {importedBackup.books.map((b, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1.5"
                    >
                      <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-slate-900 text-amber-400 rounded">
                        {b.format}
                      </span>
                      <span className="truncate max-w-[140px]">{b.title}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Binary PDF note if present */}
              {pdfCount > 0 && (
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-300 text-[11px] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    <strong>{pdfCount} PDF document{pdfCount > 1 ? 's' : ''} detected</strong> with full binary payload. Ready to render on this device with page-level highlights and annotations.
                  </span>
                </div>
              )}

              {/* Settings preview */}
              {importedBackup.settings && (
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-slate-300 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Includes personalized preferences: Theme ({importedBackup.settings.theme}), Font ({importedBackup.settings.fontFamily}), Layout ({importedBackup.settings.layoutMode}).</span>
                  </div>
                </div>
              )}

              {/* Restore Progress */}
              {restoreProgress && (
                <div className="space-y-1.5 bg-slate-850 p-3 rounded-xl border border-slate-700">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{restoreProgress.message}</span>
                    <span className="font-mono text-amber-400">{restoreProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${restoreProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Restore Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setImportedBackup(null);
                    setImportedFileName('');
                  }}
                  disabled={isRestoring}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  Choose Different File
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore('merge')}
                    disabled={isRestoring}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition cursor-pointer disabled:opacity-50"
                    title="Merges books and annotations without deleting existing local items"
                  >
                    Merge with Current
                  </button>
                  <button
                    onClick={() => handleRestore('replace')}
                    disabled={isRestoring}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    title="Replaces local database to match the exact library on the other device"
                  >
                    Replace All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
