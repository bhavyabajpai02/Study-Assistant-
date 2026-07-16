import { Router } from "express"
import { generateStudyMaterial } from "../controllers/aiController.js"

const router = Router()

// POST /api/generate
router.post("/", generateStudyMaterial)

export { router as aiRouter }
