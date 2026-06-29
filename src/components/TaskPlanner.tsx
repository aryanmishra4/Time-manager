import React, { useState } from "react";
import { Task, SubTask } from "../types";
import { 
  Calendar, 
  Trash2, 
  Sparkles, 
  Plus, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap
} from "lucide-react";

interface TaskPlannerProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
  onDecompose?: (taskTitle: string) => void;
}

export default function TaskPlanner({ tasks, onUpdateTasks }: TaskPlannerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [category, setCategory] = useState<"Study" | "Revision" | "Exercise" | "Research" | "Other">("Study");
  const [dueDate, setDueDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  // Create task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      tags,
      completed: false,
      subtasks: [],
    };

    onUpdateTasks([newTask, ...tasks]);
    setTitle("");
    setDescription("");
    setTagInput("");
    setDueDate("");
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== id));
  };

  // Toggle task complete
  const handleToggleTask = (id: string) => {
    onUpdateTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Toggle subtask complete
  const handleToggleSubtask = (taskId: string, subtaskIndex: number) => {
    onUpdateTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = [...t.subtasks];
          updatedSubtasks[subtaskIndex] = {
            ...updatedSubtasks[subtaskIndex],
            completed: !updatedSubtasks[subtaskIndex].completed,
          };
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
  };

  // AI-powered Subtask Decomposition
  const handleGenerateSubtasks = async (task: Task) => {
    setIsAiGenerating(true);
    setAiError("");
    try {
      const response = await fetch("/api/ai/suggest-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title, description: task.description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to contact study assistant");
      }

      const data = await response.json();
      if (data.subtasks && data.subtasks.length > 0) {
        const generatedSubtasks: SubTask[] = data.subtasks.map((s: any) => ({
          title: s.title,
          completed: false,
        }));

        onUpdateTasks(
          tasks.map((t) => {
            if (t.id === task.id) {
              return { ...t, subtasks: [...t.subtasks, ...generatedSubtasks] };
            }
            return t;
          })
        );
        // Expand the task to show subtasks
        setExpandedTaskId(task.id);
      }
    } catch (err: any) {
      setAiError(err.message || "Something went wrong.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Add custom manual subtask
  const [manualSubtaskText, setManualSubtaskText] = useState<{ [key: string]: string }>({});

  const handleAddManualSubtask = (taskId: string) => {
    const text = manualSubtaskText[taskId];
    if (!text || !text.trim()) return;

    onUpdateTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: [...t.subtasks, { title: text.trim(), completed: false }],
          };
        }
        return t;
      })
    );

    setManualSubtaskText({
      ...manualSubtaskText,
      [taskId]: "",
    });
  };

  // Filters & Sorters
  const filteredTasks = tasks
    .filter((t) => {
      if (filterCategory !== "All" && t.category !== filterCategory) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
    });

  // Calculate task counts
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Task Summary Stat Banner in Immersive Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div id="stat-progress-card" className="glass-panel p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Task Completion</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-white">{completedCount}</span>
            <span className="text-slate-400 text-sm">/ {totalCount} completed</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
            <div 
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-500 timer-glow" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div id="stat-urgent-card" className="glass-panel p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Urgent Focus</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-orange-500">
              {tasks.filter((t) => t.priority === "High" && !t.completed).length}
            </span>
            <span className="text-slate-400 text-sm">high priority pending</span>
          </div>
          <div className="text-xs text-orange-500/80 mt-4 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> High priority task lines
          </div>
        </div>

        <div id="stat-study-card" className="glass-panel p-5 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Study Modules</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-orange-400">
              {tasks.filter((t) => t.category === "Study" && !t.completed).length}
            </span>
            <span className="text-slate-400 text-sm">academic units</span>
          </div>
          <div className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Powered by Aura Companion
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Create Task Form */}
        <div id="task-creator-panel" className="lg:col-span-4 glass-panel p-5 h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" /> Plan New Target
          </h2>

          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Task Title
              </label>
              <input
                id="task-title-input"
                type="text"
                placeholder="e.g. Advanced Neurobiology structures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-200 placeholder-slate-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Description (Optional)
              </label>
              <textarea
                id="task-desc-input"
                placeholder="Concepts to master, key study goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-200 placeholder-slate-500 resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Category
                </label>
                <select
                  id="task-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#0F1117] border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-300"
                >
                  <option value="Study">Study 📖</option>
                  <option value="Revision">Revision 🔁</option>
                  <option value="Exercise">Exercise ✏️</option>
                  <option value="Research">Research 🔎</option>
                  <option value="Other">Other 📝</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Priority
                </label>
                <select
                  id="task-priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-[#0F1117] border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-300"
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Deadline
                </label>
                <input
                  id="task-deadline-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-300 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                id="task-tags-input"
                type="text"
                placeholder="neuro, exam, structures"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-200 placeholder-slate-500 transition-colors"
              />
            </div>

            <button
              id="add-task-btn"
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-orange-500/10 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </form>
        </div>

        {/* Task List Panel */}
        <div id="task-list-panel" className="lg:col-span-8 glass-panel p-5 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">Your Action Plan</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              <select
                id="filter-category-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-[#0F1117] border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
              >
                <option value="All">All Categories</option>
                <option value="Study">Study</option>
                <option value="Revision">Revision</option>
                <option value="Exercise">Exercise</option>
                <option value="Research">Research</option>
                <option value="Other">Other</option>
              </select>

              {/* Priority Filter */}
              <select
                id="filter-priority-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1.5 bg-[#0F1117] border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
              >
                <option value="All">All Priorities</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>

              {/* Sort selector */}
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-[#0F1117] border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
              >
                <option value="dueDate">⏳ By Deadline</option>
                <option value="priority">⚠️ By Priority</option>
              </select>
            </div>
          </div>

          {/* AI error state banner */}
          {aiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Task List Grid */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-slate-700" />
                <p>No active tasks matching current filters.</p>
                <p className="text-xs text-slate-600">Add a task to jumpstart your session!</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                const hasSubtasks = task.subtasks.length > 0;

                return (
                  <div 
                    key={task.id} 
                    id={`task-item-${task.id}`}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      task.completed 
                        ? "bg-white/2 border-white/5 opacity-50" 
                        : "bg-white/3 border-white/5 hover:border-orange-500/20 hover:bg-white/4"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Checkbox + Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button 
                          onClick={() => handleToggleTask(task.id)}
                          className="mt-0.5 text-slate-500 hover:text-orange-500 focus:outline-hidden"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-orange-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-md border border-white/20 hover:border-orange-500" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {/* Priority Badge */}
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm tracking-widest uppercase ${
                              task.priority === "High" 
                                ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                : task.priority === "Medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {task.priority}
                            </span>

                            {/* Category Badge */}
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-sm uppercase tracking-wider">
                              {task.category}
                            </span>

                            {/* Tags */}
                            {task.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center text-[10px] text-slate-500">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <h3 className={`text-sm font-medium ${task.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Deadline indicator */}
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Due {task.dueDate}
                            </span>

                            {hasSubtasks && (
                              <span className="bg-white/5 text-slate-300 px-1.5 py-0.5 rounded-sm text-[10px]">
                                Milestones: {completedSubtasks}/{task.subtasks.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Auto Subtask AI button */}
                        {!task.completed && (
                          <button
                            onClick={() => handleGenerateSubtasks(task)}
                            disabled={isAiGenerating}
                            title="Decompose steps with AI"
                            className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded-lg border border-orange-500/20 bg-orange-500/5 disabled:opacity-50 transition-all flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                          >
                            {isAiGenerating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">AI Steps</span>
                              </>
                            )}
                          </button>
                        )}

                        <button 
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded view for subtasks */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-dashed border-white/5 pl-8 space-y-3 bg-white/2 p-3 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Action Milestones / Subtasks
                        </div>

                        {/* Subtasks checklist */}
                        {hasSubtasks ? (
                          <div className="space-y-2">
                            {task.subtasks.map((sub, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                <button 
                                  onClick={() => handleToggleSubtask(task.id, idx)}
                                  className="flex items-center gap-2 font-medium text-slate-300 text-left"
                                >
                                  {sub.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-sm border border-white/20" />
                                  )}
                                  <span className={sub.completed ? "line-through text-slate-500" : ""}>
                                    {sub.title}
                                  </span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">No milestones defined. Break down your study target with AI Steps above!</div>
                        )}

                        {/* Add custom manual subtask field */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                          <input
                            type="text"
                            placeholder="Add milestone study step..."
                            value={manualSubtaskText[task.id] || ""}
                            onChange={(e) => setManualSubtaskText({
                              ...manualSubtaskText,
                              [task.id]: e.target.value
                            })}
                            className="flex-1 px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg focus:outline-hidden focus:border-orange-500/50 text-slate-200 placeholder-slate-600"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddManualSubtask(task.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddManualSubtask(task.id)}
                            className="bg-orange-500 text-black p-1.5 rounded-lg hover:bg-orange-400 transition-all font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
