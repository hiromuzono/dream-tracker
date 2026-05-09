export const GOAL_COLORS = [
  '#7F77DD',
  '#4CAF50',
  '#FF9800',
  '#E91E63',
  '#2196F3',
  '#FF5722',
] as const;

export interface Task {
  id: string;
  title: string;
  note: string;
  estimatedMinutes: number | null;
  done: boolean;
  order: number;
}

export interface Milestone {
  id: string;
  title: string;
  period: string;
  description: string;
  order: number;
  tasks: Task[];
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  startDate: string;
  deadline: string;
  status: 'active' | 'completed';
  order: number;
  milestones: Milestone[];
}

export type HabitType = 'daily' | 'weekly' | 'monthly';

export const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const;

export interface Habit {
  id: string;
  title: string;
  note: string;
  type: HabitType;
  days: string[];
  goalId: string;
  order: number;
}

export interface AppData {
  goals: Goal[];
  habits: Habit[];
  habitLogs: Record<string, string[]>;
}
