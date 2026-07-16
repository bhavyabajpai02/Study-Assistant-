import mongoose from "mongoose"

const flashcardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: "General"
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
  },
  tags: {
    type: [String],
    default: []
  },
  isLearned: {
    type: Boolean,
    default: false
  },
  forRevision: {
    type: Boolean,
    default: false
  },
  bookmarked: {
    type: Boolean,
    default: false
  },
  favorite: {
    type: Boolean,
    default: false
  }
})

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  correctIndex: {
    type: Number,
    required: true
  },
  explanation: {
    type: String,
    required: true
  }
})

const keyPointSchema = new mongoose.Schema({
  concept: {
    type: String,
    required: true
  },
  definition: {
    type: String,
    required: true
  },
  formula: {
    type: String,
    default: ""
  }
})

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  estimatedReadingTime: {
    type: String,
    default: "5 min"
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
  },
  flashcards: {
    type: [flashcardSchema],
    default: []
  },
  quiz: {
    type: [quizQuestionSchema],
    default: []
  },
  keyPoints: {
    type: [keyPointSchema],
    default: []
  },
  revisionTips: {
    type: [String],
    default: []
  },
  learningObjectives: {
    type: [String],
    default: []
  },
  recommendedRevisionDate: {
    type: String,
    default: ""
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  quizScores: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
})

export const StudySession = mongoose.model("StudySession", studySessionSchema)
