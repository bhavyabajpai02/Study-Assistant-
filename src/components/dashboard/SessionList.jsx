import React, { useState } from "react"
import { useStudy } from "../../context/StudyContext"
import { Link } from "react-router-dom"
import { 
  Star, 
  Trash2, 
  Edit3, 
  Clock, 
  Activity, 
  Search, 
  Filter,
  ArrowUpDown,
  BookOpen,
  Check
} from "lucide-react"

export default function SessionList() {
  const { 
    sessions, 
    toggleFavorite, 
    renameSession, 
    deleteSession, 
    setActiveSession 
  } = useStudy()

  // State filters
  const [searchQuery, setSearchQuery] = useState("")
  const [diffFilter, setDiffFilter] = useState("All")
  const [favOnly, setFavOnly] = useState(false)
  const [sortBy, setSortBy] = useState("newest")

  // Editing state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState("")

  const startEditing = (e, session) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const saveEdit = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    renameSession(id, editTitle)
    setEditingId(null)
  }

  const cancelEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(null)
  }

  // Handle session item triggers
  const handleItemClick = (session) => {
    setActiveSession(session)
  }

  // Filter & Sort core logs
  const filtered = sessions
    .filter(s => {
      const matchQuery = s.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchDiff = diffFilter === "All" || s.difficulty === diffFilter
      const matchFav = !favOnly || s.isFavorite
      return matchQuery && matchDiff && matchFav
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === "alpha") return a.title.localeCompare(b.title)
      return 0
    })

  const diffBadges = {
    Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Hard: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  }

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Filters Dashboard Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-950/20 border border-zinc-800/60 p-3 rounded-xl glass-panel">
        <div className="flex gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-200 outline-none w-full placeholder-zinc-500 font-sans focus:border-zinc-700 transition-colors"
            />
          </div>

          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="All">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto justify-end">
          {/* Favorites check toggle */}
          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              favOnly
                ? "bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-sm"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favOnly ? "fill-amber-500/10" : ""}`} />
            <span>Starred</span>
          </button>

          {/* Sort order select */}
          <div className="flex items-center gap-1 text-zinc-500 border border-zinc-800 bg-zinc-900 rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-zinc-400 outline-none cursor-pointer border-none p-0.5"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alpha">A-Z Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Results layout */}
      {filtered.length === 0 ? (
        <div className="glass-panel border border-zinc-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-zinc-200 font-bold text-base">No study sessions found</h4>
            <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">
              {sessions.length === 0
                ? "Start by pasting your study content above to generate your first interactive module."
                : "Try adjustments to your search queries or active filtering tags."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => {
            const isEditing = editingId === s.id
            return (
              <div
                key={s.id}
                onClick={() => handleItemClick(s)}
                className="glass-panel border border-zinc-800/50 hover:border-zinc-700/70 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 group cursor-pointer hover:shadow-card-glow hover:shadow-purple-500/5 relative overflow-hidden"
              >
                {/* Accent subtle lines */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    {/* Title or Editable field */}
                    {isEditing ? (
                      <div 
                        onClick={e => e.stopPropagation()} 
                        className="flex gap-1 items-center flex-1 mr-2"
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm font-bold text-zinc-200 w-full outline-none"
                        />
                        <button
                          onClick={(e) => saveEdit(e, s.id)}
                          className="bg-emerald-600/80 hover:bg-emerald-600 text-white p-1 rounded transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-zinc-800 text-zinc-400 hover:text-zinc-200 p-1 rounded border border-zinc-700"
                        >
                          <Check className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={`/session/${s.id}`}
                        className="text-zinc-200 font-bold group-hover:text-white transition-colors text-base font-sans truncate mr-2"
                      >
                        {s.title}
                      </Link>
                    )}

                    {/* Actions Panel */}
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={(e) => startEditing(e, s)}
                        className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800 transition-all"
                        aria-label="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-900/60 border border-transparent hover:border-zinc-850 transition-all"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-light">
                    {s.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 text-[11px] text-zinc-500">
                  <div className="flex gap-2.5 items-center">
                    <span className={`px-2 py-0.5 rounded border ${diffBadges[s.difficulty]} font-bold`}>
                      {s.difficulty}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      {s.estimatedReadingTime}
                    </span>
                  </div>

                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="flex gap-3 items-center"
                  >
                    {/* Star favorite trigger */}
                    <button
                      onClick={() => toggleFavorite(s.id)}
                      className={`hover:scale-110 active:scale-95 transition-all ${
                        s.isFavorite ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                      aria-label="Favorite"
                    >
                      <Star className={`w-4 h-4 ${s.isFavorite ? "fill-amber-500" : ""}`} />
                    </button>

                    <Link
                      to={`/session/${s.id}`}
                      className="bg-zinc-900 border border-zinc-850 hover:border-zinc-700 px-3 py-1 rounded text-zinc-300 font-bold hover:bg-zinc-800 transition-all"
                    >
                      Study
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
