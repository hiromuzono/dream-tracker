'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context';
import { Habit, StandaloneTask } from '../types';
import HabitModal from './HabitModal';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { ja } from 'date-fns/locale';

const JP_DAYS_GROWTH = ['日', '月', '火', '水', '木', '金', '土'];

function getWeekKey(dateStr: string): string {
  const d = parseISO(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return format(monday, 'yyyy-MM-dd');
}

function getLogKey(habitType: string, dateStr: string): string {
  if (habitType === 'weekly') return getWeekKey(dateStr);
  if (habitType === 'monthly') return dateStr.slice(0, 7);
  return dateStr;
}

function calcGrowthScore(habits: Habit[], habitLogs: Record<string, string[]>, standaloneTasks: StandaloneTask[], startDate: string) {
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const endStr = format(yd, 'yyyy-MM-dd');
  if (startDate > endStr) return { score: 1.0, totalDays: 0, allDoneDays: 0, missDays: 0, lastWeekBonus: false };
  let score = 1.0, totalDays = 0, allDoneDays = 0, missDays = 0, lastWeekBonus = false;
  const cur = parseISO(startDate);
  while (format(cur, 'yyyy-MM-dd') <= endStr) {
    const ds = format(cur, 'yyyy-MM-dd');
    const dayName = JP_DAYS_GROWTH[cur.getDay()];
    const applicable = [
      ...habits.filter(h => h.type === 'daily'),
      ...habits.filter(h => h.type === 'weekly' && h.days.includes(dayName)),
    ];
    if (applicable.length > 0) {
      totalDays++;
      const doneCount = applicable.filter(h => (habitLogs[h.id] || []).includes(getLogKey(h.type, ds))).length;
      const ratio = doneCount / applicable.length;
      if (ratio === 1) { score *= 1.1; allDoneDays++; }
      else if (ratio < 0.5) { score *= 0.9; missDays++; }
    }
    if (cur.getDay() === 0) {
      const weekStart = getWeekKey(ds);
      const weekTasks = standaloneTasks.filter(t => t.dueDate && t.dueDate >= weekStart && t.dueDate <= ds);
      if (weekTasks.length > 0) {
        const doneOnTime = weekTasks.filter(t => t.done && t.completedAt && t.completedAt.slice(0, 10) <= t.dueDate!).length;
        const ratio = doneOnTime / weekTasks.length;
        lastWeekBonus = ratio === 1;
        if (ratio === 1) score *= 1.1;
        else if (ratio < 0.5) score *= 0.9;
      } else {
        lastWeekBonus = false;
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return { score, totalDays, allDoneDays, missDays, lastWeekBonus };
}

function GrowthScorePanel() {
  const { data } = useApp();
  const { score, totalDays, allDoneDays, missDays, lastWeekBonus } = calcGrowthScore(
    data.habits, data.habitLogs, data.standaloneTasks, data.growthScoreStartDate
  );
  return (
    <div className="p-4 sm:p-6 border-b border-gray-800 bg-gray-900/60">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-gray-400 font-medium">📈 成長スコア</span>
      </div>
      <div className="text-3xl font-bold text-indigo-300 mb-1">{score.toFixed(3)}</div>
      {totalDays > 0 && (
        <p className="text-xs text-gray-500">
          開始から {totalDays}日 | 全達成 {allDoneDays}日 | 未達成 {missDays}日
        </p>
      )}
      {lastWeekBonus && (
        <p className="text-xs text-yellow-400 mt-1">🎉 週間ボーナス達成！</p>
      )}
    </div>
  );
}

function calcStreak(logs: string[]): number {
  const today = new Date();
  let streak = 0;
  let d = new Date(today);
  while (true) {
    const ds = format(d, 'yyyy-MM-dd');
    if (logs.includes(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

interface HabitRowProps {
  habit: Habit;
  todayStr: string;
}

function HabitRow({ habit, todayStr }: HabitRowProps) {
  const { data, toggleHabitLog, deleteHabit } = useApp();
  const [editModal, setEditModal] = useState(false);

  const logs = data.habitLogs[habit.id] || [];
  const logKey = getLogKey(habit.type, todayStr);
  const checked = logs.includes(logKey);
  const streak = habit.type === 'daily' ? calcStreak(logs) : 0;
  const goal = habit.goalId ? data.goals.find(g => g.id === habit.goalId) : undefined;

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 transition-colors group">
      {goal && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${checked ? 'text-gray-400' : 'text-gray-200'}`}>
            {habit.title}
          </span>
          {goal && (
            <span className="text-xs text-gray-600 bg-gray-700 px-1.5 py-0.5 rounded">
              {goal.emoji}{goal.name}
            </span>
          )}
          {habit.type === 'weekly' && (
            <span className="text-xs text-gray-600">{habit.days.join('・')}</span>
          )}
        </div>
        {habit.note && <p className="text-gray-600 text-xs mt-0.5">{habit.note}</p>}
      </div>
      {habit.type === 'daily' && streak > 0 && (
        <span className="text-orange-400 text-sm flex items-center gap-1 shrink-0">
          <Flame size={14} />{streak}日連続
        </span>
      )}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => setEditModal(true)} className="text-gray-600 hover:text-gray-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil size={14} />
        </button>
        <button onClick={() => deleteHabit(habit.id)} className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size={14} />
        </button>
        <button onClick={() => toggleHabitLog(habit.id, logKey)} className="ml-1">
          {checked
            ? <CheckCircle2 size={22} className="text-indigo-400" />
            : <Circle size={22} className="text-gray-600" />}
        </button>
      </div>
      {editModal && <HabitModal habit={habit} onClose={() => setEditModal(false)} />}
    </div>
  );
}

function CalendarView() {
  const { data } = useApp();
  const [month, setMonth] = useState(new Date());

  const dailyHabits = data.habits.filter(h => h.type === 'daily');
  const weeklyHabits = data.habits.filter(h => h.type === 'weekly');
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfWeek = (getDay(start) + 6) % 7; // Monday-first

  const JP_DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

  const getCounts = (date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    const dayName = JP_DAY_NAMES[date.getDay()];
    const weeklyForDay = weeklyHabits.filter(h => h.days.includes(dayName));
    const applicable = [...dailyHabits, ...weeklyForDay];
    const total = applicable.length;
    if (total === 0) return { done: 0, total: 0 };
    const done = applicable.filter(h => (data.habitLogs[h.id] || []).includes(getLogKey(h.type, ds))).length;
    return { done, total };
  };

  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-1.5 text-gray-400 hover:text-white">
          <ChevronLeft size={18} />
        </button>
        <span className="text-white font-medium">{format(month, 'yyyy年M月', { locale: ja })}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1.5 text-gray-400 hover:text-white">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map(d => (
          <div key={d} className="text-center text-gray-600 text-xs py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(d => {
          const { done, total } = getCounts(d);
          const isToday = format(d, 'yyyy-MM-dd') === todayStr;
          const allDone = total > 0 && done === total;
          const hasSome = done > 0;
          const bg = allDone ? 'rgba(99,102,241,0.4)' : hasSome ? 'rgba(99,102,241,0.15)' : '#1f2937';
          return (
            <div key={d.toISOString()}
              className={`aspect-square rounded-md flex flex-col items-center justify-center transition-all ${isToday ? 'ring-2 ring-indigo-400' : ''}`}
              style={{ background: bg }}>
              <span className="text-xs" style={{ color: total > 0 ? '#9ca3af' : '#4b5563' }}>
                {d.getDate()}
              </span>
              {total > 0 && (
                <span className="font-bold leading-none mt-0.5"
                  style={{ fontSize: 9, color: allDone ? '#a5b4fc' : hasSome ? '#6366f1' : '#4b5563' }}>
                  {done}/{total}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-gray-700 text-xs mt-3 text-right">数値 = 実行数/その日の習慣数</p>
    </div>
  );
}

export default function Habits() {
  const { data, deleteHabit } = useApp();
  const [addModal, setAddModal] = useState<{ type: 'daily' | 'weekly' | 'monthly' } | null>(null);
  const [innerTab, setInnerTab] = useState<'check' | 'calendar'>('check');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [targetDate, setTargetDate] = useState(todayStr);

  const isToday = targetDate === todayStr;

  const goBack = () => {
    const d = parseISO(targetDate);
    d.setDate(d.getDate() - 1);
    setTargetDate(format(d, 'yyyy-MM-dd'));
  };

  const goForward = () => {
    if (!isToday) {
      const d = parseISO(targetDate);
      d.setDate(d.getDate() + 1);
      setTargetDate(format(d, 'yyyy-MM-dd'));
    }
  };

  const daily = data.habits.filter(h => h.type === 'daily');
  const weekly = data.habits.filter(h => h.type === 'weekly');
  const monthly = data.habits.filter(h => h.type === 'monthly');

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h1 className="text-white text-xl font-bold">習慣管理</h1>
        </div>
      </div>

      <GrowthScorePanel />

      <div className="px-4 sm:px-6 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
          <button onClick={() => setInnerTab('check')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${innerTab === 'check' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            チェック
          </button>
          <button onClick={() => setInnerTab('calendar')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${innerTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            カレンダー
          </button>
        </div>

        {/* 日付ナビゲーション（チェックタブのみ） */}
        {innerTab === 'check' && (
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className={`text-sm font-medium px-2 ${isToday ? 'text-indigo-400' : 'text-gray-300'}`}>
              {isToday ? '今日' : format(parseISO(targetDate), 'M月d日（eee）', { locale: ja })}
            </span>
            <button onClick={goForward} disabled={isToday}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <button onClick={() => setTargetDate(todayStr)}
                className="text-xs px-2 py-1 rounded-lg border border-gray-700 text-gray-500 hover:text-indigo-400 hover:border-indigo-500 transition-colors">
                今日に戻る
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {innerTab === 'calendar' ? (
          <CalendarView />
        ) : (
          <div className="space-y-6">
            {/* Daily */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-400 text-sm font-medium">毎日習慣</h2>
                <button onClick={() => setAddModal({ type: 'daily' })}
                  className="text-gray-500 hover:text-indigo-400 text-sm flex items-center gap-1 transition-colors">
                  <Plus size={14} /> 追加
                </button>
              </div>
              {daily.length === 0 ? (
                <p className="text-gray-700 text-sm text-center py-4">毎日の習慣はありません</p>
              ) : (
                <div className="space-y-2">
                  {daily.map(h => <HabitRow key={h.id} habit={h} todayStr={targetDate} />)}
                </div>
              )}
            </div>

            {/* Weekly */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-400 text-sm font-medium">毎週習慣</h2>
                <button onClick={() => setAddModal({ type: 'weekly' })}
                  className="text-gray-500 hover:text-indigo-400 text-sm flex items-center gap-1 transition-colors">
                  <Plus size={14} /> 追加
                </button>
              </div>
              {weekly.length === 0 ? (
                <p className="text-gray-700 text-sm text-center py-4">毎週の習慣はありません</p>
              ) : (
                <div className="space-y-2">
                  {weekly.map(h => <HabitRow key={h.id} habit={h} todayStr={targetDate} />)}
                </div>
              )}
            </div>

            {/* Monthly */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-400 text-sm font-medium">毎月習慣</h2>
                <button onClick={() => setAddModal({ type: 'monthly' })}
                  className="text-gray-500 hover:text-indigo-400 text-sm flex items-center gap-1 transition-colors">
                  <Plus size={14} /> 追加
                </button>
              </div>
              {monthly.length === 0 ? (
                <p className="text-gray-700 text-sm text-center py-4">毎月の習慣はありません</p>
              ) : (
                <div className="space-y-2">
                  {monthly.map(h => <HabitRow key={h.id} habit={h} todayStr={targetDate} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {addModal && (
        <HabitModal
          defaultType={addModal.type}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}
