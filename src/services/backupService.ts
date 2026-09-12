import { db, loadSavedSettings, saveReaderSettings } from './db';
import type { LuminaBackup, Book, Highlight, Bookmark, Shelf, ReadingSession } from '../types';

export class BackupService {
  // Export entire library state to a .lumina file
  public async exportLibraryBackup(): Promise<void> {
    const books = await db.books.toArray();
    const highlights = await db.highlights.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const shelves = await db.shelves.toArray();
    const readingSessions = await db.readingSessions.toArray();
    const settings = await loadSavedSettings();

    const backupData: LuminaBackup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      books,
      highlights,
      bookmarks,
      shelves,
      readingSessions,
      settings,
    };

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
  }

  // Parse and validate a .lumina file before restoring
  public async parseBackupFile(file: File): Promise<LuminaBackup> {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON format in backup file.');
    }

    if (!data.books || !Array.isArray(data.books)) {
      throw new Error('Invalid Lumina backup: Missing book data array.');
    }

    return {
      version: data.version || 1,
      exportedAt: data.exportedAt || new Date().toISOString(),
      books: data.books || [],
      highlights: data.highlights || [],
      bookmarks: data.bookmarks || [],
      shelves: data.shelves || [],
      readingSessions: data.readingSessions || [],
      settings: data.settings || null,
    };
  }

  // Restore backup with either 'merge' or 'replace' mode
  public async restoreBackup(
    backup: LuminaBackup,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{ booksCount: number; highlightsCount: number }> {
    if (mode === 'replace') {
      await db.books.clear();
      await db.highlights.clear();
      await db.bookmarks.clear();
      await db.shelves.clear();
      await db.readingSessions.clear();
    }

    // Save books
    for (const book of backup.books) {
      await db.books.put(book);
    }

    // Save highlights
    for (const hl of backup.highlights) {
      await db.highlights.put(hl);
    }

    // Save bookmarks
    for (const bm of backup.bookmarks) {
      await db.bookmarks.put(bm);
    }

    // Save shelves
    for (const sh of backup.shelves) {
      await db.shelves.put(sh);
    }

    // Save sessions
    for (const sess of backup.readingSessions) {
      await db.readingSessions.put(sess);
    }

    // Restore settings if present
    if (backup.settings) {
      await saveReaderSettings(backup.settings);
    }

    return {
      booksCount: backup.books.length,
      highlightsCount: backup.highlights.length,
    };
  }
}

export const backupService = new BackupService();
