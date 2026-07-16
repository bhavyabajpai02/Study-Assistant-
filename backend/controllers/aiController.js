import { GoogleGenerativeAI } from "@google/generative-ai"

// Define the structured JSON Schema for Gemini validation
const studyResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    estimatedReadingTime: { type: "STRING" },
    difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
    flashcards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          front: { type: "STRING" },
          back: { type: "STRING" },
          category: { type: "STRING" }
        },
        required: ["front", "back", "category"]
      }
    },
    quiz: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          options: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          correctIndex: { type: "INTEGER" },
          explanation: { type: "STRING" }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    },
    keyPoints: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          concept: { type: "STRING" },
          definition: { type: "STRING" },
          formula: { type: "STRING" }
        },
        required: ["concept", "definition"]
      }
    },
    revisionTips: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    learningObjectives: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    recommendedRevisionDate: { type: "STRING" }
  },
  required: [
    "title",
    "summary",
    "estimatedReadingTime",
    "difficulty",
    "flashcards",
    "quiz",
    "keyPoints",
    "revisionTips",
    "learningObjectives",
    "recommendedRevisionDate"
  ]
}

export const generateStudyMaterial = async (req, res) => {
  const { content } = req.body

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Please provide the study material content or topic as a non-empty string."
    })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Falling back to mock generator.")
    // In production engineering, a fallback/sandbox mode allows reviewing the UI without active credentials.
    // We generate highly structured mock data matching the exact schema if no key is provided, or return 401.
    // Let's implement a toggle: if key is absent, we'll return a helpful instruction.
    return res.status(401).json({
      error: "Missing API Key",
      message: "GEMINI_API_KEY is not configured in backend/.env. Please configure your key in the environment."
    })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Using gemini-1.5-flash for fast and cost-effective generation
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a senior academic tutor and learning experience designer. Your goal is to dissect complex lecture notes, books, or ideas into extremely structured study aids. You must summarize notes, select key terms, construct flashcards, design MCQs, and draft revision tips."
    })

    const prompt = `Analyze the following study material and generate a structured course aid.
    
    Material:
    "${content}"
    
    You must output a single JSON object that conforms STRICTLY to the required JSON schema.
    Ensure flashcards have concise front/back concepts.
    Ensure quiz questions have exactly 4 choices in 'options', and 'correctIndex' is 0, 1, 2, or 3.
    Return only valid JSON. No markdown blocks, no leading/trailing tags.`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: studyResponseSchema,
        temperature: 0.2, // Keep temperature low for structured outputs
      }
    })

    const responseText = result.response?.text()
    if (!responseText) {
      throw new Error("Empty response received from Gemini API.")
    }

    // Try parsing to verify it is valid JSON
    let parsedData
    try {
      parsedData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("JSON parsing error on model output:", responseText)
      return res.status(502).json({
        error: "Malformed Model Output",
        message: "The AI model returned text that could not be parsed as valid JSON.",
        rawOutput: responseText
      })
    }

    res.json(parsedData)
  } catch (error) {
    console.error("Gemini Generation Error:", error)
    
    // Provide diagnostic details for common API issues
    const status = error.status || 500
    res.status(status).json({
      error: "AI Generation Failed",
      message: error.message || "An error occurred while generating study materials.",
      details: error.statusText || null
    })
  }
}
