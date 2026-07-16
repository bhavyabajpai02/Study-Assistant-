import React from "react"
import { Outlet, Navigate } from "react-router-dom"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import CommandPalette from "./CommandPalette"
import ParticleBackground from "../ui/3d/ParticleBackground"
import CursorGlow from "../ui/3d/CursorGlow"
import { Toaster } from "react-hot-toast"

export default function AppLayout() {
  return (
    <div className="min-h-screen flex relative overflow-hidden text-zinc-200">
      
      {/* 3D background constellations */}
      <ParticleBackground />
      
      {/* Interactive Cursor Spotlight */}
      <CursorGlow />
      
      {/* React Hot Toast Notifications Manager */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: "glass-panel-heavy border border-zinc-800 text-zinc-100 text-xs py-2 px-3 rounded-lg shadow-2xl",
          style: {
            background: "rgba(15, 15, 17, 0.9)",
            color: "#fafafa",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }
        }}
      />

      {/* Keyboard Shortcuts Command search overlay */}
      <CommandPalette />

      {/* Main desktop Sidebar menu */}
      <Sidebar />

      {/* Right Column details panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header toolbar */}
        <Navbar />

        {/* Dynamic Nested Page view (Dashboard, analytics, details sessions) */}
        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
