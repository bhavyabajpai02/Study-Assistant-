import { z } from "zod"

export const flashcardSchema = z.object({
  id: z.string().optional(),
  front: z.string().min(1, "Question is required"),
  back: z.string().min(1, "Answer is required"),
  category: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isLearned: z.boolean().optional(),
  forRevision: z.boolean().optional(),
  bookmarked: z.boolean().optional(),
  favorite: z.boolean().optional()
})

export const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).length(4, "Exactly 4 options are required"),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1, "Explanation is required")
})

export const keyPointSchema = z.object({
  concept: z.string().min(1, "Concept name is required"),
  definition: z.string().min(1, "Definition is required"),
  formula: z.string().optional().nullable()
})

export const studySchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  estimatedReadingTime: z.string().min(1, "Reading time is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  flashcards: z.array(flashcardSchema).min(1, "At least one flashcard is required"),
  quiz: z.array(quizQuestionSchema).min(1, "At least one quiz question is required"),
  keyPoints: z.array(keyPointSchema).min(1, "At least one key concept is required"),
  revisionTips: z.array(z.string()).min(1),
  learningObjectives: z.array(z.string()).min(1),
  recommendedRevisionDate: z.string().min(1)
})
