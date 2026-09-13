import type { Book, BookChapter } from '../types';
import { db } from './db';
import { SAMPLE_BOOKS } from './sampleBooks';



import JSZip from 'jszip';



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
    return {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      title,
      author: 'PDF Document',
      description: `Imported PDF: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      format: 'pdf',
      totalWords: 1200,
      coverGradient: randomGradient,
      chapters: [{ id: 'pdf-chapter', title: 'Document', content: 'Native PDF Document', wordCount: 1200 }],
      category: 'PDF Documents',
      rawFile: arrayBuffer,
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
  // Limit to 5MB for parsing unknown text to prevent freezing main thread
  const rawString = textDecoder.decode(arrayBuffer.byteLength > 5000000 && extension !== 'txt' && extension !== 'md' ? arrayBuffer.slice(0, 5000000) : arrayBuffer);
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
  // Normalize newlines to ensure consistent paragraph blocks
  const normalizedText = fullText.replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = normalizedText.split('\n\n');
  
  const chapters: BookChapter[] = [];
  let currentChapterTitle = defaultTitle;
  let currentChapterContent: string[] = [];
  let wordsSinceLastBreak = 0;
  
  // Heuristic to detect headings
  const isHeading = (p: string) => {
    // Ignore images
    if (p.startsWith('![')) return false;
    // Explicit markdown heading
    if (p.startsWith('#')) return true;
    
    const len = p.length;
    if (len < 3 || len > 100) return false;
    
    // Most headings don't end in typical sentence-ending punctuation
    if (/[.,:;!?]$/.test(p)) return false;
    
    // Check if it's all uppercase (and contains at least one letter)
    const isUppercase = p === p.toUpperCase() && /[A-Z]/.test(p);
    
    // Check if it's Title Case (roughly)
    const isTitleCase = /^[A-Z]/.test(p) && !/^[a-z]/.test(p.split(' ')[0]);
    
    return isUppercase || isTitleCase;
  };
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;
    
    const pWordCount = p.split(/\s+/).length;
    let isBreak = false;
    let newTitle = '';
    
    // 1. Explicit Markdown headings
    if (p.match(/^#{1,6}\s+(.+)$/)) {
      isBreak = true;
      newTitle = p.replace(/^#{1,6}\s+/, '').trim();
    }
    // 2. Typical Chapter / Part markers
    else if (p.match(/^(Chapter|Part|Section|Book)\s+[0-9IVXLCDMivxlcdm]+(\s*-:.*)?$/i) && p.length < 100) {
      isBreak = true;
      newTitle = p;
    }
    // 3. Heuristic heading (only if we've accumulated enough words to avoid breaking every short line)
    else if (wordsSinceLastBreak > 600 && isHeading(p)) {
      isBreak = true;
      newTitle = p;
    }
    // 4. Force break if chapter is getting too long and we find a decent candidate
    else if (wordsSinceLastBreak > 2500 && isHeading(p)) {
      isBreak = true;
      newTitle = p;
    }
    // 5. Hard force break if chapter is absurdly long to prevent memory/render issues
    else if (wordsSinceLastBreak > 4500) {
      isBreak = true;
      newTitle = `${defaultTitle} — Part ${chapters.length + 2}`;
    }
    
    if (isBreak && currentChapterContent.length > 0) {
      chapters.push({
        id: `ch-${chapters.length + 1}`,
        title: currentChapterTitle,
        content: currentChapterContent.join('\n\n'),
        wordCount: countWords(currentChapterContent.join('\n\n')),
      });
      currentChapterTitle = newTitle || `Chapter ${chapters.length + 1}`;
      currentChapterContent = [p];
      wordsSinceLastBreak = pWordCount;
    } else {
      currentChapterContent.push(p);
      wordsSinceLastBreak += pWordCount;
    }
  }
  
  // Push the last chapter
  if (currentChapterContent.length > 0) {
    chapters.push({
      id: `ch-${chapters.length + 1}`,
      title: currentChapterTitle,
      content: currentChapterContent.join('\n\n'),
      wordCount: countWords(currentChapterContent.join('\n\n')),
    });
  }
  
  // Fallback safely if something goes wrong
  if (chapters.length === 0) {
    chapters.push({
      id: 'ch-1',
      title: defaultTitle,
      content: fullText,
      wordCount: countWords(fullText),
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
