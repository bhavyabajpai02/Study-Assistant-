import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { User } from "../models/User.js"

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/study-assistant"
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined in backend/.env. Attempting local connection: mongodb://localhost:27017/study-assistant")
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`)
    
    // Seed demo user
    await seedDemoUser()
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

const seedDemoUser = async () => {
  try {
    const demoEmail = "demo@studyassistant.com"
    const existingDemo = await User.findOne({ email: demoEmail })
    
    if (!existingDemo) {
      console.log("🌱 Seeding Demo Account...")
      const hashedPassword = await bcrypt.hash("Demo@123", 10)
      
      const demoUser = new User({
        name: "Demo Scholar",
        email: demoEmail,
        password: hashedPassword,
        xp: 1550,
        streak: 5,
        lastActiveDate: new Date().toDateString(),
        unlockedAchievements: ["first-session", "five-sessions", "pomodoro-king"]
      })
      
      await demoUser.save()
      console.log("✨ Demo Account Seeded Successfully!")
    } else {
      console.log("☑️ Demo Account already exists.")
    }
  } catch (err) {
    console.error(`⚠️ Demo Seeder Error: ${err.message}`)
  }
}
