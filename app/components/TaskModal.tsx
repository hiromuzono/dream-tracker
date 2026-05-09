'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Task } from '../types';
import { useApp } from '../context';

interface Props {
  goalId: string;
  milestoneId: string;
  task?: Task | null;
  onClose: () => void;
}

export default function TaskModal({ goalId, milestoneId, task, onClose }: Props) {
  const { addTask, updateTask } = useApp();
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    task?.estimatedMinutes != null ? String(task.estimatedMinutes) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const mins = estimatedMinutes !== '' ? Number(estimatedMinutes) : null;
    if (task) {
      updateTask(goalId, milestoneId, task.id, { title, note, estimatedMinutes: mins });
    } else {
      addTask(goalId, milestoneId, { title, note, estimatedMinutes: mins, done: false });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{task ? 'タスクを編集' : 'タスクを追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">タイトル *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
              placeholder="タスク名" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">補足メモ</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none resize-none"
              placeholder="補足メモ（任意）" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">見積もり時間（分）</label>
            <input type="number" min="1" value={estimatedMinutes}
              onChange={e => setEstimatedMinutes(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
              placeholder="例: 30" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
              {task ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
