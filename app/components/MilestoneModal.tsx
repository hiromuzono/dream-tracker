'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Milestone } from '../types';
import { useApp } from '../context';

interface Props {
  goalId: string;
  milestone?: Milestone | null;
  onClose: () => void;
}

export default function MilestoneModal({ goalId, milestone, onClose }: Props) {
  const { addMilestone, updateMilestone } = useApp();
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [period, setPeriod] = useState(milestone?.period ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !period) return;
    if (milestone) {
      updateMilestone(goalId, milestone.id, { title, period, description });
    } else {
      addMilestone(goalId, { title, period, description });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">{milestone ? 'マイルストーンを編集' : 'マイルストーンを追加'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">タイトル *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
              placeholder="マイルストーン名" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">対象月 *</label>
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)} required
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">説明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 outline-none resize-none"
              placeholder="説明（任意）" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              キャンセル
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
              {milestone ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
