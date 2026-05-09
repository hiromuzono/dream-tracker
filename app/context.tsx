'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppData, Goal, Milestone, Task, Habit } from './types';

const STORAGE_KEY = 'dreamtracker_data';

const defaultData: AppData = {
  goals: [],
  habits: [],
  habitLogs: {},
};

interface AppContextType {
  data: AppData;
  addGoal: (goal: Omit<Goal, 'id' | 'order' | 'milestones' | 'status'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  reorderGoals: (from: number, to: number) => void;
  addMilestone: (goalId: string, ms: Omit<Milestone, 'id' | 'order' | 'tasks'>) => void;
  updateMilestone: (goalId: string, msId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (goalId: string, msId: string) => void;
  reorderMilestones: (goalId: string, from: number, to: number) => void;
  addTask: (goalId: string, msId: string, task: Omit<Task, 'id' | 'order'>) => void;
  updateTask: (goalId: string, msId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (goalId: string, msId: string, taskId: string) => void;
  toggleTask: (goalId: string, msId: string, taskId: string) => void;
  reorderTasks: (goalId: string, msId: string, from: number, to: number) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'order'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: string) => void;
  importData: (data: AppData) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const genId = () => Math.random().toString(36).slice(2, 9);

function persist(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
    setLoaded(true);
  }, []);

  const mutate = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'order' | 'milestones' | 'status'>) => {
    mutate(prev => ({
      ...prev,
      goals: [...prev.goals, { ...goalData, id: `g_${genId()}`, order: prev.goals.length, milestones: [], status: 'active' }],
    }));
  }, [mutate]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    mutate(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
  }, [mutate]);

  const deleteGoal = useCallback((id: string) => {
    mutate(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }, [mutate]);

  const reorderGoals = useCallback((from: number, to: number) => {
    mutate(prev => {
      const goals = [...prev.goals];
      const [item] = goals.splice(from, 1);
      goals.splice(to, 0, item);
      return { ...prev, goals };
    });
  }, [mutate]);

  const addMilestone = useCallback((goalId: string, msData: Omit<Milestone, 'id' | 'order' | 'tasks'>) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: [...g.milestones, { ...msData, id: `ms_${genId()}`, order: g.milestones.length, tasks: [] }],
      }),
    }));
  }, [mutate]);

  const updateMilestone = useCallback((goalId: string, msId: string, updates: Partial<Milestone>) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: g.milestones.map(m => m.id === msId ? { ...m, ...updates } : m),
      }),
    }));
  }, [mutate]);

  const deleteMilestone = useCallback((goalId: string, msId: string) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: g.milestones.filter(m => m.id !== msId),
      }),
    }));
  }, [mutate]);

  const reorderMilestones = useCallback((goalId: string, from: number, to: number) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const mss = [...g.milestones];
        const [item] = mss.splice(from, 1);
        mss.splice(to, 0, item);
        return { ...g, milestones: mss };
      }),
    }));
  }, [mutate]);

  const addTask = useCallback((goalId: string, msId: string, taskData: Omit<Task, 'id' | 'order'>) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: g.milestones.map(m => m.id !== msId ? m : {
          ...m,
          tasks: [...m.tasks, { ...taskData, id: `t_${genId()}`, order: m.tasks.length }],
        }),
      }),
    }));
  }, [mutate]);

  const updateTask = useCallback((goalId: string, msId: string, taskId: string, updates: Partial<Task>) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: g.milestones.map(m => m.id !== msId ? m : {
          ...m,
          tasks: m.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
        }),
      }),
    }));
  }, [mutate]);

  const deleteTask = useCallback((goalId: string, msId: string, taskId: string) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: g.milestones.map(m => m.id !== msId ? m : {
          ...m,
          tasks: m.tasks.filter(t => t.id !== taskId),
        }),
      }),
    }));
  }, [mutate]);

  const reorderTasks = useCallback((goalId: string, msId: string, from: number, to: number) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          milestones: g.milestones.map(m => {
            if (m.id !== msId) return m;
            const tasks = [...m.tasks];
            const [item] = tasks.splice(from, 1);
            tasks.splice(to, 0, item);
            return { ...m, tasks };
          }),
        };
      }),
    }));
  }, [mutate]);

  const toggleTask = useCallback((goalId: string, msId: string, taskId: string) => {
    mutate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id !== goalId ? g : {
        ...g,
        milestones: g.milestones.map(m => m.id !== msId ? m : {
          ...m,
          tasks: m.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
        }),
      }),
    }));
  }, [mutate]);

  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'order'>) => {
    mutate(prev => ({
      ...prev,
      habits: [...prev.habits, { ...habitData, id: `h_${genId()}`, order: prev.habits.length }],
    }));
  }, [mutate]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    mutate(prev => ({ ...prev, habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h) }));
  }, [mutate]);

  const deleteHabit = useCallback((id: string) => {
    mutate(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  }, [mutate]);

  const importData = useCallback((newData: AppData) => {
    mutate(() => newData);
  }, [mutate]);

  const toggleHabitLog = useCallback((habitId: string, date: string) => {
    mutate(prev => {
      const logs = prev.habitLogs[habitId] || [];
      const newLogs = logs.includes(date) ? logs.filter(d => d !== date) : [...logs, date];
      return { ...prev, habitLogs: { ...prev.habitLogs, [habitId]: newLogs } };
    });
  }, [mutate]);

  if (!loaded) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <AppContext.Provider value={{
      data,
      addGoal, updateGoal, deleteGoal, reorderGoals,
      addMilestone, updateMilestone, deleteMilestone, reorderMilestones,
      addTask, updateTask, deleteTask, toggleTask, reorderTasks,
      addHabit, updateHabit, deleteHabit,
      toggleHabitLog,
      importData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
