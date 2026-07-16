import React, { useState, useEffect, useMemo } from "react"
import { useStudy } from "../../context/StudyContext"
import ThreeDFlashcard from "./ThreeDFlashcard"
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shuffle, 
  RefreshCw, 
  ListFilter, 
  HelpCircle, 
  Flame, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ArrowRight,
  Maximize2,
  Minimize2,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  FolderSync,
  X,
  FileDown
} from "lucide-react"

export default function FlashcardContainer({ sessionId, flashcards = [] }) {
  const { updateSessionFlashcards } = useStudy()

  // State controls
  const [activeCards, setActiveCards] = useState(flashcards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [listView, setListView] = useState(false)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [studyMode, setStudyMode] = useState("all") // "all" | "unlearned" | "bookmarked" | "revision"

  // Full-screen state
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(null)

  // Form states
  const [cardForm, setCardForm] = useState({
    front: "",
    back: "",
    topic: "",
    difficulty: "Medium",
    tagsString: ""
  })

  // Topics list extracted dynamically
  const uniqueTopics = useMemo(() => {
    const topics = flashcards.map(f => f.topic || f.category || "General")
    return ["all", ...new Set(topics)]
  }, [flashcards])

  // Filter and Search logic
  useEffect(() => {
    let filtered = [...flashcards]

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(f => 
        (f.front && f.front.toLowerCase().includes(q)) || 
        (f.back && f.back.toLowerCase().includes(q))
      )
    }

    // 2. Topic Filter
    if (selectedTopic !== "all") {
      filtered = filtered.filter(f => (f.topic || f.category || "General") === selectedTopic)
    }

    // 3. Difficulty Filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(f => (f.difficulty || "Medium") === selectedDifficulty)
    }

    // 4. Study/Revision Mode
    if (studyMode === "unlearned") {
      filtered = filtered.filter(f => !f.isLearned)
    } else if (studyMode === "bookmarked") {
      filtered = filtered.filter(f => f.bookmarked)
    } else if (studyMode === "revision") {
      filtered = filtered.filter(f => f.forRevision)
    }

    // Fallback card if empty
    if (filtered.length === 0) {
      filtered = [{
        id: "fallback",
        front: "All Caught Up!",
        back: "No cards match the active search/filters. Create a new custom card or reset the search to study.",
        topic: "System",
        difficulty: "Easy",
        tags: ["No Match"]
      }]
    }

    setActiveCards(filtered)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [searchQuery, selectedTopic, selectedDifficulty, studyMode, flashcards])

  // Swiper Deck controls
  const handleNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % activeCards.length)
    }, 150)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + activeCards.length) % activeCards.length)
    }, 150)
  }

  const handleShuffle = () => {
    setIsFlipped(false)
    setTimeout(() => {
      const shuffled = [...activeCards].sort(() => Math.random() - 0.5)
      setActiveCards(shuffled)
      setCurrentIndex(0)
    }, 150)
  }

  // Keyboard Navigation
  useKeyboardShortcuts({
    "arrowright": () => handleNext(),
    "arrowleft": () => handlePrev(),
    "space": () => setIsFlipped(prev => !prev),
    "f": () => {
      const card = activeCards[currentIndex]
      if (card && card.id !== "fallback") handleToggleFavorite(card.id)
    },
    "l": () => {
      const card = activeCards[currentIndex]
      if (card && card.id !== "fallback") handleToggleLearned(card.id)
    },
    "r": () => {
      const card = activeCards[currentIndex]
      if (card && card.id !== "fallback") handleToggleRevision(card.id)
    }
  })

  // Swiper Drag Gesture Handler
  const handleDragEnd = (event, info) => {
    const threshold = 120
    const card = activeCards[currentIndex]
    if (!card || card.id === "fallback") return

    if (info.offset.x > threshold) {
      // Swipe Right -> Mastered / Learned
      handleToggleLearned(card.id, true)
      handleNext()
    } else if (info.offset.x < -threshold) {
      // Swipe Left -> Star / Bookmark
      handleToggleBookmark(card.id, true)
      handleNext()
    }
  }

  // CRUD Operations
  const handleToggleBookmark = async (cardId, forceValue = null) => {
    const updated = flashcards.map(f => {
      if (f.id === cardId) {
        return { ...f, bookmarked: forceValue !== null ? forceValue : !f.bookmarked }
      }
      return f
    })
    await updateSessionFlashcards(sessionId, updated)
  }

  const handleToggleLearned = async (cardId, forceValue = null) => {
    const updated = flashcards.map(f => {
      if (f.id === cardId) {
        return { ...f, isLearned: forceValue !== null ? forceValue : !f.isLearned }
      }
      return f
    })
    await updateSessionFlashcards(sessionId, updated)
  }

  const handleToggleFavorite = async (cardId) => {
    const updated = flashcards.map(f => {
      if (f.id === cardId) {
        return { ...f, favorite: !f.favorite }
      }
      return f
    })
    await updateSessionFlashcards(sessionId, updated)
  }

  const handleToggleRevision = async (cardId) => {
    const updated = flashcards.map(f => {
      if (f.id === cardId) {
        return { ...f, forRevision: !f.forRevision }
      }
      return f
    })
    await updateSessionFlashcards(sessionId, updated)
  }

  const handleCreateCard = async (e) => {
    e.preventDefault()
    const tags = cardForm.tagsString
      ? cardForm.tagsString.split(",").map(t => t.trim()).filter(Boolean)
      : []

    const newCardObj = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      front: cardForm.front,
      back: cardForm.back,
      topic: cardForm.topic.trim() || "Custom",
      difficulty: cardForm.difficulty,
      tags,
      isLearned: false,
      forRevision: false,
      bookmarked: false,
      favorite: false
    }

    const updated = [...flashcards, newCardObj]
    await updateSessionFlashcards(sessionId, updated)
    
    // reset form
    setCardForm({ front: "", back: "", topic: "", difficulty: "Medium", tagsString: "" })
    setIsAddOpen(false)
  }

  const handleOpenEdit = (card) => {
    setSelectedCardId(card.id)
    setCardForm({
      front: card.front,
      back: card.back,
      topic: card.topic || card.category || "General",
      difficulty: card.difficulty || "Medium",
      tagsString: Array.isArray(card.tags) ? card.tags.join(", ") : ""
    })
    setIsEditOpen(true)
  }

  const handleEditCard = async (e) => {
    e.preventDefault()
    const tags = cardForm.tagsString
      ? cardForm.tagsString.split(",").map(t => t.trim()).filter(Boolean)
      : []

    const updated = flashcards.map(f => {
      if (f.id === selectedCardId) {
        return {
          ...f,
          front: cardForm.front,
          back: cardForm.back,
          topic: cardForm.topic.trim() || "General",
          difficulty: cardForm.difficulty,
          tags
        }
      }
      return f
    })

    await updateSessionFlashcards(sessionId, updated)
    setIsEditOpen(false)
    setSelectedCardId(null)
  }

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this flashcard?")) return
    const updated = flashcards.filter(f => f.id !== cardId)
    await updateSessionFlashcards(sessionId, updated)
  }

  // Export Deck as PDF print layout
  const handlePrintPDF = () => {
    window.print()
  }

  const activeCard = activeCards[currentIndex]

  return (
    <div className={`flex flex-col gap-6 select-none ${isFullScreen ? "fixed inset-0 z-50 bg-zinc-950 p-6 overflow-y-auto" : ""}`}>
      
      {/* Cards Custom Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl">
        {/* Study Mode Selectors */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Study Deck" },
            { id: "unlearned", label: "Review Unlearned" },
            { id: "bookmarked", label: "Starred Only" },
            { id: "revision", label: "Revision Schedule" }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setStudyMode(mode.id)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                studyMode === mode.id
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/30"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
          {/* Add Custom Card Button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Custom Card
          </button>

          {/* Shuffle Deck */}
          <button
            onClick={handleShuffle}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
            title="Shuffle Cards"
          >
            <Shuffle className="w-4.5 h-4.5" />
          </button>

          {/* PDF Print Export */}
          <button
            onClick={handlePrintPDF}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
            title="Print/Export Deck"
          >
            <FileDown className="w-4.5 h-4.5" />
          </button>

          {/* List vs Deck Toggle */}
          <button
            onClick={() => setListView(!listView)}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors flex items-center gap-1.5 text-[11px] font-bold"
          >
            {listView ? (
              <>
                <EyeOff className="w-4 h-4" /> Swiper Deck
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Grid View
              </>
            )}
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors hidden md:block"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Focus"}
          >
            {isFullScreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deck contents..."
            className="w-full bg-zinc-950/40 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* Filter Topic */}
        <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-850 px-3 py-2 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Topic</span>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
          >
            {uniqueTopics.map((topic, i) => (
              <option key={i} value={topic} className="bg-zinc-950 text-zinc-300">
                {topic === "all" ? "All Topics" : topic}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Difficulty */}
        <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-850 px-3 py-2 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Level</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-950 text-zinc-300">All Difficulties</option>
            <option value="Easy" className="bg-zinc-950 text-zinc-300">Easy</option>
            <option value="Medium" className="bg-zinc-950 text-zinc-300">Medium</option>
            <option value="Hard" className="bg-zinc-950 text-zinc-300">Hard</option>
          </select>
        </div>
      </div>

      {listView ? (
        /* --- GRID / LIST LAYOUT MODE --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:text-zinc-950">
          {activeCards.map((f, idx) => {
            if (f.id === "fallback") return null
            return (
              <div 
                key={f.id}
                className="glass-panel border border-zinc-850 p-4 rounded-xl flex justify-between gap-4 relative overflow-hidden bg-zinc-950/30 group"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
                      {f.topic || f.category || "General"}
                    </span>
                    <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono font-bold">
                      {f.difficulty || "Medium"}
                    </span>
                  </div>
                  <h5 className="text-zinc-200 font-bold text-xs leading-relaxed font-sans">{f.front}</h5>
                  <p className="text-zinc-400 text-[11px] font-light leading-relaxed mt-1 font-sans">{f.back}</p>
                  
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {f.tags.map((t, idx) => (
                        <span key={idx} className="text-[8px] font-mono bg-zinc-900 border border-zinc-850 px-1.5 py-0.2 rounded text-zinc-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-end justify-between self-stretch flex-shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                  <div className="flex gap-1.5">
                    {/* Edit Custom Button */}
                    <button
                      onClick={() => handleOpenEdit(f)}
                      className="p-1.5 rounded text-xs border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      title="Edit Card"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {/* Delete Custom Button */}
                    <button
                      onClick={() => handleDeleteCard(f.id)}
                      className="p-1.5 rounded text-xs border border-zinc-800 bg-zinc-900/60 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 cursor-pointer"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggleBookmark(f.id)}
                      className={`p-1.5 rounded text-[10px] border cursor-pointer font-bold ${
                        f.bookmarked ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                      }`}
                      title="Bookmark"
                    >
                      ★
                    </button>
                    <button
                      onClick={() => handleToggleLearned(f.id)}
                      className={`p-1.5 rounded text-[10px] border cursor-pointer font-bold ${
                        f.isLearned ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                      }`}
                      title="Mastered"
                    >
                      ✔
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* --- STANDARD 3D SWIPER DECK VIEW --- */
        <div className="flex flex-col items-center gap-6 py-4 flex-1 justify-center">
          {/* Swiper Deck Wrapper */}
          <div className="relative w-full max-w-md h-[270px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + "_" + studyMode}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full absolute"
              >
                <ThreeDFlashcard
                  card={activeCard}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  index={currentIndex}
                  total={activeCards.length}
                  isBookmarked={activeCard?.bookmarked}
                  onBookmark={() => handleToggleBookmark(activeCard?.id)}
                  isMastered={activeCard?.isLearned}
                  onMaster={() => handleToggleLearned(activeCard?.id)}
                  isFavorite={activeCard?.favorite}
                  onFavorite={() => handleToggleFavorite(activeCard?.id)}
                  forRevision={activeCard?.forRevision}
                  onToggleRevision={() => handleToggleRevision(activeCard?.id)}
                  onEdit={() => handleOpenEdit(activeCard)}
                  onDelete={() => handleDeleteCard(activeCard?.id)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Drag instructions */}
          {activeCard?.id !== "fallback" && (
            <div className="flex justify-between w-full max-w-xs text-[10px] text-zinc-500 font-mono select-none">
              <span>← Swipe Left to Star</span>
              <span>Swipe Right to Master →</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={handlePrev}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-full text-zinc-300 hover:text-white cursor-pointer transition-colors active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-zinc-400">
              {currentIndex + 1} of {activeCards.length}
            </span>

            <button
              onClick={handleNext}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-full text-zinc-300 hover:text-white cursor-pointer transition-colors active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* --- ADD CUSTOM CARD MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="glass-panel-heavy border border-zinc-850 bg-zinc-950 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-2xl relative animate-fade-in">
            <button onClick={() => setIsAddOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-blue-500" /> Create Custom Flashcard
            </h3>

            <form onSubmit={handleCreateCard} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Question / Front</label>
                <textarea
                  value={cardForm.front}
                  onChange={(e) => setCardForm(prev => ({ ...prev, front: e.target.value }))}
                  placeholder="E.g., What is the Big O complexity of binary search?"
                  rows={2}
                  className="bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 p-2 rounded-lg outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Answer / Back</label>
                <textarea
                  value={cardForm.back}
                  onChange={(e) => setCardForm(prev => ({ ...prev, back: e.target.value }))}
                  placeholder="E.g., O(log n) because the search space is divided by half in each iteration."
                  rows={3}
                  className="bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 p-2 rounded-lg outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Topic</label>
                  <input
                    type="text"
                    value={cardForm.topic}
                    onChange={(e) => setCardForm(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="E.g., Algorithms"
                    className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 py-2 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Difficulty</label>
                  <select
                    value={cardForm.difficulty}
                    onChange={(e) => setCardForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-2 py-2 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={cardForm.tagsString}
                  onChange={(e) => setCardForm(prev => ({ ...prev, tagsString: e.target.value }))}
                  placeholder="binary, search, algorithms"
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 py-2 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors mt-2"
              >
                Save Flashcard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CUSTOM CARD MODAL --- */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="glass-panel-heavy border border-zinc-850 bg-zinc-950 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 shadow-2xl relative animate-fade-in">
            <button onClick={() => { setIsEditOpen(false); setSelectedCardId(null); }} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-extrabold text-zinc-100 flex items-center gap-1.5">
              <Edit2 className="w-4.5 h-4.5 text-blue-500" /> Edit Flashcard
            </h3>

            <form onSubmit={handleEditCard} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Question / Front</label>
                <textarea
                  value={cardForm.front}
                  onChange={(e) => setCardForm(prev => ({ ...prev, front: e.target.value }))}
                  rows={2}
                  className="bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 p-2 rounded-lg outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Answer / Back</label>
                <textarea
                  value={cardForm.back}
                  onChange={(e) => setCardForm(prev => ({ ...prev, back: e.target.value }))}
                  rows={3}
                  className="bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 p-2 rounded-lg outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Topic</label>
                  <input
                    type="text"
                    value={cardForm.topic}
                    onChange={(e) => setCardForm(prev => ({ ...prev, topic: e.target.value }))}
                    className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 py-2 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Difficulty</label>
                  <select
                    value={cardForm.difficulty}
                    onChange={(e) => setCardForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-2 py-2 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={cardForm.tagsString}
                  onChange={(e) => setCardForm(prev => ({ ...prev, tagsString: e.target.value }))}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 px-2 py-2 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors mt-2"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
