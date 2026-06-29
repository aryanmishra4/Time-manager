import { useState, useEffect } from "react";
import TaskPlanner from "./components/TaskPlanner";
import PomodoroTimer from "./components/PomodoroTimer";
import FlashcardTool from "./components/FlashcardTool";
import Notepad from "./components/Notepad";
import AuraCompanion from "./components/AuraCompanion";
import { Task, Note, FlashcardDeck } from "./types";
import { 
  Sparkles, 
  Brain, 
  Clock, 
  Layers, 
  Calendar, 
  BookOpen,
  Zap,
  AlertCircle
} from "lucide-react";

// Pre-populate with high quality mock study data to make the Immersive UI spectacular on load
const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Advanced Neurobiology Thesis Structure",
    description: "Formulate the thesis structure on synaptic plasticity and master LTP mechanism details.",
    priority: "High",
    category: "Study",
    dueDate: new Date().toISOString().split("T")[0],
    tags: ["neuro", "thesis"],
    completed: false,
    subtasks: [
      { title: "Review 'Synaptic Plasticity' flashcards", completed: true },
      { title: "Outline intro & structural framework", completed: false },
      { title: "Summarize Heuristic Analysis steps", completed: false }
    ]
  },
  {
    id: "task-2",
    title: "Prepare Chemistry midterm practice quiz",
    description: "Solve 5 organic chemistry problems on resonance structures.",
    priority: "Medium",
    category: "Exercise",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    tags: ["chemistry", "midterm"],
    completed: false,
    subtasks: []
  }
];

const INITIAL_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Heuristic Analysis Steps",
    content: "Heuristic evaluation involves testing against established usability standards.\nKey study items:\n1. Visibility of system status\n2. Match between system and the real world\n3. User control and freedom\n4. Consistency and standards\n5. Error prevention\n6. Recognition rather than recall",
    category: "Neurobiology",
    lastUpdated: "12:15 PM"
  },
  {
    id: "note-2",
    title: "Key References for Intro",
    content: "1. Bliss & Lomo (1973) - Discovery of Long-term Potentiation.\n2. Malenka & Nicoll (1999) - Postsynaptic mechanisms of LTP expression.\n3. Hebb (1949) - Synaptic organization theories.",
    category: "Research",
    lastUpdated: "02:30 PM"
  }
];

const INITIAL_DECKS: FlashcardDeck[] = [
  {
    id: "deck-1",
    title: "Synaptic Plasticity & LTP",
    description: "Key concepts on Long-term Potentiation and active recall pathways.",
    cards: [
      {
        id: "card-1",
        front: "Define the Long-term Potentiation (LTP) process",
        back: "A persistent strengthening of synapses based on recent patterns of activity, forming the neural basis for learning and memory.",
        confidence: "needs-practice"
      },
      {
        id: "card-2",
        front: "What neurotransmitter is critical for LTP induction?",
        back: "Glutamate, which acts on both AMPA and NMDA receptors to depolarize the postsynaptic membrane.",
        confidence: "getting-there"
      },
      {
        id: "card-3",
        front: "What is the rule of Hebbian Learning?",
        back: "'Cells that fire together, wire together.' Synapses strengthen when presynaptic activity correlates with postsynaptic firing.",
        confidence: "mastered"
      }
    ]
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [decks, setDecks] = useState<FlashcardDeck[]>(INITIAL_DECKS);
  
  // Immersive UI Active tab
  const [activeTab, setActiveTab] = useState<"focus" | "planning" | "insights">("focus");

  // Focus clock ticking counter to look alive in the header
  const [sessionFocusTime, setSessionFocusTime] = useState(15165); // starts at 04:12:45 for aesthetic mockup accuracy

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionFocusTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format focus clock seconds into HH:MM:SS
  const formatFocusClock = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Callback to handle accepting recommended tasks from Aura Companion
  const handleAddRecommendedTask = (
    title: string, 
    estimatedMinutes: number, 
    category: string, 
    priority: "High" | "Medium" | "Low"
  ) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description: `Recommended by Aura Coach. Recommended session length: ${estimatedMinutes} mins.`,
      priority,
      category: category as any,
      dueDate: new Date().toISOString().split("T")[0],
      tags: ["ai-suggested"],
      completed: false,
      subtasks: []
    };

    setTasks((prev) => [newTask, ...prev]);
    // Optionally flip to planning tab so user sees it added
    setActiveTab("planning");
  };

  // Accumulate pomodoro sessions
  const handleLogCompletedSession = (durationMinutes: number, type: "work" | "shortBreak" | "longBreak") => {
    // Add custom notification or update stats
    console.log(`Session logged: ${durationMinutes} mins - type: ${type}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0B0E] text-slate-200 flex flex-col justify-between overflow-x-hidden font-sans select-none pb-12">
      
      {/* Top Navigation Bar */}
      <nav className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-white/5 bg-[#07080A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full ai-gradient flex items-center justify-center shadow-lg shadow-orange-500/15">
            <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.1em] text-white flex items-center gap-1">
              AURA <span className="text-orange-500">AI</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.25em] text-orange-500 font-extrabold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Companion Active
            </p>
          </div>
        </div>
        
        {/* Real-time Focus session analytics clock */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Session Focus</span>
            <span className="text-lg font-mono text-white tracking-wide font-medium">
              {formatFocusClock(sessionFocusTime)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></div>
          </div>
        </div>
      </nav>

      {/* Main Responsive Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Dynamic Section rendering based on active footer tab */}
        {activeTab === "focus" && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Row: Pomodoro Focus clock */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500 animate-spin" style={{ animationDuration: "12s" }} />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Focus Arena</h2>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active workspace state</span>
              </div>
              <PomodoroTimer tasks={tasks} onLogCompletedSession={handleLogCompletedSession} />
            </div>

            {/* Split Row: Notepad & Flashcards previews side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Study Notepad section */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <Notepad notes={notes} onUpdateNotes={setNotes} />
              </div>

              {/* Study Decks/Flashcards preview section */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <FlashcardTool decks={decks} onUpdateDecks={setDecks} />
              </div>

            </div>
          </div>
        )}

        {activeTab === "planning" && (
          <div className="animate-fade-in">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Planning Workspace</h2>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Beat procrastination & deadlines</span>
              </div>
              <TaskPlanner tasks={tasks} onUpdateTasks={setTasks} />
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="animate-fade-in">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-orange-500 animate-pulse" />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Companion Coaching Insights</h2>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Smart recommendation engine</span>
              </div>
              <AuraCompanion 
                tasks={tasks} 
                notes={notes} 
                onAddRecommendedTask={handleAddRecommendedTask} 
              />
            </div>
          </div>
        )}

      </main>

      {/* Bottom Control / Tab Bar Footer */}
      <footer className="h-20 px-4 sm:px-8 flex items-center justify-between border-t border-white/5 bg-[#07080A]/90 backdrop-blur-md fixed bottom-0 left-0 right-0 z-50">
        <div className="flex gap-4 sm:gap-8">
          <button 
            id="tab-focus-mode"
            onClick={() => setActiveTab("focus")}
            className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all ${
              activeTab === "focus" 
                ? "text-orange-500" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === "focus" ? "bg-orange-500" : "bg-white/10"}`}></span> 
            Focus Mode
          </button>
          
          <button 
            id="tab-planning"
            onClick={() => setActiveTab("planning")}
            className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all ${
              activeTab === "planning" 
                ? "text-orange-500" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === "planning" ? "bg-orange-500" : "bg-white/10"}`}></span> 
            Planning
          </button>
          
          <button 
            id="tab-insights"
            onClick={() => setActiveTab("insights")}
            className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all ${
              activeTab === "insights" 
                ? "text-orange-500" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === "insights" ? "bg-orange-500" : "bg-white/10"}`}></span> 
            Insights
          </button>
        </div>
        
        {/* AI status indicator animations */}
        <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Aura status</span>
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-1 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
