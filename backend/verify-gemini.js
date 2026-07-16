import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { GoogleGenerativeAI } from "@google/generative-ai"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, ".env") })

const apiKey = process.env.GEMINI_API_KEY

console.log("\n==================================================")
console.log("🔍 Testing Gemini API Connectivity...")
console.log(`🔑 Key Loaded: ${apiKey ? apiKey.substring(0, 6) + "..." + apiKey.substring(apiKey.length - 4) : "None"}`)

if (!apiKey || apiKey.trim() === "") {
  console.log("❌ Error: GEMINI_API_KEY is not defined in backend/.env!")
  console.log("==================================================\n")
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(apiKey)

try {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" })
  console.log("📡 Sending test request to Google AI servers...")
  
  const result = await model.generateContent("Respond with exactly: ✓ Gemini is connected successfully!")
  const text = result.response.text().trim()
  
  console.log(`\n🎉 Response: ${text}`)
  console.log("✅ Verification Successful! Your key works and Gemini is fully connected.")
  console.log("==================================================\n")
} catch (error) {
  console.log(`\n❌ Connection Failed!`)
  console.log(`   Error Message: ${error.message}`)
  console.log("\n💡 Troubleshooting Tips:")
  console.log("   1. Verify your key contains no leading/trailing spaces or quotes in backend/.env")
  console.log("   2. Make sure you are not behind a restrictive proxy or VPN blocking google.com")
  console.log("   3. Check that your Google AI Studio billing/usage limits are not exceeded")
  console.log("==================================================\n")
}
