import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useStudy } from "../context/StudyContext"
import { useAuth } from "../context/AuthContext"
import {
  sendChatMessage,
  getConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  clearConversation
} from "../services/assistant"
import MarkdownRenderer from "../components/ui/MarkdownRenderer"
import { toast } from "react-hot-toast"
import {
  Bot,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  HelpCircle,
  BookOpen,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap,
  Check,
  AlertCircle,
  Terminal,
  FileText,
  Lightbulb,
  Briefcase,
  HelpCircle as QuizIcon
} from "lucide-react"

export default function AIAssistantPage() {
  const { user } = useAuth()
  const { activeSession, sessions } = useStudy()
  const location = useLocation()
  const navigate = useNavigate()

  // State
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [studyContext, setStudyContext] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory()
  }, [])

  // Handle location state passed from Study Session page ("Ask AI about this material" or text highlight)
  useEffect(() => {
    if (location.state?.context) {
      setStudyContext(location.state.context)
    } else if (activeSession) {
      setStudyContext({
        sessionId: activeSession.id,
        topic: activeSession.title,
        studyMaterial: activeSession.summary
      })
    }

    if (location.state?.initialPrompt) {
      const prompt = location.state.initialPrompt
      const ctx = location.state.context || (activeSession ? {
        sessionId: activeSession.id,
        topic: activeSession.title,
        studyMaterial: activeSession.summary
      } : null)
      
      // Clear location state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title)
      
      // Execute initial prompt automatically
      handleSendMessage(prompt, ctx)
    }
  }, [location.state, activeSession])

  const loadChatHistory = async () => {
    try {
      const list = await getConversations()
      setConversations(list)
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }

  const selectConversation = async (convId) => {
    setActiveConversationId(convId)
    try {
      const details = await getConversationById(convId)
      setMessages(details.messages || [])
      setStudyContext(details.studyContext || null)
    } catch (error) {
      console.error("Failed to load conversation details:", error)
      toast.error("Failed to load chat messages.")
    }
  }

  const handleStartNewChat = async (contextToUse = studyContext) => {
    try {
      const newConv = await createConversation({
        title: contextToUse?.topic ? `Chat: ${contextToUse.topic}` : "New Study Chat",
        context: contextToUse || {}
      })
      setConversations(prev => [
        {
          id: newConv._id,
          title: newConv.title,
          studyContext: newConv.studyContext,
          messageCount: 0,
          lastMessage: "",
          updatedAt: newConv.updatedAt
        },
        ...prev
      ])
      setActiveConversationId(newConv._id)
      setMessages([])
      toast.success("Started new conversation")
    } catch (error) {
      console.error("New chat error:", error)
      toast.error("Failed to start new conversation.")
    }
  }

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation()
    try {
      await deleteConversation(convId)
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConversationId === convId) {
        setActiveConversationId(null)
        setMessages([])
      }
      toast.success("Conversation deleted")
    } catch (error) {
      console.error("Delete conversation error:", error)
      toast.error("Failed to delete conversation.")
    }
  }

  const handleClearMessages = async () => {
    if (!activeConversationId) {
      setMessages([])
      return
    }
    try {
      await clearConversation(activeConversationId)
      setMessages([])
      toast.success("Conversation cleared")
    } catch (error) {
      console.error("Clear messages error:", error)
      toast.error("Failed to clear messages.")
    }
  }

  const handleSendMessage = async (textToSend = inputMessage, customContext = studyContext) => {
    const trimmed = textToSend.trim()
    if (!trimmed || loading) return

    setInputMessage("")

    // Optimistically add user message to feed
    const tempUserMsg = {
      role: "user",
      content: trimmed,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const response = await sendChatMessage({
        message: trimmed,
        conversationId: activeConversationId,
        context: customContext
      })

      if (response.success) {
        if (!activeConversationId && response.conversationId) {
          setActiveConversationId(response.conversationId)
        }
        
        // Refresh conversations list snippet
        loadChatHistory()

        // Update full message history
        if (response.conversation?.messages) {
          setMessages(response.conversation.messages)
        } else {
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: response.message, timestamp: new Date() }
          ])
        }
      }
    } catch (error) {
      console.error("Send message error:", error)
      const errorMsg = error.response?.data?.message || "Sorry, I couldn't generate a response right now. Please try again."
      toast.error(errorMsg)
      
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error**: ${errorMsg}`,
          timestamp: new Date()
        }
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Quick Action Prompts
  const quickActions = [
    { label: "Explain Simply", icon: Lightbulb, prompt: "Explain this topic in simple, beginner-friendly terms with an everyday analogy." },
    { label: "Give Example", icon: FileText, prompt: "Give me a practical, step-by-step example illustrating this concept." },
    { label: "Quiz Me", icon: QuizIcon, prompt: "Quiz me on this chapter! Ask me 3 challenging questions one at a time." },
    { label: "Summarize", icon: Brain, prompt: "Provide a concise bulleted summary of the main points of this topic." },
    { label: "Key Points", icon: Sparkles, prompt: "Extract the top 5 key concepts and definitions I need to remember." },
    { label: "Interview Questions", icon: Briefcase, prompt: "Give me 5 technical interview questions and answers for this topic." }
  ]

  // Suggested Starter Cards for Empty State
  const starterQuestions = [
    { title: "Explain Polymorphism", desc: "Understand OOP dynamic dispatch & inheritance", query: "What is polymorphism? Explain with a simple code example." },
    { title: "TCP vs UDP", desc: "Compare networking protocols", query: "What is the difference between TCP and UDP? Give real-world use cases." },
    { title: "CPU Scheduling", desc: "Operating systems process management", query: "Explain CPU scheduling algorithms like Round Robin and FCFS." },
    { title: "Quiz Me On Current Topic", desc: "Interactive comprehension check", query: studyContext?.topic ? `Quiz me on ${studyContext.topic}!` : "Quiz me on computer science fundamentals!" }
  ]

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] bg-zinc-950/40 relative overflow-hidden select-none font-sans">
      
      {/* --- SIDEBAR / DRAWER: CHAT HISTORY --- */}
      <aside
        className={`fixed md:relative z-30 inset-y-0 left-0 w-64 bg-zinc-950/90 border-r border-zinc-800/80 backdrop-blur-md flex flex-col justify-between transition-all duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
        }`}
      >
        <div className="flex flex-col h-full p-3 gap-3">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-zinc-900">
            <span className="text-xs font-extrabold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Chat History
            </span>
            <button
              onClick={() => handleStartNewChat()}
              className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Context Selector Card */}
          <div className="bg-zinc-900/60 border border-zinc-850 p-2.5 rounded-xl flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-purple-400" /> Active Context
            </span>
            {studyContext?.topic ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-extrabold text-zinc-200 truncate">{studyContext.topic}</span>
                <span className="text-[10px] text-zinc-400 line-clamp-1">
                  {studyContext.studyMaterial || "Session loaded for contextual questions."}
                </span>
                <button
                  onClick={() => setStudyContext(null)}
                  className="text-[10px] text-rose-400 hover:text-rose-300 self-start mt-1 cursor-pointer"
                >
                  Clear context
                </button>
              </div>
            ) : (
              <select
                onChange={(e) => {
                  const sel = sessions.find(s => s.id === e.target.value)
                  if (sel) {
                    setStudyContext({
                      sessionId: sel.id,
                      topic: sel.title,
                      studyMaterial: sel.summary
                    })
                  } else {
                    setStudyContext(null)
                  }
                }}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-1.5 outline-none focus:border-blue-500 cursor-pointer"
                defaultValue=""
              >
                <option value="">General Study Mode (No context)</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
            {conversations.length === 0 ? (
              <div className="text-[11px] text-zinc-500 text-center py-6">
                No past conversations found. Start a new chat!
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = activeConversationId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600/20 border border-blue-500/40 text-blue-200 font-semibold"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                      <span className="truncate">{c.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN CHAT CONTAINER --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Chat Top Header */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-4 md:px-6 flex items-center justify-between select-none z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 cursor-pointer"
              title="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-zinc-100 flex items-center gap-1.5">
                  AI Study Tutor
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {studyContext?.topic ? `Context: ${studyContext.topic}` : "General Academic Assistance"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearMessages}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear current messages"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            )}
            
            <button
              onClick={() => handleStartNewChat()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
          {messages.length === 0 ? (
            /* EMPTY STATE HERO */
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 max-w-2xl mx-auto text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 border border-blue-500/30 flex items-center justify-center mb-4 shadow-2xl">
                <Brain className="w-8 h-8 text-blue-400" />
              </div>

              <h2 className="text-xl md:text-2xl font-extrabold text-zinc-100 tracking-tight">
                Your Personal AI Study Tutor
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm mt-2 max-w-md leading-relaxed">
                Ask questions about concepts, request step-by-step examples, generate practice quizzes, or dissect study notes.
              </p>

              {studyContext?.topic && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Currently Studying: <strong>{studyContext.topic}</strong></span>
                </div>
              )}

              {/* Starter Question Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full text-left">
                {starterQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sq.query)}
                    className="glass-panel border border-zinc-850 hover:border-blue-500/50 p-3.5 rounded-xl transition-all duration-200 group cursor-pointer text-left flex flex-col gap-1 hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-zinc-200 group-hover:text-blue-400 transition-colors">
                        {sq.title}
                      </span>
                      <Zap className="w-3 h-3 text-zinc-600 group-hover:text-blue-400" />
                    </div>
                    <span className="text-[11px] text-zinc-500">{sq.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGES */
            messages.map((msg, index) => {
              const isUser = msg.role === "user"
              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"} animate-fade-in`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30"
                    }`}
                  >
                    {isUser ? user?.name?.slice(0, 1).toUpperCase() || "U" : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[78%] ${
                      isUser
                        ? "bg-blue-600/20 border border-blue-500/30 text-zinc-100 p-4 rounded-2xl rounded-tr-none shadow-xl"
                        : "glass-panel border border-zinc-850 text-zinc-200 p-4 rounded-2xl rounded-tl-none shadow-xl"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1">
                      <span className="font-bold text-zinc-400">{isUser ? "You" : "AI Tutor"}</span>
                      <span>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>

                    {isUser ? (
                      <p className="whitespace-pre-wrap text-xs md:text-sm font-light leading-relaxed">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* THINKING LOADER */}
          {loading && (
            <div className="flex gap-3 max-w-4xl mr-auto animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="glass-panel border border-zinc-850 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-xs text-zinc-400 font-mono">AI Tutor is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* --- BOTTOM INPUT & QUICK ACTIONS AREA --- */}
        <div className="border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md p-3 md:p-4 flex flex-col gap-2.5 z-10">
          
          {/* Quick Study Action Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 select-none">
            {quickActions.map((qa, idx) => {
              const Icon = qa.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qa.prompt)}
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{qa.label}</span>
                </button>
              )
            })}
          </div>

          {/* Text Input Box */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 focus-within:border-blue-500 rounded-xl px-3 py-2 transition-all shadow-inner">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={studyContext?.topic ? `Ask AI Tutor about ${studyContext.topic}...` : "Ask any study question..."}
              className="flex-1 bg-transparent border-none outline-none text-zinc-100 text-xs md:text-sm placeholder-zinc-500 resize-none font-sans max-h-32"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 flex-shrink-0"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1 font-mono">
            <span>Enter to send, Shift+Enter for newline</span>
            <span>Gemini AI Tutor Powered</span>
          </div>
        </div>
      </div>
    </div>
  )
}
