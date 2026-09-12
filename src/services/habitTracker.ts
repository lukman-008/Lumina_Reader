import { db } from './db';
import type { ReadingSession, HabitStats } from '../types';
import { ambientAudio } from './ambientAudio';

export class HabitTrackerService {
  private activeSession: {
    bookId: string;
    bookTitle: string;
    startTime: number;
    lastActiveTime: number;
    initialWords: number;
    wordsRead: number;
    pagesRead: number;
  } | null = null;

  private timerInterval: any = null;
  private focusTimerSecondsLeft: number | null = null;
  private focusTimerInitialSeconds: number = 25 * 60;
  private focusTimerActive: boolean = false;
  private focusTimerListeners: ((secondsLeft: number | null, isActive: boolean) => void)[] = [];

  // Start tracking an active reading sitting
  public startSession(bookId: string, bookTitle: string, initialWords: number = 0) {
    if (this.activeSession && this.activeSession.bookId === bookId) {
      this.activeSession.lastActiveTime = Date.now();
      return;
    }
    this.endSession(); // End any prior session
    this.activeSession = {
      bookId,
      bookTitle,
      startTime: Date.now(),
      lastActiveTime: Date.now(),
      initialWords,
      wordsRead: 0,
      pagesRead: 0,
    };
  }

  // Record active reading activity (page turns, highlights, scrolling)
  public recordActivity(wordsDelta: number = 0) {
    if (!this.activeSession) return;
    const now = Date.now();
    // Only count if within 5 minutes of previous activity (prevents leaving tab open overnight)
    const gapSeconds = (now - this.activeSession.lastActiveTime) / 1000;
    if (gapSeconds < 300) {
      if (wordsDelta > 0) {
        this.activeSession.wordsRead += wordsDelta;
        this.activeSession.pagesRead += 1;
      }
    }
    this.activeSession.lastActiveTime = now;
  }

  // End active session and save to IndexedDB if session >= 30 seconds
  public async endSession(): Promise<ReadingSession | null> {
    if (!this.activeSession) return null;

    const now = Date.now();
    // Cap inactive duration to last active time + 1 min
    const effectiveEndTime = Math.min(now, this.activeSession.lastActiveTime + 60000);
    const durationSeconds = Math.max(0, (effectiveEndTime - this.activeSession.startTime) / 1000);
    const durationMinutes = Math.round((durationSeconds / 60) * 10) / 10;

    const sessionData = this.activeSession;
    this.activeSession = null;

    if (durationMinutes >= 0.5) {
      const todayStr = new Date(sessionData.startTime).toISOString().split('T')[0];
      const session: ReadingSession = {
        id: 'session-' + Date.now(),
        bookId: sessionData.bookId,
        bookTitle: sessionData.bookTitle,
        startTime: sessionData.startTime,
        endTime: effectiveEndTime,
        durationMinutes,
        wordsRead: Math.max(sessionData.wordsRead, Math.round(durationMinutes * 220)),
        pagesRead: Math.max(1, sessionData.pagesRead),
        date: todayStr,
      };

      try {
        await db.readingSessions.put(session);
        return session;
      } catch (err) {
        console.warn('Failed to save reading session:', err);
      }
    }
    return null;
  }

  // Calculate comprehensive reading habit stats
  public async getHabitStats(dailyGoalMinutes: number = 30): Promise<HabitStats> {
    const sessions = await db.readingSessions.toArray();
    const todayStr = new Date().toISOString().split('T')[0];

    // Group by date
    const dateMinutesMap = new Map<string, number>();
    const dateWordsMap = new Map<string, number>();

    let totalMinutes = 0;
    let totalWordsRead = 0;

    sessions.forEach((s) => {
      totalMinutes += s.durationMinutes;
      totalWordsRead += s.wordsRead;
      dateMinutesMap.set(s.date, (dateMinutesMap.get(s.date) || 0) + s.durationMinutes);
      dateWordsMap.set(s.date, (dateWordsMap.get(s.date) || 0) + s.wordsRead);
    });

    const todayMinutes = Math.round((dateMinutesMap.get(todayStr) || 0) * 10) / 10;

    // Calculate streaks (consecutive days with at least 3 minutes of reading)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check today or yesterday as start of streak
    const checkDate = new Date();
    const todayHasMinutes = (dateMinutesMap.get(todayStr) || 0) >= 3;

    if (!todayHasMinutes) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Go backwards day by day for current streak
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      const mins = dateMinutesMap.get(dStr) || 0;
      if (mins >= 3) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak from all recorded unique dates sorted
    const allDates = Array.from(dateMinutesMap.keys()).sort();
    if (allDates.length > 0) {
      for (let i = 0; i < allDates.length; i++) {
        if ((dateMinutesMap.get(allDates[i]) || 0) >= 3) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // Heatmap data: past 35 days (5 weeks grid)
    const heatMapData: { date: string; minutes: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
    const loopDate = new Date();
    loopDate.setDate(loopDate.getDate() - 34); // 35 days total

    for (let i = 0; i < 35; i++) {
      const dStr = loopDate.toISOString().split('T')[0];
      const mins = Math.round((dateMinutesMap.get(dStr) || 0) * 10) / 10;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (mins > 45) level = 4;
      else if (mins > 30) level = 3;
      else if (mins > 15) level = 2;
      else if (mins > 0) level = 1;

      heatMapData.push({ date: dStr, minutes: mins, level });
      loopDate.setDate(loopDate.getDate() + 1);
    }

    const averageWpm = totalMinutes > 0 ? Math.round(totalWordsRead / totalMinutes) : 230;

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      todayMinutes,
      todayGoalMinutes: dailyGoalMinutes,
      totalMinutes: Math.round(totalMinutes),
      totalWordsRead,
      averageWpm: Math.min(600, Math.max(120, averageWpm)),
      heatMapData,
    };
  }

  // --- FOCUS / POMODORO TIMER ---
  public startFocusTimer(minutes: number = 25) {
    this.focusTimerInitialSeconds = minutes * 60;
    this.focusTimerSecondsLeft = minutes * 60;
    this.focusTimerActive = true;

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.focusTimerSecondsLeft !== null && this.focusTimerSecondsLeft > 0) {
        this.focusTimerSecondsLeft -= 1;
        this.notifyFocusTimer();
      } else if (this.focusTimerSecondsLeft === 0) {
        this.stopFocusTimer();
        ambientAudio.playFocusChime();
      }
    }, 1000);

    this.notifyFocusTimer();
  }

  public pauseFocusTimer() {
    this.focusTimerActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.notifyFocusTimer();
  }

  public resumeFocusTimer() {
    if (this.focusTimerSecondsLeft && this.focusTimerSecondsLeft > 0) {
      this.focusTimerActive = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.focusTimerSecondsLeft !== null && this.focusTimerSecondsLeft > 0) {
          this.focusTimerSecondsLeft -= 1;
          this.notifyFocusTimer();
        } else if (this.focusTimerSecondsLeft === 0) {
          this.stopFocusTimer();
          ambientAudio.playFocusChime();
        }
      }, 1000);
      this.notifyFocusTimer();
    }
  }

  public stopFocusTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.focusTimerActive = false;
    this.focusTimerSecondsLeft = null;
    this.notifyFocusTimer();
  }

  public getFocusTimerState() {
    return {
      secondsLeft: this.focusTimerSecondsLeft,
      isActive: this.focusTimerActive,
      initialSeconds: this.focusTimerInitialSeconds,
    };
  }

  public onFocusTimerChange(listener: (secondsLeft: number | null, isActive: boolean) => void): () => void {
    this.focusTimerListeners.push(listener);
    listener(this.focusTimerSecondsLeft, this.focusTimerActive);
    return () => {
      this.focusTimerListeners = this.focusTimerListeners.filter((l) => l !== listener);
    };
  }

  private notifyFocusTimer() {
    this.focusTimerListeners.forEach((l) => l(this.focusTimerSecondsLeft, this.focusTimerActive));
  }
}

export const habitTracker = new HabitTrackerService();
