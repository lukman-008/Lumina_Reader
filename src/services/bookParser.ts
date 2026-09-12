import type { Book, BookChapter } from '../types';
import { db } from './db';
import { SAMPLE_BOOKS } from './sampleBooks';

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export async function initializeDatabaseWithSeed(): Promise<Book[]> {
  try {
    const existingBooks = await db.books.toArray();
    if (existingBooks.length > 0) {
      return existingBooks;
    }
    // Seed initial books
    for (const book of SAMPLE_BOOKS) {
      await db.books.put(book);
    }
    return SAMPLE_BOOKS;
  } catch (err) {
    console.warn('Failed to seed books into db, returning defaults', err);
    return SAMPLE_BOOKS;
  }
}

const GRADIENTS = [
  'from-amber-700 via-orange-800 to-stone-900',
  'from-emerald-800 via-teal-900 to-slate-950',
  'from-indigo-900 via-slate-800 to-neutral-950',
  'from-rose-900 via-amber-900 to-stone-900',
  'from-cyan-900 via-sky-950 to-slate-900',
  'from-violet-950 via-purple-900 to-slate-950',
];

export async function parseUploadedBook(file: File): Promise<Book> {
  const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  const arrayBuffer = await file.arrayBuffer();
  let extension = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() || 'txt') : '';

  // Magic bytes check to definitively identify files lacking extensions
  // Read up to first 1024 bytes for signature scanning (handles BOMs or leading whitespaces)
  const headerView = new Uint8Array(arrayBuffer.slice(0, Math.min(1024, arrayBuffer.byteLength)));
  let headerStr = '';
  for (let i = 0; i < headerView.length; i++) {
    headerStr += String.fromCharCode(headerView[i]);
  }
  
  if (headerStr.includes('%PDF-') || file.type === 'application/pdf') {
    extension = 'pdf';
  } else if (headerView[0] === 0x50 && headerView[1] === 0x4B && headerView[2] === 0x03 && headerView[3] === 0x04) {
    // PK zip signature. If it's not another known zip format, assume epub
    if (extension !== 'epub' && extension !== 'zip' && file.type === 'application/epub+zip') {
       extension = 'epub';
    } else if (!extension) {
       extension = 'epub'; // Default to epub for unknown zips in this context
    }
  }

  if (extension === 'epub') {
    return parseEpubFile(file, title, randomGradient);
  }

  if (extension === 'pdf') {
    let extractedText = '';
    try {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        extractedText += strings.join(' ') + '\n\n';
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
      extractedText = `[Document: ${file.name}]\n\nThis PDF document could not be parsed correctly or contains no readable text.`;
    }

    // Cleanup excessive whitespace while preserving paragraphs
    extractedText = extractedText.replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    if (extractedText.length < 50) {
      extractedText = `[Document: ${file.name}]\n\nThis PDF document might contain scanned images instead of text, or could not be parsed correctly.`;
    }

    const chapters = splitIntoChapters(extractedText, title);
    const totalWords = countWords(extractedText);

    return {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      title,
      author: 'PDF Document',
      description: `Imported PDF: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      format: 'pdf',
      totalWords: Math.max(totalWords, 1200),
      coverGradient: randomGradient,
      chapters,
      category: 'PDF Documents',
      addedAt: Date.now(),
      readingProgress: {
        currentChapterIndex: 0,
        currentPageIndex: 0,
        percentage: 0,
        lastReadTimestamp: Date.now(),
      },
    };
  }

  // Fallback for TXT, MD, and completely unknown formats
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawString = textDecoder.decode(arrayBuffer);
  let extractedText = '';

  if (extension === 'txt' || extension === 'md') {
    extractedText = rawString;
  } else {
    const extractedMatches = rawString.match(/[A-Za-z0-9 ,.?!'"\n\r:;()\-]{30,}/g);
    extractedText = extractedMatches && extractedMatches.length > 0 
      ? extractedMatches.join('\n\n')
      : `[Document: ${file.name}]\n\nUnsupported document format.`;
  }

  const chapters = splitIntoChapters(extractedText, title);
  const totalWords = countWords(extractedText);

  return {
    id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    title,
    author: 'Unknown Author',
    description: `Imported Document: ${file.name}`,
    format: extension === 'md' ? 'md' : 'txt',
    totalWords: Math.max(totalWords, 1200),
    coverGradient: randomGradient,
    chapters,
    category: extension === 'md' ? 'Notes & Manuscripts' : 'Documents',
    addedAt: Date.now(),
    readingProgress: {
      currentChapterIndex: 0,
      currentPageIndex: 0,
      percentage: 0,
      lastReadTimestamp: Date.now(),
    },
  };
}

async function parseEpubFile(file: File, title: string, gradient: string): Promise<Book> {
  let fullText = '';
  try {
    const zip = await JSZip.loadAsync(file);
    const htmlFiles = Object.keys(zip.files).filter(name => 
      name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm')
    );

    // Sort files to try and preserve reading order (simplified approach, ideally we'd parse the spine in the OPF file)
    htmlFiles.sort();

    for (const htmlFile of htmlFiles) {
      const fileData = await zip.files[htmlFile].async('string');
      // Extract text content from body or full html if no body
      const bodyMatch = fileData.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const contentToClean = bodyMatch ? bodyMatch[1] : fileData;
      
      const cleanText = contentToClean
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n\n')
        .replace(/<h[1-6][^>]*>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/ {2,}/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
        
      if (cleanText) {
        fullText += cleanText + '\n\n';
      }
    }
  } catch (err) {
    console.error('EPUB parsing error:', err);
    fullText = `[EPUB Document: ${file.name}]\n\nFailed to extract readable text from this EPUB file.`;
  }

  const usableText = fullText.trim().length > 200 
    ? fullText.trim() 
    : `EPUB Book: ${title}\n\nWelcome to your imported EPUB book. Enjoy clean typography and distraction-free offline reading.\n\n${fullText.trim()}`;

  const chapters = splitIntoChapters(usableText, title);
  const totalWords = countWords(usableText);

  return {
    id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    title,
    author: 'Unknown Author',
    description: usableText.slice(0, 240).trim() + '...',
    format: 'epub',
    totalWords,
    coverGradient: gradient,
    chapters,
    category: 'EPUB Books',
    addedAt: Date.now(),
    readingProgress: {
      currentChapterIndex: 0,
      currentPageIndex: 0,
      percentage: 0,
      lastReadTimestamp: Date.now(),
    },
  };
}

function splitIntoChapters(fullText: string, defaultTitle: string): BookChapter[] {
  // Regex to look for "Chapter 1", "CHAPTER I", "Section 1", "Act I", "# Chapter"
  const chapterRegex = /(?:\n\s*(?:Chapter|CHAPTER|Section|SECTION|Part|PART|Book|BOOK)\s+[0-9IVXLCDMivxlcdm]+[^\n]*|\n#{1,3}\s+[^\n]+)/g;
  
  const matches = [...fullText.matchAll(chapterRegex)];
  
  if (!matches || matches.length < 2) {
    // If no explicit chapter breaks found, split intelligently every ~2,500 words for optimal desktop paging
    const words = fullText.split(/\s+/);
    const wordsPerChapter = 2200;
    const chapters: BookChapter[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerChapter) {
      const chunk = words.slice(i, i + wordsPerChapter).join(' ');
      const chapterNumber = Math.floor(i / wordsPerChapter) + 1;
      chapters.push({
        id: `ch-${chapterNumber}`,
        title: `${defaultTitle} — Part ${chapterNumber}`,
        content: chunk,
        wordCount: countWords(chunk),
      });
    }

    return chapters.length > 0 ? chapters : [{
      id: 'ch-1',
      title: defaultTitle,
      content: fullText,
      wordCount: countWords(fullText),
    }];
  }

  const chapters: BookChapter[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index || 0;
    const endIndex = i + 1 < matches.length ? (matches[i + 1].index || fullText.length) : fullText.length;
    const chapterRaw = fullText.slice(startIndex, endIndex).trim();
    const firstLineEnd = chapterRaw.indexOf('\n');
    const title = firstLineEnd !== -1 ? chapterRaw.slice(0, firstLineEnd).replace(/[#*]/g, '').trim() : `Chapter ${i + 1}`;
    const content = firstLineEnd !== -1 ? chapterRaw.slice(firstLineEnd).trim() : chapterRaw;

    chapters.push({
      id: `ch-${i + 1}`,
      title: title || `Chapter ${i + 1}`,
      content: content || chapterRaw,
      wordCount: countWords(content),
    });
  }

  return chapters;
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTimeMinutes(wordCount: number, wpm: number = 220): number {
  return Math.max(1, Math.round(wordCount / wpm));
}
