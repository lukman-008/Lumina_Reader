import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Book, ReaderSettings } from '../types';
import { db } from '../services/db';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface NativePdfReaderProps {
  book: Book;
  onBackToLibrary: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
}

export const NativePdfReader: React.FC<NativePdfReaderProps> = ({
  book,
  onBackToLibrary,
  settings,
  onUpdateSettings,
  isZenMode,
  onToggleZenMode
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    // If rawFile exists in memory, use it
    if (book.rawFile) {
      setFileData(book.rawFile);
    } else {
      // Fetch from DB if it wasn't passed in memory
      db.books.get(book.id).then((b) => {
        if (b?.rawFile) {
          setFileData(b.rawFile);
        }
      });
    }

    // Set initial page from reading progress
    if (book.readingProgress?.currentPageIndex) {
      setPageNumber(book.readingProgress.currentPageIndex + 1); // 1-indexed for react-pdf
    }
  }, [book.id]);

  useEffect(() => {
    // Resize observer to make the PDF fill the container properly
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const saveProgress = (pageIdx: number, total: number) => {
    if (!total) return;
    const progress = {
      ...book.readingProgress,
      currentPageIndex: pageIdx,
      currentChapterIndex: pageIdx,
      percentage: Math.round(((pageIdx + 1) / total) * 100),
      lastReadTimestamp: Date.now(),
    };
    db.books.update(book.id, { readingProgress: progress }).catch(console.error);
  };

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    saveProgress(pageNumber - 1, nextNumPages);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const next = Math.min(Math.max(1, prevPageNumber + offset), numPages || 1);
      saveProgress(next - 1, numPages);
      return next;
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      changePage(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changePage(-1);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // Compute theme styles mapping based on Lumina's themes
  const themeStyle = useMemo(() => {
    switch (settings.theme) {
      case 'paper': return { bg: 'bg-stone-100', text: 'text-stone-900', container: 'bg-white' };
      case 'sepia': return { bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', container: 'bg-[#fcf7ed]' };
      case 'dusk': return { bg: 'bg-slate-800', text: 'text-slate-300', container: 'bg-slate-700' };
      case 'amoled': return { bg: 'bg-black', text: 'text-stone-400', container: 'bg-zinc-950' };
      case 'eink': return { bg: 'bg-gray-200', text: 'text-black', container: 'bg-white' };
      case 'sage': return { bg: 'bg-[#e2efe6]', text: 'text-[#2c4c3b]', container: 'bg-[#f0f7f2]' };
      case 'nordic': return { bg: 'bg-[#e5e9f0]', text: 'text-[#2e3440]', container: 'bg-white' };
      default: return { bg: 'bg-white', text: 'text-black', container: 'bg-white' };
    }
  }, [settings.theme]);

  // Max width of the PDF canvas based on user setting
  const pdfMaxWidth = Math.min(containerWidth - (settings.marginWidth * 2), settings.layoutMode === 'double' ? 1200 : 800);

  return (
    <div className={`w-full flex flex-col transition-colors duration-200 relative overflow-hidden ${themeStyle.bg} ${themeStyle.text} ${isZenMode ? 'h-screen' : 'h-[calc(100vh-2.75rem)]'}`}>
      
      {/* Click zones for desktop page turning */}
      <div
        onClick={() => changePage(-1)}
        className="absolute left-0 top-0 bottom-0 w-16 md:w-28 z-10 cursor-w-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition flex items-center justify-start pl-3 opacity-0 hover:opacity-100"
      >
        <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
          <ChevronLeft className="w-5 h-5 opacity-70" />
        </div>
      </div>
      
      <div
        onClick={() => changePage(1)}
        className="absolute right-0 top-0 bottom-0 w-16 md:w-28 z-10 cursor-e-resize hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition flex items-center justify-end pr-3 opacity-0 hover:opacity-100"
      >
        <div className="p-2 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs">
          <ChevronRight className="w-5 h-5 opacity-70" />
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto w-full flex justify-center pb-24 ${
          settings.layoutMode === 'scroll' ? 'items-start pt-8' : 'items-center'
        }`}
      >
        {!fileData ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            <p>Loading High-Fidelity PDF Engine...</p>
          </div>
        ) : (
          <div 
            className={`shadow-2xl transition-all duration-300 ${themeStyle.container} ${settings.layoutMode !== 'scroll' ? 'rounded-lg overflow-hidden' : ''}`}
            style={{ 
              maxWidth: pdfMaxWidth, 
              width: '100%' 
            }}
          >
            <Document
              file={fileData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current opacity-50"></div>
                </div>
              }
              error={
                <div className="flex justify-center items-center h-96 text-rose-500">
                  <p>Failed to load native PDF. The file may be corrupted.</p>
                </div>
              }
            >
              {settings.layoutMode === 'scroll' ? (
                // Continuous Scroll Rendering
                <div className="flex flex-col gap-6 items-center">
                  {Array.from(new Array(numPages), (el, index) => (
                    <div key={`page_${index + 1}`} className="shadow-xl bg-white w-full">
                      <Page
                        pageNumber={index + 1}
                        width={pdfMaxWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        loading={<div className="h-96 w-full animate-pulse bg-black/5" />}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Paginated Rendering
                <Page
                  pageNumber={pageNumber}
                  width={pdfMaxWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={<div className="h-screen w-full animate-pulse bg-black/5" />}
                />
              )}
            </Document>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center text-xs opacity-60 backdrop-blur-md z-20 ${
        settings.theme === 'dusk' || settings.theme === 'amoled' ? 'bg-black/20' : 'bg-white/20'
      }`}>
        <div>{book.title}</div>
        <div className="flex items-center gap-2">
          <span>{pageNumber} of {numPages || '-'}</span>
          <div className="w-32 h-1 bg-current/20 rounded-full overflow-hidden ml-2">
            <div 
              className="h-full bg-current rounded-full" 
              style={{ width: `${numPages ? (pageNumber / numPages) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
