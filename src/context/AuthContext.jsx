import React, { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext(undefined)

// Configure Axios request interceptor to attach JWT token to all requests automatically
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aether_study_token") || sessionStorage.getItem("aether_study_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Verify token on mount to perform auto-login
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("aether_study_token") || sessionStorage.getItem("aether_study_token")
      if (savedToken) {
        try {
          const response = await axios.get("/api/auth/me")
          setUser(response.data)
          setToken(savedToken)
        } catch (error) {
          console.error("Auto-login failed:", error)
          logoutSilently()
        }
      }
      setAuthLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password })
      const { token: userToken, ...userData } = response.data

      if (rememberMe) {
        localStorage.setItem("aether_study_token", userToken)
      } else {
        sessionStorage.setItem("aether_study_token", userToken)
      }

      setUser(userData)
      setToken(userToken)
      toast.success("Successfully logged in! Welcome back.")
      return userData
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Login failed. Please check your credentials."
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await axios.post("/api/auth/register", { name, email, password })
      const { token: userToken, ...userData } = response.data

      // Automatically remember register session
      localStorage.setItem("aether_study_token", userToken)
      
      setUser(userData)
      setToken(userToken)
      toast.success("Account created successfully! Welcome to Aether Study.")
      return userData
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed. Try a different email."
      toast.error(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const logout = () => {
    localStorage.removeItem("aether_study_token")
    sessionStorage.removeItem("aether_study_token")
    setUser(null)
    setToken(null)
    toast.success("Successfully logged out.")
  }

  const logoutSilently = () => {
    localStorage.removeItem("aether_study_token")
    sessionStorage.removeItem("aether_study_token")
    setUser(null)
    setToken(null)
  }

  const updateStats = async (stats) => {
    try {
      const response = await axios.put("/api/auth/stats", stats)
      setUser(prev => ({
        ...prev,
        ...response.data
      }))
      return response.data
    } catch (error) {
      console.error("Failed to update user stats on backend:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        register,
        logout,
        updateStats,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
