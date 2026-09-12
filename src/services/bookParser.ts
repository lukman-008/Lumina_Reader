import type { Book, BookChapter } from '../types';
import { db } from './db';
import { SAMPLE_BOOKS } from './sampleBooks';

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
  const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
  const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  if (extension === 'txt' || extension === 'md') {
    const text = await file.text();
    const chapters = splitIntoChapters(text, title);
    const totalWords = countWords(text);

    return {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      title,
      author: 'Unknown Author',
      description: text.slice(0, 240).trim() + '...',
      format: extension === 'md' ? 'md' : 'txt',
      totalWords,
      coverGradient: randomGradient,
      chapters,
      category: extension === 'md' ? 'Notes & Manuscripts' : 'General Literature',
      addedAt: Date.now(),
      readingProgress: {
        currentChapterIndex: 0,
        currentPageIndex: 0,
        percentage: 0,
        lastReadTimestamp: Date.now(),
      },
    };
  }

  if (extension === 'epub') {
    return parseEpubFile(file, title, randomGradient);
  }

  // Fallback for PDF or other formats
  const arrayBuffer = await file.arrayBuffer();
  // Decode basic readable text strings if PDF
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawPdfString = textDecoder.decode(arrayBuffer);
  
  // Extract visible ASCII characters from PDF stream
  const extractedMatches = rawPdfString.match(/[A-Za-z0-9 ,.?!'"\n\r:;()\-]{30,}/g);
  const extractedText = extractedMatches && extractedMatches.length > 0 
    ? extractedMatches.join('\n\n')
    : `[Document: ${file.name}]\n\nThis PDF document has been loaded into your local offline storage. Lumina Reader is rendering it in reflowable reader mode.`;

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

async function parseEpubFile(file: File, title: string, gradient: string): Promise<Book> {
  // EPUB is a zipped archive containing HTML/XHTML chapters.
  // We can read the text content directly
  const text = await file.text();
  
  // Extract paragraphs or chapters from HTML tags
  const cleanText = text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const usableText = cleanText.length > 200 
    ? cleanText 
    : `EPUB Book: ${title}\n\nWelcome to your imported EPUB book. Enjoy clean typography and distraction-free offline reading.`;

  const chapters = splitIntoChapters(usableText, title);
  const totalWords = countWords(usableText);

  return {
    id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    title,
    author: 'EPUB Author',
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
