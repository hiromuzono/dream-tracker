'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Habit, HabitType, WEEKDAYS } from '../types';
import { useApp } from '../context';

interface Props {
  habit?: Habit | null;
  defaultType?: HabitType;
  onClose: () => void;
}

export default function HabitModal({ habit, defaultType = 'daily', onClose }: Props) {
  const { data, addHabit, updateHabit } = useApp();
  const [title, setTitle] = useState(habit?.title ?? '');
  const [note, setNote] = useState(habit?.note ?? '');
  const [type, setType] = useState<HabitType>(habit?.type ?? defaultType);
  const [days, setDays] = useState<string[]>(habit?.days ?? []);
  const [goalId, setGoalId] = useState(habit?.goalId ?? '');

  const toggleDay = (d: string) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (habit) {
      updateHabit(habit.id, { title, note, type, days: type === 'weekly' ? days : [], goalId });
    } else {
      addHabit({ title, note, type, days: type === 'weekly' ? days : [], goalId });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{habit ? '習慣を編集' : '習慣を追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">タイトル *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
              placeholder="習慣名" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">補足メモ</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
              placeholder="補足（任意）" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">種類 *</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as HabitType[]).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === t ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}>
                  {t === 'daily' ? '毎日' : t === 'weekly' ? '毎週' : '毎月'}
                </button>
              ))}
            </div>
          </div>
          {type === 'weekly' && (
            <div>
              <label className="text-gray-400 text-sm block mb-2">曜日</label>
              <div className="flex gap-2">
                {WEEKDAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${days.includes(d) ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-gray-400 text-sm block mb-1">関連目標</label>
            <select value={goalId} onChange={e => setGoalId(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none">
              <option value="">なし</option>
              {data.goals.map(g => (
                <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
              {habit ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
