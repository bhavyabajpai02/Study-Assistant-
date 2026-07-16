import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import LoadingSphere from "../ui/3d/LoadingSphere"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-400">
        <div className="scale-75">
          <LoadingSphere />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest animate-pulse mt-2">
          Authenticating Session...
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
