import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Copy,
  Check,
  Download,
  Upload,
  ArrowRight,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { progressSyncService, type SyncInfo } from '../services/progressSyncService';
import type { ReadingProgressSyncPayload } from '../types';

interface ReadingProgressSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: () => void;
}

export const ReadingProgressSyncModal: React.FC<ReadingProgressSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [syncCode, setSyncCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [lastSyncInfo, setLastSyncInfo] = useState<SyncInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<ReadingProgressSyncPayload | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLastSyncInfo(progressSyncService.getLastSyncInfo());
      generateCode();
    }
  }, [isOpen]);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await progressSyncService.generateSyncCode();
      setSyncCode(code);
    } catch (err) {
      console.error('Failed to generate sync code', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPayload = async () => {
    const payload = await progressSyncService.generateSyncPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_progress_sync_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInputCodeChange = (text: string) => {
    setInputCode(text);
    setSyncFeedback(null);
    if (!text.trim()) {
      setPreviewPayload(null);
      return;
    }
    try {
      const parsed = progressSyncService.parseSyncCode(text);
      setPreviewPayload(parsed);
    } catch {
      setPreviewPayload(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      handleInputCodeChange(text);
    } catch (err) {
      setSyncFeedback('Could not read sync file.');
    }
  };

  const handleApplySync = async () => {
    if (!previewPayload) return;
    setIsApplying(true);
    setSyncFeedback(null);
    try {
      const result = await progressSyncService.applySyncPayload(previewPayload);
      setSyncFeedback(
        `Sync successful! Updated ${result.booksUpdated} books, merged ${result.highlightsAdded} highlights & notes.`
      );
      setLastSyncInfo(progressSyncService.getLastSyncInfo());
      setTimeout(() => {
        onSyncCompleted();
      }, 1200);
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message || 'Check your code.'}`);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[85dvh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Reading Progress Sync</h2>
              <p className="text-[11px] text-slate-400">
                Sync reading positions, highlights & notes across devices without an account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Banner */}
        {lastSyncInfo && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Last synced:{' '}
                <strong className="text-slate-200">
                  {new Date(lastSyncInfo.lastSyncTimestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lastSyncInfo.deviceName}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Export Device State</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Import & Merge State</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">
                    Your Portable Sync Passkey
                  </span>
                  <button
                    onClick={generateCode}
                    disabled={isGenerating}
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Copy this encrypted sync code and paste it on your tablet, phone, or other browser to seamlessly restore your exact reading chapter, page, highlights, and notes.
                </p>

                {/* Code Display Area */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={syncCode}
                    rows={4}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-300 resize-none select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-[11px] flex items-center gap-1 shadow-sm transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* Alternative Export as JSON File */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <div>
                  <h4 className="font-medium text-slate-200 text-xs">Save as Sync File</h4>
                  <p className="text-[11px] text-slate-400">
                    Prefer offline files? Download your sync payload as JSON.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPayload}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <span className="font-semibold text-slate-200 text-xs block">
                  Paste Sync Passkey or Upload Payload
                </span>
                <textarea
                  value={inputCode}
                  onChange={(e) => handleInputCodeChange(e.target.value)}
                  placeholder="Paste sync code or JSON string here..."
                  rows={4}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-200 resize-none focus:outline-none focus:border-sky-500"
                />

                <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                  <label className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3 h-3 text-sky-400" />
                    <span>Upload sync JSON file</span>
                    <input
                      type="file"
                      accept=".json,.lumina-sync"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {inputCode && (
                    <button
                      onClick={() => handleInputCodeChange('')}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Payload Preview */}
              {previewPayload && (
                <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-sky-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Valid Sync Payload Detected</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Books Progress</span>
                      <strong className="text-slate-100 font-mono text-xs">
                        {previewPayload.booksProgress.length}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Highlights & Notes</span>
                      <strong className="text-slate-100 font-mono text-xs">
                        {previewPayload.highlights.length}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Device Origin</span>
                      <strong className="text-slate-100 truncate block text-xs">
                        {previewPayload.deviceName}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={handleApplySync}
                    disabled={isApplying}
                    className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md mt-2"
                  >
                    {isApplying ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Apply & Merge Reading Progress</span>
                  </button>
                </div>
              )}

              {syncFeedback && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
