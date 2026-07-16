import { Router } from "express"
import { generateStudyMaterial, generateStudySection } from "../controllers/aiController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = Router()

// POST /api/generate (Protected)
router.post("/", protect, generateStudyMaterial)

// POST /api/generate/section (Protected)
router.post("/section", protect, generateStudySection)

export { router as aiRouter }
