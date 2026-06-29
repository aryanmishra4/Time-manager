import React, { useState } from "react";
import { Flashcard, FlashcardDeck } from "../types";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Loader2,
  Bookmark
} from "lucide-react";

interface FlashcardToolProps {
  decks: FlashcardDeck[];
  onUpdateDecks: (decks: FlashcardDeck[]) => void;
  suggestedTopic?: string;
}

export default function FlashcardTool({ decks, onUpdateDecks, suggestedTopic = "" }: FlashcardToolProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Dynamic creation states
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [aiTopic, setAiTopic] = useState(suggestedTopic);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  // Manual creation states
  const [manualFront, setManualFront] = useState("");
  const [manualBack, setManualBack] = useState("");

  // Get current selected deck
  const currentDeck = decks.find((d) => d.id === selectedDeckId);

  // Create a new empty manual deck
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    const newDeck: FlashcardDeck = {
      id: crypto.randomUUID(),
      title: newDeckTitle.trim(),
      description: newDeckDesc.trim(),
      cards: [],
    };

    onUpdateDecks([newDeck, ...decks]);
    setSelectedDeckId(newDeck.id);
    setNewDeckTitle("");
    setNewDeckDesc("");
  };

  // Generate Deck using Gemini AI via API
  const handleAiGenerateDeck = async () => {
    if (!aiTopic.trim()) return;
    setIsAiGenerating(true);
    setAiError("");

    try {
      const response = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: aiTopic.trim(), count: 5 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate study deck");
      }

      const data = await response.json();
      if (data.flashcards && data.flashcards.length > 0) {
        const generatedCards: Flashcard[] = data.flashcards.map((c: any) => ({
          id: crypto.randomUUID(),
          front: c.front,
          back: c.back,
          confidence: "needs-practice",
        }));

        const newDeck: FlashcardDeck = {
          id: crypto.randomUUID(),
          title: `Aura Study: ${aiTopic.trim()}`,
          description: `Auto-generated companion deck covering ${aiTopic.trim()}`,
          cards: generatedCards,
        };

        onUpdateDecks([newDeck, ...decks]);
        setSelectedDeckId(newDeck.id);
        setAiTopic("");
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to contact academic AI.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Add individual manual card to current deck
  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !manualFront.trim() || !manualBack.trim()) return;

    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      front: manualFront.trim(),
      back: manualBack.trim(),
      confidence: "needs-practice",
    };

    const updatedDecks = decks.map((d) => {
      if (d.id === selectedDeckId) {
        return { ...d, cards: [...d.cards, newCard] };
      }
      return d;
    });

    onUpdateDecks(updatedDecks);
    setManualFront("");
    setManualBack("");
  };

  // Delete Deck
  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateDecks(decks.filter((d) => d.id !== id));
    if (selectedDeckId === id) {
      setSelectedDeckId(null);
    }
  };

  // Set card study progress confidence rating
  const handleRateCard = (confidence: "needs-practice" | "getting-there" | "mastered") => {
    if (!currentDeck) return;
    
    const updatedCards = [...currentDeck.cards];
    updatedCards[currentCardIndex] = {
      ...updatedCards[currentCardIndex],
      confidence,
    };

    const updatedDecks = decks.map((d) => {
      if (d.id === currentDeck.id) {
        return { ...d, cards: updatedCards };
      }
      return d;
    });

    onUpdateDecks(updatedDecks);
    
    // Auto advance after short timer delay if desired, or let user click
    if (currentCardIndex < currentDeck.cards.length - 1) {
      setTimeout(() => {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => prev + 1);
      }, 300);
    }
  };

  // Card movement
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleNextCard = () => {
    if (currentDeck && currentCardIndex < currentDeck.cards.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  // Deck Statistics calculations
  const totalCards = currentDeck?.cards.length || 0;
  const masteredCount = currentDeck?.cards.filter((c) => c.confidence === "mastered").length || 0;
  const learningCount = currentDeck?.cards.filter((c) => c.confidence === "getting-there").length || 0;
  const practiceCount = currentDeck?.cards.filter((c) => !c.confidence || c.confidence === "needs-practice").length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Deck Management / AI deck creator */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Dynamic AI Generator Tool */}
        <div id="ai-deck-creator" className="glass-panel p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" /> Auto AI study engine
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Input any syllabus topic, complex subject, or chapter title, and Aura AI will instantly forge a custom active recall study deck for you!
          </p>

          <div className="space-y-3">
            <input
              id="ai-deck-input"
              type="text"
              placeholder="e.g. Synaptic Plasticity & LTP"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:outline-hidden focus:border-orange-500/50 text-slate-200"
            />

            {aiError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {aiError}
              </div>
            )}

            <button
              id="generate-deck-btn"
              onClick={handleAiGenerateDeck}
              disabled={isAiGenerating || !aiTopic.trim()}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-widest py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Deck...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  AI Create Flashcards
                </>
              )}
            </button>
          </div>
        </div>

        {/* Decks Collection Panel */}
        <div id="decks-collection-card" className="glass-panel p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
            Decks Library
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {decks.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                No active decks found. Generate with AI above or create one manually!
              </div>
            ) : (
              decks.map((deck) => (
                <div
                  key={deck.id}
                  id={`deck-item-${deck.id}`}
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    selectedDeckId === deck.id
                      ? "bg-orange-500/10 border-orange-500/30 text-white"
                      : "bg-white/3 border-white/5 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="truncate flex-1">
                    <h4 className="text-xs font-semibold truncate flex items-center gap-1.5">
                      <Bookmark className={`w-3.5 h-3.5 ${selectedDeckId === deck.id ? "text-orange-500" : "text-slate-500"}`} />
                      {deck.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{deck.cards.length} cards in deck</p>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteDeck(deck.id, e)}
                    className="text-slate-600 hover:text-red-400 p-1 rounded-md transition-colors shrink-0"
                    title="Delete study deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Manual Deck Creation Form */}
          <form onSubmit={handleCreateDeck} className="border-t border-white/5 pt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual Deck Creator</h4>
            <input
              type="text"
              placeholder="Deck title..."
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-slate-200"
            />
            <button
              type="submit"
              disabled={!newDeckTitle.trim()}
              className="w-full border border-white/15 hover:border-white/20 text-slate-200 font-semibold text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-45"
            >
              <Plus className="w-3 h-3" /> Create Deck
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Flashcard Active Study Portal */}
      <div id="flashcard-study-arena" className="lg:col-span-8 glass-panel p-5 flex flex-col justify-between min-h-[460px]">
        
        {currentDeck ? (
          <>
            {/* Header / Meta */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {currentDeck.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{currentDeck.description || "Self-study deck module."}</p>
              </div>

              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-sm uppercase tracking-widest shrink-0">
                Card {currentDeck.cards.length > 0 ? currentCardIndex + 1 : 0} of {totalCards}
              </span>
            </div>

            {/* Active Study Arena with Cards */}
            {currentDeck.cards.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-6">
                
                {/* 3D Flashcard flip simulator - fully customized in Immersive styling */}
                <div 
                  id="active-flash-card"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full max-w-md aspect-[16/10] cursor-pointer relative group"
                  style={{ perspective: "1000px" }}
                >
                  <div 
                    className={`w-full h-full duration-500 transform-style-3d relative rounded-2xl border transition-all ${
                      isFlipped 
                        ? "rotate-y-180 bg-orange-500/5 border-orange-500/30" 
                        : "bg-white/3 border-white/10 hover:border-white/20"
                    }`}
                    style={{ 
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    
                    {/* Front of card */}
                    <div 
                      className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-600" /> Active Recall Prompt
                      </div>

                      <div className="text-center px-4 my-auto">
                        <p className="text-base text-slate-100 font-medium leading-relaxed italic">
                          "{currentDeck.cards[currentCardIndex].front}"
                        </p>
                      </div>

                      <div className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1">
                        <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: "10s" }} /> Click to reveal breakdown
                      </div>
                    </div>

                    {/* Back of card */}
                    <div 
                      className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden rotate-y-180"
                      style={{ 
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)"
                      }}
                    >
                      <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /> Explanation / Concepts
                      </div>

                      <div className="text-center px-4 my-auto">
                        <p className="text-sm text-slate-200 leading-relaxed font-light">
                          {currentDeck.cards[currentCardIndex].back}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                        Back of Card
                      </div>
                    </div>

                  </div>
                </div>

                {/* Rating controls to trigger meta stats */}
                {isFlipped && (
                  <div className="flex flex-col items-center space-y-2 animate-fade-in">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Assess retention confidence:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRateCard("needs-practice")}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-semibold transition-all"
                      >
                        🔴 Practice Needed
                      </button>
                      <button
                        onClick={() => handleRateCard("getting-there")}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs font-semibold transition-all"
                      >
                        🟡 Getting There
                      </button>
                      <button
                        onClick={() => handleRateCard("mastered")}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-semibold transition-all"
                      >
                        🟢 Mastered Card
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                    className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300 disabled:opacity-30 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs text-slate-400 font-medium">
                    {currentCardIndex + 1} / {totalCards}
                  </span>

                  <button
                    onClick={handleNextCard}
                    disabled={currentCardIndex === totalCards - 1}
                    className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300 disabled:opacity-30 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <Brain className="w-12 h-12 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-white">This deck is currently empty.</p>
                  <p className="text-xs text-slate-500 mt-1">Add custom cards manually below to start studying!</p>
                </div>
              </div>
            )}

            {/* Quick manual flashcard creator form inside selected deck */}
            <form onSubmit={handleAddManualCard} className="border-t border-white/5 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add study card manually</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Front (question, concept...)"
                  value={manualFront}
                  onChange={(e) => setManualFront(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#0F1117] border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
                  required
                />
                <input
                  type="text"
                  placeholder="Back (answer, explanation...)"
                  value={manualBack}
                  onChange={(e) => setManualBack(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#0F1117] border border-white/10 rounded-lg text-slate-300 focus:outline-hidden"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-widest py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 w-full"
              >
                <Plus className="w-3.5 h-3.5" /> Save Flashcard
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <Brain className="w-12 h-12 text-slate-700 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No deck selected</p>
              <p className="text-xs text-slate-500 mt-1">Choose a flashcard deck from the library, or forge a dynamic one using Aura's study AI.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
