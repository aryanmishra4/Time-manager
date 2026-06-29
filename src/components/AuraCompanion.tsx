import React, { useState, useEffect } from "react";
import { Task, Note, FocusInsight } from "../types";
import { 
  Sparkles, 
  Send, 
  Brain, 
  Quote, 
  Lightbulb, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  ChevronRight
} from "lucide-react";

interface AuraCompanionProps {
  tasks: Task[];
  notes: Note[];
  onAddRecommendedTask?: (taskTitle: string, estimatedMinutes: number, category: string, priority: "High" | "Medium" | "Low") => void;
}

export default function AuraCompanion({ tasks, notes, onAddRecommendedTask }: AuraCompanionProps) {
  // Chat States
  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; content: string }>>([
    {
      role: "model",
      content: "Greetings! I am Aura, your active study companion. Share what you're working on, or ask me to decompose your syllabus targets!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Recommendations / Insights States
  const [insight, setInsight] = useState<FocusInsight | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  // Fetch AI Recommendations based on current tasks/notes
  const handleFetchInsights = async () => {
    setIsInsightLoading(true);
    setInsightError("");
    try {
      const response = await fetch("/api/ai/recommend-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sync recommendations.");
      }

      const data = await response.json();
      setInsight(data);
    } catch (err: any) {
      setInsightError(err.message || "Aura core model is warming up.");
    } finally {
      setIsInsightLoading(false);
    }
  };

  // Auto trigger insight fetch on load or when tasks count changes
  useEffect(() => {
    handleFetchInsights();
  }, [tasks.length, notes.length]);

  // Send message to AI Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to local state
    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: newHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transmit message.");
      }

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `⚠️ System notification: ${err.message || "Connection failed."}` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add recommended task directly to planner
  const handleAcceptRecommendation = (rec: any) => {
    if (onAddRecommendedTask) {
      onAddRecommendedTask(rec.title, rec.estimatedMinutes, rec.category, rec.priority);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Smart Recommendations */}
      <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
        
        {/* Dynamic Focus insights panel */}
        <div id="ai-recommendations-panel" className="glass-panel p-5 flex-1 flex flex-col justify-between space-y-4">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" /> Focus Recommendations
              </h3>
              
              <button
                id="refresh-recs-btn"
                onClick={handleFetchInsights}
                disabled={isInsightLoading}
                className="text-[10px] font-bold text-orange-500 hover:text-orange-400 uppercase tracking-widest disabled:opacity-40"
              >
                {isInsightLoading ? "Syncing..." : "Sync AI"}
              </button>
            </div>

            {insightError && (
              <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl text-xs text-orange-400/80 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{insightError}</span>
              </div>
            )}

            {isInsightLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="uppercase tracking-widest font-bold text-[10px]">Aura is modeling your schedule...</p>
              </div>
            ) : insight && insight.recommendations && insight.recommendations.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
                  <p className="font-bold text-orange-400 uppercase tracking-wider mb-1">SMART SESSION TIP</p>
                  <p className="text-slate-200 leading-relaxed">{insight.focusPlan}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommended Actions</h4>
                  
                  {insight.recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-500/20 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-orange-500/10 text-orange-400 rounded-sm border border-orange-500/20 uppercase tracking-wider">
                            {rec.category}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ⏱️ {rec.estimatedMinutes} mins
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-slate-200">{rec.title}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{rec.reason}</p>
                      </div>

                      <button
                        onClick={() => handleAcceptRecommendation(rec)}
                        className="self-end sm:self-center px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-0.5 shrink-0"
                      >
                        Add <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs space-y-2 flex flex-col items-center">
                <Brain className="w-8 h-8 text-slate-700" />
                <p>No actionable study recommendations currently.</p>
                <p className="text-[10px] text-slate-600">Sync with tasks above to initialize recommendations.</p>
              </div>
            )}
          </div>

          {/* Motivation card footer */}
          {insight && insight.motivation && (
            <div className="pt-4 border-t border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Quote className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] italic text-slate-300">"{insight.motivation}"</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5 font-bold">Aura Motivation Engine</p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Right Column: AI Academic Coach Chat */}
      <div id="ai-chatbox-panel" className="lg:col-span-7 glass-panel p-5 flex flex-col justify-between h-[450px]">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full ai-gradient flex items-center justify-center shadow-md shadow-orange-500/15">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Chat with Aura</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Companion Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Message logs */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                msg.role === "user"
                  ? "bg-orange-500 text-black font-medium rounded-tr-xs"
                  : "bg-white/4 border border-white/5 text-slate-200 rounded-tl-xs"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white/4 border border-white/5 rounded-2xl rounded-tl-xs p-3.5 flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                <span>Aura is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Message Form */}
        <form onSubmit={handleSendMessage} className="border-t border-white/5 pt-3 flex items-center gap-2">
          <input
            id="chat-input-text"
            type="text"
            placeholder="Ask Aura to explain a study topic, build focus guides, or suggest breaks..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 px-4 py-3 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-200 placeholder-slate-600 disabled:opacity-50"
          />
          <button
            id="send-chat-btn"
            type="submit"
            disabled={isChatLoading || !inputMessage.trim()}
            className="p-3 bg-orange-500 hover:bg-orange-400 text-black rounded-xl transition-all disabled:opacity-40 shrink-0 shadow-md shadow-orange-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
