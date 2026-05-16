'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, GripVertical, X, Clock } from 'lucide-react';
import { useApp } from '../context';
import { StandaloneTask } from '../types';
import { format, differenceInCalendarDays, parseISO, addDays } from 'date-fns';

function formatMinutes(min: number): string {
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

function DueBadge({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const diff = differenceInCalendarDays(parseISO(dueDate), parseISO(today));
  if (diff < 0) return <span className="text-xs text-red-400 shrink-0">{Math.abs(diff)}日超過</span>;
  if (diff === 0) return <span className="text-xs text-red-400 font-bold shrink-0">今日まで！</span>;
  if (diff <= 3) return <span className="text-xs text-orange-400 shrink-0">残 {diff}日</span>;
  return <span className="text-xs text-gray-500 shrink-0">残 {diff}日</span>;
}

interface TaskModalProps {
  task?: StandaloneTask;
  onClose: () => void;
}

function TaskModal({ task, onClose }: TaskModalProps) {
  const { addStandaloneTask, updateStandaloneTask } = useApp();
  const [title, setTitle] = useState(task?.title ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task?.estimatedMinutes != null ? String(task.estimatedMinutes) : ''
  );

  const handleSave = () => {
    if (!title.trim()) return;
    const mins = estimatedMinutes !== '' ? parseInt(estimatedMinutes, 10) : undefined;
    const payload = {
      title: title.trim(),
      dueDate: dueDate || undefined,
      estimatedMinutes: mins && mins > 0 ? mins : undefined,
    };
    if (task) {
      updateStandaloneTask(task.id, payload);
    } else {
      addStandaloneTask({ ...payload, done: false });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">{task ? 'タスクを編集' : 'タスクを追加'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">タスク名</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="タスク名を入力..."
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-400 text-xs mb-1 block">期限日（任意）</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-xs mb-1 block">所要時間（分）</label>
              <input
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="例: 30"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:text-white transition-colors">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={!title.trim()}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 transition-colors">
            {task ? '保存' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemoArea() {
  const { data, updateMemo } = useApp();
  const [value, setValue] = useState(data.memo);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setValue(data.memo); }, [data.memo]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  };

  useEffect(() => { autoResize(); }, [value]);

  return (
    <div className="mt-6">
      <h2 className="text-gray-400 text-sm font-medium mb-2">メモ</h2>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => { setValue(e.target.value); autoResize(); }}
        onBlur={() => updateMemo(value)}
        className="w-full bg-gray-800/40 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500 resize-none min-h-[100px] transition-colors"
        placeholder="メモを入力..."
      />
    </div>
  );
}

export default function Tasks() {
  const { data, deleteStandaloneTask, toggleStandaloneTask, reorderStandaloneTasks } = useApp();
  const [addModal, setAddModal] = useState(false);
  const [editTask, setEditTask] = useState<StandaloneTask | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const tasks = [...data.standaloneTasks].sort((a, b) => a.order - b.order);
  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  const weekStart = format(monday, 'yyyy-MM-dd');
  const weekEnd = format(addDays(monday, 6), 'yyyy-MM-dd');
  const thisWeekMinutes = pending
    .filter(t => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd)
    .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);

  const handleDrop = (toIdx: number) => {
    if (dragIdx !== null && dragIdx !== toIdx) {
      const fromTaskIdx = tasks.indexOf(pending[dragIdx]);
      const toTaskIdx = tasks.indexOf(pending[toIdx]);
      reorderStandaloneTasks(fromTaskIdx, toTaskIdx);
    }
    setDragIdx(null);
    setDropIdx(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h1 className="text-white text-xl font-bold">タスク</h1>
            </div>
            {thisWeekMinutes > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg">
                <Clock size={13} />
                今週 {formatMinutes(thisWeekMinutes)}
              </span>
            )}
          </div>
          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            <Plus size={14} /> 追加
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {pending.length === 0 ? (
          <p className="text-gray-700 text-sm text-center py-8">タスクがありません。追加してみましょう！</p>
        ) : (
          <div className="space-y-2">
            {pending.map((task, idx) => (
              <div key={task.id}
                draggable
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragIdx(idx); }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropIdx(idx); }}
                onDrop={e => { e.preventDefault(); handleDrop(idx); }}
                onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                className={`flex items-center gap-3 py-3 px-4 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 transition-colors group ${dropIdx === idx && dragIdx !== idx ? 'ring-2 ring-indigo-500/50' : ''} ${dragIdx === idx ? 'opacity-50' : ''}`}>
                <GripVertical size={14} className="text-gray-700 group-hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0" />
                <button onClick={() => toggleStandaloneTask(task.id)} className="shrink-0">
                  <Circle size={20} className="text-gray-600 hover:text-indigo-400 transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-200">{task.title}</span>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.dueDate && (
                      <span className="text-xs text-gray-600">{task.dueDate}</span>
                    )}
                    {task.estimatedMinutes != null && task.estimatedMinutes > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-0.5">
                        <Clock size={10} />{formatMinutes(task.estimatedMinutes)}
                      </span>
                    )}
                  </div>
                </div>
                <DueBadge dueDate={task.dueDate} />
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditTask(task)} className="text-gray-600 hover:text-gray-300 p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteStandaloneTask(task.id)} className="text-gray-600 hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div className="mt-6">
            <button onClick={() => setShowDone(v => !v)}
              className="text-gray-600 text-sm hover:text-gray-400 transition-colors mb-2">
              {showDone ? '▼' : '▶'} 完了済み ({done.length})
            </button>
            {showDone && (
              <div className="space-y-2">
                {done.map(task => (
                  <div key={task.id}
                    className="flex items-center gap-3 py-3 px-4 bg-gray-800/20 rounded-xl group">
                    <div className="w-3.5 shrink-0" />
                    <button onClick={() => toggleStandaloneTask(task.id)} className="shrink-0">
                      <CheckCircle2 size={20} className="text-indigo-400/60" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-600 line-through">{task.title}</span>
                      {task.estimatedMinutes != null && task.estimatedMinutes > 0 && (
                        <span className="ml-2 text-xs text-gray-700 flex items-center gap-0.5 inline-flex">
                          <Clock size={10} />{formatMinutes(task.estimatedMinutes)}
                        </span>
                      )}
                    </div>
                    <button onClick={() => deleteStandaloneTask(task.id)}
                      className="text-gray-700 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <MemoArea />
      </div>

      {addModal && <TaskModal onClose={() => setAddModal(false)} />}
      {editTask && <TaskModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}
