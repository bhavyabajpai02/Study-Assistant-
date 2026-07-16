import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Sparkles, Eye, EyeOff, Lock, Mail, User, ArrowRight } from "lucide-react"
import ParticleBackground from "../components/ui/3d/ParticleBackground"
import CursorGlow from "../components/ui/3d/CursorGlow"

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setError("")
    setLoading(true)
    try {
      await register(name, email, password)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Failed to create account.")
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight font-sans">
            Create your workspace
          </h2>
          <p className="text-zinc-400 text-xs mt-1 font-light">
            Register and start parsing lecture guides.
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel border border-zinc-850 p-6 md:p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative overflow-hidden bg-zinc-950/80 backdrop-blur-md">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 pl-10 pr-4 py-2.5 rounded-lg outline-none transition-all"
                  required
                />
              </div>
            </div>

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
                  placeholder="alex@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 pl-10 pr-4 py-2.5 rounded-lg outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 pl-10 pr-10 py-2.5 rounded-lg outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-xs text-zinc-200 pl-10 pr-10 py-2.5 rounded-lg outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-xs py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <span>{loading ? "Creating account..." : "Start Studying"}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Login redirection */}
          <div className="text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-4 mt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
