import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Volume2, 
  FileEdit, 
  Maximize2,
  Loader2
} from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { aiService } from '../services/aiService';
import { ttsService } from '../services/ttsService';
import { db } from '../services/db';

interface ImageModalProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  bookId?: string;
  chapterIndex?: number;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  src,
  alt,
  bookId,
  chapterIndex,
  onClose,
}) => {
  useEscapeKey(isOpen, onClose);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrCopied, setOcrCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // Reset state when opening a new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setOcrText(null);
      setIsOcrLoading(false);
      setCopied(false);
      setOcrCopied(false);
      setNoteSaved(false);
    }
  }, [isOpen, src]);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopyImage = async () => {
    try {
      if (src.startsWith('data:image')) {
        const res = await fetch(src);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } else {
        await navigator.clipboard.writeText(src);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      await navigator.clipboard.writeText(src);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleExtractText = async () => {
    setIsOcrLoading(true);
    try {
      let base64 = src;
      // Convert URL to base64 if needed
      if (!src.startsWith('data:')) {
        const res = await fetch(src);
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      const res = await aiService.extractTextFromImage(base64);
      setOcrText(res.text || 'No text detected in this image.');
    } catch (err: any) {
      setOcrText(`OCR Error: ${err.message || 'Unable to extract text'}`);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSaveOcrAsNote = async () => {
    if (!ocrText || !bookId) return;
    try {
      await db.highlights.put({
        id: `ocr-${Date.now()}`,
        bookId: bookId,
        chapterIndex: chapterIndex ?? 0,
        selectedText: ocrText.slice(0, 300),
        color: 'sky',
        note: `[Extracted from Image]: ${ocrText}`,
        createdAt: Date.now(),
      });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadOcrAloud = () => {
    if (ocrText) {
      ttsService.speakText(ocrText, { rate: 1.0 });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 sm:px-6 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 max-w-[60%]">
          <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
            {alt || 'Book Illustration'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-xl p-1 border border-slate-700/80">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* AI OCR button */}
          <button
            onClick={handleExtractText}
            disabled={isOcrLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
            title="Extract text from this image with AI"
          >
            {isOcrLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Extract Text</span>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopyImage}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/80 transition cursor-pointer"
            title="Copy Image"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/80 transition cursor-pointer"
            title="Close viewer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image viewport */}
      <div 
        className="w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt || 'Book image'}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          draggable={false}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
        />
      </div>

      {/* OCR text bottom overlay drawer */}
      {ocrText !== null && (
        <div 
          className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 max-h-[45vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-4 flex flex-col z-30 animate-in slide-in-from-bottom-4 duration-200 select-text"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Extracted Text (OCR)</span>
            </div>
            <button
              onClick={() => setOcrText(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto my-2.5 text-xs text-slate-200 leading-relaxed max-h-44 pr-1 font-serif select-text">
            {ocrText}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ocrText);
                  setOcrCopied(true);
                  setTimeout(() => setOcrCopied(false), 1500);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                {ocrCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{ocrCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleReadOcrAloud}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Read aloud"
              >
                <Volume2 className="w-3 h-3 text-sky-400" />
                <span>Listen</span>
              </button>
            </div>

            {bookId && (
              <button
                onClick={handleSaveOcrAsNote}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition cursor-pointer"
              >
                <FileEdit className="w-3 h-3" />
                <span>{noteSaved ? 'Saved!' : 'Save Note'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
