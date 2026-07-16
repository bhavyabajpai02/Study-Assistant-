import { generateStudyMaterial as generateMaterialService, generateStudySection as generateSectionService } from "../services/geminiService.js"

// @desc    Generate full study material from raw content / topic
// @route   POST /api/generate
// @access  Private
export const generateStudyMaterial = async (req, res) => {
  const { content, options } = req.body

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Please provide the study material content or topic as a non-empty string."
    })
  }

  try {
    const parsedData = await generateMaterialService(content, options)

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
    console.error("AI Controller generate material failure:", error)

    if (error.message === "AI_SERVICES_UNAVAILABLE") {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "AI services are currently unavailable. Please contact the administrator or configure the backend environment."
      })
    }

    res.status(502).json({
      error: "Bad Gateway",
      message: "The AI service encountered an issue processing this request. Please try again shortly."
    })
  }
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

  try {
    const parsedData = await generateSectionService(content, section, options)

    // Post-process flashcards to ensure unique IDs and status flags
    if (section === "flashcards" && parsedData && Array.isArray(parsedData.flashcards)) {
      const difficulty = options?.difficulty || "Medium"
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
    console.error(`AI Controller generate section failure (${section}):`, error)

    if (error.message === "AI_SERVICES_UNAVAILABLE") {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "AI services are currently unavailable. Please contact the administrator or configure the backend environment."
      })
    }

    res.status(502).json({
      error: "Bad Gateway",
      message: "The AI service encountered an issue processing this request. Please try again shortly."
    })
  }
}
