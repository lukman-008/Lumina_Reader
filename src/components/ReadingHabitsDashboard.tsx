import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Zap,
  BookOpen,
  Calendar,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Bell,
  X,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { habitTracker } from '../services/habitTracker';
import type { HabitStats, ReadingSession } from '../types';
import { db } from '../services/db';

interface ReadingHabitsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingHabitsDashboard: React.FC<ReadingHabitsDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<ReadingSession[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(30);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [selectedTimerMins, setSelectedTimerMins] = useState<number>(25);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      const data = await habitTracker.getHabitStats(dailyGoal);
      setStats(data);
      const sessions = await db.readingSessions.orderBy('startTime').reverse().limit(6).toArray();
      setRecentSessions(sessions);
    };

    loadData();

    const unsubTimer = habitTracker.onFocusTimerChange((sec, active) => {
      setTimerSeconds(sec);
      setIsTimerActive(active);
    });

    return () => unsubTimer();
  }, [isOpen, dailyGoal]);

  if (!isOpen || !stats) return null;

  const formatTimerTime = (sec: number | null) => {
    if (sec === null) return `${selectedTimerMins}:00`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = (mins: number) => {
    setSelectedTimerMins(mins);
    habitTracker.startFocusTimer(mins);
  };

  const handleToggleTimer = () => {
    if (isTimerActive) {
      habitTracker.pauseFocusTimer();
    } else if (timerSeconds !== null && timerSeconds > 0) {
      habitTracker.resumeFocusTimer();
    } else {
      habitTracker.startFocusTimer(selectedTimerMins);
    }
  };

  const handleResetTimer = () => {
    habitTracker.stopFocusTimer();
  };

  const LEVEL_COLORS = [
    'bg-slate-800/80 border-slate-700/60',
    'bg-amber-900/50 border-amber-700/40 text-amber-200',
    'bg-amber-700/60 border-amber-600/50 text-amber-100',
    'bg-amber-600/80 border-amber-500/60 text-slate-950 font-bold',
    'bg-amber-400 border-amber-300 text-slate-950 font-bold shadow-xs',
  ];

  const goalPercentage = Math.min(100, Math.round((stats.todayMinutes / stats.todayGoalMinutes) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col space-y-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold shadow-xs">
              <Flame className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Reading Velocity & Habit Dashboard</h3>
              <p className="text-xs text-slate-400">
                Offline analytics, streak metrics & Pomodoro focus pacer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Streak */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Streak</span>
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {stats.currentStreak} <span className="text-xs font-sans font-normal text-slate-400">days</span>
              </span>
              <span className="text-[10px] text-amber-400 block mt-0.5">
                Record: {stats.longestStreak} days
              </span>
            </div>
          </div>

          {/* Today Reading */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Today</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {stats.todayMinutes} <span className="text-xs font-sans font-normal text-slate-400">min</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Goal: {stats.todayGoalMinutes} min ({goalPercentage}%)
              </span>
            </div>
          </div>

          {/* Reading Speed (WPM) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pace (WPM)</span>
              <Zap className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {stats.averageWpm}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                ~{Math.round(stats.averageWpm * 60).toLocaleString()} words/hr
              </span>
            </div>
          </div>

          {/* Total Words Conquered */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Lifetime</span>
              <Trophy className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono text-slate-100">
                {(stats.totalWordsRead / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.totalMinutes} total mins
              </span>
            </div>
          </div>
        </div>

        {/* 35-Day Reading Heatmap Grid */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                35-Day Reading Density Heatmap
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-xs bg-slate-800" />
              <div className="w-2.5 h-2.5 rounded-xs bg-amber-900/60" />
              <div className="w-2.5 h-2.5 rounded-xs bg-amber-700/80" />
              <div className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
              <span>More</span>
            </div>
          </div>

          {/* Grid of 35 boxes (7 days x 5 columns) */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {stats.heatMapData.map((item) => (
              <div
                key={item.date}
                title={`${item.date}: ${item.minutes} minutes read`}
                className={`h-8 rounded-lg border flex flex-col items-center justify-center text-[10px] transition-all hover:scale-105 cursor-pointer ${
                  LEVEL_COLORS[item.level]
                }`}
              >
                <span className="opacity-90">{item.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrated Pomodoro / Reading Focus Timer */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-800/80 to-slate-800/80 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-lg shadow-inner">
              {formatTimerTime(timerSeconds)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">Reading Focus Timer</span>
                {isTimerActive && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-medium animate-pulse">
                    Running
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gentle singing bowl chime rings upon completion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Presets */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700">
              {[15, 25, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => handleStartTimer(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                    selectedTimerMins === m && timerSeconds !== null
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={handleToggleTimer}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-xs transition"
              title={isTimerActive ? 'Pause Timer' : 'Start Timer'}
            >
              {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Reset */}
            <button
              onClick={handleResetTimer}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Reading Sessions */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Recent Sittings
          </span>
          {recentSessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
              Your reading duration and speed will log here automatically as you turn pages.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{sess.bookTitle}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0 font-mono">
                    <span>{sess.durationMinutes} mins</span>
                    <span>·</span>
                    <span>{sess.wordsRead.toLocaleString()} words</span>
                    <span>·</span>
                    <span>{sess.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
