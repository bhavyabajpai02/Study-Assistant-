import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Sparkles, Mail, ArrowLeft, Send } from "lucide-react"
import toast from "react-hot-toast"
import ParticleBackground from "../components/ui/3d/ParticleBackground"
import CursorGlow from "../components/ui/3d/CursorGlow"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      toast.success("Recovery instructions sent to " + email)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* 3D background constellations */}
      <ParticleBackground />
      
      {/* Interactive Cursor Spotlight */}
      <CursorGlow />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Branding Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-glass-glow shadow-blue-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-zinc-100" />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight font-sans text-center">
            Reset password
          </h2>
          <p className="text-zinc-400 text-xs mt-1 font-light text-center">
            {submitted ? "Check your inbox for a magic link." : "Enter your email, and we'll send reset instructions."}
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel border border-zinc-850 p-6 md:p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative overflow-hidden bg-zinc-950/80 backdrop-blur-md">
          {submitted ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg leading-relaxed font-medium">
                We have emailed a password reset link to <strong className="text-zinc-200">{email}</strong>.
              </div>
              <Link
                to="/login"
                className="mt-2 text-xs font-bold text-zinc-300 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 pl-10 pr-4 py-2.5 rounded-lg outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-xs py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <span>{loading ? "Sending link..." : "Send Reset Instructions"}</span>
                {!loading && <Send className="w-3.5 h-3.5" />}
              </button>

              <Link
                to="/login"
                className="mt-1 text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
