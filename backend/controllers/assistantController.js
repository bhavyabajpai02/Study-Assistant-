import mongoose from "mongoose"
import { Conversation } from "../models/Conversation.js"
import { chatWithTutor } from "../services/geminiService.js"

// @desc    Chat with AI Tutor (Send user message & get tutor response)
// @route   POST /api/assistant/chat
// @access  Private
export const handleChat = async (req, res) => {
  try {
    const { message, conversationId, context } = req.body
    const userId = req.user?._id

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User session expired or invalid. Please log in again."
      })
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Message content cannot be empty."
      })
    }

    let conversation = null

    // If conversationId is provided and is a valid MongoDB ObjectId, find existing conversation
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      try {
        conversation = await Conversation.findOne({ _id: conversationId, userId })
      } catch (dbErr) {
        console.warn("⚠️ Failed to query conversation by ID, starting fresh session:", dbErr.message)
      }
    }

    // Prepare context payload safely
    const safeContext = typeof context === "object" && context !== null ? context : { topic: typeof context === "string" ? context : "" }

    // If not found or new chat, create a new conversation document
    if (!conversation) {
      const chatTitle = safeContext.topic || (message.length > 35 ? `${message.substring(0, 35)}...` : message)
      conversation = new Conversation({
        userId,
        title: chatTitle || "New Study Chat",
        studyContext: safeContext,
        messages: []
      })
    } else if (safeContext.topic || safeContext.studyMaterial) {
      // Update context if fresh context is passed
      conversation.studyContext = {
        ...(conversation.studyContext || {}),
        ...safeContext
      }
    }

    // Call Gemini Service with current history and context
    const aiAnswer = await chatWithTutor(conversation.messages || [], message.trim(), conversation.studyContext)

    // Append user message & AI response to conversation
    conversation.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date()
    })

    conversation.messages.push({
      role: "assistant",
      content: aiAnswer,
      timestamp: new Date()
    })

    // Update conversation title if default title
    if (conversation.title === "New Study Chat" && message) {
      conversation.title = message.length > 35 ? `${message.substring(0, 35)}...` : message
    }

    // Attempt to save conversation to DB without blocking response if DB encounters transient issue
    try {
      await conversation.save()
    } catch (saveErr) {
      console.error("⚠️ Failed to persist conversation history to DB:", saveErr.message)
    }

    return res.json({
      success: true,
      message: aiAnswer,
      conversationId: conversation._id,
      conversation
    })
  } catch (error) {
    console.error("❌ AI Assistant Controller Error:", error)

    if (error.message === "AI_SERVICES_UNAVAILABLE") {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "AI Tutor service is currently offline or GEMINI_API_KEY is missing."
      })
    }

    const errorDetail = error.message || ""
    if (errorDetail.includes("quota") || errorDetail.includes("429")) {
      return res.status(429).json({
        error: "Rate Limit Exceeded",
        message: "AI Tutor usage limit reached. Please try again in a few moments."
      })
    }

    return res.status(502).json({
      error: "Bad Gateway",
      message: "The AI Tutor service encountered an issue generating a response. Please try again."
    })
  }
}

// @desc    Get all conversations for logged-in user
// @route   GET /api/assistant/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id
    const conversations = await Conversation.find({ userId })
      .select("_id title studyContext createdAt updatedAt messages")
      .sort({ updatedAt: -1 })

    // Map to include snippet of last message
    const formatted = conversations.map(c => ({
      id: c._id,
      title: c.title,
      studyContext: c.studyContext,
      messageCount: c.messages.length,
      lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1].content.substring(0, 80) : "",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))

    res.json(formatted)
  } catch (error) {
    console.error("Fetch conversations error:", error)
    res.status(500).json({ error: "Internal Server Error", message: "Failed to load chat history." })
  }
}

// @desc    Get single conversation with full message history
// @route   GET /api/assistant/conversations/:id
// @access  Private
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const conversation = await Conversation.findOne({ _id: id, userId })
    if (!conversation) {
      return res.status(404).json({ error: "Not Found", message: "Conversation not found." })
    }

    res.json(conversation)
  } catch (error) {
    console.error("Get conversation by ID error:", error)
    res.status(500).json({ error: "Internal Server Error", message: "Failed to load conversation details." })
  }
}

// @desc    Create a new empty conversation
// @route   POST /api/assistant/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const userId = req.user._id
    const { title, context } = req.body

    const conversation = new Conversation({
      userId,
      title: title || "New Study Chat",
      studyContext: context || {},
      messages: []
    })

    await conversation.save()
    res.status(201).json(conversation)
  } catch (error) {
    console.error("Create conversation error:", error)
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create conversation." })
  }
}

// @desc    Delete a conversation
// @route   DELETE /api/assistant/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId })
    if (!conversation) {
      return res.status(404).json({ error: "Not Found", message: "Conversation not found." })
    }

    res.json({ success: true, message: "Conversation deleted successfully." })
  } catch (error) {
    console.error("Delete conversation error:", error)
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete conversation." })
  }
}

// @desc    Clear messages in conversation
// @route   PUT /api/assistant/conversations/:id/clear
// @access  Private
export const clearConversation = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const conversation = await Conversation.findOne({ _id: id, userId })
    if (!conversation) {
      return res.status(404).json({ error: "Not Found", message: "Conversation not found." })
    }

    conversation.messages = []
    await conversation.save()

    res.json(conversation)
  } catch (error) {
    console.error("Clear conversation error:", error)
    res.status(500).json({ error: "Internal Server Error", message: "Failed to clear conversation." })
  }
}
