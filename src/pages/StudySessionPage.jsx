import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useStudy } from "../context/StudyContext"
import FlashcardContainer from "../components/flashcards/FlashcardContainer"
import QuizContainer from "../components/quiz/QuizContainer"
import AnalyticsView from "../components/analytics/AnalyticsView"
import { 
  BookOpen, 
  Layers, 
  FileQuestion, 
  BarChart3, 
  Star, 
  Printer, 
  Download, 
  ArrowLeft,
  Calendar,
  Compass,
  AlertTriangle
} from "lucide-react"

export default function StudySessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sessions, toggleFavorite, setActiveSession } = useStudy()

  // Find target session
  const session = sessions.find(s => s.id === id)

  // Active Tab state: "summary" | "flashcards" | "quiz" | "analytics"
  const [activeTab, setActiveTab] = useState("summary")

  useEffect(() => {
    if (session) {
      setActiveSession(session)
    }
  }, [session, setActiveSession])

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
        <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-rose-400 mb-4 animate-bounce">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-zinc-200 font-extrabold text-lg">Session Not Found</h3>
        <p className="text-zinc-500 text-xs mt-1 max-w-xs text-center">
          The requested study session does not exist in local storage or has been deleted.
        </p>
        <Link 
          to="/dashboard" 
          className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg active:scale-95 transition-all"
        >
          Return to Workspace
        </Link>
      </div>
    )
  }

  // print current view handler
  const handlePrint = () => {
    window.print()
  }

  // Export Flashcards as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session.flashcards, null, 2))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${session.title.replace(/\s+/g, "_")}_flashcards.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const diffBadges = {
    Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Hard: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  }

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 gap-8 overflow-y-auto print-area select-none">
      
      {/* --- TOP BACK & UTILITIES ROW (no-print helper) --- */}
      <section className="flex justify-between items-center no-print">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </Link>

        <div className="flex gap-2">
          {/* Favorite Toggle */}
          <button
            onClick={() => toggleFavorite(session.id)}
            className={`p-2 rounded-lg border text-zinc-400 transition-all ${
              session.isFavorite
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200"
            }`}
            title="Mark Favorite"
          >
            <Star className={`w-4 h-4 ${session.isFavorite ? "fill-amber-500" : ""}`} />
          </button>

          {/* Export JSON trigger */}
          <button
            onClick={handleExportJSON}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Export Flashcards"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Cards</span>
          </button>

          {/* Print Trigger */}
          <button
            onClick={handlePrint}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Print Notes"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Notes</span>
          </button>
        </div>
      </section>

      {/* --- SESSION DETAILS HEADER --- */}
      <section className="flex flex-col gap-3 border-b border-zinc-900/60 pb-6">
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${diffBadges[session.difficulty]}`}>
            {session.difficulty}
          </span>
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Next Review: {session.recommendedRevisionDate}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight font-sans">
          {session.title}
        </h1>
        <p className="text-zinc-400 text-xs font-light max-w-4xl leading-relaxed">
          {session.summary}
        </p>
      </section>

      {/* --- INTERACTIVE MODULES TAB HEADER (no-print) --- */}
      <section className="flex border-b border-zinc-900/80 gap-1.5 no-print">
        {[
          { id: "summary", label: "Study Notes", icon: BookOpen },
          { id: "flashcards", label: "Flashcards", icon: Layers },
          { id: "quiz", label: "Interactive Quiz", icon: FileQuestion },
          { id: "analytics", label: "Statistics", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                isActive
                  ? "border-blue-500 text-blue-400 font-extrabold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </section>

      {/* --- TAB VIEWS CONTENT --- */}
      <section className="flex-1 min-h-[300px]">
        {/* TAB 1: Study Notes / Overview */}
        {activeTab === "summary" && (
          <div className="flex flex-col gap-8 max-w-4xl animate-fade-in font-sans">
            {/* Key Concepts Grid */}
            <div className="flex flex-col gap-4">
              <h3 className="text-zinc-200 font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4.5 h-4.5 text-blue-400" /> Key Concepts & Definitions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.keyPoints.map((kp, idx) => (
                  <div 
                    key={idx} 
                    className="glass-panel border border-zinc-850 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden"
                  >
                    <span className="absolute right-3 top-3 text-[10px] text-zinc-600 font-mono font-bold">#{idx + 1}</span>
                    <h4 className="text-zinc-100 font-extrabold text-sm tracking-tight">{kp.concept}</h4>
                    <p className="text-zinc-400 text-xs font-light leading-relaxed">{kp.definition}</p>
                    
                    {kp.formula && (
                      <div className="bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-lg font-mono text-[10px] text-blue-400 mt-1 select-all break-all">
                        {kp.formula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Objectives and Revision Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-900/60 pt-6">
              {/* Learning Objectives */}
              <div className="flex flex-col gap-3">
                <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Mastery Goals</h4>
                <ul className="flex flex-col gap-2">
                  {session.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-xs text-zinc-400 font-light leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Revision Tips */}
              <div className="flex flex-col gap-3">
                <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Revision Strategies</h4>
                <ul className="flex flex-col gap-2">
                  {session.revisionTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-xs text-zinc-400 font-light leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Flashcards Deck */}
        {activeTab === "flashcards" && (
          <div className="animate-fade-in no-print">
            <FlashcardContainer sessionId={session.id} flashcards={session.flashcards} />
          </div>
        )}

        {/* TAB 3: MCQ Quiz */}
        {activeTab === "quiz" && (
          <div className="animate-fade-in no-print">
            <QuizContainer sessionId={session.id} quizQuestions={session.quiz} />
          </div>
        )}

        {/* TAB 4: Statistics */}
        {activeTab === "analytics" && (
          <div className="animate-fade-in">
            <AnalyticsView session={session} />
          </div>
        )}
      </section>
    </div>
  )
}
