import type { Book, SearchIndexResult } from '../types';

interface IndexedParagraph {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  chapterIndex: number;
  chapterTitle: string;
  paragraphIndex: number;
  text: string;
  lowerText: string;
}

class SearchIndexService {
  private cache: Map<string, IndexedParagraph[]> = new Map();

  // Index a book into memory cache for instantaneous subsequent searches
  public indexBook(book: Book): IndexedParagraph[] {
    if (this.cache.has(book.id)) {
      return this.cache.get(book.id)!;
    }

    const paragraphs: IndexedParagraph[] = [];
    book.chapters.forEach((ch, chIdx) => {
      const paras = ch.content.split('\n\n').filter(Boolean);
      paras.forEach((para, pIdx) => {
        const clean = para.trim();
        if (clean.length > 5) {
          paragraphs.push({
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
            chapterIndex: chIdx,
            chapterTitle: ch.title,
            paragraphIndex: pIdx,
            text: clean,
            lowerText: clean.toLowerCase(),
          });
        }
      });
    });

    this.cache.set(book.id, paragraphs);
    return paragraphs;
  }

  // Clear cache if book updated
  public invalidateBook(bookId: string) {
    this.cache.delete(bookId);
  }

  // Search within a single book
  public searchInBook(book: Book, query: string, maxResults: number = 60): SearchIndexResult[] {
    if (!query || query.trim().length < 2) return [];
    const trimmed = query.trim().toLowerCase();
    const paragraphs = this.indexBook(book);
    const results: SearchIndexResult[] = [];

    for (const para of paragraphs) {
      if (results.length >= maxResults) break;
      const idx = para.lowerText.indexOf(trimmed);
      if (idx !== -1) {
        // Create an informative snippet around the match
        const start = Math.max(0, idx - 60);
        const end = Math.min(para.text.length, idx + trimmed.length + 80);
        const prefix = start > 0 ? '… ' : '';
        const suffix = end < para.text.length ? ' …' : '';
        const snippet = prefix + para.text.slice(start, end).replace(/\s+/g, ' ') + suffix;

        results.push({
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          chapterIndex: para.chapterIndex,
          chapterTitle: para.chapterTitle,
          matchSnippet: snippet,
          matchIndex: idx,
          matchTerm: query.trim(),
        });
      }
    }

    return results;
  }

  // Search across all books in library
  public searchLibrary(books: Book[], query: string, maxResults: number = 80): SearchIndexResult[] {
    if (!query || query.trim().length < 2) return [];
    const results: SearchIndexResult[] = [];

    for (const book of books) {
      if (results.length >= maxResults) break;
      const bookMatches = this.searchInBook(book, query, 20);
      results.push(...bookMatches);
    }

    return results;
  }
}

export const searchIndex = new SearchIndexService();
