import axios from "axios"
import { studySchema } from "../validators/studySchema"

let activeController = null

/**
 * Attempts to repair basic schema discrepancies if Zod validation fails.
 */
function repairSchemaDefaults(data, sourceContent = "") {
  if (!data || typeof data !== "object") return null

  const repaired = { ...data }

  if (!repaired.title || typeof repaired.title !== "string") {
    repaired.title = "Untitled Study Session"
  }
  if (!repaired.summary || typeof repaired.summary !== "string") {
    repaired.summary = "A study guide generated from the provided material."
  }
  if (!repaired.estimatedReadingTime || typeof repaired.estimatedReadingTime !== "string") {
    const wordCount = sourceContent.split(/\s+/).length
    const mins = Math.max(1, Math.ceil(wordCount / 200))
    repaired.estimatedReadingTime = `${mins} min read`
  }
  if (!["Easy", "Medium", "Hard"].includes(repaired.difficulty)) {
    repaired.difficulty = "Medium"
  }

  // Ensure flashcards array
  if (!Array.isArray(repaired.flashcards) || repaired.flashcards.length === 0) {
    repaired.flashcards = [
      {
        front: "Core Concept",
        back: "Please review the summary for the detailed overview of this topic.",
        category: "General"
      }
    ]
  } else {
    repaired.flashcards = repaired.flashcards.map((f, i) => ({
      front: f.front || `Flashcard Question ${i + 1}`,
      back: f.back || `Flashcard Answer ${i + 1}`,
      category: f.category || "General"
    }))
  }

  // Ensure quiz array
  if (!Array.isArray(repaired.quiz) || repaired.quiz.length === 0) {
    repaired.quiz = [
      {
        question: `Comprehension Check: What is the main subject of "${repaired.title}"?`,
        options: [
          repaired.title,
          "An unrelated alternative topic",
          "A collection of general summaries",
          "None of the above"
        ],
        correctIndex: 0,
        explanation: "Based on the generated title, the principal topic represents the correct learning path."
      }
    ]
  } else {
    repaired.quiz = repaired.quiz.map(q => {
      let opts = Array.isArray(q.options) ? [...q.options] : []
      while (opts.length < 4) {
        opts.push(`Alternative Option ${opts.length + 1}`)
      }
      opts = opts.slice(0, 4)

      let correct = parseInt(q.correctIndex)
      if (isNaN(correct) || correct < 0 || correct > 3) {
        correct = 0
      }

      return {
        question: q.question || "Comprehension question?",
        options: opts,
        correctIndex: correct,
        explanation: q.explanation || "Review study materials for detailed evidence."
      }
    })
  }

  // Ensure keyPoints array
  if (!Array.isArray(repaired.keyPoints) || repaired.keyPoints.length === 0) {
    repaired.keyPoints = [
      {
        concept: repaired.title,
        definition: repaired.summary.substring(0, 100) + "...",
        formula: null
      }
    ]
  } else {
    repaired.keyPoints = repaired.keyPoints.map(kp => ({
      concept: kp.concept || "Concept Key",
      definition: kp.definition || "Concept definition detail.",
      formula: kp.formula || null
    }))
  }

  // String arrays
  if (!Array.isArray(repaired.revisionTips) || repaired.revisionTips.length === 0) {
    repaired.revisionTips = ["Spaced repetition: Review these cards tomorrow, and again in 3 days."]
  }
  if (!Array.isArray(repaired.learningObjectives) || repaired.learningObjectives.length === 0) {
    repaired.learningObjectives = ["Recall definitions", "Pass the topic comprehension quiz"]
  }
  if (!repaired.recommendedRevisionDate || typeof repaired.recommendedRevisionDate !== "string") {
    repaired.recommendedRevisionDate = "In 2 days"
  }

  return repaired
}

export const generateStudyMaterial = async (content) => {
  // Cancel any active running request
  if (activeController) {
    activeController.abort()
  }

  activeController = new AbortController()

  try {
    const response = await axios.post("/api/generate", { content }, {
      signal: activeController.signal,
      headers: {
        "Content-Type": "application/json"
      }
    })

    const rawData = response.data

    // Try standard validation
    try {
      return studySchema.parse(rawData)
    } catch (zodError) {
      console.warn("Zod schema validation failed. Attempting structural recovery...", zodError)
      
      const repaired = repairSchemaDefaults(rawData, content)
      
      // Re-validate the repaired object
      return studySchema.parse(repaired)
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new Error("REQUEST_CANCELLED")
    }

    if (error.name === "ZodError") {
      console.error("Critical Schema Mismatch after repair attempt:", error.errors)
      throw new Error("The AI response was malformed and could not be successfully repaired to fit the application.")
    }

    const backendMsg = error.response?.data?.message || error.response?.data?.error
    const errorMsg = backendMsg || error.message || "An error occurred connecting to the server."
    throw new Error(errorMsg)
  } finally {
    activeController = null
  }
}
