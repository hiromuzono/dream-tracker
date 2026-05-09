'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from './context';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import GoalDetail from './components/GoalDetail';
import Habits from './components/Habits';
import GoalModal from './components/GoalModal';
import { Goal } from './types';

function AppContent() {
  const { data } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: Goal }>({ open: false });

  const activeGoal = data.goals.find(g => g.id === activeTab) ?? null;

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      <Navigation
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        onAddGoal={() => setGoalModal({ open: true })}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && <Dashboard onTabChange={tab => setActiveTab(tab)} />}
        {activeTab === 'habits' && <Habits />}
        {activeGoal && <GoalDetail key={activeGoal.id} goal={activeGoal} />}
      </main>

      {goalModal.open && (
        <GoalModal goal={goalModal.goal} onClose={() => setGoalModal({ open: false })} />
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
