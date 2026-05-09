'use client';

import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Clock, CheckCircle2, Circle, GripVertical } from 'lucide-react';
import { Goal, Milestone, Task } from '../types';
import { useApp } from '../context';
import MilestoneModal from './MilestoneModal';
import TaskModal from './TaskModal';
import GoalModal from './GoalModal';
import { format, parseISO, differenceInCalendarMonths } from 'date-fns';

function getMilestoneBadge(period: string): { label: string; color: string } {
  const now = format(new Date(), 'yyyy-MM');
  const next1 = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'yyyy-MM');
  const next2 = format(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1), 'yyyy-MM');
  if (period < now) return { label: '期限切れ', color: 'bg-red-500/20 text-red-400' };
  if (period === now) return { label: '今月', color: 'bg-blue-500/20 text-blue-400' };
  if (period === next1 || period === next2) return { label: '近日', color: 'bg-green-500/20 text-green-400' };
  return { label: '予定', color: 'bg-gray-700 text-gray-400' };
}

function calcTaskProgress(tasks: Task[]) {
  if (tasks.length === 0) return { taskPct: 0, timePct: 0 };
  const done = tasks.filter(t => t.done).length;
  const taskPct = Math.round((done / tasks.length) * 100);
  const totalTime = tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 1), 0);
  const doneTime = tasks.filter(t => t.done).reduce((s, t) => s + (t.estimatedMinutes ?? 1), 0);
  const timePct = totalTime === 0 ? 0 : Math.round((doneTime / totalTime) * 100);
  return { taskPct, timePct };
}

function calcGoalProgress(goal: Goal) {
  const allTasks = goal.milestones.flatMap(m => m.tasks);
  return calcTaskProgress(allTasks);
}

function calcElapsedPace(goal: Goal): number {
  const now = new Date();
  const start = parseISO(`${goal.startDate}-01`);
  const end = parseISO(`${goal.deadline}-01`);
  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return 100;
  const elapsedMs = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
}

interface MilestoneRowProps {
  goal: Goal;
  milestone: Milestone;
  index: number;
  showCompleted: boolean;
  dragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function MilestoneRow({ goal, milestone, index, showCompleted, dragOver, onDragStart, onDragOver, onDrop, onDragEnd }: MilestoneRowProps) {
  const { deleteTask, toggleTask, deleteMilestone, reorderTasks } = useApp();
  const [open, setOpen] = useState(true);
  const [taskModal, setTaskModal] = useState<{ mode: 'add' | 'edit'; task?: Task } | null>(null);
  const [msModal, setMsModal] = useState(false);
  const [dragTaskIdx, setDragTaskIdx] = useState<number | null>(null);
  const [dropTaskIdx, setDropTaskIdx] = useState<number | null>(null);

  const badge = getMilestoneBadge(milestone.period);
  const tasks = showCompleted ? milestone.tasks : milestone.tasks.filter(t => !t.done);
  const { taskPct } = calcTaskProgress(milestone.tasks);
  const doneCount = milestone.tasks.filter(t => t.done).length;

  const handleTaskDrop = (toIdx: number) => {
    if (dragTaskIdx !== null && dragTaskIdx !== toIdx) {
      reorderTasks(goal.id, milestone.id, dragTaskIdx, toIdx);
    }
    setDragTaskIdx(null);
    setDropTaskIdx(null);
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${dragOver ? 'border-indigo-500 opacity-70' : 'border-gray-700'}`}
      onDragOver={onDragOver}
      onDrop={e => { e.preventDefault(); onDrop(); }}
    >
      <div className="flex items-center gap-2 px-3 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors">
        {/* Drag handle for milestone */}
        <div
          draggable
          onDragStart={e => { e.stopPropagation(); onDragStart(); }}
          onDragEnd={onDragEnd}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        >
          <GripVertical size={15} />
        </div>

        <div className="cursor-pointer flex-1 min-w-0 flex items-center gap-2 flex-wrap" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
          <span className="text-white font-medium truncate">{milestone.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
          <span className="text-gray-500 text-xs">{milestone.period}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-400 text-xs hidden sm:inline">{doneCount}/{milestone.tasks.length}</span>
          <span className="text-gray-300 text-sm font-medium">{taskPct}%</span>
          <button onClick={e => { e.stopPropagation(); setMsModal(true); }} className="text-gray-500 hover:text-gray-300 p-1"><Pencil size={13} /></button>
          <button onClick={e => { e.stopPropagation(); deleteMilestone(goal.id, milestone.id); }} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={13} /></button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1">
          {tasks.map((task, ti) => {
            const realIdx = milestone.tasks.findIndex(t => t.id === task.id);
            return (
              <div
                key={task.id}
                className={`flex items-center gap-2 py-1.5 group rounded-lg px-1 transition-all ${dropTaskIdx === realIdx ? 'border-t-2 border-indigo-400' : ''}`}
                draggable
                onDragStart={() => setDragTaskIdx(realIdx)}
                onDragOver={e => { e.preventDefault(); setDropTaskIdx(realIdx); }}
                onDrop={() => handleTaskDrop(realIdx)}
                onDragEnd={() => { setDragTaskIdx(null); setDropTaskIdx(null); }}
              >
                <GripVertical size={13} className="text-gray-700 hover:text-gray-500 cursor-grab shrink-0" />
                <button onClick={() => toggleTask(goal.id, milestone.id, task.id)} className="shrink-0">
                  {task.done
                    ? <CheckCircle2 size={16} style={{ color: goal.color }} />
                    : <Circle size={16} className="text-gray-600" />}
                </button>
                <span className={`flex-1 text-sm min-w-0 ${task.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                  {task.title}
                  {task.note && <span className="text-gray-500 ml-2 text-xs">{task.note}</span>}
                </span>
                {task.estimatedMinutes != null && (
                  <span className="text-gray-600 text-xs flex items-center gap-1 shrink-0">
                    <Clock size={11} />{task.estimatedMinutes}分
                  </span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setTaskModal({ mode: 'edit', task })} className="text-gray-500 hover:text-gray-300 p-1"><Pencil size={11} /></button>
                  <button onClick={() => deleteTask(goal.id, milestone.id, task.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={11} /></button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setTaskModal({ mode: 'add' })}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-400 text-sm py-1 px-1 transition-colors">
            <Plus size={13} /> タスクを追加
          </button>
        </div>
      )}

      {taskModal && (
        <TaskModal goalId={goal.id} milestoneId={milestone.id} task={taskModal.task} onClose={() => setTaskModal(null)} />
      )}
      {msModal && (
        <MilestoneModal goalId={goal.id} milestone={milestone} onClose={() => setMsModal(false)} />
      )}
    </div>
  );
}

interface Props {
  goal: Goal;
}

export default function GoalDetail({ goal }: Props) {
  const { deleteGoal, reorderMilestones } = useApp();
  const [showCompleted, setShowCompleted] = useState(true);
  const [msModal, setMsModal] = useState(false);
  const [editGoalModal, setEditGoalModal] = useState(false);
  const [dragMsIdx, setDragMsIdx] = useState<number | null>(null);
  const [dropMsIdx, setDropMsIdx] = useState<number | null>(null);

  const { taskPct, timePct } = calcGoalProgress(goal);
  const elapsedPace = calcElapsedPace(goal);
  const diff = taskPct - elapsedPace;
  const remaining = differenceInCalendarMonths(parseISO(`${goal.deadline}-01`), new Date());

  const handleMsDrop = (toIdx: number) => {
    if (dragMsIdx !== null && dragMsIdx !== toIdx) {
      reorderMilestones(goal.id, dragMsIdx, toIdx);
    }
    setDragMsIdx(null);
    setDropMsIdx(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Goal Header */}
      <div className="p-4 sm:p-6 border-b border-gray-800 bg-gray-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-2xl sm:text-3xl">{goal.emoji}</span>
              <h1 className="text-white text-lg sm:text-xl font-bold">{goal.name}</h1>
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              開始: {goal.startDate} | 期限: {goal.deadline} | 残り: {remaining > 0 ? `${remaining}ヶ月` : '期限切れ'}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <button onClick={() => setEditGoalModal(true)} className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <Pencil size={15} />
            </button>
            <button
              onClick={() => { if (confirm('この目標を削除しますか？')) deleteGoal(goal.id); }}
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-16 sm:w-20 shrink-0">タスク進捗</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${taskPct}%`, backgroundColor: goal.color }} />
            </div>
            <span className="text-gray-300 text-sm font-medium w-10 text-right">{taskPct}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-16 sm:w-20 shrink-0">時間進捗</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 opacity-70" style={{ width: `${timePct}%`, backgroundColor: goal.color }} />
            </div>
            <span className="text-gray-300 text-sm font-medium w-10 text-right">{timePct}%</span>
          </div>
        </div>

        {/* Pace comparison */}
        <div className="bg-gray-800/60 rounded-xl p-3 text-xs sm:text-sm space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            <span>📅</span>
            <span>経過時間ペース: <span className="text-white font-medium">{elapsedPace}%</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>✅</span>
            <span>実績達成率: <span className="text-white font-medium">{taskPct}%</span></span>
          </div>
          <div className={`flex items-center gap-2 font-medium ${diff >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
            <span>{diff >= 0 ? '✅' : '⚠️'}</span>
            <span>{diff >= 0 ? `+${diff}% ペース通りです` : `${diff}% ペースより遅れています`}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center px-4 sm:px-6 py-3 gap-2 border-b border-gray-800">
        <button
          onClick={() => setShowCompleted(false)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showCompleted ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          未完了のみ
        </button>
        <button
          onClick={() => setShowCompleted(true)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showCompleted ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          すべて表示
        </button>
      </div>

      {/* Milestones */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {goal.milestones.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <p className="text-4xl mb-3">🏁</p>
            <p>マイルストーンがありません</p>
            <p className="text-sm mt-1">最初のマイルストーンを追加しましょう</p>
          </div>
        )}
        {goal.milestones.map((ms, idx) => (
          <MilestoneRow
            key={ms.id}
            goal={goal}
            milestone={ms}
            index={idx}
            showCompleted={showCompleted}
            dragOver={dropMsIdx === idx}
            onDragStart={() => setDragMsIdx(idx)}
            onDragOver={e => { e.preventDefault(); setDropMsIdx(idx); }}
            onDrop={() => handleMsDrop(idx)}
            onDragEnd={() => { setDragMsIdx(null); setDropMsIdx(null); }}
          />
        ))}
        <button
          onClick={() => setMsModal(true)}
          className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-indigo-400 hover:border-indigo-500 text-sm flex items-center justify-center gap-2 transition-colors">
          <Plus size={15} /> マイルストーンを追加
        </button>
      </div>

      {msModal && <MilestoneModal goalId={goal.id} onClose={() => setMsModal(false)} />}
      {editGoalModal && <GoalModal goal={goal} onClose={() => setEditGoalModal(false)} />}
    </div>
  );
}
