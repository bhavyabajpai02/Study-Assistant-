import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { generateStudyMaterial as aiGenerateService } from "../services/ai"
import toast from "react-hot-toast"

const StudyContext = createContext(undefined)

const ACHIEVEMENTS_LIST = [
  { id: "first-session", title: "Novice Scholar", desc: "Generated your first AI study session.", icon: "🎓", xpReward: 100 },
  { id: "five-sessions", title: "Knowledge Gatherer", desc: "Generated 5 AI study sessions.", icon: "📚", xpReward: 250 },
  { id: "bookmark-master", title: "Memory Architect", desc: "Bookmarked 5 or more flashcards.", icon: "🔖", xpReward: 100 },
  { id: "quiz-perfect", title: "Perfect Score", desc: "Scored 100% on any study quiz.", icon: "🏆", xpReward: 300 },
  { id: "pomodoro-king", title: "Deep Focus", desc: "Completed a full work Pomodoro cycle.", icon: "⏱️", xpReward: 150 },
  { id: "streak-3", title: "Consistent Learner", desc: "Maintained a 3-day study streak.", icon: "🔥", xpReward: 200 }
]

export const StudyProvider = ({ children }) => {
  // --- Core Sessions State ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("aether_study_sessions")
    return saved ? JSON.parse(saved) : []
  })
  const [activeSession, setActiveSession] = useState(null)
  
  // --- Request & Generating UI State ---
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState("")

  // --- Gamification State ---
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem("aether_study_xp")
    return saved ? parseInt(saved) : 0
  })
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("aether_study_streak")
    return saved ? parseInt(saved) : 0
  })
  const [lastActiveDate, setLastActiveDate] = useState(() => {
    return localStorage.getItem("aether_study_last_active") || ""
  })
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const saved = localStorage.getItem("aether_study_achievements")
    return saved ? JSON.parse(saved) : []
  })

  // --- Pomodoro State ---
  const [pomodoro, setPomodoro] = useState({
    isActive: false,
    timeLeft: 25 * 60,
    duration: 25 * 60,
    mode: "work", // "work", "shortBreak", "longBreak"
    cyclesCompleted: 0
  })

  // --- Command Palette State ---
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Timer Ref for Pomodoro ticking
  const timerRef = useRef(null)

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("aether_study_sessions", JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem("aether_study_xp", xp.toString())
  }, [xp])

  useEffect(() => {
    localStorage.setItem("aether_study_streak", streak.toString())
  }, [streak])

  useEffect(() => {
    localStorage.setItem("aether_study_last_active", lastActiveDate)
  }, [lastActiveDate])

  useEffect(() => {
    localStorage.setItem("aether_study_achievements", JSON.stringify(unlockedAchievements))
  }, [unlockedAchievements])

  // --- Pomodoro Audio Notification Helper ---
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      console.warn("Audio Context beep blocker by browser policies.")
    }
  }

  // --- Pomodoro Interval Tick ---
  useEffect(() => {
    if (pomodoro.isActive) {
      timerRef.current = setInterval(() => {
        setPomodoro(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current)
            playAlert()
            
            let nextMode = "work"
            let nextDuration = 25 * 60
            let nextCycles = prev.cyclesCompleted

            if (prev.mode === "work") {
              nextCycles += 1
              toast.success("Focus block complete! Take a break.")
              // Reward focus XP
              setXp(x => x + 150)
              triggerAchievement("pomodoro-king")

              if (nextCycles % 4 === 0) {
                nextMode = "longBreak"
                nextDuration = 15 * 60
              } else {
                nextMode = "shortBreak"
                nextDuration = 5 * 60
              }
            } else {
              toast.success("Break over! Time to focus.")
              nextMode = "work"
              nextDuration = 25 * 60
            }

            return {
              isActive: false,
              timeLeft: nextDuration,
              duration: nextDuration,
              mode: nextMode,
              cyclesCompleted: nextCycles
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pomodoro.isActive])

  // --- XP Level Calculator ---
  const getLevel = useCallback(() => {
    // Standard quadratic curve: lvl = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }, [xp])

  const getXPForNextLevel = useCallback(() => {
    const currentLevel = getLevel()
    return Math.pow(currentLevel, 2) * 100
  }, [getLevel])

  const getXPProgress = useCallback(() => {
    const currentLvl = getLevel()
    const baseXP = currentLvl === 1 ? 0 : Math.pow(currentLvl - 1, 2) * 100
    const targetXP = Math.pow(currentLvl, 2) * 100
    const progress = ((xp - baseXP) / (targetXP - baseXP)) * 100
    return Math.max(0, Math.min(100, progress))
  }, [xp, getLevel])

  // --- Streak Manager ---
  const updateStreak = useCallback(() => {
    const todayStr = new Date().toDateString()
    if (lastActiveDate === todayStr) return // Already updated today

    if (!lastActiveDate) {
      setStreak(1)
      setLastActiveDate(todayStr)
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (lastActiveDate === yesterdayStr) {
        const nextStreak = streak + 1
        setStreak(nextStreak)
        setLastActiveDate(todayStr)
        toast.success(`Study streak increased to ${nextStreak} days! 🔥`)

        if (nextStreak >= 3) {
          triggerAchievement("streak-3")
        }
      } else {
        // Streak broken
        setStreak(1)
        setLastActiveDate(todayStr)
        toast.success("New study streak started! Let's maintain it. 📝")
      }
    }
  }, [lastActiveDate, streak])

  // --- Achievement Trigger Helper ---
  const triggerAchievement = useCallback((id) => {
    setUnlockedAchievements(prev => {
      if (prev.includes(id)) return prev

      const achievement = ACHIEVEMENTS_LIST.find(a => a.id === id)
      if (achievement) {
        toast((t) => (
          <span className="flex items-center gap-3">
            <span className="text-2xl">{achievement.icon}</span>
            <div>
              <p className="font-semibold text-zinc-100">Achievement Unlocked!</p>
              <p className="text-xs text-zinc-400 font-bold">{achievement.title} (+{achievement.xpReward} XP)</p>
            </div>
          </span>
        ), {
          duration: 4000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a"
          }
        })
        setXp(x => x + achievement.xpReward)
        return [...prev, id]
      }
      return prev
    })
  }, [])

  // Check count-based achievements
  useEffect(() => {
    if (sessions.length >= 1) {
      triggerAchievement("first-session")
    }
    if (sessions.length >= 5) {
      triggerAchievement("five-sessions")
    }

    // Check flashcards bookmark count
    const totalBookmarks = sessions.reduce((acc, s) => acc + (s.bookmarkedCards?.length || 0), 0)
    if (totalBookmarks >= 5) {
      triggerAchievement("bookmark-master")
    }
  }, [sessions, triggerAchievement])

  // --- AI Study Generation flow ---
  const createStudySession = async (notesText) => {
    setLoading(true)
    setLoadingStep("Reading Notes...")
    
    // Simulate natural steps for dramatic loading transitions
    const stepTimers = [
      setTimeout(() => setLoadingStep("Extracting Core Concepts..."), 1200),
      setTimeout(() => setLoadingStep("Generating Flashcards..."), 2600),
      setTimeout(() => setLoadingStep("Preparing Custom Quiz..."), 4000),
      setTimeout(() => setLoadingStep("Structuring Final Materials..."), 5200)
    ]

    try {
      const generatedData = await aiGenerateService(notesText)
      
      const newSession = {
        ...generatedData,
        id: `session_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        masteredCards: [],
        bookmarkedCards: [],
        quizScores: []
      }

      setSessions(prev => [newSession, ...prev])
      setActiveSession(newSession)
      updateStreak()
      setXp(x => x + 100) // Reward session creation XP
      
      toast.success("Study materials prepared successfully!")
      return newSession
    } catch (error) {
      if (error.message !== "REQUEST_CANCELLED") {
        console.error("AI flow failure:", error)
        toast.error(error.message || "Failed to generate materials. Please retry.")
      }
      throw error
    } finally {
      stepTimers.forEach(clearTimeout)
      setLoading(false)
      setLoadingStep("")
    }
  }

  // --- Study Interactions ---
  const toggleFavorite = (id) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    )
    if (activeSession?.id === id) {
      setActiveSession(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
    }
  }

  const renameSession = (id, newTitle) => {
    if (!newTitle.trim()) return
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle } : s))
    )
    if (activeSession?.id === id) {
      setActiveSession(prev => ({ ...prev, title: newTitle }))
    }
    toast.success("Session renamed.")
  }

  const deleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSession?.id === id) {
      setActiveSession(null)
    }
    toast.success("Study session deleted.")
  }

  const toggleBookmarkCard = (sessionId, cardIndex) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const list = s.bookmarkedCards || []
          const next = list.includes(cardIndex)
            ? list.filter(i => i !== cardIndex)
            : [...list, cardIndex]
          return { ...s, bookmarkedCards: next }
        }
        return s
      })
    )

    if (activeSession?.id === sessionId) {
      setActiveSession(prev => {
        const list = prev.bookmarkedCards || []
        const next = list.includes(cardIndex)
          ? list.filter(i => i !== cardIndex)
          : [...list, cardIndex]
        return { ...prev, bookmarkedCards: next }
      })
    }
    setXp(x => x + 10) // Small reward for bookmark interaction
  }

  const toggleMasteredCard = (sessionId, cardIndex) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const list = s.masteredCards || []
          const next = list.includes(cardIndex)
            ? list.filter(i => i !== cardIndex)
            : [...list, cardIndex]
          return { ...s, masteredCards: next }
        }
        return s
      })
    )

    if (activeSession?.id === sessionId) {
      setActiveSession(prev => {
        const list = prev.masteredCards || []
        const next = list.includes(cardIndex)
          ? list.filter(i => i !== cardIndex)
          : [...list, cardIndex]
        return { ...prev, masteredCards: next }
      })
    }
  }

  const addQuizScore = (sessionId, scorePercent) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const list = s.quizScores || []
          return { ...s, quizScores: [...list, scorePercent] }
        }
        return s
      })
    )

    if (activeSession?.id === sessionId) {
      setActiveSession(prev => {
        const list = prev.quizScores || []
        return { ...prev, quizScores: [...list, scorePercent] }
      })
    }

    if (scorePercent === 100) {
      triggerAchievement("quiz-perfect")
      setXp(x => x + 200)
    } else {
      setXp(x => x + 50) // Basic XP for completing quiz
    }
    updateStreak()
  }

  // --- Pomodoro Widget controls ---
  const startPomodoro = () => setPomodoro(prev => ({ ...prev, isActive: true }))
  const pausePomodoro = () => setPomodoro(prev => ({ ...prev, isActive: false }))
  const resetPomodoro = () => setPomodoro(prev => ({ ...prev, isActive: false, timeLeft: prev.duration }))
  const setPomodoroDuration = (mins, mode = "work") => {
    const sec = mins * 60
    setPomodoro(prev => ({ ...prev, isActive: false, duration: sec, timeLeft: sec, mode }))
  }

  return (
    <StudyContext.Provider
      value={{
        sessions,
        activeSession,
        setActiveSession,
        loading,
        loadingStep,
        xp,
        streak,
        unlockedAchievements,
        achievementsList: ACHIEVEMENTS_LIST,
        getLevel,
        getXPForNextLevel,
        getXPProgress,
        createStudySession,
        toggleFavorite,
        renameSession,
        deleteSession,
        toggleBookmarkCard,
        toggleMasteredCard,
        addQuizScore,
        pomodoro,
        startPomodoro,
        pausePomodoro,
        resetPomodoro,
        setPomodoroDuration,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen
      }}
    >
      {children}
    </StudyContext.Provider>
  )
}

export const useStudy = () => {
  const context = useContext(StudyContext)
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider")
  }
  return context
}
