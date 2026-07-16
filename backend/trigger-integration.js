import axios from "axios"

const BACKEND_URL = "http://localhost:5000"

async function run() {
  console.log("\n==================================================")
  console.log("🚀 Starting Full Flow Integration Test...")

  let token = ""
  // Step 1: Login as Demo Account to get JWT token
  try {
    console.log("\n🔑 1. Logging in as demo user...")
    const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: "demo@studyassistant.com",
      password: "Demo@123"
    })
    token = loginRes.data.token
    console.log("✓ Login Success!")
    console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`)
  } catch (error) {
    console.error("❌ Login Failed:", error.response?.data || error.message)
    process.exit(1)
  }

  // Step 2: Call generate study material
  let generatedData = null
  try {
    console.log("\n📡 2. Requesting AI generation from /api/generate...")
    const genRes = await axios.post(`${BACKEND_URL}/api/generate`, {
      content: "React Hooks allow functional components to manage local state and side effects.",
      options: {
        difficulty: "Medium",
        language: "English",
        outputStyle: "Concise",
        summaryLength: "Short",
        flashcardCount: 3,
        quizCount: 3
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    generatedData = genRes.data
    console.log("✓ AI Generation Success!")
    console.log("Generated Title:", generatedData.title)
    console.log("Flashcards count:", generatedData.flashcards?.length)
    console.log("Quiz questions count:", generatedData.quiz?.length)
  } catch (error) {
    console.error("❌ AI Generation Failed!")
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error("Response data:", JSON.stringify(error.response.data, null, 2))
    } else {
      console.error("Error message:", error.message)
    }
    process.exit(1)
  }

  // Step 3: Call create session
  try {
    console.log("\n💾 3. Requesting Database Save to /api/sessions...")
    const saveRes = await axios.post(`${BACKEND_URL}/api/sessions`, {
      ...generatedData,
      originalNotes: "React Hooks allow functional components to manage local state and side effects.",
      generationSettings: {
        difficulty: "Medium",
        language: "English",
        outputStyle: "Concise",
        summaryLength: "Short",
        flashcardCount: 3,
        quizCount: 3
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log("✓ Database Save Success!")
    console.log("Saved Session ID:", saveRes.data.id || saveRes.data._id)
    console.log("==================================================\n")
  } catch (error) {
    console.error("❌ Database Save Failed!")
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error("Response data:", JSON.stringify(error.response.data, null, 2))
    } else {
      console.error("Error: ", error.message)
    }
    process.exit(1)
  }
}

run()
