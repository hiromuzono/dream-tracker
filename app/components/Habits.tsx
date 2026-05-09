'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context';
import { Habit } from '../types';
import HabitModal from './HabitModal';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

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
  const checked = logs.includes(todayStr);
  const streak = habit.type === 'daily' ? calcStreak(logs) : 0;
  const goal = habit.goalId ? data.goals.find(g => g.id === habit.goalId) : undefined;

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 transition-colors group">
      {goal && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${checked && habit.type === 'daily' ? 'text-gray-400' : 'text-gray-200'}`}>
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
        {habit.type === 'daily' && (
          <button onClick={() => toggleHabitLog(habit.id, todayStr)} className="ml-1">
            {checked
              ? <CheckCircle2 size={22} className="text-indigo-400" />
              : <Circle size={22} className="text-gray-600" />}
          </button>
        )}
      </div>
      {editModal && <HabitModal habit={habit} onClose={() => setEditModal(false)} />}
    </div>
  );
}

function CalendarView() {
  const { data } = useApp();
  const [month, setMonth] = useState(new Date());

  const dailyHabits = data.habits.filter(h => h.type === 'daily');
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfWeek = (getDay(start) + 6) % 7; // Monday-first

  const getCellIntensity = (date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    const checked = dailyHabits.filter(h => (data.habitLogs[h.id] || []).includes(ds)).length;
    if (dailyHabits.length === 0) return 0;
    return checked / dailyHabits.length;
  };

  const intensityToColor = (v: number) => {
    if (v === 0) return 'bg-gray-800';
    if (v < 0.34) return 'bg-indigo-900';
    if (v < 0.67) return 'bg-indigo-600';
    return 'bg-indigo-400';
  };

  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

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
          const intensity = getCellIntensity(d);
          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={d.toISOString()}
              className={`aspect-square rounded-md flex items-center justify-center text-xs transition-all ${intensityToColor(intensity)} ${isToday ? 'ring-2 ring-indigo-400' : ''}`}>
              <span className={intensity > 0 ? 'text-white' : 'text-gray-600'}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 justify-end">
        <span className="text-gray-600 text-xs">少</span>
        {['bg-gray-800', 'bg-indigo-900', 'bg-indigo-600', 'bg-indigo-400'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
        ))}
        <span className="text-gray-600 text-xs">多</span>
      </div>
    </div>
  );
}

export default function Habits() {
  const { data, deleteHabit } = useApp();
  const [addModal, setAddModal] = useState<{ type: 'daily' | 'weekly' | 'monthly' } | null>(null);
  const [innerTab, setInnerTab] = useState<'check' | 'calendar'>('check');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const daily = data.habits.filter(h => h.type === 'daily');
  const weekly = data.habits.filter(h => h.type === 'weekly');
  const monthly = data.habits.filter(h => h.type === 'monthly');

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h1 className="text-white text-xl font-bold">習慣管理</h1>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-gray-800">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
          <button onClick={() => setInnerTab('check')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${innerTab === 'check' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            今日のチェック
          </button>
          <button onClick={() => setInnerTab('calendar')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${innerTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            カレンダー
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
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
                  {daily.map(h => <HabitRow key={h.id} habit={h} todayStr={todayStr} />)}
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
                  {weekly.map(h => <HabitRow key={h.id} habit={h} todayStr={todayStr} />)}
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
                  {monthly.map(h => <HabitRow key={h.id} habit={h} todayStr={todayStr} />)}
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
