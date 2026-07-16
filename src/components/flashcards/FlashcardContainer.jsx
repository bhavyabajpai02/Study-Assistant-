import React, { useState, useEffect } from "react"
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
  ArrowRight 
} from "lucide-react"

export default function FlashcardContainer({ sessionId, flashcards = [] }) {
  const { toggleBookmarkCard, toggleMasteredCard, sessions } = useStudy()

  // Find corresponding saved session states
  const session = sessions.find(s => s.id === sessionId)
  const bookmarkedIds = session?.bookmarkedCards || []
  const masteredIds = session?.masteredCards || []

  // Flashcards state
  const [activeCards, setActiveCards] = useState(flashcards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [filterMode, setFilterMode] = useState("all") // "all" | "unlearned" | "bookmarked"
  const [listView, setListView] = useState(false)

  // Reload cards if list filters alter
  useEffect(() => {
    let filtered = [...flashcards]
    if (filterMode === "unlearned") {
      filtered = flashcards.filter((_, idx) => !masteredIds.includes(idx))
    } else if (filterMode === "bookmarked") {
      filtered = flashcards.filter((_, idx) => bookmarkedIds.includes(idx))
    }

    // Default to fallback card if filters leave it empty
    if (filtered.length === 0) {
      filtered = [{
        front: "All Caught Up!",
        back: "No cards match the active filters. Toggle filters to restart study sessions.",
        category: "Complete"
      }]
    }

    setActiveCards(filtered)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [filterMode, flashcards, bookmarkedIds, masteredIds])

  // Slide Controls
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

  // Keyboard Navigation Bindings
  useKeyboardShortcuts({
    "arrowright": () => handleNext(),
    "arrowleft": () => handlePrev(),
    "space": () => setIsFlipped(prev => !prev),
    "b": () => {
      const originalIndex = flashcards.findIndex(f => f.front === activeCards[currentIndex]?.front)
      if (originalIndex !== -1) {
        toggleBookmarkCard(sessionId, originalIndex)
      }
    }
  })

  // Swipe Action Handlers
  const handleDragEnd = (event, info) => {
    const threshold = 120
    const originalIndex = flashcards.findIndex(f => f.front === activeCards[currentIndex]?.front)

    if (originalIndex === -1) return

    if (info.offset.x > threshold) {
      // Swiped Right -> Mastered
      if (!masteredIds.includes(originalIndex)) {
        toggleMasteredCard(sessionId, originalIndex)
      }
      handleNext()
    } else if (info.offset.x < -threshold) {
      // Swiped Left -> Bookmark Review Later
      if (!bookmarkedIds.includes(originalIndex)) {
        toggleBookmarkCard(sessionId, originalIndex)
      }
      handleNext()
    }
  }

  const activeCard = activeCards[currentIndex]
  const originalIndex = flashcards.findIndex(f => f.front === activeCard?.front)
  const isBookmarked = bookmarkedIds.includes(originalIndex)
  const isMastered = masteredIds.includes(originalIndex)

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Cards Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-950/20 border border-zinc-850 p-3 rounded-xl gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filterMode === "all"
                ? "bg-blue-600/10 text-blue-400 border-blue-500/25"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            All Cards
          </button>
          <button
            onClick={() => setFilterMode("unlearned")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filterMode === "unlearned"
                ? "bg-orange-600/10 text-orange-400 border-orange-500/25"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Review Later
          </button>
          <button
            onClick={() => setFilterMode("bookmarked")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filterMode === "bookmarked"
                ? "bg-amber-600/10 text-amber-400 border-amber-500/25"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Starred
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={handleShuffle}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Shuffle Cards"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setListView(!listView)}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            {listView ? (
              <>
                <EyeOff className="w-4 h-4" /> Hide List
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Show List
              </>
            )}
          </button>
        </div>
      </div>

      {listView ? (
        // List Layout Mode
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashcards.map((f, idx) => {
            const starred = bookmarkedIds.includes(idx)
            const mastered = masteredIds.includes(idx)
            return (
              <div 
                key={idx}
                className="glass-panel border border-zinc-800/40 p-4 rounded-xl flex justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
                    {f.category}
                  </span>
                  <h5 className="text-zinc-200 font-bold text-xs font-sans">
                    {f.front}
                  </h5>
                  <p className="text-zinc-400 text-[11px] font-light leading-relaxed mt-1">
                    {f.back}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleBookmarkCard(sessionId, idx)}
                      className={`p-1 rounded text-xs border ${
                        starred ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                      }`}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => toggleMasteredCard(sessionId, idx)}
                      className={`p-1 rounded text-xs border ${
                        mastered ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                      }`}
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
        // Standard interactive swiper layout
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Swiper Deck Wrapper */}
          <div className="relative w-full max-w-md h-[270px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + "_" + filterMode}
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
                  isBookmarked={isBookmarked}
                  onBookmark={() => toggleBookmarkCard(sessionId, originalIndex)}
                  isMastered={isMastered}
                  onMaster={() => toggleMasteredCard(sessionId, originalIndex)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Swipe Indicator Tags */}
          <div className="flex justify-between w-full max-w-xs text-[10px] text-zinc-500 font-mono select-none">
            <span>← Swipe Left to Star</span>
            <span>Swipe Right to Master →</span>
          </div>

          {/* Progress indicators & triggers */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={handlePrev}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-full text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-zinc-400">
              {currentIndex + 1} of {activeCards.length}
            </span>

            <button
              onClick={handleNext}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-full text-zinc-300 hover:text-white transition-colors"
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
    </div>
  )
}
