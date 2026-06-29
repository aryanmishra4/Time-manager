export interface SubTask {
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  tags: string[];
  completed: boolean;
  category: "Study" | "Revision" | "Exercise" | "Research" | "Other";
  subtasks: SubTask[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  category: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  confidence?: "needs-practice" | "getting-there" | "mastered";
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
}

export interface PomodoroSettings {
  workTime: number; // in minutes
  shortBreakTime: number; // in minutes
  longBreakTime: number; // in minutes
  longBreakInterval: number; // number of work sessions before a long break
}

export interface PomodoroLog {
  id: string;
  timestamp: string;
  duration: number; // in seconds
  type: "work" | "shortBreak" | "longBreak";
  completed: boolean;
}

export interface AIRecommendation {
  title: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  estimatedMinutes: number;
  category: "Study" | "Revision" | "Exercise" | "Research";
}

export interface FocusInsight {
  recommendations: AIRecommendation[];
  focusPlan: string;
  motivation: string;
}
