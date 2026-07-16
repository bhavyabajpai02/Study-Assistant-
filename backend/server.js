import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import { aiRouter } from "./routes/aiRoutes.js"

// Load env variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security configurations
app.use(helmet({
  contentSecurityPolicy: false, // Let R3F or three external files loads correctly
}))

// CORS configuration (allow requests from the frontend development server)
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

app.use(express.json({ limit: "5mb" })) // Support large text uploads

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

// Route registrations
app.use("/api/generate", limiter, aiRouter)

// Base Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() })
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
})
