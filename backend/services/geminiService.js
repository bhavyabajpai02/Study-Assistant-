import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"

// Initialize state
let genAI = null
let modelInstance = null

export const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === "") {
    return null
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
    modelInstance = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are a senior academic tutor and learning experience designer. Your goal is to dissect complex lecture notes, books, or ideas into extremely structured study aids."
    })
  }
  return modelInstance
}

// Check if Gemini is configured
export const isGeminiConfigured = () => {
  const apiKey = process.env.GEMINI_API_KEY
  return !!(apiKey && apiKey.trim() !== "")
}

// Zod Schemas for Validation
const flashcardZodSchema = z.object({
  id: z.string().optional(),
  front: z.string().default("Key Term"),
  back: z.string().default("Review details in summary."),
  topic: z.string().default("General"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  tags: z.array(z.string()).default([]),
  isLearned: z.boolean().default(false),
  forRevision: z.boolean().default(false),
  bookmarked: z.boolean().default(false),
  favorite: z.boolean().default(false)
})

const quizQuestionZodSchema = z.object({
  question: z.string().default("Comprehension question?"),
  options: z.array(z.string()).default(["Option 1", "Option 2", "Option 3", "Option 4"]),
  correctIndex: z.number().int().min(0).max(3).default(0),
  explanation: z.string().default("Review materials for details.")
})

const keyPointZodSchema = z.object({
  concept: z.string().default("Concept key"),
  definition: z.string().default("Concept details"),
  formula: z.string().optional().nullable().default(null)
})

const studyZodSchema = z.object({
  title: z.string().default("Untitled Study Guide"),
  summary: z.string().default("A study guide generated from the provided material."),
  estimatedReadingTime: z.string().default("5 min read"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  flashcards: z.array(flashcardZodSchema).default([]),
  quiz: z.array(quizQuestionZodSchema).default([]),
  keyPoints: z.array(keyPointZodSchema).default([]),
  revisionTips: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  recommendedRevisionDate: z.string().default("In 2 days")
})

// Single Section Schemas
const summaryZodSchema = z.object({
  title: z.string().default("Untitled Summary"),
  summary: z.string().default("Overview of notes."),
  estimatedReadingTime: z.string().default("5 min read"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium")
})

const flashcardsArrayZodSchema = z.object({
  flashcards: z.array(flashcardZodSchema).default([])
})

const quizArrayZodSchema = z.object({
  quiz: z.array(quizQuestionZodSchema).default([])
})

const keyPointsArrayZodSchema = z.object({
  keyPoints: z.array(keyPointZodSchema).default([])
})

const revisionTipsArrayZodSchema = z.object({
  revisionTips: z.array(z.string()).default([])
})

// Backoff Helper
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const executeWithRetry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 1) throw error
    console.warn(`⚠️ Gemini request failed. Retrying in ${delay}ms... Error: ${error.message}`)
    await wait(delay)
    return executeWithRetry(fn, retries - 1, delay * 2)
  }
}

// Repair and default fallback generators
const repairAndValidateStudy = (data, sourceText = "") => {
  const result = studyZodSchema.safeParse(data)
  if (result.success) return result.data

  console.warn("🔧 AI Study Guide validation failed. Repairing defaults...", result.error.errors)

  const repaired = { ...data }
  if (!repaired.title || typeof repaired.title !== "string") repaired.title = "Untitled Study Guide"
  if (!repaired.summary || typeof repaired.summary !== "string") repaired.summary = "A detailed study guide."
  if (!repaired.estimatedReadingTime) {
    const w = sourceText.split(/\s+/).length
    repaired.estimatedReadingTime = `${Math.max(1, Math.ceil(w / 200))} min read`
  }
  if (!["Easy", "Medium", "Hard"].includes(repaired.difficulty)) repaired.difficulty = "Medium"

  if (!Array.isArray(repaired.flashcards) || repaired.flashcards.length === 0) {
    repaired.flashcards = [{ front: "Core Concept", back: "Review session notes summary.", topic: "General", difficulty: "Medium", tags: [] }]
  }
  if (!Array.isArray(repaired.quiz) || repaired.quiz.length === 0) {
    repaired.quiz = [{ question: "Review check?", options: ["Option A", "Option B", "Option C", "Option D"], correctIndex: 0, explanation: "Correct answer choice is A." }]
  }
  if (!Array.isArray(repaired.keyPoints) || repaired.keyPoints.length === 0) {
    repaired.keyPoints = [{ concept: "Main Theme", definition: "Primary subject of study notes." }]
  }
  if (!Array.isArray(repaired.revisionTips) || repaired.revisionTips.length === 0) {
    repaired.revisionTips = ["Spaced repetition: Review these points again in 48 hours."]
  }
  if (!Array.isArray(repaired.learningObjectives) || repaired.learningObjectives.length === 0) {
    repaired.learningObjectives = ["Recall core terms", "Explain concept definitions"]
  }
  if (!repaired.recommendedRevisionDate) repaired.recommendedRevisionDate = "In 2 days"

  return studyZodSchema.parse(repaired)
}

const repairAndValidateSection = (data, section) => {
  let schema = null
  switch (section) {
    case "summary": schema = summaryZodSchema; break
    case "flashcards": schema = flashcardsArrayZodSchema; break
    case "quiz": schema = quizArrayZodSchema; break
    case "keyPoints": schema = keyPointsArrayZodSchema; break
    case "revisionTips": schema = revisionTipsArrayZodSchema; break
    default: throw new Error(`Unsupported section type: ${section}`)
  }

  const result = schema.safeParse(data)
  if (result.success) return result.data

  console.warn(`🔧 AI ${section} section validation failed. Repairing...`, result.error.errors)
  const repaired = { ...data }

  if (section === "summary") {
    if (!repaired.title) repaired.title = "Untitled Summary"
    if (!repaired.summary) repaired.summary = "A detailed summary overview."
    if (!repaired.estimatedReadingTime) repaired.estimatedReadingTime = "5 min read"
    if (!["Easy", "Medium", "Hard"].includes(repaired.difficulty)) repaired.difficulty = "Medium"
  } else if (section === "flashcards") {
    if (!Array.isArray(repaired.flashcards) || repaired.flashcards.length === 0) {
      repaired.flashcards = [{ front: "Key Term", back: "Review definitions.", topic: "General", difficulty: "Medium", tags: [] }]
    }
  } else if (section === "quiz") {
    if (!Array.isArray(repaired.quiz) || repaired.quiz.length === 0) {
      repaired.quiz = [{ question: "Comprehension test?", options: ["Choice A", "Choice B", "Choice C", "Choice D"], correctIndex: 0, explanation: "Answer is A." }]
    }
  } else if (section === "keyPoints") {
    if (!Array.isArray(repaired.keyPoints) || repaired.keyPoints.length === 0) {
      repaired.keyPoints = [{ concept: "Core Term", definition: "Concept definition." }]
    }
  } else if (section === "revisionTips") {
    if (!Array.isArray(repaired.revisionTips) || repaired.revisionTips.length === 0) {
      repaired.revisionTips = ["Spaced review recommended."]
    }
  }

  return schema.parse(repaired)
}

// Generate Full Study Material
export const generateStudyMaterial = async (content, options = {}) => {
  const model = initializeGemini()
  if (!model) {
    throw new Error("AI_SERVICES_UNAVAILABLE")
  }

  const difficulty = options.difficulty || "Medium"
  const lang = options.language || "English"
  const tone = options.outputStyle || "Academic"
  const summaryLength = options.summaryLength || "Medium"
  const flashcardCount = options.flashcardCount || 10
  const quizCount = options.quizCount || 5

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

  const fetchAction = async () => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })

    const responseText = result.response?.text()
    if (!responseText) throw new Error("Empty response received from Gemini.")
    return responseText
  }

  try {
    const rawJSON = await executeWithRetry(fetchAction)
    const cleanedJSON = rawJSON.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim()
    const parsedData = JSON.parse(cleanedJSON)
    return repairAndValidateStudy(parsedData, content)
  } catch (error) {
    console.error("Gemini service full generate failed:", error)
    throw error
  }
}

// Generate Section Study Material
export const generateStudySection = async (content, section, options = {}) => {
  const model = initializeGemini()
  if (!model) {
    throw new Error("AI_SERVICES_UNAVAILABLE")
  }

  const lang = options.language || "English"
  const tone = options.outputStyle || "Academic"

  let promptInstruction = ""
  switch (section) {
    case "summary":
      promptInstruction = `Generate a structured summary, title, estimated reading time, and overall difficulty.
      Length style: ${options.summaryLength || "Medium"}.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "flashcards":
      promptInstruction = `Generate an array of exactly ${options.flashcardCount || 10} flashcards.
      Ensure they have a concise front question and back answer, topic/category, tags, and difficulty.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "quiz":
      promptInstruction = `Generate a custom multiple choice quiz with exactly ${options.quizCount || 5} questions.
      Each question must have exactly 4 options, a correctIndex (0, 1, 2, or 3), and a detailed explanation.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "keyPoints":
      promptInstruction = `Identify and extract key concepts, definitions, and any relevant formulas.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    case "revisionTips":
      promptInstruction = `Draft a list of highly actionable revision strategies, study tips, or memory triggers.
      Language: ${lang}.
      Tone: ${tone}.`
      break
    default:
      throw new Error(`Unsupported section type: ${section}`)
  }

  const prompt = `Analyze this study material:
  "${content}"
  
  Task: ${promptInstruction}
  
  You must output a single JSON object that conforms STRICTLY to the required JSON schema.
  Return only valid JSON. No markdown blocks, no leading/trailing tags.`

  const fetchAction = async () => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })

    const responseText = result.response?.text()
    if (!responseText) throw new Error("Empty response received from Gemini.")
    return responseText
  }

  try {
    const rawJSON = await executeWithRetry(fetchAction)
    const cleanedJSON = rawJSON.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim()
    const parsedData = JSON.parse(cleanedJSON)
    return repairAndValidateSection(parsedData, section)
  } catch (error) {
    console.error(`Gemini service section generate failed (${section}):`, error)
    throw error
  }
}
