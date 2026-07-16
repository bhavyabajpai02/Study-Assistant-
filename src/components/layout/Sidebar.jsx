import React from "react"
import { NavLink, Link, useLocation } from "react-router-dom"
import { useStudy } from "../../context/StudyContext"
import PomodoroWidget from "../ui/PomodoroWidget"
import { 
  BookOpen, 
  LayoutDashboard, 
  BarChart3, 
  Sparkles, 
  Flame, 
  Zap, 
  Keyboard,
  Settings,
  FolderLock
} from "lucide-react"

export default function Sidebar() {
  const { 
    streak, 
    xp, 
    getLevel, 
    getXPProgress, 
    getXPForNextLevel,
    activeSession 
  } = useStudy()
  
  const location = useLocation()
  const currentLvl = getLevel()
  const nextLvlXP = getXPForNextLevel()
  const progressPercent = getXPProgress()

  const navLinks = [
    { to: "/dashboard", label: "Workspace", icon: LayoutDashboard },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
  ]

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md h-screen sticky top-0 hidden md:flex flex-col p-4 justify-between select-none">
      <div className="flex flex-col gap-6">
        {/* App Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-2 py-1 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-glass-glow shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-zinc-100" />
          </div>
          <span className="font-bold tracking-tight text-zinc-100 font-sans text-[17px] bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-300">
            Aether Study
          </span>
        </Link>

        {/* Learning Streak & XP Gamification Card */}
        <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 border border-zinc-800/50 p-3 rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
              <Flame className="w-4 h-4 fill-orange-500/10" />
              <span>{streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400 font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5 fill-purple-500/10" />
              <span>Lvl {currentLvl}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-[9px] text-zinc-500 font-semibold font-mono">
              <span>{xp} XP</span>
              <span>{nextLvlXP} XP</span>
            </div>
            <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2.5 mb-1.5">
            Core Menu
          </span>
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-100 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-zinc-900/30"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Active Study Guide Section */}
        {activeSession && (
          <nav className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2.5 mb-1.5 flex justify-between items-center">
              <span>Current Session</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <Link
              to={`/session/${activeSession.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/30 transition-all ${
                location.pathname.startsWith("/session") ? "bg-zinc-900/50 border border-zinc-800/80 font-medium" : ""
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="truncate max-w-[150px]">{activeSession.title}</span>
            </Link>
          </nav>
        )}
      </div>

      {/* Footer Area: Pomodoro Timer & Keyboard Short cuts */}
      <div className="flex flex-col gap-4">
        <PomodoroWidget />

        {/* Shortcut hint */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono bg-zinc-900/20 border border-zinc-900/50 p-2 rounded-lg">
          <span className="flex items-center gap-1">
            <Keyboard className="w-3 h-3 text-zinc-600" /> Quick Palette
          </span>
          <kbd className="bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded text-zinc-400 select-none">
            Ctrl+K
          </kbd>
        </div>
      </div>
    </aside>
  )
}
