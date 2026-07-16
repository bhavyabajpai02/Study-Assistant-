import React, { useEffect, useState } from "react"

export default function CursorGlow() {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isTouch, setIsTouch] = useState(true)

  useEffect(() => {
    // Check for touch device capabilities to preserve performance on mobile/tablet
    const detectTouch = () => {
      return "ontouchstart" in window || navigator.maxTouchPoints > 0
    }
    
    const touch = detectTouch()
    setIsTouch(touch)
    if (touch) return

    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isVisible])

  if (isTouch || !isVisible) return null

  return (
    <div
      className="cursor-glow"
      style={{
        "--x": `${coords.x}px`,
        "--y": `${coords.y}px`,
      }}
    />
  )
}
