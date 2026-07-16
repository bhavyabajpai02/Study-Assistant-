import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, ".env") })

const uri = process.env.MONGODB_URI

console.log("\n==================================================")
console.log("🔍 Testing MongoDB Atlas Connection...")
console.log(`📡 URI: ${uri ? uri.replace(/:([^@]+)@/, ":******@") : "None"}`) // Mask password in logs

if (!uri || uri.trim() === "") {
  console.log("❌ Error: MONGODB_URI is not defined in backend/.env!")
  console.log("==================================================\n")
  process.exit(1)
}

try {
  console.log("📡 Attempting connection to MongoDB Atlas...")
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  console.log("✅ Connection Successful! MongoDB Atlas is active and connected.")
  console.log(`🔌 Database State: Connected (Host: ${mongoose.connection.host})`)
  console.log("==================================================\n")
  await mongoose.disconnect()
} catch (error) {
  console.log(`\n❌ Database Connection Failed!`)
  console.log(`   Error Message: ${error.message}`)
  console.log("\n💡 Troubleshooting Tips:")
  console.log("   1. Verify your database username and password in backend/.env are correct")
  console.log("   2. Check if MONGODB_URI starts with 'mongodb+srv://'")
  console.log("   3. In your MongoDB Atlas Dashboard, make sure Network Access is set to allow connection from IP '0.0.0.0/0' (anywhere)")
  console.log("==================================================\n")
  process.exit(1)
}
