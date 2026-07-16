import { Router } from "express"
import multer from "multer"
import { parseFile } from "../controllers/parserController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = Router()

// Configure multer to stage files strictly in memory
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB upload limit
  }
})

// POST /api/parse-file (Protected)
router.post("/", protect, upload.single("file"), parseFile)

export { router as parserRouter }
