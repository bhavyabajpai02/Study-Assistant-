import React, { useEffect, useRef, useState } from "react"

export default function KnowledgeSphere({ topics = [] }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  // Default fallback topics if none are active
  const activeTopics = topics.length > 0 ? topics : [
    { name: "Quantum Theory", level: 85 },
    { name: "Linear Algebra", level: 60 },
    { name: "Mechanics", level: 90 },
    { name: "Electromagnetism", level: 45 },
    { name: "Thermodynamics", level: 75 },
    { name: "Astrophysics", level: 30 },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = container.clientWidth)
    let height = (canvas.height = container.clientHeight)

    // 3D coordinates for nodes
    let nodes = activeTopics.map((t, idx) => {
      // Uniform distribution on a sphere
      const phi = Math.acos(-1 + (2 * idx) / activeTopics.length)
      const theta = Math.sqrt(activeTopics.length * Math.PI) * phi
      
      const r = 120 // Radius of sphere

      return {
        name: t.name,
        level: t.level,
        x3d: r * Math.sin(phi) * Math.cos(theta),
        y3d: r * Math.sin(phi) * Math.sin(theta),
        z3d: r * Math.cos(phi),
        x2d: 0,
        y2d: 0,
        scale: 1,
        color: t.level > 80 ? "#22c55e" : t.level > 50 ? "#3b82f6" : "#a855f7"
      }
    })

    // Camera perspective distance
    const fov = 350
    const centerX = width / 2
    const centerY = height / 2

    // Rotation angles
    let angleX = 0.005
    let angleY = 0.005

    // Interactive Dragging variables
    let isDragging = false
    let startMouseX = 0
    let startMouseY = 0

    const rotateX = (node, angle) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const y = node.y3d * cos - node.z3d * sin
      const z = node.z3d * cos + node.y3d * sin
      node.y3d = y
      node.z3d = z
    }

    const rotateY = (node, angle) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const x = node.x3d * cos - node.z3d * sin
      const z = node.z3d * cos + node.x3d * sin
      node.x3d = x
      node.z3d = z
    }

    // Event listeners for drag rotation
    const handleMouseDown = (e) => {
      isDragging = true
      const rect = canvas.getBoundingClientRect()
      startMouseX = e.clientX - rect.left
      startMouseY = e.clientY - rect.top
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (isDragging) {
        const dx = mouseX - startMouseX
        const dy = mouseY - startMouseY

        angleY = dx * 0.005
        angleX = dy * 0.005

        startMouseX = mouseX
        startMouseY = mouseY
      } else {
        // Hover detection
        let foundNode = null
        for (const node of nodes) {
          const dx = mouseX - node.x2d
          const dy = mouseY - node.y2d
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 15 * node.scale) {
            foundNode = node
            break
          }
        }
        setHoveredNode(foundNode)
      }
    }

    const handleMouseUp = () => {
      isDragging = false
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    // Resize Handler
    const handleResize = () => {
      if (!container || !canvas) return
      width = canvas.width = container.clientWidth
      height = canvas.height = container.clientHeight
    }
    window.addEventListener("resize", handleResize)

    let animationId

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw background halo
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 180)
      glowGrad.addColorStop(0, "rgba(59, 130, 246, 0.03)")
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(centerX, centerY, 180, 0, Math.PI * 2)
      ctx.fill()

      // Apply automatic deceleration if not dragging
      if (!isDragging) {
        angleX *= 0.95
        angleY *= 0.95
        // Add a slow base drift
        angleX += (0.002 - angleX) * 0.1
        angleY += (0.002 - angleY) * 0.1
      }

      // Rotate nodes
      nodes.forEach(node => {
        rotateX(node, angleX)
        rotateY(node, angleY)

        // Perspective projection
        // node.z3d ranges from -r to r
        // Map to positive scale values
        node.scale = fov / (fov + node.z3d)
        node.x2d = centerX + node.x3d * node.scale
        node.y2d = centerY + node.y3d * node.scale
      })

      // Sort nodes by depth (z3d descending) to draw back elements first (painter's algorithm)
      const sortedNodes = [...nodes].sort((a, b) => b.z3d - a.z3d)

      // Draw connection lines
      ctx.lineWidth = 0.5
      for (let i = 0; i < sortedNodes.length; i++) {
        for (let j = i + 1; j < sortedNodes.length; j++) {
          const n1 = sortedNodes[i]
          const n2 = sortedNodes[j]

          const dx = n1.x3d - n2.x3d
          const dy = n1.y3d - n2.y3d
          const dz = n1.z3d - n2.z3d
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          // Connect lines between nearby nodes in 3D space
          if (dist < 180) {
            const avgScale = (n1.scale + n2.scale) / 2
            const alpha = (1 - dist / 180) * 0.12 * avgScale
            ctx.beginPath()
            ctx.moveTo(n1.x2d, n1.y2d)
            ctx.lineTo(n2.x2d, n2.y2d)
            ctx.strokeStyle = `rgba(113, 113, 122, ${alpha})`
            ctx.stroke()
          }
        }
      }

      // Draw nodes and text
      sortedNodes.forEach(node => {
        const radius = Math.max(4, 8 * node.scale)
        const isHovered = hoveredNode && hoveredNode.name === node.name

        // Node Glow
        ctx.beginPath()
        ctx.arc(node.x2d, node.y2d, radius * (isHovered ? 1.5 : 1.2), 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.shadowBlur = isHovered ? 15 : 4
        ctx.shadowColor = node.color
        ctx.globalAlpha = 0.3 + (node.scale - 0.5) * 0.7 // Dim nodes in back
        ctx.fill()
        ctx.shadowBlur = 0 // Reset shadow

        // Core Solid Circle
        ctx.beginPath()
        ctx.arc(node.x2d, node.y2d, radius, 0, Math.PI * 2)
        ctx.fillStyle = "#ffffff"
        ctx.globalAlpha = 0.8 * (node.scale - 0.3)
        ctx.fill()

        // Label
        if (node.scale > 0.7) {
          ctx.font = `${isHovered ? "bold 11px" : "500 10px"} Inter, sans-serif`
          ctx.fillStyle = isHovered ? "#ffffff" : "#a1a1aa"
          ctx.textAlign = "center"
          ctx.globalAlpha = (node.scale - 0.6) / 0.8
          ctx.fillText(node.name, node.x2d, node.y2d - radius - 5)
        }
      })

      ctx.globalAlpha = 1.0 // Reset alpha
      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("resize", handleResize)
    }
  }, [activeTopics, hoveredNode])

  return (
    <div ref={containerRef} className="w-full h-full relative group">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
      
      {/* Floating Hover Card */}
      {hoveredNode && (
        <div 
          className="absolute glass-panel p-2.5 rounded-lg text-xs w-44 pointer-events-none transition-opacity duration-200"
          style={{
            left: `${hoveredNode.x2d + 15}px`,
            top: `${hoveredNode.y2d - 40}px`,
            zIndex: 30,
          }}
        >
          <div className="font-semibold text-zinc-100">{hoveredNode.name}</div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-zinc-400">Mastery Level:</span>
            <span 
              className="font-bold font-mono"
              style={{ color: hoveredNode.color }}
            >
              {hoveredNode.level}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{
                width: `${hoveredNode.level}%`,
                backgroundColor: hoveredNode.color
              }}
            />
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 text-[9px] text-zinc-500 font-mono select-none pointer-events-none uppercase tracking-wide">
        Drag to rotate knowledge network
      </div>
    </div>
  )
}
