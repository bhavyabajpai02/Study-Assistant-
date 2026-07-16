import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import { connectDB } from "./config/db.js"
import { aiRouter } from "./routes/aiRoutes.js"
import { authRouter } from "./routes/authRoutes.js"
import { sessionRouter } from "./routes/sessionRoutes.js"
import { parserRouter } from "./routes/parserRoutes.js"
import { isGeminiConfigured } from "./services/geminiService.js"

// Resolve absolute path to .env in backend directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, ".env") })

const PORT = process.env.PORT || 5000

// Validate required environment variables on startup
const requiredEnvVars = ["PORT", "GEMINI_API_KEY", "JWT_SECRET", "MONGODB_URI"]
const missingVars = []

requiredEnvVars.forEach(v => {
  if (!process.env[v] || process.env[v].trim() === "") {
    missingVars.push(v)
  }
})

if (missingVars.length > 0) {
  console.log("\n==================================================")
  console.log("⚠️  Startup Environment Variable Check Failed!")
  missingVars.forEach(v => {
    console.log(`❌ Missing Environment Variable: ${v}`)
    if (v === "GEMINI_API_KEY") {
      console.log("   👉 Action: Please create backend/.env and add your Gemini API key: GEMINI_API_KEY=your_key")
    } else if (v === "JWT_SECRET") {
      console.log("   👉 Action: Please define a JWT signing secret in backend/.env: JWT_SECRET=random_secret_string")
    } else if (v === "MONGODB_URI") {
      console.log("   👉 Action: Please define your MongoDB URI in backend/.env: MONGODB_URI=mongodb://...")
    } else if (v === "PORT") {
      console.log("   👉 Action: Please define server listening port: PORT=5000")
    }
  })
  console.log("==================================================\n")
}

const app = express()

// Connect to MongoDB Database
connectDB()

// Enable security headers
app.use(helmet())

// Configure CORS
app.use(cors())

// Parse JSON request body
app.use(express.json())

// Rate Limiting (to protect the AI generation endpoints from abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Database connectivity validation middleware
app.use((req, res, next) => {
  // If request is base health check or base router check, skip
  if (req.path === "/api/health" || req.path === "/") {
    return next()
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "Database connection is offline. Please try again shortly."
    })
  }
  next()
})

// Route registrations
app.use("/api/auth", authRouter)
app.use("/api/sessions", sessionRouter)
app.use("/api/parse-file", parserRouter)
app.use("/api/generate", limiter, aiRouter)

// Serve static frontend build files if they exist (Production mode)
const distPath = path.join(__dirname, "../dist")
app.use(express.static(distPath))

// Base Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() })
})

// Catch-all route to serve index.html for React SPA routing
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next()
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Aether Study API is online. (Static frontend files are not compiled yet, run 'npm run build' first).")
    }
  })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err)
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred in the service."
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Aether Study Backend running on http://localhost:${PORT}`)
  console.log("\n--- Service Health Status ---")
  console.log(process.env.MONGODB_URI ? "✓ MONGODB_URI Configured" : "⚠️ MONGODB_URI Missing (Connecting local fallback...)")
  console.log(isGeminiConfigured() ? "✓ Gemini Configured" : "⚠️ Gemini API Key Missing (AI services disabled)")
  console.log(process.env.JWT_SECRET ? "✓ JWT Ready" : "❌ JWT Secret Missing (Authentication services will fail)")
  console.log("✓ Server Running")
  console.log("-------------------------------\n")
})
