import { Router } from "express"
import { getSessions, createSession, getSessionById, updateSession, deleteSession } from "../controllers/sessionController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = Router()

// Protect all routes inside this file
router.use(protect)

router.route("/")
  .get(getSessions)
  .post(createSession)

router.route("/:id")
  .get(getSessionById)
  .put(updateSession)
  .delete(deleteSession)

export { router as sessionRouter }
