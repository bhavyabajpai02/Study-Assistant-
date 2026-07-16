import { User } from "../models/User.js"
import { hashPassword, comparePassword } from "../utils/password.js"
import { generateToken } from "../utils/jwt.js"

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Validation Error", message: "Please enter all fields (name, email, password)." })
  }

  try {
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ error: "Validation Error", message: "User with this email already exists." })
    }

    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        streak: user.streak,
        lastActiveDate: user.lastActiveDate,
        unlockedAchievements: user.unlockedAchievements,
        token: generateToken(user._id)
      })
    } else {
      res.status(400).json({ error: "Bad Request", message: "Invalid user data." })
    }
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "Validation Error", message: "Please enter both email and password." })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid email or password." })
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid email or password." })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
      unlockedAchievements: user.unlockedAchievements,
      token: generateToken(user._id)
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Get user profile details
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        streak: user.streak,
        lastActiveDate: user.lastActiveDate,
        unlockedAchievements: user.unlockedAchievements
      })
    } else {
      res.status(404).json({ error: "Not Found", message: "User not found." })
    }
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}

// @desc    Update user study statistics
// @route   PUT /api/auth/stats
// @access  Private
export const updateUserStats = async (req, res) => {
  const { xp, streak, lastActiveDate, unlockedAchievements } = req.body

  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: "User not found." })
    }

    if (xp !== undefined) user.xp = xp
    if (streak !== undefined) user.streak = streak
    if (lastActiveDate !== undefined) user.lastActiveDate = lastActiveDate
    if (unlockedAchievements !== undefined) user.unlockedAchievements = unlockedAchievements

    const updatedUser = await user.save()
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      xp: updatedUser.xp,
      streak: updatedUser.streak,
      lastActiveDate: updatedUser.lastActiveDate,
      unlockedAchievements: updatedUser.unlockedAchievements
    })
  } catch (error) {
    console.error("Stats update error:", error)
    res.status(500).json({ error: "Internal Server Error", message: error.message })
  }
}
