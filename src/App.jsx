import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { StudyProvider } from "./context/StudyContext"
import AppLayout from "./components/layout/AppLayout"
import LandingPage from "./pages/LandingPage"
import DashboardPage from "./pages/DashboardPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import StudySessionPage from "./pages/StudySessionPage"

export default function App() {
  return (
    <StudyProvider>
      <Routes>
        {/* Full-screen Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Workspace Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/session/:id" element={<StudySessionPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StudyProvider>
  )
}
