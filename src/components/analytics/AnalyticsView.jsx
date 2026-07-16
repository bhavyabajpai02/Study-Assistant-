import React from "react"
import { useStudy } from "../../context/StudyContext"
import KnowledgeSphere from "../ui/3d/KnowledgeSphere"
import { 
  TrendingUp, 
  Clock, 
  Flame, 
  Zap, 
  Calendar,
  Sparkles
} from "lucide-react"

export default function AnalyticsView({ session = null }) {
  const { sessions, streak, xp, getLevel, getXPProgress } = useStudy()

  // Generate GitHub-style contribution heatmap data for the last 12 weeks (84 days)
  const renderHeatmap = () => {
    const today = new Date()
    const cells = []
    
    // Group session creations by date string
    const activityMap = {}
    sessions.forEach(s => {
      if (s.createdAt) {
        const dStr = new Date(s.createdAt).toDateString()
        activityMap[dStr] = (activityMap[dStr] || 0) + 1
      }
    })

    // Walk backwards 12 weeks
    for (let i = 83; i >= 0; i--) {
      const day = new Date()
      day.setDate(today.getDate() - i)
      const dayStr = day.toDateString()
      const activityCount = activityMap[dayStr] || 0

      // Color tier class based on session activity count
      let colorClass = "bg-zinc-900 border border-zinc-950"
      if (activityCount === 1) colorClass = "bg-purple-950 border border-purple-900/60"
      else if (activityCount === 2) colorClass = "bg-purple-800 border border-purple-700/60"
      else if (activityCount >= 3) colorClass = "bg-purple-500 border border-purple-400/60"

      cells.push({
        date: dayStr,
        count: activityCount,
        colorClass
      })
    }

    return (
      <div className="flex flex-col gap-3 bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl select-none">
        <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
          <Calendar className="w-4 h-4 text-purple-400" /> Consistency Calendar
        </h4>
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-1">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 heatmap-cell rounded-sm cursor-pointer transition-all ${cell.colorClass}`}
              title={`${cell.count} study session${cell.count !== 1 ? "s" : ""} on ${cell.date}`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1">
          <span>84 days ago</span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-purple-950 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-purple-800 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-purple-50 rounded-sm" />
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalNotesLength = sessions.reduce((acc, s) => acc + (s.summary?.length || 0), 0)
  const averageAccuracy = sessions.reduce((acc, s) => {
    const scores = s.quizScores || []
    if (scores.length === 0) return acc
    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length
    return acc + avg
  }, 0) / (sessions.filter(s => s.quizScores?.length > 0).length || 1)

  // extract topics from session keypoints to feed into the 3D Sphere
  const extractedTopics = session 
    ? session.keyPoints.map(kp => ({ name: kp.concept, level: Math.floor(Math.random() * 40) + 60 }))
    : sessions.flatMap(s => s.keyPoints.map(kp => ({ name: kp.concept, level: Math.floor(Math.random() * 45) + 55 }))).slice(0, 8)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full select-none">
      
      {/* LEFT COLUMN: Overview Stats (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* gamified meters info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-zinc-800/40 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Level Status</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-purple-400 font-sans">Level {getLevel()}</span>
              <span className="text-[10px] text-zinc-500 font-mono">Multiplier 1.25x</span>
            </div>
            <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ width: `${getXPProgress()}%` }}
              />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-zinc-800/40 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Average Quiz Accuracy</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {Math.round(averageAccuracy || 0)}%
              </span>
              <span className="text-[10px] text-zinc-500 font-sans">Across attempts</span>
            </div>
            <div className="w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${averageAccuracy || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        {renderHeatmap()}

        {/* Numeric stats lists */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <Clock className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-zinc-200 font-bold text-sm font-mono mt-0.5">
              {sessions.length * 8} mins
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Study Duration</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-zinc-200 font-bold text-sm font-mono mt-0.5">
              {Math.round(averageAccuracy > 0 ? (averageAccuracy / 100) * 100 : 0)}%
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Mastery Index</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <Flame className="w-5 h-5 text-orange-400 mb-1" />
            <span className="text-zinc-200 font-bold text-sm font-mono mt-0.5">
              {streak} Days
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Study Streak</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: 3D Knowledge Network (5 cols) */}
      <div className="lg:col-span-5 h-[340px] md:h-[400px] w-full">
        <div className="glass-panel border border-zinc-850 rounded-2xl h-full relative overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/20">
            <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Sparkles className="w-4 h-4 text-blue-400" /> 3D Topic Map
            </h4>
          </div>

          {/* Canvas knowledge node networks */}
          <div className="flex-1 w-full h-full relative">
            <KnowledgeSphere topics={extractedTopics} />
          </div>
        </div>
      </div>
    </div>
  )
}
