import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react"
import ParticleBackground from "../components/ui/3d/ParticleBackground"
import CursorGlow from "../components/ui/3d/CursorGlow"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }

    setError("")
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Invalid credentials.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail("demo@studyassistant.com")
    setPassword("Demo@123")
    setError("")
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* 3D background constellations */}
      <ParticleBackground />
      
      {/* Interactive Cursor Spotlight */}
      <CursorGlow />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Branding Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-glass-glow shadow-blue-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-zinc-100" />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight font-sans">
            Welcome back to Aether
          </h2>
          <p className="text-zinc-400 text-xs mt-1 font-light">
            Step back into your AI study portal.
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

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] text-zinc-500 hover:text-blue-400 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Remember Me Toggle */}
            <div className="flex items-center gap-2 py-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-zinc-900 border-zinc-800 rounded focus:ring-blue-500/30 focus:ring-1 text-blue-600 transition-all cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-zinc-400 select-none cursor-pointer">
                Remember my session
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold text-xs py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <span>{loading ? "Signing in..." : "Continue"}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Signup redirection */}
          <div className="text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-4 mt-1">
            New to Aether Study?{" "}
            <Link to="/register" className="text-blue-400 hover:underline font-bold">
              Create an account
            </Link>
          </div>
        </div>

        {/* Demo Account Info Panel */}
        <div className="mt-4 glass-panel border border-zinc-900/50 p-4 rounded-xl flex flex-col gap-2 bg-zinc-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Sandbox Mode (Demo Account Available)</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
            Don't want to register? You can sign in using our configured sandbox account instantly.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 mt-1">
            <div className="bg-zinc-900/60 border border-zinc-900 px-2 py-1.5 rounded-lg truncate">
              <span className="text-zinc-600">Email:</span> demo@studyassistant.com
            </div>
            <div className="bg-zinc-900/60 border border-zinc-900 px-2 py-1.5 rounded-lg truncate">
              <span className="text-zinc-600">Pass:</span> Demo@123
            </div>
          </div>
          <button
            onClick={fillDemoCredentials}
            className="mt-2 text-center text-[10px] font-bold text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            Auto-Fill Sandbox Credentials
          </button>
        </div>

      </div>
    </div>
  )
}
