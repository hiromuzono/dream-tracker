'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../context';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Goal } from '../types';

type Tab = 'today' | 'week' | 'month';

interface TaskItem {
  type: 'task' | 'habit';
  id: string;
  title: string;
  goalId?: string;
  goalName?: string;
  goalColor?: string;
  goalEmoji?: string;
  done: boolean;
  milestoneId?: string;
  taskId?: string;
  habitId?: string;
  label?: string;
}

function getMsBadge(period: string) {
  const now = format(new Date(), 'yyyy-MM');
  const next1 = format(addMonths(new Date(), 1), 'yyyy-MM');
  const next2 = format(addMonths(new Date(), 2), 'yyyy-MM');
  if (period < now) return { label: '期限切れ', cls: 'bg-red-500/20 text-red-400' };
  if (period === now) return { label: '今月', cls: 'bg-blue-500/20 text-blue-400' };
  if (period === next1 || period === next2) return { label: '近日', cls: 'bg-green-500/20 text-green-400' };
  return { label: '予定', cls: 'bg-gray-700 text-gray-400' };
}

function useTaskItems(tab: Tab) {
  const { data } = useApp();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayMonth = format(today, 'yyyy-MM');

  const goalMap = new Map(data.goals.map(g => [g.id, g]));
  const items: TaskItem[] = [];

  if (tab === 'today') {
    data.habits.filter(h => h.type === 'daily').forEach(h => {
      const goal = h.goalId ? goalMap.get(h.goalId) : undefined;
      const logs = data.habitLogs[h.id] || [];
      items.push({
        type: 'habit', id: h.id, title: h.title,
        goalId: h.goalId, goalName: goal?.name, goalColor: goal?.color, goalEmoji: goal?.emoji,
        done: logs.includes(todayStr), habitId: h.id, label: '毎日習慣',
      });
    });
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const todayDay = dayNames[today.getDay()];
    data.habits.filter(h => h.type === 'weekly' && h.days.includes(todayDay)).forEach(h => {
      const goal = h.goalId ? goalMap.get(h.goalId) : undefined;
      items.push({
        type: 'habit', id: `w-${h.id}`, title: h.title,
        goalId: h.goalId, goalName: goal?.name, goalColor: goal?.color, goalEmoji: goal?.emoji,
        done: false, habitId: h.id, label: '毎週習慣',
      });
    });
  }

  if (tab === 'week') {
    data.habits.filter(h => h.type === 'weekly').forEach(h => {
      const goal = h.goalId ? goalMap.get(h.goalId) : undefined;
      items.push({
        type: 'habit', id: h.id, title: h.title,
        goalId: h.goalId, goalName: goal?.name, goalColor: goal?.color, goalEmoji: goal?.emoji,
        done: false, habitId: h.id, label: `毎週(${h.days.join('・')})`,
      });
    });
  }

  if (tab === 'month') {
    data.habits.filter(h => h.type === 'monthly').forEach(h => {
      const goal = h.goalId ? goalMap.get(h.goalId) : undefined;
      items.push({
        type: 'habit', id: h.id, title: h.title,
        goalId: h.goalId, goalName: goal?.name, goalColor: goal?.color, goalEmoji: goal?.emoji,
        done: false, habitId: h.id, label: '毎月習慣',
      });
    });
    data.goals.forEach(g => {
      g.milestones.filter(m => m.period === todayMonth).forEach(ms => {
        ms.tasks.forEach(t => {
          items.push({
            type: 'task', id: t.id, title: t.title,
            goalId: g.id, goalName: g.name, goalColor: g.color, goalEmoji: g.emoji,
            done: t.done, milestoneId: ms.id, taskId: t.id, label: ms.title,
          });
        });
      });
    });
  }

  return items;
}

function calcOverallProgress(goals: Goal[]) {
  const allTasks = goals.flatMap(g => g.milestones.flatMap(m => m.tasks));
  if (allTasks.length === 0) return 0;
  const totalTime = allTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 1), 0);
  const doneTime = allTasks.filter(t => t.done).reduce((s, t) => s + (t.estimatedMinutes ?? 1), 0);
  return Math.round((doneTime / totalTime) * 100);
}

interface Props {
  onTabChange?: (tab: string) => void;
}

export default function Dashboard({ onTabChange }: Props) {
  const { data, toggleTask, toggleHabitLog } = useApp();
  const [tab, setTab] = useState<Tab>('today');
  const [showCompleted, setShowCompleted] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayMonth = format(today, 'yyyy-MM');
  const dateLabel = format(today, 'yyyy年M月d日（eee）', { locale: ja });

  const items = useTaskItems(tab);
  const filtered = showCompleted ? items : items.filter(item => !item.done);
  const overallPct = calcOverallProgress(data.goals);

  // 各目標の直近マイルストーン（今月以降で最初）
  const goalMilestones = data.goals.map(g => {
    const upcoming = [...g.milestones]
      .filter(m => m.period >= todayMonth)
      .sort((a, b) => a.period.localeCompare(b.period));
    const ms = upcoming[0];
    if (!ms) return null;
    return { goal: g, ms };
  }).filter((x): x is { goal: Goal; ms: NonNullable<typeof x>['ms'] } => x !== null);

  const handleToggle = (item: TaskItem) => {
    if (item.type === 'task' && item.goalId && item.milestoneId && item.taskId) {
      toggleTask(item.goalId, item.milestoneId, item.taskId);
    } else if (item.type === 'habit' && item.habitId) {
      toggleHabitLog(item.habitId, todayStr);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🗓</span>
          <h1 className="text-white text-xl font-bold">ダッシュボード</h1>
        </div>
        <p className="text-gray-500 text-sm">{dateLabel}</p>
      </div>

      <div className="px-4 sm:px-6 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['today', 'week', 'month'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t === 'today' ? '今日' : t === 'week' ? '今週' : '今月'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCompleted(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showCompleted ? 'border-indigo-500 text-indigo-400' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}>
          {showCompleted ? '完了済みを非表示' : '完了済みを表示'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* タスク・習慣リスト */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-white font-medium">今日のタスクは全部完了！</p>
            <p className="text-gray-500 text-sm mt-1">お疲れ様でした</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 py-3 px-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/70 transition-colors group">
                {item.goalColor && (
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.goalColor }} />
                )}
                <button onClick={() => handleToggle(item)} className="shrink-0">
                  {item.done
                    ? <CheckCircle2 size={20} className="text-indigo-400" />
                    : <Circle size={20} className="text-gray-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${item.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                    {item.title}
                  </span>
                  {item.label && (
                    <span className="ml-2 text-xs text-gray-600 bg-gray-700 px-1.5 py-0.5 rounded">
                      {item.label}
                    </span>
                  )}
                </div>
                {item.goalEmoji && (
                  <span className="text-sm text-gray-500 flex items-center gap-1 shrink-0">
                    <span>{item.goalEmoji}</span>
                    <span className="text-xs hidden sm:inline">{item.goalName}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 全体進捗 */}
        <div className="mt-6 p-4 bg-gray-800/40 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">全目標の総合進捗</span>
            <span className="text-white font-medium">{overallPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%` }} />
          </div>
          {data.goals.length === 0 && (
            <p className="text-gray-600 text-xs mt-2 text-center">目標を追加すると進捗が表示されます</p>
          )}
        </div>

        {/* 目標・マイルストーン・タスクのツリー表示 */}
        {goalMilestones.length > 0 && (
          <div className="mt-4 space-y-3">
            {goalMilestones.map(({ goal, ms }) => {
              const badge = getMsBadge(ms.period);
              return (
                <div key={goal.id} className="rounded-xl overflow-hidden bg-gray-800/40">
                  {/* 目標ヘッダー */}
                  <button
                    onClick={() => onTabChange?.(goal.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 border-b border-gray-700 hover:bg-gray-800/60 transition-colors text-left">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                    <span className="text-white text-sm font-semibold">{goal.emoji} {goal.name}</span>
                  </button>

                  {/* マイルストーン */}
                  <div className="px-4 pt-2.5 pb-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-gray-500 text-xs">📍</span>
                      <span className="text-gray-300 text-xs font-medium">{ms.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                      <span className="text-gray-600 text-xs">{ms.period}</span>
                    </div>

                    {/* タスク一覧 */}
                    {ms.tasks.length === 0 ? (
                      <p className="text-gray-700 text-xs pl-4">タスクなし</p>
                    ) : (
                      <div className="space-y-1.5 pl-4">
                        {ms.tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2">
                            <span className="text-sm shrink-0" style={{ color: task.done ? goal.color : '#4b5563' }}>
                              {task.done ? '✔' : '○'}
                            </span>
                            <span className={`text-xs ${task.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
