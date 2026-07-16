import React, { useState, useEffect } from "react"
import { useStudy } from "../context/StudyContext"
import { useAuth } from "../context/AuthContext"
import SessionList from "../components/dashboard/SessionList"
import LoadingSphere from "../components/ui/3d/LoadingSphere"
import FlashcardContainer from "../components/flashcards/FlashcardContainer"
import QuizContainer from "../components/quiz/QuizContainer"
import AnalyticsView from "../components/analytics/AnalyticsView"
import axios from "axios"
import toast from "react-hot-toast"
import { 
  Sparkles, 
  Flame, 
  Award, 
  BookOpen, 
  Plus, 
  X,
  FileText,
  Bookmark,
  Share2,
  Trash2,
  Edit,
  FolderOpen,
  Calendar,
  Compass,
  FileQuestion,
  HelpCircle,
  Lightbulb,
  UploadCloud,
  Loader,
  Play,
  RotateCw,
  FolderPlus,
  Save,
  Check,
  Star,
  Printer,
  ChevronDown
} from "lucide-react"

export default function DashboardPage() {
  const { 
    sessions, 
    activeSession, 
    setActiveSession, 
    createStudySession, 
    loading, 
    loadingStep, 
    streak, 
    xp, 
    getLevel,
    toggleFavorite,
    renameSession,
    deleteSession,
    updateSessionDetails,
    regenerateSessionSection,
    duplicateSession
  } = useStudy()

  const { user } = useAuth()

  // Studio Mode display state
  const [showStudio, setShowStudio] = useState(false)
  const [inputMethod, setInputMethod] = useState("paste") // "paste" | "upload" | "topic"

  // Text inputs state
  const [notesText, setNotesText] = useState("")
  const [topicInput, setTopicInput] = useState("")
  
  // File Upload states
  const [uploadedFile, setUploadedFile] = useState(null) // { filename, size, text }
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  // Options settings state
  const [difficulty, setDifficulty] = useState("Medium")
  const [summaryLength, setSummaryLength] = useState("Medium")
  const [flashcardCount, setFlashcardCount] = useState(10)
  const [quizCount, setQuizCount] = useState(5)
  const [language, setLanguage] = useState("English")
  const [outputStyle, setOutputStyle] = useState("Academic")
  const [contentTypes, setContentTypes] = useState({
    summary: true,
    flashcards: true,
    quiz: true,
    keyPoints: true,
    revisionTips: true
  })

  // Workspace tab state: "summary" | "flashcards" | "quiz" | "revision" | "concepts" | "analytics" | "bookmarks"
  const [activeTab, setActiveTab] = useState("summary")
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)

  // Editing workspace states
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [summaryEditVal, setSummaryEditVal] = useState("")
  
  const [isEditingConcepts, setIsEditingConcepts] = useState(false)
  const [conceptsEditVal, setConceptsEditVal] = useState([]) // array of concepts
  
  const [isEditingRevision, setIsEditingRevision] = useState(false)
  const [revisionEditVal, setRevisionEditVal] = useState("") // raw comma/newline split text
  
  const [isEditingQuiz, setIsEditingQuiz] = useState(false)
  const [quizEditVal, setQuizEditVal] = useState([]) // array of questions

  // Load Paste Draft from LocalStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("aether_study_draft")
    if (savedDraft) {
      setNotesText(savedDraft)
    }
  }, [])

  // Auto-save paste drafts
  const handleNotesChange = (val) => {
    setNotesText(val)
    localStorage.setItem("aether_study_draft", val)
  }

  const handleClearPaste = () => {
    setNotesText("")
    localStorage.removeItem("aether_study_draft")
  }

  // File Upload parsing request handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(10)

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploadProgress(40)
      const response = await axios.post("/api/parse-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(Math.max(40, Math.min(95, percent)))
        }
      })

      setUploadedFile({
        filename: response.data.filename,
        size: response.data.size,
        text: response.data.text
      })
      setUploadProgress(100)
      toast.success("File parsed successfully!")
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Failed to extract text from file.")
      setUploadedFile(null)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  // Sample Click triggers
  const handleSelectSample = (topic) => {
    setInputMethod("topic")
    setTopicInput(topic)
  }

  // Trigger main study guide generation
  const handleGenerate = async () => {
    let sourceContent = ""

    if (inputMethod === "paste") {
      sourceContent = notesText
    } else if (inputMethod === "upload") {
      sourceContent = uploadedFile?.text || ""
    } else {
      sourceContent = topicInput
    }

    if (!sourceContent.trim() || (inputMethod === "paste" && sourceContent.trim().length < 15)) {
      toast.error("Please provide at least 15 characters of study notes or a topic.")
      return
    }

    const opts = {
      difficulty,
      summaryLength,
      flashcardCount,
      quizCount,
      language,
      outputStyle,
      contentTypes
    }

    try {
      const session = await createStudySession(sourceContent, opts)
      setShowStudio(false)
      setActiveSession(session)
      setActiveTab("summary")
      
      // Clear inputs
      if (inputMethod === "paste") handleClearPaste()
      else setTopicInput("")
      setUploadedFile(null)
    } catch (e) {
      // Handled in Context
    }
  }

  // Sync edits
  const startEditingSummary = () => {
    setSummaryEditVal(activeSession?.summary || "")
    setIsEditingSummary(true)
  }

  const saveSummaryEdit = async () => {
    if (activeSession) {
      await updateSessionDetails(activeSession.id, { summary: summaryEditVal })
      setIsEditingSummary(false)
      toast.success("Summary updated successfully.")
    }
  }

  const startEditingConcepts = () => {
    setConceptsEditVal(JSON.parse(JSON.stringify(activeSession?.keyPoints || [])))
    setIsEditingConcepts(true)
  }

  const handleConceptChange = (idx, field, val) => {
    setConceptsEditVal(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  const saveConceptsEdit = async () => {
    if (activeSession) {
      await updateSessionDetails(activeSession.id, { keyPoints: conceptsEditVal })
      setIsEditingConcepts(false)
      toast.success("Concepts updated.")
    }
  }

  const startEditingRevision = () => {
    setRevisionEditVal((activeSession?.revisionTips || []).join("\n"))
    setIsEditingRevision(true)
  }

  const saveRevisionEdit = async () => {
    if (activeSession) {
      const tips = revisionEditVal.split("\n").map(t => t.trim()).filter(Boolean)
      await updateSessionDetails(activeSession.id, { revisionTips: tips })
      setIsEditingRevision(false)
      toast.success("Revision strategies updated.")
    }
  }

  const startEditingQuiz = () => {
    setQuizEditVal(JSON.parse(JSON.stringify(activeSession?.quiz || [])))
    setIsEditingQuiz(true)
  }

  const handleQuizQuestionChange = (idx, val) => {
    setQuizEditVal(prev => prev.map((q, i) => i === idx ? { ...q, question: val } : q))
  }

  const handleQuizOptionChange = (qIdx, oIdx, val) => {
    setQuizEditVal(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const opts = [...q.options]
        opts[oIdx] = val
        return { ...q, options: opts }
      }
      return q
    }))
  }

  const saveQuizEdit = async () => {
    if (activeSession) {
      await updateSessionDetails(activeSession.id, { quiz: quizEditVal })
      setIsEditingQuiz(false)
      toast.success("Quiz questions updated.")
    }
  }

  // Section regeneration trigger
  const handleRegenerate = async (sectionName) => {
    if (!activeSession) return
    const options = {
      difficulty,
      summaryLength,
      flashcardCount,
      quizCount,
      language,
      outputStyle
    }
    const updated = await regenerateSessionSection(activeSession.id, sectionName, options)
    if (updated) {
      toast.success(`Regenerated ${sectionName}!`)
    }
  }

  // Exporters
  const handleExportJSON = (session) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${session.title.replace(/\s+/g, "_")}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setExportDropdownOpen(false)
  }

  const handleExportMarkdown = (session) => {
    let md = `# ${session.title}\n\n## Summary\n${session.summary}\n\n`
    
    if (session.keyPoints && session.keyPoints.length > 0) {
      md += `## Key Concepts\n`
      session.keyPoints.forEach(kp => {
        md += `### ${kp.concept}\n${kp.definition}\n`
        if (kp.formula) md += `*Formula*: \`${kp.formula}\`\n`
        md += `\n`
      })
    }

    if (session.revisionTips && session.revisionTips.length > 0) {
      md += `## Revision Strategies\n`
      session.revisionTips.forEach(tip => {
        md += `- ${tip}\n`
      })
      md += `\n`
    }

    if (session.flashcards && session.flashcards.length > 0) {
      md += `## Flashcards\n`
      session.flashcards.forEach(fc => {
        md += `**Q**: ${fc.front}\n**A**: ${fc.back}\n*Topic*: ${fc.topic} | *Level*: ${fc.difficulty}\n\n`
      })
    }

    if (session.quiz && session.quiz.length > 0) {
      md += `## Quiz Questions\n`
      session.quiz.forEach((q, idx) => {
        md += `### Q${idx + 1}: ${q.question}\n`
        q.options.forEach((opt, oIdx) => {
          md += `${oIdx === q.correctIndex ? '[x]' : '[ ]'} ${opt}\n`
        })
        md += `*Explanation*: ${q.explanation}\n\n`
      })
    }

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md)
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `${session.title.replace(/\s+/g, "_")}.md`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setExportDropdownOpen(false)
  }

  const handlePrint = () => {
    window.print()
    setExportDropdownOpen(false)
  }

  // Duplicate session handler
  const handleDuplicate = async (id) => {
    await duplicateSession(id)
  }

  const handleRename = async (id) => {
    const newName = window.prompt("Enter new session title:")
    if (newName) {
      await renameSession(id, newName)
    }
  }

  // Word count math helper
  const wordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  const readTimeEstimate = (text) => {
    const w = wordCount(text)
    return Math.max(1, Math.ceil(w / 200))
  }

  // --- RENDERING CONFIG ---

  // 1. LOADING SCREEN OVERLAY
  if (loading) {
    return <LoadingSphere step={loadingStep} />
  }

  // 2. ACTIVE STUDY WORKSPACE RENDER
  if (activeSession) {
    const bookmarkedCards = activeSession.flashcards?.filter(f => f.bookmarked) || []
    
    return (
      <div className="flex-1 flex flex-col p-6 md:p-8 gap-6 overflow-y-auto print-area select-none">
        
        {/* --- Header Workspace Controls Row --- */}
        <section className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSession(null)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              ← Back to Studio
            </button>
            <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight font-sans truncate max-w-[250px] md:max-w-[400px]">
              {activeSession.title}
            </h1>
          </div>

          <div className="flex gap-2 relative">
            {/* Rename */}
            <button
              onClick={() => handleRename(activeSession.id)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
              title="Rename Session"
            >
              <Edit className="w-4 h-4" />
            </button>

            {/* Favorite */}
            <button
              onClick={() => toggleFavorite(activeSession.id)}
              className={`p-2 rounded-lg border text-zinc-400 transition-all cursor-pointer ${
                activeSession.isFavorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200"
              }`}
              title="Mark Favorite"
            >
              <Star className={`w-4 h-4 ${activeSession.isFavorite ? "fill-amber-500" : ""}`} />
            </button>

            {/* Duplicate */}
            <button
              onClick={() => handleDuplicate(activeSession.id)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
              title="Duplicate Session"
            >
              <FolderPlus className="w-4 h-4" />
            </button>

            {/* Export Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-3.5 py-1.7 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
              >
                <Share2 className="w-4 h-4" /> Export <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-50 flex flex-col gap-1">
                  <button
                    onClick={() => handleExportJSON(activeSession)}
                    className="px-2 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                  >
                    JSON File
                  </button>
                  <button
                    onClick={() => handleExportMarkdown(activeSession)}
                    className="px-2 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-2 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Layout (PDF)
                  </button>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                if (window.confirm("Delete this session entirely?")) {
                  deleteSession(activeSession.id)
                }
              }}
              className="bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 text-zinc-500 hover:text-rose-400 p-2 rounded-lg cursor-pointer transition-colors"
              title="Delete Session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* --- Interactive Tab Headers Row --- */}
        <section className="flex flex-wrap border-b border-zinc-900/80 gap-1.5 no-print">
          {[
            { id: "summary", label: "Summary", icon: BookOpen },
            { id: "flashcards", label: "Flashcards", icon: FileText },
            { id: "quiz", label: "Quiz Questions", icon: FileQuestion },
            { id: "revision", label: "Revision Notes", icon: Calendar },
            { id: "concepts", label: "Key Concepts", icon: Compass },
            { id: "analytics", label: "Analytics", icon: Trophy },
            { id: "bookmarks", label: "Bookmarks", icon: Bookmark }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsEditingSummary(false)
                  setIsEditingConcepts(false)
                  setIsEditingRevision(false)
                  setIsEditingQuiz(false)
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                  isActive
                    ? "border-blue-500 text-blue-400 font-extrabold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </section>

        {/* --- ACTIVE TAB ELEMENT WRAPPER --- */}
        <section className="flex-1 min-h-[350px]">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="flex flex-col gap-6 max-w-4xl animate-fade-in text-left">
              <div className="flex justify-between items-center no-print">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                  Study Summary
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegenerate("summary")}
                    className="text-[10px] font-bold border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 hover:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3 h-3 animate-spin-hover" /> Regenerate
                  </button>
                  {!isEditingSummary ? (
                    <button
                      onClick={startEditingSummary}
                      className="text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-blue-600/20 transition-all"
                    >
                      <Edit className="w-3 h-3" /> Edit Summary
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={saveSummaryEdit}
                        className="text-[10px] font-bold bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-600/20 transition-all"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setIsEditingSummary(false)}
                        className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditingSummary ? (
                <textarea
                  value={summaryEditVal}
                  onChange={(e) => setSummaryEditVal(e.target.value)}
                  rows={12}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl p-4 text-xs text-zinc-200 outline-none leading-relaxed font-sans"
                />
              ) : (
                <div className="glass-panel border border-zinc-850 p-6 rounded-2xl bg-zinc-950/20 leading-relaxed font-sans font-light text-zinc-300 text-xs md:text-sm whitespace-pre-line">
                  <h3 className="text-zinc-200 font-extrabold text-base mb-4 tracking-tight border-b border-zinc-900 pb-2">
                    {activeSession.title}
                  </h3>
                  {activeSession.summary}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FLASHCARDS */}
          {activeTab === "flashcards" && (
            <div className="animate-fade-in no-print">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                  3D Swiper Deck & Custom CRUD
                </span>
                <button
                  onClick={() => handleRegenerate("flashcards")}
                  className="text-[10px] font-bold border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 hover:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3 h-3 animate-spin-hover" /> Regenerate Cards
                </button>
              </div>
              <FlashcardContainer sessionId={activeSession.id} flashcards={activeSession.flashcards} />
            </div>
          )}

          {/* TAB 3: QUIZ */}
          {activeTab === "quiz" && (
            <div className="animate-fade-in no-print text-left max-w-xl mx-auto flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                  MCQ Practice Exam
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegenerate("quiz")}
                    className="text-[10px] font-bold border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 hover:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3 h-3 animate-spin-hover" /> Regenerate Quiz
                  </button>
                  {!isEditingQuiz ? (
                    <button
                      onClick={startEditingQuiz}
                      className="text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-blue-600/20 transition-all"
                    >
                      <Edit className="w-3 h-3" /> Edit Questions
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={saveQuizEdit}
                        className="text-[10px] font-bold bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-600/20 transition-all"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setIsEditingQuiz(false)}
                        className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditingQuiz ? (
                <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto border border-zinc-850 p-4 rounded-2xl bg-zinc-950/20">
                  {quizEditVal.map((q, qIdx) => (
                    <div key={qIdx} className="flex flex-col gap-3 border-b border-zinc-900 pb-4">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Question {qIdx + 1}</label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuizQuestionChange(qIdx, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-2.5 rounded-lg outline-none"
                      />
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-900 px-2.5 py-1.5 rounded-lg">
                            <span className="text-[10px] text-zinc-600 font-mono font-bold">O{oIdx+1}</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleQuizOptionChange(qIdx, oIdx, e.target.value)}
                              className="bg-transparent text-xs text-zinc-300 outline-none w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <QuizContainer sessionId={activeSession.id} quizQuestions={activeSession.quiz} />
              )}
            </div>
          )}

          {/* TAB 4: REVISION NOTES */}
          {activeTab === "revision" && (
            <div className="flex flex-col gap-6 max-w-4xl animate-fade-in text-left">
              <div className="flex justify-between items-center no-print">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                  Revision Tips & Strategies
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegenerate("revisionTips")}
                    className="text-[10px] font-bold border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 hover:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3 h-3 animate-spin-hover" /> Regenerate
                  </button>
                  {!isEditingRevision ? (
                    <button
                      onClick={startEditingRevision}
                      className="text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-blue-600/20 transition-all"
                    >
                      <Edit className="w-3 h-3" /> Edit Notes
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={saveRevisionEdit}
                        className="text-[10px] font-bold bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-600/20 transition-all"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setIsEditingRevision(false)}
                        className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditingRevision ? (
                <textarea
                  value={revisionEditVal}
                  onChange={(e) => setRevisionEditVal(e.target.value)}
                  placeholder="Paste each revision bullet points on a new line..."
                  rows={8}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl p-4 text-xs text-zinc-200 outline-none leading-relaxed font-sans"
                />
              ) : (
                <div className="glass-panel border border-zinc-850 p-6 rounded-2xl bg-zinc-950/20 flex flex-col gap-4">
                  <h4 className="text-zinc-200 font-extrabold text-sm uppercase tracking-wide border-b border-zinc-900 pb-2">Strategies</h4>
                  <ul className="flex flex-col gap-3">
                    {activeSession.revisionTips?.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 items-start text-xs text-zinc-300 font-light leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold font-mono text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: KEY CONCEPTS */}
          {activeTab === "concepts" && (
            <div className="flex flex-col gap-6 max-w-4xl animate-fade-in text-left">
              <div className="flex justify-between items-center no-print">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                  Concepts & Definitions
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRegenerate("keyPoints")}
                    className="text-[10px] font-bold border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 hover:text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCw className="w-3 h-3 animate-spin-hover" /> Regenerate
                  </button>
                  {!isEditingConcepts ? (
                    <button
                      onClick={startEditingConcepts}
                      className="text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-blue-600/20 transition-all"
                    >
                      <Edit className="w-3 h-3" /> Edit Concepts
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={saveConceptsEdit}
                        className="text-[10px] font-bold bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-600/20 transition-all"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setIsEditingConcepts(false)}
                        className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditingConcepts ? (
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto border border-zinc-850 p-4 rounded-2xl bg-zinc-950/20">
                  {conceptsEditVal.map((kp, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-zinc-900 pb-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Concept Name</label>
                        <input
                          type="text"
                          value={kp.concept}
                          onChange={(e) => handleConceptChange(idx, "concept", e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-2 rounded-lg outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Definition</label>
                        <input
                          type="text"
                          value={kp.definition}
                          onChange={(e) => handleConceptChange(idx, "definition", e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-2 rounded-lg outline-none"
                        />
                      </div>
                      {kp.formula !== undefined && (
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Formula / Syntax (optional)</label>
                          <input
                            type="text"
                            value={kp.formula || ""}
                            onChange={(e) => handleConceptChange(idx, "formula", e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-2 rounded-lg outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSession.keyPoints?.map((kp, idx) => (
                    <div 
                      key={idx} 
                      className="glass-panel border border-zinc-850 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden"
                    >
                      <span className="absolute right-3 top-3 text-[10px] text-zinc-600 font-mono font-bold">#{idx + 1}</span>
                      <h4 className="text-zinc-100 font-extrabold text-sm tracking-tight">{kp.concept}</h4>
                      <p className="text-zinc-400 text-xs font-light leading-relaxed">{kp.definition}</p>
                      
                      {kp.formula && (
                        <div className="bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-lg font-mono text-[10px] text-blue-400 mt-1 select-all break-all">
                          {kp.formula}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="animate-fade-in">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono block text-left mb-4">
                Workspace Guide Performance Stats
              </span>
              <AnalyticsView session={activeSession} />
            </div>
          )}

          {/* TAB 7: BOOKMARKS */}
          {activeTab === "bookmarks" && (
            <div className="flex flex-col gap-4 animate-fade-in text-left">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
                Starred Flashcards ({bookmarkedCards.length})
              </span>
              
              {bookmarkedCards.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-850 rounded-2xl text-zinc-500 text-xs">
                  No bookmarked flashcards in this session yet. Swipe left or click Star on cards to bookmark.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarkedCards.map((f) => (
                    <div key={f.id} className="glass-panel border border-zinc-850 p-4 rounded-xl flex justify-between gap-4 bg-zinc-950/20">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{f.topic || "General"}</span>
                        <h5 className="text-zinc-200 font-bold text-xs">{f.front}</h5>
                        <p className="text-zinc-400 text-[11px] font-light leading-relaxed mt-1">{f.back}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </section>
      </div>
    )
  }

  // 3. AI STUDY STUDIO FORM / INPUTS
  if (showStudio) {
    return (
      <div className="flex-1 flex flex-col p-6 md:p-8 gap-6 overflow-y-auto select-none max-w-4xl mx-auto w-full text-left">
        
        {/* Studio Title */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-glass-glow shadow-blue-500/20">
              <Sparkles className="w-4.5 h-4.5 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-zinc-100 tracking-tight font-sans">
                Aether Study Studio
              </h2>
              <p className="text-[11px] text-zinc-500 font-light mt-0.5">
                Modern AI transformation workspace.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStudio(false)}
            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title="Cancel Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Methods Tab Selector */}
        <div className="flex border-b border-zinc-900/80 gap-1.5">
          {[
            { id: "paste", label: "Paste Notes" },
            { id: "upload", label: "Upload Files" },
            { id: "topic", label: "Enter a Topic" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setInputMethod(tab.id)}
              className={`px-4 py-2 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                inputMethod === tab.id
                  ? "border-blue-500 text-blue-400 font-extrabold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Inputs Area */}
        <div className="min-h-[180px]">
          {/* Paste Notes */}
          {inputMethod === "paste" && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={notesText}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Paste lecture logs, book segments, handwritten text, copied summaries, code blocks, or study checklists..."
                  rows={8}
                  className="w-full bg-zinc-900/40 border border-zinc-850 focus:border-zinc-700 rounded-xl p-4 text-xs text-zinc-200 placeholder-zinc-650 outline-none leading-relaxed font-sans resize-none"
                />
                
                {notesText.trim() && (
                  <button 
                    onClick={handleClearPaste}
                    className="absolute top-3 right-3 text-zinc-600 hover:text-rose-400 cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center text-[10px] text-zinc-500 font-mono bg-zinc-900/10 border border-zinc-900/60 p-2.5 rounded-lg gap-2">
                <span>Total Characters: <strong className="text-zinc-400">{notesText.length}</strong></span>
                <span>Total Words: <strong className="text-zinc-400">{wordCount(notesText)}</strong></span>
                <span>Est. Reading Time: <strong className="text-zinc-400">{readTimeEstimate(notesText)} mins</strong></span>
              </div>
            </div>
          )}

          {/* Upload Files */}
          {inputMethod === "upload" && (
            <div className="flex flex-col gap-4">
              {uploadedFile ? (
                <div className="border border-zinc-850 p-4 rounded-xl flex items-center justify-between bg-zinc-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-[400px]">
                        {uploadedFile.filename}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {(uploadedFile.size / 1024).toFixed(1)} KB (Text Extracted Successfully)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-500 hover:text-rose-400 p-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-850 bg-zinc-900/10 hover:bg-zinc-900/30 p-8 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={uploading}
                  />
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-zinc-300">Click or drag files to upload</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Supports PDF, DOCX, TXT, or Markdown (up to 15MB)</p>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span>Extracting PDF/Word Text...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enter a Topic */}
          {inputMethod === "topic" && (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="E.g., Operating Systems, Dynamic Programming, React Hooks, DBMS..."
                className="w-full bg-zinc-900/40 border border-zinc-850 focus:border-zinc-700 rounded-xl px-4 py-3 text-xs text-zinc-200 outline-none"
              />

              {/* Sample Topics */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Sample Topics</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Operating Systems",
                    "React Hooks",
                    "Computer Networks",
                    "Data Structures",
                    "DBMS",
                    "OOP Concepts"
                  ].map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(topic)}
                      className="bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-850/80 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- CUSTOM GENERATION SETTINGS OPTIONS PANEL --- */}
        <div className="glass-panel border border-zinc-850 p-6 rounded-2xl bg-zinc-950/20 flex flex-col gap-5 mt-2">
          <h3 className="text-zinc-200 font-extrabold text-xs uppercase tracking-wider font-mono border-b border-zinc-900 pb-2">
            Customize Study Guide Outputs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Custom Sliders Section */}
            <div className="flex flex-col gap-4">
              {/* Flashcards Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span>Number of Flashcards</span>
                  <span className="font-mono text-blue-400">{flashcardCount} cards</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={flashcardCount}
                  onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Quiz questions Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span>Number of Quiz Questions</span>
                  <span className="font-mono text-blue-400">{quizCount} MCQs</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={quizCount}
                  onChange={(e) => setQuizCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Config select parameters dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-2 py-2 rounded-lg outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Summary Length</label>
                <select
                  value={summaryLength}
                  onChange={(e) => setSummaryLength(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-2 py-2 rounded-lg outline-none"
                >
                  <option value="Short">Short</option>
                  <option value="Medium">Medium</option>
                  <option value="Detailed">Detailed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-2 py-2 rounded-lg outline-none"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Tonal Style</label>
                <select
                  value={outputStyle}
                  onChange={(e) => setOutputStyle(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-2 py-2 rounded-lg outline-none"
                >
                  <option value="Concise">Concise</option>
                  <option value="Academic">Academic</option>
                  <option value="Interview Ready">Interview Ready</option>
                  <option value="Exam Focused">Exam Focused</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Generate Button Trigger */}
        <button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-white/10" />
          <span>Generate Study Material</span>
        </button>

      </div>
    )
  }

  // 4. MAIN EMPTY STATE / LANDINGWORKSPACE
  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 gap-8 overflow-y-auto relative select-none">
      
      {/* Statistics Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Learning Streak", value: `${streak} Day${streak !== 1 ? "s" : ""}`, icon: Flame, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
          { label: "Mastery Level", value: `Level ${getLevel()}`, icon: Award, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
          { label: "Study Experience", value: `${xp} XP`, icon: Sparkles, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
          { label: "Active Sessions", value: `${sessions.length} Guide${sessions.length !== 1 ? "s" : ""}`, icon: BookOpen, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="glass-panel p-4 rounded-xl border border-zinc-800/40 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</span>
                <span className="text-zinc-200 font-bold text-xs sm:text-sm font-sans">{stat.value}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* Main workspace check empty/saved state */}
      {sessions.length === 0 ? (
        /* EMPTY STATE VIEW */
        <section className="flex-1 border border-dashed border-zinc-850 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-5 min-h-[300px] bg-zinc-950/10 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-44 h-44 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-blue-400 shadow-glass-glow shadow-blue-500/5">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-zinc-200 font-extrabold text-base md:text-lg">Your AI Study Studio</h3>
            <p className="text-zinc-500 text-xs font-light leading-relaxed max-w-md">
              Start by uploading your notes, pasting text, or entering a topic to generate your personalized AI study guide.
            </p>
          </div>

          <button
            onClick={() => setShowStudio(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-md shadow-blue-500/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Get Started</span>
          </button>
        </section>
      ) : (
        /* SAVED SESSIONS GRID WORKSPACE */
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-zinc-200 font-extrabold text-xs uppercase tracking-wider font-mono">
              Saved Study Guides
            </h3>
            <button
              onClick={() => setShowStudio(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Open Studio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => {
              const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              })

              return (
                <div 
                  key={session.id} 
                  onClick={() => {
                    setActiveSession(session)
                    setActiveTab("summary")
                  }}
                  className="glass-panel border border-zinc-850 p-4 rounded-xl bg-zinc-950/20 hover:border-zinc-700/80 hover:shadow-card-glow hover:-translate-y-0.5 transition-all duration-300 text-left flex flex-col gap-3 cursor-pointer relative group overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                  {/* Badges row */}
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded uppercase font-bold">
                      {session.difficulty}
                    </span>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" /> {formattedDate}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h4 className="text-zinc-200 font-extrabold text-sm truncate max-w-[200px] group-hover:text-blue-400 transition-colors">
                      {session.title}
                    </h4>
                    <p className="text-zinc-550 text-xs font-light leading-normal line-clamp-2 max-w-[280px]">
                      {session.summary}
                    </p>
                  </div>

                  {/* Bottom metrics stats */}
                  <div className="flex justify-between items-center border-t border-zinc-900/60 pt-2.5 text-[10px] text-zinc-500 font-bold">
                    <span>📚 {session.flashcards?.length || 0} Cards</span>
                    <span>📝 {session.quiz?.length || 0} Questions</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
