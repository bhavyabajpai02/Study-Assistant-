import React, { useState, useEffect, useRef } from "react"
import { useStudy } from "../../context/StudyContext"
import { useNavigate } from "react-router-dom"
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts"
import { AnimatePresence, motion } from "framer-motion"
import { 
  Search, 
  Terminal, 
  Play, 
  Pause, 
  Flame, 
  LayoutDashboard, 
  BarChart3, 
  X,
  FileText
} from "lucide-react"

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    sessions,
    setActiveSession,
    startPomodoro,
    pausePomodoro,
    setPomodoroDuration
  } = useStudy()

  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Listen for Cmd/Ctrl+K to open
  useKeyboardShortcuts({
    "ctrl+k": () => setIsCommandPaletteOpen(prev => !prev),
    "escape": () => setIsCommandPaletteOpen(false)
  })

  // Focus input on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isCommandPaletteOpen])

  if (!isCommandPaletteOpen) return null

  // Command items
  const staticCommands = [
    {
      id: "go-dashboard",
      title: "Go to Workspace",
      category: "Navigation",
      icon: LayoutDashboard,
      action: () => navigate("/dashboard")
    },
    {
      id: "go-analytics",
      title: "Go to Analytics",
      category: "Navigation",
      icon: BarChart3,
      action: () => navigate("/analytics")
    },
    {
      id: "timer-start",
      title: "Start Pomodoro Timer",
      category: "Pomodoro",
      icon: Play,
      action: () => startPomodoro()
    },
    {
      id: "timer-pause",
      title: "Pause Pomodoro Timer",
      category: "Pomodoro",
      icon: Pause,
      action: () => pausePomodoro()
    },
    {
      id: "timer-25",
      title: "Set Focus Session (25m)",
      category: "Pomodoro",
      icon: Terminal,
      action: () => setPomodoroDuration(25, "work")
    },
    {
      id: "timer-5",
      title: "Set Short Break (5m)",
      category: "Pomodoro",
      icon: Terminal,
      action: () => setPomodoroDuration(5, "shortBreak")
    }
  ]

  // Filtered session records
  const filteredSessions = sessions
    .filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    .map(s => ({
      id: `session-${s.id}`,
      title: `Study Session: ${s.title}`,
      category: "Saved Guides",
      icon: FileText,
      action: () => {
        setActiveSession(s)
        navigate(`/session/${s.id}`)
      }
    }))

  // Concat all matches
  const allItems = [
    ...staticCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())),
    ...filteredSessions
  ]

  // Keyboard navigation inside list
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % allItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action()
        setIsCommandPaletteOpen(false)
      }
    }
  }

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 select-none"
        onClick={() => setIsCommandPaletteOpen(false)}
      >
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm"
        />

        {/* Palette Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-zinc-950/90 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative z-10 glass-panel-heavy"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header query field */}
          <div className="flex items-center gap-3 px-4 border-b border-zinc-800/80 h-12">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search guides, tools, and actions..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-zinc-100 text-sm flex-1 placeholder-zinc-500 font-sans"
            />
            <button 
              onClick={() => setIsCommandPaletteOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[350px] overflow-y-auto p-2 flex flex-col gap-1">
            {allItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No commands or guides found matching "{query}"
              </div>
            ) : (
              // Grouped view or basic list with category badges
              allItems.map((item, idx) => {
                const Icon = item.icon
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action()
                      setIsCommandPaletteOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-all ${
                      isSelected 
                        ? "bg-blue-600 text-white" 
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                      <span className="font-semibold font-sans">{item.title}</span>
                    </div>
                    <span 
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isSelected 
                          ? "bg-blue-700 text-blue-100" 
                          : "bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {item.category}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer Guide Help */}
          <div className="bg-zinc-900/50 px-4 py-2 border-t border-zinc-800/80 flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
            <span>↑↓ Navigation</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
