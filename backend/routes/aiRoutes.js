import { Router } from "express"
import { generateStudyMaterial } from "../controllers/aiController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = Router()

// POST /api/generate (Protected)
router.post("/", protect, generateStudyMaterial)

export { router as aiRouter }
