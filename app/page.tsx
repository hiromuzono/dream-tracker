'use client';

import React, { useState, useRef } from 'react';
import { AppProvider, useApp } from './context';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import GoalDetail from './components/GoalDetail';
import Habits from './components/Habits';
import GoalModal from './components/GoalModal';
import { Goal, AppData } from './types';
import { Download, Upload, Menu, X } from 'lucide-react';

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
    <div className="absolute top-12 right-2 z-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-52 overflow-hidden">
      <button
        onClick={handleExport}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
        <Download size={15} />
        データをエクスポート
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-t border-gray-800">
        <Upload size={15} />
        データをインポート
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}

function AppContent() {
  const { data } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: Goal }>({ open: false });
  const [menuOpen, setMenuOpen] = useState(false);

  const activeGoal = data.goals.find(g => g.id === activeTab) ?? null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="relative flex items-center border-b border-gray-800 bg-gray-950 shrink-0">
        <div className="flex-1 overflow-hidden">
          <Navigation
            activeTab={activeTab}
            onTabChange={tab => { setActiveTab(tab); setMenuOpen(false); }}
            onAddGoal={() => setGoalModal({ open: true })}
          />
        </div>
        {/* Settings button */}
        <div className="relative shrink-0 pr-2">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {menuOpen && <ExportImportMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 49px)' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'habits' && <Habits />}
        {activeGoal && <GoalDetail key={activeGoal.id} goal={activeGoal} />}
        {!activeGoal && activeTab !== 'dashboard' && activeTab !== 'habits' && (
          <div className="flex items-center justify-center h-full text-gray-600">
            目標が見つかりません
          </div>
        )}
      </main>

      {goalModal.open && (
        <GoalModal
          goal={goalModal.goal}
          onClose={() => setGoalModal({ open: false })}
        />
      )}

      {/* Backdrop for menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

export default function DreamTrackerPage() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
