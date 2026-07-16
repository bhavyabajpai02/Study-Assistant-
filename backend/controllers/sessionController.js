import { StudySession } from "../models/StudySession.js"

// @desc    Get all study sessions for active user
// @route   GET /api/sessions
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id }).sort({ createdAt: -1 })
    
    // Map _id to id to ensure frontend compatibility
    const mappedSessions = sessions.map(session => {
      const obj = session.toObject()
      obj.id = obj._id.toString()
      return obj
    })

    res.json(mappedSessions)
  } catch (error) {
    console.error("Fetch sessions error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Create new study session
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  const {
    title,
    summary,
    estimatedReadingTime,
    difficulty,
    flashcards,
    quiz,
    keyPoints,
    revisionTips,
    learningObjectives,
    recommendedRevisionDate,
    originalNotes,
    generationSettings
  } = req.body

  if (!title || !summary) {
    return res.status(400).json({ error: "Validation Error", message: "Title and summary are required." })
  }

  try {
    const session = await StudySession.create({
      userId: req.user._id,
      title,
      summary,
      estimatedReadingTime,
      difficulty,
      flashcards: flashcards || [],
      quiz: quiz || [],
      keyPoints: keyPoints || [],
      revisionTips: revisionTips || [],
      learningObjectives: learningObjectives || [],
      recommendedRevisionDate: recommendedRevisionDate || "",
      originalNotes: originalNotes || "",
      generationSettings: generationSettings || {}
    })

    const obj = session.toObject()
    obj.id = obj._id.toString()

    res.status(201).json(obj)
  } catch (error) {
    console.error("Create session error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Get single study session
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = async (req, res) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, userId: req.user._id })
    
    if (!session) {
      return res.status(404).json({ error: "Not Found", message: "Study session not found or access denied." })
    }

    const obj = session.toObject()
    obj.id = obj._id.toString()

    res.json(obj)
  } catch (error) {
    console.error("Get session error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Update study session
// @route   PUT /api/sessions/:id
// @access  Private
export const updateSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, userId: req.user._id })

    if (!session) {
      return res.status(404).json({ error: "Not Found", message: "Study session not found or access denied." })
    }

    const fieldsToUpdate = [
      "title",
      "summary",
      "estimatedReadingTime",
      "difficulty",
      "flashcards",
      "quiz",
      "keyPoints",
      "revisionTips",
      "learningObjectives",
      "recommendedRevisionDate",
      "isFavorite",
      "quizScores",
      "originalNotes",
      "generationSettings"
    ]

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        session[field] = req.body[field]
      }
    })

    const updatedSession = await session.save()
    const obj = updatedSession.toObject()
    obj.id = obj._id.toString()

    res.json(obj)
  } catch (error) {
    console.error("Update session error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Delete study session
// @route   DELETE /api/sessions/:id
// @access  Private
export const deleteSession = async (req, res) => {
  try {
    const result = await StudySession.deleteOne({ _id: req.params.id, userId: req.user._id })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not Found", message: "Study session not found or access denied." })
    }

    res.json({ message: "Study session deleted successfully." })
  } catch (error) {
    console.error("Delete session error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}
