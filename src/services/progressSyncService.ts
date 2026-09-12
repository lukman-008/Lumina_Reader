import { db } from './db';
import { habitTracker } from './habitTracker';
import type { ReadingProgressSyncPayload, Highlight, Bookmark } from '../types';

const SYNC_STORAGE_KEY = 'lumina_last_sync_info';

export interface SyncInfo {
  lastSyncTimestamp: number;
  deviceId: string;
  deviceName: string;
  syncedBooksCount: number;
  syncedHighlightsCount: number;
}

class ProgressSyncService {
  private getOrCreateDeviceId(): string {
    let id = localStorage.getItem('lumina_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('lumina_device_id', id);
    }
    return id;
  }

  private getDeviceName(): string {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Desktop';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS Device';
    if (/Android/i.test(userAgent)) return 'Android Device';
    if (/Macintosh|Mac OS X/i.test(userAgent)) return 'Mac Computer';
    if (/Windows/i.test(userAgent)) return 'Windows PC';
    if (/Linux/i.test(userAgent)) return 'Linux Machine';
    return 'Lumina Reader Client';
  }

  // Generate a complete portable reading sync payload
  public async generateSyncPayload(): Promise<ReadingProgressSyncPayload> {
    const books = await db.books.toArray();
    const highlights = await db.highlights.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const stats = await habitTracker.getHabitStats();

    const booksProgress = books.map((b) => ({
      bookId: b.id,
      title: b.title,
      currentChapterIndex: b.readingProgress.currentChapterIndex,
      currentPageIndex: b.readingProgress.currentPageIndex,
      percentage: b.readingProgress.percentage,
      lastReadTimestamp: b.readingProgress.lastReadTimestamp,
    }));

    return {
      version: 1,
      deviceId: this.getOrCreateDeviceId(),
      deviceName: this.getDeviceName(),
      timestamp: Date.now(),
      booksProgress,
      highlights,
      bookmarks,
      habitStatsSummary: {
        currentStreak: stats.currentStreak,
        totalMinutes: stats.totalMinutes,
        totalWordsRead: stats.totalWordsRead,
      },
    };
  }

  // Generate a compact shareable sync string (base64 encoded JSON)
  public async generateSyncCode(): Promise<string> {
    const payload = await this.generateSyncPayload();
    const jsonStr = JSON.stringify(payload);
    // Use Unicode-safe base64 encoding
    return btoa(encodeURIComponent(jsonStr));
  }

  // Parse a sync code (base64 or direct JSON)
  public parseSyncCode(rawInput: string): ReadingProgressSyncPayload {
    let jsonStr = rawInput.trim();
    try {
      // Try decoding base64 first
      jsonStr = decodeURIComponent(atob(rawInput.trim()));
    } catch {
      // If not base64, assume direct JSON string
      jsonStr = rawInput.trim();
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.booksProgress || !Array.isArray(parsed.booksProgress)) {
      throw new Error('Invalid reading progress sync payload format.');
    }
    return parsed as ReadingProgressSyncPayload;
  }

  // Apply sync payload with intelligent conflict resolution (newest timestamp / higher progress wins)
  public async applySyncPayload(
    payload: ReadingProgressSyncPayload
  ): Promise<{ booksUpdated: number; highlightsAdded: number; bookmarksAdded: number }> {
    let booksUpdated = 0;
    let highlightsAdded = 0;
    let bookmarksAdded = 0;

    // 1. Sync Books Reading Progress
    for (const prog of payload.booksProgress) {
      const existing = await db.books.get(prog.bookId);
      if (existing) {
        // If incoming progress is newer or further along, update it
        const shouldUpdate =
          prog.lastReadTimestamp > (existing.readingProgress.lastReadTimestamp || 0) ||
          prog.percentage > (existing.readingProgress.percentage || 0);

        if (shouldUpdate) {
          await db.books.update(prog.bookId, {
            readingProgress: {
              currentChapterIndex: prog.currentChapterIndex,
              currentPageIndex: prog.currentPageIndex,
              percentage: prog.percentage,
              lastReadTimestamp: Math.max(prog.lastReadTimestamp, Date.now()),
            },
          });
          booksUpdated++;
        }
      }
    }

    // 2. Sync Highlights & Notes
    const existingHighlights = await db.highlights.toArray();
    const existingHlIds = new Set(existingHighlights.map((h) => h.id));

    for (const hl of payload.highlights) {
      if (!existingHlIds.has(hl.id)) {
        await db.highlights.put(hl);
        highlightsAdded++;
      } else {
        // If existing highlight exists but incoming has newer note, update note
        const existing = existingHighlights.find((h) => h.id === hl.id);
        if (existing && hl.note && !existing.note) {
          await db.highlights.update(hl.id, { note: hl.note, updatedAt: hl.updatedAt || Date.now() });
        }
      }
    }

    // 3. Sync Bookmarks
    const existingBookmarks = await db.bookmarks.toArray();
    const existingBmKeys = new Set(
      existingBookmarks.map((b) => `${b.bookId}-${b.chapterIndex}-${b.pageIndex}`)
    );

    for (const bm of payload.bookmarks) {
      const key = `${bm.bookId}-${bm.chapterIndex}-${bm.pageIndex}`;
      if (!existingBmKeys.has(key)) {
        await db.bookmarks.put(bm);
        bookmarksAdded++;
      }
    }

    // Save sync info to localStorage
    const info: SyncInfo = {
      lastSyncTimestamp: Date.now(),
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
      syncedBooksCount: booksUpdated,
      syncedHighlightsCount: highlightsAdded,
    };
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(info));

    return { booksUpdated, highlightsAdded, bookmarksAdded };
  }

  // Get last sync info
  public getLastSyncInfo(): SyncInfo | null {
    try {
      const str = localStorage.getItem(SYNC_STORAGE_KEY);
      if (str) return JSON.parse(str);
    } catch {}
    return null;
  }
}

export const progressSyncService = new ProgressSyncService();
