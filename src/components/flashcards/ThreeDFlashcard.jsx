import React from "react"
import { HelpCircle, CheckCircle, Flame, Edit2, Trash2, Calendar } from "lucide-react"

export default function ThreeDFlashcard({
  card,
  isFlipped,
  onFlip,
  index,
  total,
  isBookmarked,
  onBookmark,
  isMastered,
  onMaster,
  isFavorite,
  onFavorite,
  forRevision,
  onToggleRevision,
  onEdit,
  onDelete
}) {
  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      onFlip()
    }
  }

  if (!card) return null

  return (
    <div className="w-full max-w-md mx-auto aspect-[16/10] min-h-[270px] perspective-1000 select-none">
      <div
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
        className={`w-full h-full duration-500 transform-style-3d relative transition-transform ${
          isFlipped ? "rotate-y-180" : ""
        } cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl`}
        aria-label={`Flashcard ${index + 1} of ${total}. ${isFlipped ? "Back face showing." : "Front face showing."}`}
      >
        {/* --- FRONT SIDE --- */}
        <div className="absolute inset-0 backface-hidden glass-panel rounded-2xl p-6 flex flex-col justify-between border border-zinc-800/80 bg-zinc-950/80 shadow-2xl overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -right-12 -top-12 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl" />

          {/* Top panel */}
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              Question {index + 1}/{total}
            </span>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {onEdit && card.id !== "fallback" && (
                <button
                  onClick={onEdit}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  title="Edit Card"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              )}
              {onDelete && card.id !== "fallback" && (
                <button
                  onClick={onDelete}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 cursor-pointer"
                  title="Delete Card"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
              <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                {card.topic || card.category || "General"}
              </span>
            </div>
          </div>

          {/* Center Card Content */}
          <div className="text-center px-4 py-2 flex flex-col items-center justify-center flex-1">
            <h4 className="text-sm md:text-base font-extrabold text-zinc-100 leading-relaxed font-sans">
              {card.front}
            </h4>
            
            {/* Tags array rendering */}
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 justify-center">
                {card.tags.map((t, idx) => (
                  <span key={idx} className="text-[8px] font-mono bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">
              Click or Space to flip
            </span>

            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Favorite Toggle */}
              {onFavorite && card.id !== "fallback" && (
                <button
                  onClick={onFavorite}
                  className={`p-1.5 rounded-lg border transition-all text-[10px] font-bold cursor-pointer leading-none ${
                    isFavorite
                      ? "bg-rose-500/15 border-rose-500/35 text-rose-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={isFavorite ? "Unfavorite" : "Favorite"}
                >
                  ♥
                </button>
              )}

              {/* Bookmark Toggle */}
              {onBookmark && card.id !== "fallback" && (
                <button
                  onClick={onBookmark}
                  className={`p-1.5 rounded-lg border transition-all text-[10px] font-bold cursor-pointer leading-none ${
                    isBookmarked
                      ? "bg-amber-500/15 border-amber-500/35 text-amber-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                  aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                  title="Star Card"
                >
                  ★
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- BACK SIDE --- */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel rounded-2xl p-6 flex flex-col justify-between border border-zinc-800/80 bg-zinc-950/80 shadow-2xl overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl" />

          {/* Top panel */}
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Explanation
            </span>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
              {card.topic || card.category || "General"}
            </span>
          </div>

          {/* Center Card Content */}
          <div className="px-4 py-2 flex items-center justify-center flex-1 overflow-y-auto max-h-[145px]">
            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed text-center font-sans font-light">
              {card.back}
            </p>
          </div>

          {/* Bottom Controls */}
          <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">
              Click or Space to flip
            </span>

            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Revision toggle */}
              {onToggleRevision && card.id !== "fallback" && (
                <button
                  onClick={onToggleRevision}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                    forRevision
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-400 font-extrabold"
                      : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Schedule for Revision"
                >
                  <Calendar className="w-3 h-3" />
                  <span>{forRevision ? "Revision" : "Review"}</span>
                </button>
              )}

              {/* Mastery toggle */}
              {onMaster && card.id !== "fallback" && (
                <button
                  onClick={onMaster}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                    isMastered
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-extrabold"
                      : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300"
                  }`}
                  aria-label={isMastered ? "Mark as unlearned" : "Mark as mastered"}
                  title="Master Card"
                >
                  <Flame className={`w-3 h-3 ${isMastered ? "fill-emerald-500/10" : ""}`} />
                  <span>{isMastered ? "Mastered" : "Learn"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
