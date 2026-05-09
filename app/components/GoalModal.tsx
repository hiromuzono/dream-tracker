'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Goal, GOAL_COLORS } from '../types';
import { useApp } from '../context';

interface Props {
  goal?: Goal | null;
  onClose: () => void;
}

const EMOJIS = ['🎯', '🤖', '📖', '🌍', '💪', '🚀', '💡', '🎨', '🏆', '✨', '🔥', '⭐'];

export default function GoalModal({ goal, onClose }: Props) {
  const { addGoal, updateGoal } = useApp();
  const [name, setName] = useState(goal?.name ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [description, setDescription] = useState(goal?.description ?? '');
  const [startDate, setStartDate] = useState(goal?.startDate ?? '');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');

  useEffect(() => {
    const now = new Date();
    if (!startDate) {
      setStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !deadline) return;
    if (goal) {
      updateGoal(goal.id, { name, emoji, color, description, startDate, deadline });
    } else {
      addGoal({ name, emoji, color, description, startDate, deadline });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{goal ? '目標を編集' : '目標を追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">絵文字</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`w-9 h-9 text-xl rounded-lg border-2 transition-all ${emoji === e ? 'border-indigo-500 bg-indigo-500/20' : 'border-gray-700 hover:border-gray-500'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">カラー</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">目標名 *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
              placeholder="目標名を入力" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">説明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none resize-none"
              placeholder="説明（任意）" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm block mb-1">開始年月 *</label>
              <input type="month" value={startDate} onChange={e => setStartDate(e.target.value)} required
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">期限 *</label>
              <input type="month" value={deadline} onChange={e => setDeadline(e.target.value)} required
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
              {goal ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
