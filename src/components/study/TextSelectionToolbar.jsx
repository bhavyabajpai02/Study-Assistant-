import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkles, HelpCircle, FileText, Lightbulb } from "lucide-react"

export default function TextSelectionToolbar({ children, sessionTitle, sessionId }) {
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !containerRef.current) {
        setIsVisible(false)
        return
      }

      const text = selection.toString().trim()
      if (!text || text.length < 3) {
        setIsVisible(false)
        return
      }

      // Ensure selection is inside this container
      if (!containerRef.current.contains(selection.anchorNode)) {
        setIsVisible(false)
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      setSelectedText(text)
      setPosition({
        top: rect.top - containerRect.top - 45,
        left: Math.max(10, rect.left - containerRect.left + (rect.width / 2) - 150)
      })
      setIsVisible(true)
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => document.removeEventListener("selectionchange", handleSelectionChange)
  }, [])

  const handleAction = (promptPrefix) => {
    if (!selectedText) return
    setIsVisible(false)
    window.getSelection()?.removeAllRanges()

    const fullPrompt = `${promptPrefix}: "${selectedText}"`
    navigate("/assistant", {
      state: {
        initialPrompt: fullPrompt,
        context: {
          sessionId,
          topic: sessionTitle || "Selected Text Context",
          studyMaterial: selectedText
        }
      }
    })
  }

  return (
    <div ref={containerRef} className="relative">
      {isVisible && (
        <div
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          className="absolute z-50 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in text-xs font-semibold select-none"
        >
          <span className="text-[10px] text-zinc-500 font-bold px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Ask AI:
          </span>

          <button
            onClick={() => handleAction("Explain this concept simply")}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
            title="Explain highlighted text"
          >
            <HelpCircle className="w-3 h-3 text-blue-400" />
            <span>Explain</span>
          </button>

          <button
            onClick={() => handleAction("Summarize this text in 2 key points")}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
            title="Summarize highlighted text"
          >
            <FileText className="w-3 h-3 text-purple-400" />
            <span>Summarize</span>
          </button>

          <button
            onClick={() => handleAction("Give a real-world example of this")}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
            title="Give example"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Example</span>
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
