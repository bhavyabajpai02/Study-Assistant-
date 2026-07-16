import React from "react"
import { Link } from "react-router-dom"
import HeroCanvas from "../components/ui/3d/HeroCanvas"
import { motion } from "framer-motion"
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  FileQuestion, 
  TrendingUp, 
  Timer, 
  Flame, 
  Github,
  Award
} from "lucide-react"

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const features = [
    {
      title: "Interactive 3D Flashcards",
      desc: "Study terms and definitions using fluid, physical 3D card flips and swipe gestures.",
      icon: Layers,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Custom Quiz Engine",
      desc: "Convert materials into multiple-choice examinations complete with timers and performance analytics.",
      icon: FileQuestion,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "XP & Achievements",
      desc: "Keep motivated via learning milestones, streak tracking, and level ups as you revise.",
      icon: Award,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Progress Heatmaps",
      desc: "Monitor your study consistency with detailed learning calendars and interactive topic spheres.",
      icon: TrendingUp,
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
    },
    {
      title: "Deep Work Timers",
      desc: "Use the integrated Pomodoro system right in your workspace to manage study intervals.",
      icon: Timer,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      title: "Streak Milestones",
      desc: "Gamify consistency. Build your daily streak and earn large XP rewards.",
      icon: Flame,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden relative bg-[#09090b]">
      {/* Background radial gradient highlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-20" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none -z-20" />

      {/* Header bar */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-40 select-none">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-glass-glow shadow-blue-500/25">
            <Sparkles className="w-4.5 h-4.5 text-zinc-100" />
          </div>
          <span className="font-bold tracking-tight text-zinc-100 font-sans text-lg bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-300">
            Aether Study
          </span>
        </Link>

        <Link
          to="/dashboard"
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 duration-100"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left column: Text details */}
        <motion.div 
          className="lg:col-span-7 flex flex-col gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-[11px] font-bold text-blue-400 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Generative AI
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-zinc-100 font-sans"
          >
            Deepen focus.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400">
              Synthesize knowledge.
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-zinc-400 text-base md:text-lg max-w-xl font-light leading-relaxed"
          >
            Paste lecture notes, book transcripts, or study templates. Aether analyzes your text and builds custom interactive study guides, physical 3D flashcards, and quizzes.
          </motion.p>

          <motion.div variants={itemVariants} className="flex gap-4 mt-2">
            <Link
              to="/dashboard"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-transform"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>

        {/* Right column: 3D Canvas orb placeholder */}
        <motion.div 
          className="lg:col-span-5 h-[350px] md:h-[450px] w-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          <div className="w-full h-full glass-panel rounded-2xl relative overflow-hidden group shadow-2xl border-white/5">
            <div className="absolute top-4 left-4 text-[10px] text-zinc-500 font-mono select-none uppercase tracking-widest z-10">
              WebGL Neural Reactor
            </div>
            <HeroCanvas />
          </div>
        </motion.div>
      </main>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-20 border-t border-zinc-900/80 w-full select-none">
        <div className="text-center mb-16 flex flex-col gap-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">
            Designed for deep absorption.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm font-light">
            Forget passive reading. Aether converts notes into active retrieval tools that guarantee concept retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-300 group flex flex-col gap-4 relative"
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feat.color} shadow-sm group-hover:scale-110 transition-all`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-zinc-100 font-bold text-base tracking-tight font-sans">
                    {feat.title}
                  </h3>
                  <p className="text-zinc-400 text-xs font-light leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-zinc-900 bg-zinc-950/20 py-8 px-6 md:px-12 select-none z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-zinc-500 font-mono">Aether Study Project © 2026. Built by Vercel Frontend team.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
