import React from "react"
import { useStudy } from "../../context/StudyContext"
import { Search, Sparkles, Flame, User, LayoutDashboard, BarChart3, BookOpen } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const { streak, setIsCommandPaletteOpen, activeSession } = useStudy()
  const location = useLocation()

  return (
    <>
      {/* --- Desktop/Tablet Top Navbar --- */}
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/20 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 select-none">
        {/* Left Side: Topic Context */}
        <div className="flex items-center gap-3">
          <div className="md:hidden w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-zinc-300 hidden md:inline bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            {location.pathname === "/dashboard" ? "Workspace Hub" : location.pathname === "/analytics" ? "Performance Analytics" : activeSession ? `Session: ${activeSession.title}` : "Aether Portal"}
          </span>
        </div>

        {/* Right Side: Search and Account Controls */}
        <div className="flex items-center gap-4">
          {/* Quick Search trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-500 w-44 md:w-56 text-left transition-all duration-200"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span>Search workspace...</span>
            <kbd className="bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded text-[9px] text-zinc-400 font-mono ml-auto">
              ⌘K
            </kbd>
          </button>

          {/* Quick Streak indicator (mobile only) */}
          <div className="flex md:hidden items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-lg text-orange-400 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-orange-500/10" />
            <span>{streak}d</span>
          </div>

          {/* Profile Badge */}
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* --- Mobile Glassmorphic Bottom Navigation --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800/80 flex items-center justify-around px-4 z-40 select-none pb-safe">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
            location.pathname === "/dashboard" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        {activeSession && (
          <Link
            to={`/session/${activeSession.id}`}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              location.pathname.startsWith("/session") ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Active Study</span>
          </Link>
        )}

        <Link
          to="/analytics"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
            location.pathname === "/analytics" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Analytics</span>
        </Link>
      </nav>
    </>
  )
}
