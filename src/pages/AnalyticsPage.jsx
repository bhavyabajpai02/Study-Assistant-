import React from "react"
import { useStudy } from "../context/StudyContext"
import AnalyticsView from "../components/analytics/AnalyticsView"
import { BarChart3, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function AnalyticsPage() {
  const { sessions } = useStudy()

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 gap-6 overflow-y-auto select-none">
      
      {/* Header section */}
      <section className="flex flex-col gap-1 border-b border-zinc-900 pb-4">
        <h1 className="text-zinc-100 font-extrabold text-xl font-sans flex items-center gap-2">
          <BarChart3 className="w-5.5 h-5.5 text-purple-400" /> Performance Analytics
        </h1>
        <p className="text-zinc-400 text-xs font-light max-w-xl">
          Review your cumulative learning data, study frequency, and conceptual mapping across all active study records.
        </p>
      </section>

      {/* Main Analytics View Panel */}
      {sessions.length === 0 ? (
        <section className="glass-panel border border-zinc-850 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-zinc-200 font-bold text-base">No Analytics Available</h4>
            <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">
              Synthesize your first notes study session on the workspace dashboard to populate statistics trackers.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg active:scale-95 transition-all shadow-md shadow-blue-500/10"
          >
            Go to Workspace
          </Link>
        </section>
      ) : (
        <section className="flex-1">
          <AnalyticsView />
        </section>
      )}
    </div>
  )
}
