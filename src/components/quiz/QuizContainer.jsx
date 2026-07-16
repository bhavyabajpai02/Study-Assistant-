import React, { useState, useEffect, useRef } from "react"
import { useStudy } from "../../context/StudyContext"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Timer, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  HelpCircle, 
  Sparkles,
  Trophy
} from "lucide-react"

export default function QuizContainer({ sessionId, quizQuestions = [] }) {
  const { addQuizScore } = useStudy()

  // Quiz running states
  const [questions, setQuestions] = useState(quizQuestions)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState(null) // 0-3 index
  const [answersSubmitted, setAnswersSubmitted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  // Scores trackers
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [wrongIndices, setWrongIndices] = useState([]) // Indexes of original questions got wrong
  const [quizFinished, setQuizFinished] = useState(false)

  // Timer Ref
  const timerRef = useRef(null)

  const activeQuestion = questions[currentIdx]

  // Timer loop logic
  useEffect(() => {
    if (isTimerRunning && secondsLeft > 0 && !quizFinished) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1)
      }, 1000)
    } else if (secondsLeft === 0 && !answersSubmitted) {
      handleOptionSelect(-1) // Auto fail question on timeout
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [secondsLeft, isTimerRunning, answersSubmitted, quizFinished])

  // Select Choice Trigger
  const handleOptionSelect = (optIndex) => {
    if (answersSubmitted) return
    
    // Stop Timer
    setIsTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedOpt(optIndex)
    setAnswersSubmitted(true)

    const isCorrect = optIndex === activeQuestion.correctIndex
    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1)
    } else {
      // Find the index of this question in the original array
      const originalIdx = quizQuestions.findIndex(q => q.question === activeQuestion.question)
      setWrongIndices(prev => [...prev, originalIdx])
    }
  }

  // Next Question triggers
  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1)
      setSelectedOpt(null)
      setAnswersSubmitted(false)
      setSecondsLeft(30)
      setIsTimerRunning(true)
    } else {
      // Finished Quiz
      setQuizFinished(true)
      const score = Math.round((correctAnswersCount / questions.length) * 100)
      addQuizScore(sessionId, score)
    }
  }

  // Reset entire quiz to start
  const handleRestartAll = () => {
    setQuestions(quizQuestions)
    setCurrentIdx(0)
    setSelectedOpt(null)
    setAnswersSubmitted(false)
    setSecondsLeft(30)
    setIsTimerRunning(true)
    setCorrectAnswersCount(0)
    setWrongIndices([])
    setQuizFinished(false)
  }

  // Retake incorrect answers only
  const handleRetakeWrong = () => {
    const wrongQuestions = quizQuestions.filter((_, idx) => wrongIndices.includes(idx))
    setQuestions(wrongQuestions)
    setCurrentIdx(0)
    setSelectedOpt(null)
    setAnswersSubmitted(false)
    setSecondsLeft(30)
    setIsTimerRunning(true)
    setCorrectAnswersCount(0)
    setWrongIndices([])
    setQuizFinished(false)
  }

  // Timer Progress Bar Math
  const timerPercent = (secondsLeft / 30) * 100

  // Finish Score card View
  if (quizFinished) {
    const scorePercent = Math.round((correctAnswersCount / questions.length) * 100)
    const passed = scorePercent >= 70

    return (
      <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 text-center max-w-md mx-auto flex flex-col gap-6 select-none bg-zinc-950/60">
        <div className="flex justify-center mt-2 relative">
          <div className="absolute w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-glass">
            <Trophy className={`w-8 h-8 ${passed ? "text-amber-400" : "text-zinc-500"}`} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h4 className="text-zinc-200 font-extrabold text-lg">Quiz Complete!</h4>
          <p className="text-zinc-400 text-xs font-light">
            You scored {correctAnswersCount} correct out of {questions.length} questions.
          </p>
        </div>

        {/* Score Ring indicator */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center select-none font-mono">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="45" className="stroke-zinc-800 fill-none" strokeWidth="6" />
            <circle
              cx="56"
              cy="56"
              r="45"
              className={`fill-none transition-all duration-1000 ${
                passed ? "stroke-emerald-500" : "stroke-rose-500"
              }`}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 - (scorePercent / 100) * 2 * Math.PI * 45}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute text-xl font-black ${passed ? "text-emerald-400" : "text-rose-400"}`}>
            {scorePercent}%
          </span>
        </div>

        {/* Diagnostic XP Info */}
        <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded-xl text-left text-xs leading-relaxed">
          <div className="flex justify-between items-center mb-1">
            <span className="text-zinc-400">XP Awarded:</span>
            <span className="font-bold text-zinc-100 flex items-center gap-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              +{scorePercent === 100 ? "300 XP (Perfect)" : "50 XP"}
            </span>
          </div>
          <p className="text-zinc-500 text-[10px] font-light">
            {passed
              ? "Excellent performance! Spaced repetition schedules updated."
              : "Review incorrect concepts below to optimize mastery thresholds."}
          </p>
        </div>

        {/* Controls Layout */}
        <div className="flex flex-col gap-2.5">
          {wrongIndices.length > 0 && (
            <button
              onClick={handleRetakeWrong}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake {wrongIndices.length} Wrong Questions</span>
            </button>
          )}

          <button
            onClick={handleRestartAll}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restart Entire Quiz</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 select-none">
      {/* Quiz Progress & Timer Row */}
      <div className="flex items-center justify-between bg-zinc-950/20 border border-zinc-850 p-3 rounded-xl">
        <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          Question {currentIdx + 1} of {questions.length}
        </span>

        {/* Timer countdown visual */}
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${secondsLeft < 10 ? "text-rose-400 animate-pulse" : "text-zinc-500"}`} />
          <span className={`text-xs font-mono font-bold ${secondsLeft < 10 ? "text-rose-400" : "text-zinc-300"}`}>
            {secondsLeft}s
          </span>
          <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-zinc-900/50">
            <div
              className={`h-full transition-all duration-1000 ${
                secondsLeft < 10 ? "bg-rose-500" : "bg-blue-500"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* MCQ Question Area */}
      <div className="glass-panel border border-zinc-800/80 bg-zinc-950/80 rounded-2xl p-6 flex flex-col gap-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-600/5 rounded-full blur-xl pointer-events-none" />

        <h4 className="text-sm md:text-base font-bold text-zinc-100 leading-relaxed font-sans">
          {activeQuestion.question}
        </h4>

        {/* MCQ choices */}
        <div className="flex flex-col gap-2.5">
          {activeQuestion.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx
            const isCorrect = idx === activeQuestion.correctIndex
            const showCorrect = answersSubmitted && isCorrect
            const showIncorrect = answersSubmitted && isSelected && !isCorrect

            return (
              <button
                key={idx}
                disabled={answersSubmitted}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-sans transition-all flex items-center justify-between ${
                  answersSubmitted
                    ? showCorrect
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : showIncorrect
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                      : "bg-zinc-900/40 border-zinc-900/80 text-zinc-600"
                    : "bg-zinc-900 border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-zinc-200"
                }`}
              >
                <span>{opt}</span>
                {answersSubmitted && (
                  <span>
                    {isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : isSelected ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : null}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Correct/Incorrect Explanation Text Area */}
        <AnimatePresence>
          {answersSubmitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-zinc-900/80 pt-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-bold font-sans">
                {selectedOpt === activeQuestion.correctIndex ? (
                  <span className="text-emerald-400 flex items-center gap-1">Correct Answer!</span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    Incorrect. (Correct choice: Option {activeQuestion.correctIndex + 1})
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-[11px] font-light leading-relaxed">
                {activeQuestion.explanation}
              </p>

              <button
                onClick={handleNext}
                className="mt-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold py-2 px-4 rounded-lg ml-auto transition-colors cursor-pointer"
              >
                {currentIdx + 1 === questions.length ? "Finish Exam" : "Next Question"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
