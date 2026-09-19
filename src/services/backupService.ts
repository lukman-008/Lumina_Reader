import { db, loadSavedSettings, saveReaderSettings } from './db';
import type { LuminaBackup, LuminaBackupBook, Book, Highlight, Bookmark, Shelf, ReadingSession } from '../types';

/**
 * Converts an ArrayBuffer or Uint8Array to a Base64 string safely without call-stack overflow
 */
export async function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const actualBuffer: ArrayBuffer = buffer instanceof Uint8Array
    ? (buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer)
    : buffer;

  if (typeof FileReader !== 'undefined' && typeof Blob !== 'undefined') {
    return new Promise((resolve, reject) => {
      const blob = new Blob([actualBuffer]);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Fallback for non-browser/node contexts
  const bytes = new Uint8Array(actualBuffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string back into an ArrayBuffer safely
 */
export async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  const cleanB64 = base64.replace(/\s/g, '');
  try {
    const res = await fetch(`data:application/octet-stream;base64,${cleanB64}`);
    return await res.arrayBuffer();
  } catch {
    const binary = atob(cleanB64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export interface RestoreResult {
  booksCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  shelvesCount: number;
  sessionsCount: number;
  pdfsRestored: number;
}

export class BackupService {
  /**
   * Export entire library state to a self-contained .lumina offline file
   */
  public async exportLibraryBackup(
    onProgress?: (message: string, percent: number) => void
  ): Promise<void> {
    onProgress?.('Querying library database...', 10);
    const books = await db.books.toArray();
    const highlights = await db.highlights.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const shelves = await db.shelves.toArray();
    const readingSessions = await db.readingSessions.toArray();
    const settings = await loadSavedSettings();

    onProgress?.('Preparing books and binary assets...', 25);
    const serializedBooks: LuminaBackupBook[] = [];

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const progressPercent = 25 + Math.round(((i + 1) / Math.max(books.length, 1)) * 50);
      onProgress?.(`Packaging "${book.title}" (${i + 1}/${books.length})...`, progressPercent);

      // Create a clean copy
      const bookCopy: LuminaBackupBook = { ...book };

      // Handle PDF or raw binary files
      if (book.rawFile) {
        try {
          let buffer: ArrayBuffer;
          if (book.rawFile instanceof Blob) {
            buffer = await book.rawFile.arrayBuffer();
          } else if (book.rawFile instanceof Uint8Array) {
            buffer = book.rawFile.buffer.slice(book.rawFile.byteOffset, book.rawFile.byteOffset + book.rawFile.byteLength) as ArrayBuffer;
          } else if (book.rawFile instanceof ArrayBuffer) {
            buffer = book.rawFile;
          } else if (typeof book.rawFile === 'string') {
            buffer = await base64ToArrayBuffer(book.rawFile);
          } else {
            buffer = new ArrayBuffer(0);
          }

          if (buffer.byteLength > 0) {
            bookCopy.rawFileBase64 = await arrayBufferToBase64(buffer);
          }
        } catch (err) {
          console.warn(`Failed to encode raw binary for book "${book.title}":`, err);
        }
        // Remove the raw non-serializable property so JSON.stringify doesn't output `{}`
        delete (bookCopy as any).rawFile;
      }

      // Convert temporary blob URLs for coverImage to permanent base64 data URLs
      if (bookCopy.coverImage && bookCopy.coverImage.startsWith('blob:')) {
        try {
          const res = await fetch(bookCopy.coverImage);
          const blob = await res.blob();
          const ab = await blob.arrayBuffer();
          const b64 = await arrayBufferToBase64(ab);
          const mime = blob.type || 'image/jpeg';
          bookCopy.coverImage = `data:${mime};base64,${b64}`;
        } catch (err) {
          console.warn(`Could not serialize blob coverImage for book "${book.title}":`, err);
        }
      }

      serializedBooks.push(bookCopy);
    }

    onProgress?.('Assembling .lumina archive...', 85);
    const backupData: LuminaBackup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      books: serializedBooks,
      highlights,
      bookmarks,
      shelves,
      readingSessions,
      settings,
    };

    onProgress?.('Generating downloadable archive...', 95);
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_library_backup_${dateStr}.lumina`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onProgress?.('Export completed successfully!', 100);
  }

  /**
   * Parse and validate a .lumina or .json backup file
   */
  public async parseBackupFile(file: File | string): Promise<LuminaBackup> {
    let text: string;
    if (typeof file === 'string') {
      text = file;
    } else {
      text = await file.text();
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid file format: Not a valid JSON or .lumina archive.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Corrupted backup file: Root object is missing.');
    }

    if (!data.books || !Array.isArray(data.books)) {
      throw new Error('Invalid Lumina backup: Missing book data collection.');
    }

    // Process and normalize books, restoring any base64 rawFile into ArrayBuffers
    const normalizedBooks: LuminaBackupBook[] = [];
    for (const b of data.books) {
      const book: LuminaBackupBook = { ...b };
      
      // If rawFileBase64 is present, reconstruct the binary ArrayBuffer
      if (book.rawFileBase64 && typeof book.rawFileBase64 === 'string') {
        try {
          book.rawFile = await base64ToArrayBuffer(book.rawFileBase64);
        } catch (err) {
          console.warn(`Failed to decode binary rawFile for "${book.title}":`, err);
        }
      } else if (book.rawFile && typeof (book.rawFile as any) === 'object' && !(book.rawFile instanceof ArrayBuffer) && !(book.rawFile instanceof Blob)) {
        // Clean out legacy empty `{}` from older exports
        delete (book as any).rawFile;
      }

      normalizedBooks.push(book);
    }

    return {
      version: typeof data.version === 'number' ? data.version : 2,
      exportedAt: data.exportedAt || new Date().toISOString(),
      books: normalizedBooks,
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      shelves: Array.isArray(data.shelves) ? data.shelves : [],
      readingSessions: Array.isArray(data.readingSessions) ? data.readingSessions : [],
      settings: data.settings && typeof data.settings === 'object' ? data.settings : null,
    };
  }

  /**
   * Restore backup with either 'merge' or 'replace' mode
   */
  public async restoreBackup(
    backup: LuminaBackup,
    mode: 'merge' | 'replace' = 'merge',
    onProgress?: (message: string, percent: number) => void
  ): Promise<RestoreResult> {
    if (mode === 'replace') {
      onProgress?.('Clearing existing local database...', 10);
      await db.books.clear();
      await db.highlights.clear();
      await db.bookmarks.clear();
      await db.shelves.clear();
      await db.readingSessions.clear();
    }

    let pdfsRestored = 0;
    const totalBooks = backup.books.length;

    // Save books with restored binary files
    for (let i = 0; i < totalBooks; i++) {
      const book = { ...backup.books[i] };
      const percent = 15 + Math.round(((i + 1) / Math.max(totalBooks, 1)) * 50);
      onProgress?.(`Restoring book ${i + 1} of ${totalBooks}: "${book.title}"...`, percent);

      // Ensure rawFile is converted to real ArrayBuffer if rawFileBase64 is present
      if (book.rawFileBase64 && !book.rawFile) {
        try {
          book.rawFile = await base64ToArrayBuffer(book.rawFileBase64);
        } catch (err) {
          console.warn(`Could not restore binary rawFile for "${book.title}":`, err);
        }
      }

      if (book.rawFile && (book.rawFile instanceof ArrayBuffer || book.rawFile instanceof Uint8Array)) {
        pdfsRestored++;
      }

      // Remove the rawFileBase64 field to save space in IndexedDB
      delete book.rawFileBase64;

      await db.books.put(book as Book);
    }

    onProgress?.('Restoring highlights and annotations...', 70);
    for (const hl of backup.highlights) {
      await db.highlights.put(hl);
    }

    onProgress?.('Restoring bookmarks...', 80);
    for (const bm of backup.bookmarks) {
      await db.bookmarks.put(bm);
    }

    onProgress?.('Restoring custom shelves...', 88);
    for (const sh of backup.shelves) {
      await db.shelves.put(sh);
    }

    onProgress?.('Restoring reading history and sessions...', 94);
    for (const sess of backup.readingSessions) {
      await db.readingSessions.put(sess);
    }

    // Restore settings if present
    if (backup.settings) {
      onProgress?.('Applying reader preferences...', 98);
      await saveReaderSettings(backup.settings);
    }

    onProgress?.('Restore completed!', 100);

    return {
      booksCount: backup.books.length,
      highlightsCount: backup.highlights.length,
      bookmarksCount: backup.bookmarks.length,
      shelvesCount: backup.shelves.length,
      sessionsCount: backup.readingSessions.length,
      pdfsRestored,
    };
  }
}

export const backupService = new BackupService();
