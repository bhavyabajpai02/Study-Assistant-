import React from "react"
import { useStudy } from "../../context/StudyContext"
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain } from "lucide-react"

export default function PomodoroWidget() {
  const {
    pomodoro,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroDuration
  } = useStudy()

  const { timeLeft, duration, isActive, mode } = pomodoro

  // Format time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Circular progress math
  const strokeRadius = 24
  const strokeCircumference = 2 * Math.PI * strokeRadius
  const progressPercent = duration > 0 ? (duration - timeLeft) / duration : 0
  const strokeOffset = strokeCircumference - progressPercent * strokeCircumference

  const cycleColors = {
    work: "stroke-blue-500 text-blue-500",
    shortBreak: "stroke-emerald-500 text-emerald-500",
    longBreak: "stroke-indigo-500 text-indigo-500"
  }

  const handleSkip = () => {
    // Jump straight to zero to trigger the mode transition
    pomodoro.timeLeft = 0
  }

  return (
    <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 flex flex-col gap-3 relative overflow-hidden group">
      {/* Background soft glow accent */}
      <div 
        className={`absolute -right-8 -top-8 w-20 h-20 rounded-full blur-2xl opacity-15 transition-all duration-300 ${
          mode === "work" ? "bg-blue-500" : "bg-emerald-500"
        }`} 
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-zinc-400">
          {mode === "work" ? (
            <>
              <Brain className="w-3.5 h-3.5 text-blue-400" /> Focus Block
            </>
          ) : (
            <>
              <Coffee className="w-3.5 h-3.5 text-emerald-400" /> Break Cycle
            </>
          )}
        </span>
        <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
          Cycle #{pomodoro.cyclesCompleted + 1}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* SVG Progress Circle */}
        <div className="relative w-14 h-14 flex items-center justify-center select-none">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r={strokeRadius}
              className="stroke-zinc-800 fill-none"
              strokeWidth="3.5"
            />
            <circle
              cx="28"
              cy="28"
              r={strokeRadius}
              className={`fill-none transition-all duration-300 ${cycleColors[mode]}`}
              strokeWidth="3.5"
              strokeDasharray={strokeCircumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-bold font-mono text-zinc-300">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Controls Layout */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex gap-2">
            {isActive ? (
              <button
                onClick={pausePomodoro}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-1.5 rounded-lg flex items-center justify-center text-zinc-300 transition-colors"
                aria-label="Pause Pomodoro"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={startPomodoro}
                className="flex-1 bg-blue-600/80 hover:bg-blue-600 border border-blue-500 p-1.5 rounded-lg flex items-center justify-center text-white transition-colors"
                aria-label="Start Pomodoro"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
              </button>
            )}

            <button
              onClick={resetPomodoro}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-1.5 rounded-lg flex items-center justify-center text-zinc-400 transition-colors"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {isActive && (
              <button
                onClick={handleSkip}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-1.5 rounded-lg flex items-center justify-center text-zinc-400 transition-colors"
                aria-label="Skip State"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick presets picker */}
          <div className="flex gap-1 justify-between mt-1">
            <button
              onClick={() => setPomodoroDuration(25, "work")}
              className={`text-[9px] px-1 py-0.5 rounded transition-all font-semibold ${
                mode === "work" && duration === 25 * 60
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-300 border border-transparent"
              }`}
            >
              25m
            </button>
            <button
              onClick={() => setPomodoroDuration(5, "shortBreak")}
              className={`text-[9px] px-1 py-0.5 rounded transition-all font-semibold ${
                mode === "shortBreak" && duration === 5 * 60
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-300 border border-transparent"
              }`}
            >
              5m
            </button>
            <button
              onClick={() => setPomodoroDuration(15, "longBreak")}
              className={`text-[9px] px-1 py-0.5 rounded transition-all font-semibold ${
                mode === "longBreak" && duration === 15 * 60
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-300 border border-transparent"
              }`}
            >
              15m
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
