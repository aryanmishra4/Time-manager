import React, { useState } from "react";
import { Note } from "../types";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Search, 
  FileText, 
  Save, 
  Loader2, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface NotepadProps {
  notes: Note[];
  onUpdateNotes: (notes: Note[]) => void;
}

export default function Notepad({ notes, onUpdateNotes }: NotepadProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiError, setAiError] = useState("");

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // Create a new note
  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "Untitled Study Note",
      content: "",
      category: "General",
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onUpdateNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  // Update specific note field
  const handleUpdateNoteField = (id: string, field: keyof Note, value: string) => {
    onUpdateNotes(
      notes.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            [field]: value,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return note;
      })
    );
  };

  // Delete note
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filteredNotes = notes.filter((n) => n.id !== id);
    onUpdateNotes(filteredNotes);
    if (selectedNoteId === id) {
      setSelectedNoteId(filteredNotes.length > 0 ? filteredNotes[0].id : null);
    }
  };

  // AI-powered summarizer and action items decomposition
  const handleAiFormatNote = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsAiSummarizing(true);
    setAiError("");

    try {
      const response = await fetch("/api/ai/suggest-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: activeNote.title, 
          description: activeNote.content 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to organize note content");
      }

      const data = await response.json();
      if (data.subtasks && data.subtasks.length > 0) {
        // Construct organized bullet points and action items
        const bulletPoints = data.subtasks.map((s: any) => `- [ ] ${s.title} (est. ${s.duration})`).join("\n");
        const formattedContent = `${activeNote.content}\n\n### ⚡ Aura AI Organized Milestones:\n${bulletPoints}`;

        handleUpdateNoteField(activeNote.id, "content", formattedContent);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to contact academic summarizer.");
    } finally {
      setIsAiSummarizing(false);
    }
  };

  // Filter notes based on search
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Sidebar: Notes Navigation */}
      <div className="lg:col-span-4 glass-panel p-5 space-y-4 flex flex-col h-[460px]">
        
        {/* Header Action Row */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-orange-500" /> Study Notepad
          </h3>
          <button
            id="new-note-btn"
            onClick={handleCreateNote}
            className="text-orange-500 hover:text-orange-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
          >
            + New Note
          </button>
        </div>

        {/* Search Notes bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            id="note-search-input"
            type="text"
            placeholder="Search notes or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-200 placeholder-slate-600"
          />
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-12">
              No study notes found. Tap '+ New Note' to organize your topics!
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                id={`note-item-${note.id}`}
                onClick={() => setSelectedNoteId(note.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  selectedNoteId === note.id
                    ? "bg-orange-500/10 border-orange-500/30 text-white"
                    : "bg-white/3 border-white/5 text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="truncate flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400 rounded-sm uppercase tracking-wider">
                      {note.category}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Saved {note.lastUpdated}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-semibold truncate">
                    {note.title || "Untitled Note"}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {note.content ? note.content.slice(0, 50) : "Empty study note..."}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  className="text-slate-600 hover:text-red-400 p-1 rounded-lg transition-colors shrink-0"
                  title="Delete study note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Main Panel: Active Note Editor */}
      <div id="note-editor-arena" className="lg:col-span-8 glass-panel p-5 flex flex-col justify-between h-[460px]">
        
        {activeNote ? (
          <div className="flex-1 flex flex-col justify-between h-full space-y-4">
            
            {/* Note Editor Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="flex-1 min-w-0">
                <input
                  id="note-editor-title"
                  type="text"
                  placeholder="Note Title"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNoteField(activeNote.id, "title", e.target.value)}
                  className="w-full text-base font-bold bg-transparent text-white focus:outline-hidden"
                />
                
                {/* Note category label select */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Subject Area:</span>
                  <input
                    type="text"
                    placeholder="e.g. Neurobiology, Math"
                    value={activeNote.category}
                    onChange={(e) => handleUpdateNoteField(activeNote.id, "category", e.target.value)}
                    className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm text-[10px] text-orange-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Format action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="ai-summarize-btn"
                  onClick={handleAiFormatNote}
                  disabled={isAiSummarizing || !activeNote.content.trim()}
                  title="Aura AI organize milestones & action items"
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-md shadow-orange-500/10"
                >
                  {isAiSummarizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Decomposing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Decompose Tasks
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Error Alert */}
            {aiError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Note Editor Body textarea */}
            <div className="flex-1">
              <textarea
                id="note-editor-content"
                placeholder="Transcribe key class concepts, draft syllabus chapters, or master topics. Once done, tap 'Decompose Tasks' to have Aura instantly structure actionable milestones for you..."
                value={activeNote.content}
                onChange={(e) => handleUpdateNoteField(activeNote.id, "content", e.target.value)}
                className="w-full h-full bg-transparent text-slate-200 text-sm focus:outline-hidden resize-none leading-relaxed placeholder-slate-600"
              />
            </div>

            {/* Footer saved status */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              <div className="flex items-center gap-1">
                <Save className="w-3.5 h-3.5 text-orange-500" /> Auto-saved local state
              </div>
              <div>
                Updated {activeNote.lastUpdated}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <FileText className="w-12 h-12 text-slate-700 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No note selected</p>
              <p className="text-xs text-slate-500 mt-1">Tap '+ New Note' to capture details or launch syllabus tracking.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
