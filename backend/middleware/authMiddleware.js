import { verifyToken } from "../utils/jwt.js"
import { User } from "../models/User.js"

export const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]
      const decoded = verifyToken(token)

      req.user = await User.findById(decoded.id).select("-password")
      if (!req.user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User associated with this token no longer exists."
        })
      }

      return next()
    } catch (error) {
      console.error("Auth middleware JWT verification error:", error)
      return res.status(401).json({
        error: "Unauthorized",
        message: "Not authorized, token validation failed."
      })
    }
  }

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Not authorized, no login token provided."
    })
  }
}
