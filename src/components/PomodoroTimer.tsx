import { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX, 
  Zap, 
  BookOpen, 
  Sparkles
} from "lucide-react";

interface PomodoroTimerProps {
  tasks: Task[];
  onLogCompletedSession?: (durationMinutes: number, type: "work" | "shortBreak" | "longBreak") => void;
}

export default function PomodoroTimer({ tasks, onLogCompletedSession }: PomodoroTimerProps) {
  // Timer configurations (in minutes)
  const [workTime, setWorkTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  
  // Timer State
  const [mode, setMode] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // Trackers
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mode duration updates
  useEffect(() => {
    if (!isActive) {
      if (mode === "work") setTimeLeft(workTime * 60);
      else if (mode === "shortBreak") setTimeLeft(shortBreak * 60);
      else if (mode === "longBreak") setTimeLeft(longBreak * 60);
    }
  }, [workTime, shortBreak, longBreak, mode, isActive]);

  // Audio synthesize utility (using Web Audio API to play alert)
  const playAlertSound = (type: "bell" | "click") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === "bell") {
        // Play a beautiful, gentle study bell (chime)
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(659.25, now); // E5

        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } else {
        // Quick gentle tick/click
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn("Web Audio API not supported or user interaction required:", e);
    }
  };

  // Timer loop
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            clearInterval(intervalRef.current!);
            setIsActive(false);
            playAlertSound("bell");
            
            // Log completed session
            const currentMode = mode;
            const durationInMinutes = currentMode === "work" ? workTime : currentMode === "shortBreak" ? shortBreak : longBreak;
            
            if (onLogCompletedSession) {
              onLogCompletedSession(durationInMinutes, currentMode);
            }

            if (currentMode === "work") {
              setSessionsCompleted((prevCount) => {
                const nextCount = prevCount + 1;
                // Transition rules
                if (nextCount % 4 === 0) {
                  setMode("longBreak");
                  setTimeLeft(longBreak * 60);
                } else {
                  setMode("shortBreak");
                  setTimeLeft(shortBreak * 60);
                }
                return nextCount;
              });
            } else {
              setMode("work");
              setTimeLeft(workTime * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, mode, workTime, shortBreak, longBreak]);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTogglePlay = () => {
    playAlertSound("click");
    setIsActive(!isActive);
  };

  const handleReset = () => {
    playAlertSound("click");
    setIsActive(false);
    if (mode === "work") setTimeLeft(workTime * 60);
    else if (mode === "shortBreak") setTimeLeft(shortBreak * 60);
    else if (mode === "longBreak") setTimeLeft(longBreak * 60);
  };

  const handleSwitchMode = (newMode: "work" | "shortBreak" | "longBreak") => {
    playAlertSound("click");
    setIsActive(false);
    setMode(newMode);
    if (newMode === "work") setTimeLeft(workTime * 60);
    else if (newMode === "shortBreak") setTimeLeft(shortBreak * 60);
    else if (newMode === "longBreak") setTimeLeft(longBreak * 60);
  };

  // Progress circle math
  const totalSeconds = mode === "work" ? workTime * 60 : mode === "shortBreak" ? shortBreak * 60 : longBreak * 60;
  const progressRatio = timeLeft / totalSeconds;
  const strokeDashoffset = 283 - (283 * progressRatio);

  // Selected task detail
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left side: The Timer Display in Immersive Style */}
      <div id="pomodoro-timer-card" className="lg:col-span-7 glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
        
        {/* Decorative ambient ring glow matching the mockup */}
        <div className="absolute w-[360px] h-[360px] border border-orange-500/5 rounded-full pointer-events-none" />
        <div className="absolute w-[440px] h-[440px] border border-white/5 rounded-full pointer-events-none" />
        
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full filter blur-3xl opacity-[0.06] transition-all duration-700 pointer-events-none ${
          mode === "work" ? "bg-orange-500" : "bg-emerald-500"
        }`} />

        {/* Mode Selector Tab Bar */}
        <div className="flex gap-1 bg-[#0A0B0E]/80 border border-white/5 p-1 rounded-xl z-10 mb-8">
          <button
            id="pomo-mode-work"
            onClick={() => handleSwitchMode("work")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              mode === "work"
                ? "bg-orange-500 text-black shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Deep Work
          </button>
          <button
            id="pomo-mode-short"
            onClick={() => handleSwitchMode("shortBreak")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              mode === "shortBreak"
                ? "bg-white/10 text-white shadow-lg border border-white/5"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Short Break
          </button>
          <button
            id="pomo-mode-long"
            onClick={() => handleSwitchMode("longBreak")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              mode === "longBreak"
                ? "bg-white/10 text-white shadow-lg border border-white/5"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Outer Circular Progress Visual - Immersive style */}
        <div className="relative w-64 h-64 flex items-center justify-center my-2 z-10">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-white/5 fill-transparent"
              strokeWidth="3.5"
            />
            {/* Live Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`fill-transparent transition-all duration-300 ${
                mode === "work" ? "stroke-orange-500" : "stroke-slate-400"
              }`}
              strokeWidth="3.5"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time digits & Status labels - matching mockup styling */}
          <div className="text-center">
            <span className="block text-6xl font-light tracking-tighter text-white timer-glow font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500 mt-2 block">
              {mode === "work" ? "STUDY ACTIVE" : mode === "shortBreak" ? "REST SESSION" : "LONG REPOSE"}
            </span>
          </div>
        </div>

        {/* Main Controls Panel */}
        <div className="flex items-center gap-4 z-10 mt-8">
          <button
            id="pomo-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio" : "Unmute audio"}
            className="p-3 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          <button
            id="pomo-play-pause"
            onClick={handleTogglePlay}
            className={`px-8 py-3 rounded-full text-black font-bold text-xs uppercase tracking-widest hover:bg-orange-400 transition-colors shadow-lg ${
              isActive 
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10" 
                : "bg-orange-500 hover:bg-orange-400 shadow-orange-500/10"
            }`}
          >
            {isActive ? "Pause Session" : "Start Session"}
          </button>

          <button
            id="pomo-reset"
            onClick={handleReset}
            title="Reset interval"
            className="p-3 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Focus Target Task Badge */}
        {selectedTask ? (
          <div className="mt-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 max-w-xs text-xs">
            <Zap className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-500 uppercase tracking-widest text-[9px]">Target:</span>{" "}
              <span className="font-medium text-slate-200">{selectedTask.title}</span>
            </div>
            <button 
              onClick={() => setSelectedTaskId("")}
              className="text-slate-400 hover:text-orange-500 ml-1.5 font-bold"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="mt-6 text-[11px] text-slate-500 italic uppercase tracking-wider">No task targeted. Select focus task below.</div>
        )}
      </div>

      {/* Right side: Session Stats & Settings */}
      <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
        
        {/* Settings Widget */}
        <div id="pomodoro-settings-card" className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-orange-500" /> Adjust Intervals
            </h3>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-sm uppercase tracking-widest">
              Streak: {sessionsCompleted}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-widest">
                Study (m)
              </label>
              <input
                id="pomo-setting-work"
                type="number"
                min="1"
                max="60"
                value={workTime}
                onChange={(e) => setWorkTime(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-widest">
                Short (m)
              </label>
              <input
                id="pomo-setting-short"
                type="number"
                min="1"
                max="60"
                value={shortBreak}
                onChange={(e) => setShortBreak(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-widest">
                Long (m)
              </label>
              <input
                id="pomo-setting-long"
                type="number"
                min="1"
                max="60"
                value={longBreak}
                onChange={(e) => setLongBreak(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Task Selection Selector */}
        <div id="pomodoro-task-linker" className="glass-panel p-5 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
              <BookOpen className="w-4 h-4 text-orange-500" /> Link Session
            </h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Target a pending study task to focus your mind. Completing Pomodoro sessions builds real academic momentum!
            </p>

            <select
              id="pomo-task-select"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-300"
            >
              <option value="">-- Choose target task --</option>
              {tasks
                .filter((t) => !t.completed)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Productivity Tip */}
          <div className="bg-orange-500/5 p-3.5 rounded-xl border border-orange-500/10 text-[11px] text-orange-400/90 flex items-start gap-2 mt-4">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-orange-500 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider">Aura Protip:</span> High-focus blocks (25m) with structured breaks (5m) prevent study fatigue and supercharge retention.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
