import React, { useState, useRef, useEffect } from "react"
import { useStudy } from "../../context/StudyContext"
import { useAuth } from "../../context/AuthContext"
import { Search, Sparkles, Flame, User, LayoutDashboard, BarChart3, BookOpen, LogOut, ChevronDown } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

function ProfileDropdown() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 pl-2 pr-3 py-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer select-none"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
          {initials}
        </div>
        <span className="text-xs font-semibold max-w-[100px] truncate">{user.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-50 flex flex-col gap-1.5 animate-fade-in">
          <div className="px-2 py-1.5 border-b border-zinc-900">
            <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              logout()
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

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

          {/* Profile Dropdown */}
          <ProfileDropdown />
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
