import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  X,
  RefreshCw,
  Library,
  BookOpen,
} from 'lucide-react';
import { backupService } from '../services/backupService';
import type { LuminaBackup } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLibraryChanged: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onLibraryChanged,
}) => {
  useEscapeKey(isOpen, onClose);
  const [isExporting, setIsExporting] = useState(false);
  const [importedBackup, setImportedBackup] = useState<LuminaBackup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen) {
      setImportedBackup(null);
      setIsRestoring(false);
      setRestoreSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await backupService.exportLibraryBackup();
    } catch (err: any) {
      setErrorMessage('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setRestoreSuccess(null);

    try {
      const parsed = await backupService.parseBackupFile(file);
      setImportedBackup(parsed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read backup file.');
    }
  };

  const handleRestore = async (mode: 'merge' | 'replace') => {
    if (!importedBackup) return;
    setIsRestoring(true);
    setErrorMessage(null);

    try {
      const result = await backupService.restoreBackup(importedBackup, mode);
      setRestoreSuccess(
        `Successfully restored ${result.booksCount} books and ${result.highlightsCount} highlights (${mode === 'merge' ? 'Merged' : 'Replaced'}).`
      );
      setImportedBackup(null);
      onLibraryChanged();
    } catch (err: any) {
      setErrorMessage('Restore failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col space-y-6 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap gap-2 items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Library Backup & Restore</h3>
              <p className="text-xs text-slate-400">
                Self-contained .lumina offline data archive
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
        {restoreSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Export Section */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2.5">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Export Library (.lumina)
              </span>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Packaging...' : 'Export Backup'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Exports all books, full text, bookmarks, highlights, reading stats, and custom shelves into a single offline file.
          </p>
        </div>

        {/* Import Section */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Restore / Import Backup
            </span>
          </div>

          {!importedBackup ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-900/40">
              <FileCode className="w-7 h-7 text-slate-500" />
              <span className="text-xs font-medium text-slate-300">
                Click or drop a <code className="text-amber-400 font-mono">.lumina</code> file
              </span>
              <span className="text-[10px] text-slate-500">
                Validates data integrity before writing to storage
              </span>
              <input
                type="file"
                accept=".lumina,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">
                  Backup Archive Detected
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  v{importedBackup.version} · {importedBackup.exportedAt.slice(0, 10)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-800">
                  <span className="font-bold font-mono text-slate-100 block">
                    {importedBackup.books.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Books</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800">
                  <span className="font-bold font-mono text-slate-100 block">
                    {importedBackup.highlights.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Highlights</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800">
                  <span className="font-bold font-mono text-slate-100 block">
                    {importedBackup.shelves.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Shelves</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setImportedBackup(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestore('merge')}
                  disabled={isRestoring}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition"
                >
                  Merge with Current
                </button>
                <button
                  onClick={() => handleRestore('replace')}
                  disabled={isRestoring}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-semibold transition"
                >
                  Replace All
                </button>
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
