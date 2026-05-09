'use client';

import React, { useRef } from 'react';
import { Plus, LayoutDashboard, Zap } from 'lucide-react';
import { useApp } from '../context';

type TabId = 'dashboard' | string | 'habits';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddGoal: () => void;
}

export default function Navigation({ activeTab, onTabChange, onAddGoal }: Props) {
  const { data } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <nav className="flex items-center border-b border-gray-800 bg-gray-950 shrink-0 overflow-hidden">
      {/* Dashboard tab - fixed */}
      <button
        onClick={() => onTabChange('dashboard')}
        className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 shrink-0 transition-colors ${
          activeTab === 'dashboard'
            ? 'border-indigo-500 text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
        }`}>
        <LayoutDashboard size={15} />
        <span>ダッシュボード</span>
      </button>

      {/* Goal tabs - scrollable */}
      <div ref={scrollRef} className="flex items-center overflow-x-auto scrollbar-hide flex-1">
        {data.goals.map(goal => (
          <button
            key={goal.id}
            onClick={() => onTabChange(goal.id)}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 shrink-0 transition-colors ${
              activeTab === goal.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: goal.color }}
            />
            <span className="max-w-[120px] truncate">{goal.emoji} {goal.name}</span>
          </button>
        ))}

        {/* Add goal button */}
        <button
          onClick={onAddGoal}
          className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-indigo-400 shrink-0 transition-colors">
          <Plus size={15} />
          <span>目標追加</span>
        </button>
      </div>

      {/* Habits tab - fixed right */}
      <button
        onClick={() => onTabChange('habits')}
        className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 shrink-0 transition-colors ${
          activeTab === 'habits'
            ? 'border-indigo-500 text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
        }`}>
        <Zap size={15} />
        <span>習慣</span>
      </button>
    </nav>
  );
}
