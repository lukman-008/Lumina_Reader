export type ReadingTheme = 'paper' | 'sepia' | 'dusk' | 'amoled' | 'eink' | 'sage' | 'nordic';

export type AccentColor = 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';

export type FontFamilyChoice = 'literata' | 'merriweather' | 'sans' | 'dyslexic' | 'mono';

export type LayoutMode = 'double' | 'single' | 'scroll';

export type TextAlignment = 'justify' | 'left';

export type SoundscapeType = 'none' | 'rain' | 'fireplace' | 'cafe' | 'brown-noise' | 'waves' | 'crickets';

export interface BookChapter {
  id: string;
  title: string;
  content: string; // Plain text or HTML/Markdown content
  wordCount: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  chapterIndex: number;
  selectedText: string;
  startOffset?: number;
  endOffset?: number;
  startItemIndex?: number;
  endItemIndex?: number;
  pdfPageIndex?: number;
  rects?: { left: number; top: number; width: number; height: number }[];
  color: 'yellow' | 'emerald' | 'sky' | 'rose' | 'amber' | 'violet';
  note?: string;
  scope?: 'word' | 'line' | 'paragraph';
  createdAt: number;
  updatedAt?: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterIndex: number;
  pageIndex: number;
  label: string;
  snippet: string;
  createdAt: number;
}

export interface Shelf {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverGradient?: string;
  coverImage?: string; // base64 or object URL
  format: 'epub' | 'pdf' | 'txt' | 'md';
  totalWords: number;
  chapters: BookChapter[];
  readingProgress: {
    currentChapterIndex: number;
    currentPageIndex: number;
    percentage: number;
    lastReadTimestamp: number;
  };
  category: string;
  addedAt: number;
  isFavorite?: boolean;
  shelfId?: string;
  tags?: string[];
  rawFile?: ArrayBuffer | Blob;
}

export interface ReaderSettings {
  theme: ReadingTheme;
  fontFamily: FontFamilyChoice;
  fontSize: number; // in px, e.g. 18
  lineHeight: number; // e.g. 1.7
  letterSpacing: number; // in px, e.g. 0
  marginWidth: number; // in px or rem, e.g. 32
  layoutMode: LayoutMode;
  textAlign: TextAlignment;
  bionicReading: boolean;
  twoColumnThreshold: number;
  // Ambient Sound & Warmth Lighting
  soundscape: SoundscapeType;
  soundscapeVolume: number; // 0 to 1
  warmth: number; // 0 to 100 (blue light filter temperature)
  autoCircadian: boolean;
  // Reading Ruler (Focus Guide)
  readingRuler: boolean;
  readingRulerHeight: number; // 24 to 80 px
  readingRulerOpacity: number; // 0.1 to 0.4
  // Auto-Pacing
  autoPagingWpm: number; // 150 to 500
  // UI Customization
  accentColor?: AccentColor;
  progressDisplayMode?: 'book' | 'chapter';
  // Reading Experience & Sensory Feedback
  pageTurnAnimation?: 'slide' | 'curl' | 'fade';
  soundEffects?: boolean; // tactile paper rustle & click sounds
  hapticFeedback?: boolean; // gentle vibration on mobile
}

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  wordsRead: number;
  pagesRead: number;
  date: string; // YYYY-MM-DD
}

export interface DailyReadingLog {
  date: string; // YYYY-MM-DD
  minutesRead: number;
  wordsRead: number;
  sessionsCount: number;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  todayGoalMinutes: number;
  totalMinutes: number;
  totalWordsRead: number;
  averageWpm: number;
  heatMapData: { date: string; minutes: number; level: 0 | 1 | 2 | 3 | 4 }[];
}

export interface LuminaBackupBook extends Book {
  rawFileBase64?: string;
}

export interface LuminaBackup {
  version: number;
  exportedAt: string;
  books: LuminaBackupBook[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  shelves: Shelf[];
  readingSessions: ReadingSession[];
  settings: ReaderSettings | null;
}

export interface ReadingSessionStats {
  id: string;
  bookId: string;
  durationMinutes: number;
  pagesRead: number;
  date: string;
}

export type OSPlatform = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';

export interface SearchIndexResult {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  chapterIndex: number;
  chapterTitle: string;
  matchSnippet: string;
  matchIndex: number;
  matchTerm: string;
}

export interface ReadingProgressSyncPayload {
  version: number;
  deviceId: string;
  deviceName: string;
  timestamp: number;
  booksProgress: {
    bookId: string;
    title: string;
    currentChapterIndex: number;
    currentPageIndex: number;
    percentage: number;
    lastReadTimestamp: number;
  }[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  habitStatsSummary?: {
    currentStreak: number;
    totalMinutes: number;
    totalWordsRead: number;
  };
}

export interface ImportQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  format: 'epub' | 'pdf' | 'txt' | 'md' | 'lumina' | 'other';
  status: 'pending' | 'parsing' | 'success' | 'error';
  parsedBook?: Book;
  parsedBackup?: LuminaBackup;
  errorMessage?: string;
}
