'use client';

import React, { useState, useRef } from 'react';
import { Plus, LayoutDashboard, Zap, Download, Upload, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../context';
import { AppData } from '../types';

type TabId = 'dashboard' | string | 'habits';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddGoal: () => void;
}

function ExportImportMenu({ onClose }: { onClose: () => void }) {
  const { data, importData } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dreamtracker_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as AppData;
        if (parsed.goals && parsed.habits && parsed.habitLogs) {
          if (confirm('現在のデータを上書きしてインポートしますか？')) {
            importData(parsed);
            onClose();
          }
        } else {
          alert('無効なDreamTrackerデータファイルです');
        }
      } catch {
        alert('JSONファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="absolute top-full right-0 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-52 overflow-hidden">
      <button onClick={handleExport}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-left">
        <Download size={15} /> データをエクスポート
      </button>
      <button onClick={() => fileRef.current?.click()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-t border-gray-800 text-left">
        <Upload size={15} /> データをインポート
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}

export default function Navigation({ activeTab, onTabChange, onAddGoal }: Props) {
  const { data, reorderGoals } = useApp();
  const [goalDrawer, setGoalDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragGoalIdx, setDragGoalIdx] = useState<number | null>(null);
  const [dropGoalIdx, setDropGoalIdx] = useState<number | null>(null);

  const isGoalActive = data.goals.some(g => g.id === activeTab);

  const tabCls = (active: boolean) =>
    `border-b-2 transition-colors ${active ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`;

  const openDrawer = () => { setGoalDrawer(v => !v); setMenuOpen(false); };
  const openMenu = () => { setMenuOpen(v => !v); setGoalDrawer(false); };

  const handleGoalDrop = (toIdx: number) => {
    if (dragGoalIdx !== null && dragGoalIdx !== toIdx) {
      reorderGoals(dragGoalIdx, toIdx);
    }
    setDragGoalIdx(null);
    setDropGoalIdx(null);
  };

  return (
    <div className="relative border-b border-gray-800 bg-gray-950 shrink-0">

      {/* ===== スマホナビ (md未満) ===== */}
      <div className="flex md:hidden h-11 items-stretch">
        <button
          onClick={() => { onTabChange('dashboard'); setGoalDrawer(false); }}
          className={`flex-1 text-xs font-medium ${tabCls(activeTab === 'dashboard')}`}>
          ダッシュボード
        </button>

        <div className="flex-1 relative">
          <button
            onClick={openDrawer}
            className={`w-full h-full text-xs font-medium ${tabCls(isGoalActive)}`}>
            🎯 目標 {goalDrawer ? '▲' : '▼'}
          </button>
          {goalDrawer && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setGoalDrawer(false)} />
              <div className="absolute top-full left-0 z-50 shadow-2xl border border-gray-700 rounded-b-xl overflow-hidden"
                style={{ background: '#111827', minWidth: 200 }}>
                {data.goals.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-500 text-center">目標がありません</p>
                )}
                {data.goals.map((g, idx) => (
                  <div key={g.id} className="flex items-center border-b border-gray-800 last:border-0">
                    <button
                      onClick={() => { onTabChange(g.id); setGoalDrawer(false); }}
                      className="flex-1 flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors"
                      style={{
                        color: activeTab === g.id ? 'white' : '#9ca3af',
                        background: activeTab === g.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                      }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="truncate">{g.emoji} {g.name}</span>
                    </button>
                    {/* 並び替えボタン */}
                    <div className="flex flex-col pr-2 shrink-0">
                      <button
                        onClick={() => idx > 0 && reorderGoals(idx, idx - 1)}
                        disabled={idx === 0}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-20 p-0.5 transition-colors">
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => idx < data.goals.length - 1 && reorderGoals(idx, idx + 1)}
                        disabled={idx === data.goals.length - 1}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-20 p-0.5 transition-colors">
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => { onAddGoal(); setGoalDrawer(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm border-t border-gray-700 text-gray-500 hover:text-indigo-400 transition-colors">
                  <Plus size={14} /> 目標を追加
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => { onTabChange('habits'); setGoalDrawer(false); }}
          className={`flex-1 text-xs font-medium ${tabCls(activeTab === 'habits')}`}>
          ⚡ 習慣
        </button>

        <button
          onClick={() => { onTabChange('tasks'); setGoalDrawer(false); }}
          className={`flex-1 text-xs font-medium ${tabCls(activeTab === 'tasks')}`}>
          📋 タスク
        </button>

        <div className="relative shrink-0 flex items-center pr-1">
          <button onClick={openMenu}
            className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          {menuOpen && <ExportImportMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* ===== PCナビ (md以上) ===== */}
      <nav className="hidden md:flex items-center overflow-hidden">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium shrink-0 ${tabCls(activeTab === 'dashboard')}`}>
          <LayoutDashboard size={15} />
          <span>ダッシュボード</span>
        </button>

        {/* 目標タブ（PC: ドラッグ&ドロップで並び替え） */}
        <div className="flex items-center overflow-x-auto flex-1">
          {data.goals.map((goal, idx) => (
            <button
              key={goal.id}
              draggable
              onDragStart={() => setDragGoalIdx(idx)}
              onDragOver={e => { e.preventDefault(); setDropGoalIdx(idx); }}
              onDrop={() => handleGoalDrop(idx)}
              onDragEnd={() => { setDragGoalIdx(null); setDropGoalIdx(null); }}
              onClick={() => onTabChange(goal.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium shrink-0 transition-all cursor-grab active:cursor-grabbing ${tabCls(activeTab === goal.id)} ${dropGoalIdx === idx ? 'bg-indigo-500/10' : ''}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
              <span className="max-w-[120px] truncate">{goal.emoji} {goal.name}</span>
            </button>
          ))}
          <button onClick={onAddGoal}
            className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-indigo-400 shrink-0 transition-colors">
            <Plus size={15} />
            <span>目標追加</span>
          </button>
        </div>

        <button
          onClick={() => onTabChange('habits')}
          className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium shrink-0 ${tabCls(activeTab === 'habits')}`}>
          <Zap size={15} />
          <span>習慣</span>
        </button>

        <button
          onClick={() => onTabChange('tasks')}
          className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium shrink-0 ${tabCls(activeTab === 'tasks')}`}>
          <span>📋</span>
          <span>タスク</span>
        </button>

        <div className="relative shrink-0 pr-2">
          <button onClick={openMenu}
            className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {menuOpen && <ExportImportMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </nav>

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
