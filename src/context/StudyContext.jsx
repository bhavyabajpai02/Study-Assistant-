import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { generateStudyMaterial as aiGenerateService } from "../services/ai"
import { useAuth } from "./AuthContext"
import axios from "axios"
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
  const { user, updateStats } = useAuth()

  // --- Core State ---
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  
  // --- Request & Generating UI State ---
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState("")

  // --- Gamification Local Mirror State ---
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lastActiveDate, setLastActiveDate] = useState("")
  const [unlockedAchievements, setUnlockedAchievements] = useState([])

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
  const timerRef = useRef(null)

  // Sync state from authenticated user profile
  useEffect(() => {
    if (user) {
      setXp(user.xp || 0)
      setStreak(user.streak || 0)
      setLastActiveDate(user.lastActiveDate || "")
      setUnlockedAchievements(user.unlockedAchievements || [])

      // Load sessions from MongoDB
      const loadSessions = async () => {
        try {
          const response = await axios.get("/api/sessions")
          setSessions(response.data)
        } catch (error) {
          console.error("Failed to load sessions from DB:", error)
        }
      }
      loadSessions()
    } else {
      // Clean states on logout
      setSessions([])
      setActiveSession(null)
      setXp(0)
      setStreak(0)
      setLastActiveDate("")
      setUnlockedAchievements([])
    }
  }, [user])

  // --- Pomodoro Audio Helper ---
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      console.warn("Audio Context beep blocked by browser policies.")
    }
  }

  // --- Pomodoro Tick ---
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
              awardXP(150)
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

  // --- Gamification Helper Functions ---
  const awardXP = useCallback(async (amount) => {
    if (!user) return
    const nextXp = xp + amount
    setXp(nextXp)
    await updateStats({ xp: nextXp })
  }, [user, xp, updateStats])

  const triggerAchievement = useCallback(async (id) => {
    if (!user || unlockedAchievements.includes(id)) return

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
      
      const nextAchievements = [...unlockedAchievements, id]
      const nextXp = xp + achievement.xpReward
      setXp(nextXp)
      setUnlockedAchievements(nextAchievements)
      await updateStats({ xp: nextXp, unlockedAchievements: nextAchievements })
    }
  }, [user, unlockedAchievements, xp, updateStats])

  const updateStreakAndActive = useCallback(async () => {
    if (!user) return
    const todayStr = new Date().toDateString()
    if (lastActiveDate === todayStr) return

    let nextStreak = streak
    if (!lastActiveDate) {
      nextStreak = 1
      toast.success("New study streak started! Let's maintain it. 📝")
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (lastActiveDate === yesterdayStr) {
        nextStreak = streak + 1
        toast.success(`Study streak increased to ${nextStreak} days! 🔥`)
        if (nextStreak >= 3) {
          triggerAchievement("streak-3")
        }
      } else {
        nextStreak = 1
        toast.success("New study streak started! Let's maintain it. 📝")
      }
    }

    setStreak(nextStreak)
    setLastActiveDate(todayStr)
    await updateStats({ streak: nextStreak, lastActiveDate: todayStr })
  }, [user, lastActiveDate, streak, updateStats, triggerAchievement])

  // --- XP Level Calculator ---
  const getLevel = useCallback(() => {
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

  // --- AI Study Generation flow ---
  const createStudySession = async (notesText, options = {}) => {
    setLoading(true)
    setLoadingStep("Reading Notes...")
    
    const stepTimers = [
      setTimeout(() => setLoadingStep("Extracting Core Concepts..."), 1200),
      setTimeout(() => setLoadingStep("Generating Flashcards..."), 2600),
      setTimeout(() => setLoadingStep("Preparing Custom Quiz..."), 4000),
      setTimeout(() => setLoadingStep("Structuring Final Materials..."), 5200)
    ]

    try {
      const generatedData = await aiGenerateService(notesText, options)
      
      // Save directly to MongoDB with originalNotes & options settings
      const response = await axios.post("/api/sessions", {
        ...generatedData,
        originalNotes: notesText,
        generationSettings: options
      })
      const newSession = response.data

      setSessions(prev => [newSession, ...prev])
      setActiveSession(newSession)
      
      updateStreakAndActive()
      awardXP(100) // Reward session creation XP

      // Check achievements
      if (sessions.length === 0) {
        triggerAchievement("first-session")
      } else if (sessions.length + 1 >= 5) {
        triggerAchievement("five-sessions")
      }
      
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

  // --- Study Interactions / CRUD ---
  const toggleFavorite = async (id) => {
    const target = sessions.find(s => s.id === id)
    if (!target) return

    const nextFav = !target.isFavorite
    try {
      const response = await axios.put(`/api/sessions/${id}`, { isFavorite: nextFav })
      const updated = response.data

      setSessions(prev => prev.map(s => s.id === id ? updated : s))
      if (activeSession?.id === id) {
        setActiveSession(updated)
      }
    } catch (error) {
      console.error("Favorite toggle error:", error)
      toast.error("Failed to save changes.")
    }
  }

  const renameSession = async (id, newTitle) => {
    if (!newTitle.trim()) return
    try {
      const response = await axios.put(`/api/sessions/${id}`, { title: newTitle })
      const updated = response.data

      setSessions(prev => prev.map(s => s.id === id ? updated : s))
      if (activeSession?.id === id) {
        setActiveSession(updated)
      }
      toast.success("Session renamed.")
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to rename session.")
    }
  }

  const deleteSession = async (id) => {
    try {
      await axios.delete(`/api/sessions/${id}`)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSession?.id === id) {
        setActiveSession(null)
      }
      toast.success("Study session deleted.")
    } catch (error) {
      console.error("Delete session error:", error)
      toast.error("Failed to delete session.")
    }
  }

  // Unified flashcard update save method
  const updateSessionFlashcards = async (sessionId, updatedFlashcards) => {
    try {
      const response = await axios.put(`/api/sessions/${sessionId}`, {
        flashcards: updatedFlashcards
      })
      const updated = response.data

      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s))
      if (activeSession?.id === sessionId) {
        setActiveSession(updated)
      }

      // Check bookmark count achievements
      const totalBookmarks = [updated, ...sessions.filter(s => s.id !== sessionId)].reduce(
        (acc, s) => acc + (s.flashcards?.filter(f => f.bookmarked).length || 0), 0
      )
      if (totalBookmarks >= 5) {
        triggerAchievement("bookmark-master")
      }

      return updated
    } catch (error) {
      console.error("Save flashcards error:", error)
      toast.error("Failed to sync flashcards with server.")
    }
  }

  const addQuizScore = async (sessionId, scorePercent) => {
    const target = sessions.find(s => s.id === sessionId)
    if (!target) return

    const scores = [...(target.quizScores || []), scorePercent]
    try {
      const response = await axios.put(`/api/sessions/${sessionId}`, { quizScores: scores })
      const updated = response.data

      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s))
      if (activeSession?.id === sessionId) {
        setActiveSession(updated)
      }

      if (scorePercent === 100) {
        triggerAchievement("quiz-perfect")
        awardXP(200)
      } else {
        awardXP(50)
      }
      updateStreakAndActive()
    } catch (error) {
      console.error("Quiz score save error:", error)
      toast.error("Failed to save quiz scores.")
    }
  }

  // --- Pomodoro controls ---
  const startPomodoro = () => setPomodoro(prev => ({ ...prev, isActive: true }))
  const pausePomodoro = () => setPomodoro(prev => ({ ...prev, isActive: false }))
  const resetPomodoro = () => setPomodoro(prev => ({ ...prev, isActive: false, timeLeft: prev.duration }))
  const setPomodoroDuration = (mins, mode = "work") => {
    const sec = mins * 60
    setPomodoro(prev => ({ ...prev, isActive: false, duration: sec, timeLeft: sec, mode }))
  }

  const regenerateSessionSection = async (sessionId, sectionName, options = {}) => {
    const target = sessions.find(s => s.id === sessionId)
    if (!target) return

    setLoading(true)
    setLoadingStep(`Regenerating ${sectionName}...`)

    try {
      const response = await axios.post("/api/generate/section", {
        content: target.originalNotes || target.title || "",
        section: sectionName,
        options: {
          ...target.generationSettings,
          ...options
        }
      })

      const sectionData = response.data
      const putResponse = await axios.put(`/api/sessions/${sessionId}`, sectionData)
      const updated = putResponse.data

      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s))
      if (activeSession?.id === sessionId) {
        setActiveSession(updated)
      }

      toast.success(`${sectionName} regenerated successfully!`)
      return updated
    } catch (error) {
      console.error("Section regeneration error:", error)
      toast.error(error.response?.data?.message || `Failed to regenerate ${sectionName}.`)
    } finally {
      setLoading(false)
      setLoadingStep("")
    }
  }

  const duplicateSession = async (sessionId) => {
    const target = sessions.find(s => s.id === sessionId)
    if (!target) return

    try {
      const { id, _id, createdAt, updatedAt, ...rest } = target
      const response = await axios.post("/api/sessions", {
        ...rest,
        title: `${rest.title} (Copy)`
      })
      const duplicated = response.data
      setSessions(prev => [duplicated, ...prev])
      toast.success("Session duplicated successfully.")
      return duplicated
    } catch (error) {
      console.error("Duplication error:", error)
      toast.error("Failed to duplicate session.")
    }
  }

  const updateSessionDetails = async (sessionId, updatedData) => {
    try {
      const response = await axios.put(`/api/sessions/${sessionId}`, updatedData)
      const updated = response.data
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s))
      if (activeSession?.id === sessionId) {
        setActiveSession(updated)
      }
      return updated
    } catch (error) {
      console.error("Update session details error:", error)
      toast.error("Failed to save updates.")
    }
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
        updateSessionFlashcards,
        addQuizScore,
        regenerateSessionSection,
        duplicateSession,
        updateSessionDetails,
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
