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
          topic: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
          tags: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["front", "back", "topic", "difficulty", "tags"]
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
  const { content, options } = req.body

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Please provide the study material content or topic as a non-empty string."
    })
  }

  const difficulty = options?.difficulty || "Medium"
  const lang = options?.language || "English"
  const tone = options?.outputStyle || "Academic"
  const summaryLength = options?.summaryLength || "Medium"
  const flashcardCount = options?.flashcardCount || 10
  const quizCount = options?.quizCount || 5

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Falling back to mock generator.")
    return res.status(401).json({
      error: "Missing API Key",
      message: "GEMINI_API_KEY is not configured in backend/.env. Please configure your key in the environment."
    })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
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

    Additional Customization Requirements:
    - Overall Difficulty Level: ${difficulty}
    - Document Summary Length: ${summaryLength}
    - Flashcards Count: Generate exactly ${flashcardCount} cards.
    - Quiz Questions Count: Generate exactly ${quizCount} questions.
    - Output Language: Write all textual properties in ${lang}.
    - Tone/Presentation Style: ${tone}.
    
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

    // Post-process to ensure all flashcards have a unique id and proper schema fields
    if (parsedData && Array.isArray(parsedData.flashcards)) {
      parsedData.flashcards = parsedData.flashcards.map((fc, index) => ({
        id: fc.id || `fc_${Math.random().toString(36).substr(2, 9)}_${Date.now()}_${index}`,
        front: fc.front || "",
        back: fc.back || "",
        topic: fc.topic || fc.category || "General",
        difficulty: fc.difficulty || "Medium",
        tags: Array.isArray(fc.tags) ? fc.tags : [],
        isLearned: false,
        forRevision: false,
        bookmarked: false,
        favorite: false
      }))
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

// --- Schemas for Individual Study Sections ---

const summarySchemaSingle = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    estimatedReadingTime: { type: "STRING" },
    difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] }
  },
  required: ["title", "summary", "estimatedReadingTime", "difficulty"]
}

const flashcardsSchemaSingle = {
  type: "OBJECT",
  properties: {
    flashcards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          front: { type: "STRING" },
          back: { type: "STRING" },
          topic: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
          tags: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["front", "back", "topic", "difficulty", "tags"]
      }
    }
  },
  required: ["flashcards"]
}

const quizSchemaSingle = {
  type: "OBJECT",
  properties: {
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
    }
  },
  required: ["quiz"]
}

const keyPointsSchemaSingle = {
  type: "OBJECT",
  properties: {
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
    }
  },
  required: ["keyPoints"]
}

const revisionTipsSchemaSingle = {
  type: "OBJECT",
  properties: {
    revisionTips: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ["revisionTips"]
}

// @desc    Generate only a specific section of the study guide
// @route   POST /api/generate/section
// @access  Private
export const generateStudySection = async (req, res) => {
  const { content, section, options } = req.body

  if (!content || !section) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Please provide content and section parameters."
    })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(401).json({
      error: "Missing API Key",
      message: "GEMINI_API_KEY is not configured in backend/.env."
    })
  }

  let responseSchema
  let promptInstruction = ""

  const difficulty = options?.difficulty || "Medium"
  const lang = options?.language || "English"
  const tone = options?.outputStyle || "Academic"

  switch (section) {
    case "summary":
      responseSchema = summarySchemaSingle
      promptInstruction = `Generate a structured summary, title, estimated reading time, and overall difficulty.
      Length style: ${options?.summaryLength || "Medium"}.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "flashcards":
      responseSchema = flashcardsSchemaSingle
      promptInstruction = `Generate an array of exactly ${options?.flashcardCount || 10} flashcards.
      Ensure they have a concise front question and back answer, topic/category, tags, and difficulty.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "quiz":
      responseSchema = quizSchemaSingle
      promptInstruction = `Generate a custom multiple choice quiz with exactly ${options?.quizCount || 5} questions.
      Each question must have exactly 4 options, a correctIndex (0, 1, 2, or 3), and a detailed explanation.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "keyPoints":
      responseSchema = keyPointsSchemaSingle
      promptInstruction = `Identify and extract key concepts, definitions, and any relevant formulas.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "revisionTips":
      responseSchema = revisionTipsSchemaSingle
      promptInstruction = `Draft a list of highly actionable revision strategies, study tips, or memory triggers.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    default:
      return res.status(400).json({ error: "Validation Error", message: `Unsupported section '${section}'.` })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are a senior academic tutor. Your goal is to dissect complex lecture notes and generate targeted study aids matching the requested JSON schema."
    })

    const prompt = `Analyze this study material:
    "${content}"
    
    Task: ${promptInstruction}
    
    You must output a single JSON object that conforms STRICTLY to the required JSON schema.
    Return only valid JSON. No markdown blocks, no leading/trailing tags.`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2
      }
    })

    const responseText = result.response?.text()
    if (!responseText) {
      throw new Error("Empty response received from Gemini API.")
    }

    let parsedData = JSON.parse(responseText)

    // Post-process flashcards to ensure unique IDs and status flags
    if (section === "flashcards" && parsedData && Array.isArray(parsedData.flashcards)) {
      parsedData.flashcards = parsedData.flashcards.map((fc, index) => ({
        id: fc.id || `fc_${Math.random().toString(36).substr(2, 9)}_${Date.now()}_${index}`,
        front: fc.front || "",
        back: fc.back || "",
        topic: fc.topic || fc.category || "General",
        difficulty: fc.difficulty || difficulty,
        tags: Array.isArray(fc.tags) ? fc.tags : [],
        isLearned: false,
        forRevision: false,
        bookmarked: false,
        favorite: false
      }))
    }

    res.json(parsedData)
  } catch (error) {
    console.error(`Gemini section generation error (${section}):`, error)
    res.status(500).json({
      error: "AI Generation Failed",
      message: error.message || "An error occurred while generating study materials."
    })
  }
}
