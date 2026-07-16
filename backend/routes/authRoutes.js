import { Router } from "express"
import { registerUser, loginUser, getUserProfile, updateUserStats } from "../controllers/authController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/me", protect, getUserProfile)
router.put("/stats", protect, updateUserStats)

export { router as authRouter }
