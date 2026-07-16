import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"

// Helper to check WebGL availability
function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas")
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    )
  } catch (e) {
    return false
  }
}

export default function HeroCanvas() {
  const mountRef = useRef(null)
  const [hasWebGL, setHasWebGL] = useState(true)

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false)
      return
    }

    const container = mountRef.current
    if (!container) return

    // --- Three.js Setup ---
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    // Soft deep purple/black background matching dark mode
    scene.background = null 

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x3b82f6, 1.5, 15) // Accent Blue
    pointLight1.position.set(3, 3, 3)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xa855f7, 2, 15) // Accent Purple
    pointLight2.position.set(-3, -3, 3)
    scene.add(pointLight2)

    // --- Geometries & Meshes ---
    
    // 1. Central Glass Core Orb
    const coreGeo = new THREE.SphereGeometry(1.6, 64, 64)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6, // Glass transparency
      ior: 1.5, // Index of refraction
      thickness: 1.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    scene.add(coreMesh)

    // 2. Glowing Inner Core Node
    const innerGeo = new THREE.SphereGeometry(0.3, 32, 32)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.8
    })
    const innerMesh = new THREE.Mesh(innerGeo, innerMat)
    scene.add(innerMesh)

    // 3. Orbital Wireframe Neural Ring (Torus)
    const ringGeo = new THREE.TorusGeometry(2.3, 0.03, 16, 100)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    })
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat)
    ringMesh1.rotation.x = Math.PI / 4
    scene.add(ringMesh1)

    const ringMesh2 = ringMesh1.clone()
    ringMesh2.rotation.y = Math.PI / 3
    ringMesh2.rotation.x = -Math.PI / 6
    scene.add(ringMesh2)

    // 4. Floating Ambient Particles (Constellation dust)
    const particleCount = 120
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Procedural distribution in a sphere around core
      const radius = 2.5 + Math.random() * 2.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i + 2] = radius * Math.cos(phi)

      // Gradient color between blue and purple
      const ratio = Math.random()
      colors[i] = ratio * 0.23 + 0.23 // Red
      colors[i + 1] = ratio * 0.5 + 0.35 // Green
      colors[i + 2] = 1.0 // Blue
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    // Create custom particle material using glowing texture code
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })

    const pointCloud = new THREE.Points(particleGeo, particleMat)
    scene.add(pointCloud)

    // --- Interactive Mouse Coordinate Tracking ---
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      // Normalise coordinates (-1 to 1)
      target.x = ((e.clientX - rect.left) / width) * 2 - 1
      target.y = -((e.clientY - rect.top) / height) * 2 + 1
    }

    container.addEventListener("mousemove", handleMouseMove)

    // --- Render Loop ---
    let clock = new THREE.Clock()

    const animate = () => {
      const time = clock.getElapsedTime()

      // Core rotation & float
      coreMesh.rotation.y = time * 0.15
      coreMesh.rotation.x = time * 0.08
      coreMesh.position.y = Math.sin(time * 0.8) * 0.15 // Gentle float

      innerMesh.position.y = Math.sin(time * 0.8) * 0.15
      innerMesh.scale.setScalar(1 + Math.sin(time * 2) * 0.08) // Pulsing

      // Rings rotating in opposite directions
      ringMesh1.rotation.z = time * 0.1
      ringMesh1.position.y = Math.sin(time * 0.8) * 0.15
      ringMesh2.rotation.z = -time * 0.08
      ringMesh2.position.y = Math.sin(time * 0.8) * 0.15

      // Particles rotation
      pointCloud.rotation.y = time * 0.05
      pointCloud.rotation.x = time * 0.02
      pointCloud.position.y = Math.sin(time * 0.8) * 0.15

      // Smooth mouse-lag interpolation (lerping)
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08

      // Gentle camera parallax orientation based on cursor
      scene.rotation.y = current.x * 0.3
      scene.rotation.x = -current.y * 0.3

      renderer.render(scene, camera)
      reqId = requestAnimationFrame(animate)
    }

    let reqId = requestAnimationFrame(animate)

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", handleResize)

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener("resize", handleResize)
      container.removeEventListener("mousemove", handleMouseMove)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      coreGeo.dispose()
      coreMat.dispose()
      innerGeo.dispose()
      innerMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  if (!hasWebGL) {
    // 2D SVG/CSS Fallback
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="absolute w-64 h-64 bg-accent-purple/20 rounded-full blur-[80px] animate-pulse-glow" />
        <div className="absolute w-48 h-48 bg-accent-glow/20 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <svg className="w-72 h-72 text-zinc-600 animate-float" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="25" fill="none" stroke="url(#gradient)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="8" fill="#18181b" stroke="#3b82f6" strokeWidth="1" />
          <circle cx="50" cy="50" r="2" fill="#a855f7" className="animate-ping" style={{ transformOrigin: "50px 50px" }} />
          {/* Orbiting nodes */}
          <circle cx="50" cy="25" r="2.5" fill="#3b82f6" className="animate-spin" style={{ transformOrigin: "50px 50px", animationDuration: "12s" }} />
          <circle cx="68" cy="50" r="2.0" fill="#a855f7" className="animate-spin" style={{ transformOrigin: "50px 50px", animationDuration: "8s" }} />
          <defs>
            <radialGradient id="gradient">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    )
  }

  return <div ref={mountRef} className="w-full h-full cursor-pointer relative" />
}
