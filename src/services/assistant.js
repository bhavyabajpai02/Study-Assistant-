import axios from "axios"

/**
 * Send chat message to AI Tutor
 * @param {Object} payload - { message, conversationId, context }
 */
export const sendChatMessage = async ({ message, conversationId, context }) => {
  const response = await axios.post("/api/assistant/chat", {
    message,
    conversationId,
    context
  })
  return response.data
}

/**
 * Get all conversations for current user
 */
export const getConversations = async () => {
  const response = await axios.get("/api/assistant/conversations")
  return response.data
}

/**
 * Get specific conversation details by ID
 */
export const getConversationById = async (id) => {
  const response = await axios.get(`/api/assistant/conversations/${id}`)
  return response.data
}

/**
 * Create a new conversation
 */
export const createConversation = async ({ title, context } = {}) => {
  const response = await axios.post("/api/assistant/conversations", {
    title,
    context
  })
  return response.data
}

/**
 * Delete conversation
 */
export const deleteConversation = async (id) => {
  const response = await axios.delete(`/api/assistant/conversations/${id}`)
  return response.data
}

/**
 * Clear messages in conversation
 */
export const clearConversation = async (id) => {
  const response = await axios.put(`/api/assistant/conversations/${id}/clear`)
  return response.data
}
