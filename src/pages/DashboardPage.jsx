import React from "react"
import { useForm } from "react-hook-form"
import { useStudy } from "../context/StudyContext"
import SessionList from "../components/dashboard/SessionList"
import LoadingSphere from "../components/ui/3d/LoadingSphere"
import { 
  Sparkles, 
  Flame, 
  Award, 
  BookOpen, 
  FolderSync, 
  Lightbulb 
} from "lucide-react"

export default function DashboardPage() {
  const { 
    createStudySession, 
    loading, 
    loadingStep, 
    streak, 
    xp, 
    getLevel,
    sessions 
  } = useStudy()

  const { 
    register, 
    handleSubmit, 
    reset,
    watch,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      content: ""
    }
  })

  // Watch text length for counter
  const noteContent = watch("content", "")

  const onSubmit = async (data) => {
    try {
      await createStudySession(data.content)
      reset()
    } catch (e) {
      // Errors are handled via toast notifications inside StudyContext
    }
  }

  const stats = [
    {
      label: "Learning Streak",
      value: `${streak} Day${streak !== 1 ? "s" : ""}`,
      icon: Flame,
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
    },
    {
      label: "Mastery Level",
      value: `Level ${getLevel()}`,
      icon: Award,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      label: "Study Experience",
      value: `${xp} XP`,
      icon: Sparkles,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      label: "Active Sessions",
      value: `${sessions.length} Guide${sessions.length !== 1 ? "s" : ""}`,
      icon: BookOpen,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    }
  ]

  const mockPrompts = [
    "Paste lecture notes on Neural Networks...",
    "Paste history chapter about the Industrial Revolution...",
    "Paste chemistry notes on thermodynamics and kinetics...",
    "Paste standard code snippets or algorithm designs..."
  ]

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 gap-8 overflow-y-auto relative select-none">
      {/* 3D Loading overlay */}
      {loading && <LoadingSphere step={loadingStep} />}

      {/* --- STATISTICS CARDS PANEL --- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border border-zinc-800/40 flex items-center gap-4 transition-all duration-300 hover:shadow-card-glow hover:shadow-blue-500/5 hover:-translate-y-0.5"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="text-zinc-200 font-bold text-sm md:text-base font-sans">
                  {stat.value}
                </span>
              </div>
            </div>
          )
        })}
      </section>

      {/* --- AI GENERATOR PANEL --- */}
      <section className="glass-panel rounded-2xl border border-zinc-850 p-6 flex flex-col gap-5 bg-gradient-to-b from-zinc-900/50 to-zinc-900/10 relative overflow-hidden group">
        {/* Glow backdrop highlight */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[80px] -z-10 pointer-events-none group-hover:bg-blue-600/10 transition-colors" />

        <div className="flex flex-col gap-1.5">
          <h2 className="text-zinc-100 font-bold text-lg flex items-center gap-2 tracking-tight font-sans">
            <Sparkles className="w-5 h-5 text-blue-400" /> Synthesize Study Material
          </h2>
          <p className="text-zinc-400 text-xs font-light max-w-2xl leading-relaxed">
            Provide lecture notes, slide transcriptions, textbooks, or key questions. Aether's AI constructs study outlines, concept files, bookmarks, and quiz exams.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              {...register("content", {
                required: "Notes text cannot be empty.",
                minLength: { value: 15, message: "Provide at least 15 characters of notes for better contextual analysis." }
              })}
              placeholder={mockPrompts[Math.floor(Math.random() * mockPrompts.length)]}
              rows={6}
              className={`w-full bg-zinc-900/80 border ${
                errors.content ? "border-rose-500/50" : "border-zinc-800"
              } focus:border-zinc-700 rounded-xl p-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none leading-relaxed font-sans resize-none transition-colors`}
            />

            {/* Character count helper */}
            <span className="absolute bottom-3 right-3 text-[10px] text-zinc-500 font-mono select-none">
              {noteContent.length} chars
            </span>
          </div>

          <div className="flex items-center justify-between">
            {errors.content ? (
              <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                {errors.content.message}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <Lightbulb className="w-3.5 h-3.5 text-zinc-600" /> Minimum 15 characters recommended.
              </span>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <FolderSync className="w-4 h-4" />
              <span>Generate Study Material</span>
            </button>
          </div>
        </form>
      </section>

      {/* --- SAVED GUIDES LIST --- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-zinc-200 font-bold text-sm uppercase tracking-wider font-sans">
            Saved Study Guides
          </h3>
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg font-mono">
            {sessions.length} total
          </span>
        </div>

        <SessionList />
      </section>
    </div>
  )
}
