import express from "express"
import { protect } from "../middleware/authMiddleware.js"
import {
  handleChat,
  getConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  clearConversation
} from "../controllers/assistantController.js"

const router = express.Router()

// All routes are protected by JWT auth
router.use(protect)

router.post("/chat", handleChat)
router.get("/conversations", getConversations)
router.post("/conversations", createConversation)
router.get("/conversations/:id", getConversationById)
router.delete("/conversations/:id", deleteConversation)
router.put("/conversations/:id/clear", clearConversation)

export const assistantRouter = router
