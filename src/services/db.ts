import Dexie, { type Table } from 'dexie';
import type { Book, Highlight, Bookmark, ReaderSettings, Shelf, ReadingSession } from '../types';

export class LuminaDatabase extends Dexie {
  books!: Table<Book, string>;
  highlights!: Table<Highlight, string>;
  bookmarks!: Table<Bookmark, string>;
  settings!: Table<{ key: string; value: any }, string>;
  shelves!: Table<Shelf, string>;
  readingSessions!: Table<ReadingSession, string>;

  constructor() {
    super('LuminaReaderDB');
    this.version(1).stores({
      books: 'id, title, author, category, addedAt',
      highlights: 'id, bookId, chapterIndex, createdAt',
      bookmarks: 'id, bookId, chapterIndex, createdAt',
      settings: 'key',
    });
    this.version(2).stores({
      books: 'id, title, author, category, addedAt, shelfId',
      highlights: 'id, bookId, chapterIndex, createdAt',
      bookmarks: 'id, bookId, chapterIndex, createdAt',
      settings: 'key',
      shelves: 'id, name, createdAt',
      readingSessions: 'id, bookId, date, startTime',
    });
  }
}

export const db = new LuminaDatabase();

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'sepia',
  fontFamily: 'literata',
  fontSize: 19,
  lineHeight: 1.7,
  letterSpacing: 0,
  marginWidth: 48,
  layoutMode: 'double',
  textAlign: 'justify',
  bionicReading: false,
  twoColumnThreshold: 900,
  soundscape: 'none',
  soundscapeVolume: 0.45,
  warmth: 0,
  autoCircadian: false,
  readingRuler: false,
  readingRulerHeight: 44,
  readingRulerOpacity: 0.22,
  autoPagingWpm: 240,
  accentColor: 'amber',
  progressDisplayMode: 'chapter',
};

export async function loadSavedSettings(): Promise<ReaderSettings> {
  try {
    const item = await db.settings.get('reader_settings');
    if (item && item.value) {
      return { ...DEFAULT_SETTINGS, ...item.value };
    }
  } catch (err) {
    console.warn('Failed to read settings from DB, using defaults', err);
  }
  return DEFAULT_SETTINGS;
}

export async function saveReaderSettings(settings: ReaderSettings): Promise<void> {
  try {
    await db.settings.put({ key: 'reader_settings', value: settings });
  } catch (err) {
    console.error('Failed to save settings to DB', err);
  }
}
