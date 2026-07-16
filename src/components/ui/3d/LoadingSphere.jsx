import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"

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

export default function LoadingSphere({ step }) {
  const canvasMountRef = useRef(null)
  const [hasWebGL, setHasWebGL] = useState(true)

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false)
      return
    }

    const container = canvasMountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xa855f7, 2, 10)
    pointLight.position.set(0, 0, 1.5)
    scene.add(pointLight)

    // Holographic Geometry (Dodecahedron Wireframe)
    const geom = new THREE.DodecahedronGeometry(1.2, 0)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    })
    const wireframeMesh = new THREE.Mesh(geom, mat)
    scene.add(wireframeMesh)

    // Outer orbiting shell (icosahedron vertices points)
    const outerGeom = new THREE.IcosahedronGeometry(1.6, 0)
    const outerMat = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    })
    const outerPoints = new THREE.Points(outerGeom, outerMat)
    scene.add(outerPoints)

    // Pulsing central node
    const coreGeom = new THREE.SphereGeometry(0.2, 16, 16)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.9
    })
    const coreMesh = new THREE.Mesh(coreGeom, coreMat)
    scene.add(coreMesh)

    let clock = new THREE.Clock()
    let reqId

    const animate = () => {
      const time = clock.getElapsedTime()

      // Wireframe rotation
      wireframeMesh.rotation.y = time * 0.4
      wireframeMesh.rotation.x = time * 0.2

      // Outer points rotation opposite direction
      outerPoints.rotation.y = -time * 0.25
      outerPoints.rotation.x = -time * 0.15

      // Pulsing effect
      const pulseScale = 1.0 + Math.sin(time * 5) * 0.15
      coreMesh.scale.setScalar(pulseScale)
      pointLight.intensity = 2 + Math.sin(time * 5) * 1.0

      renderer.render(scene, camera)
      reqId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener("resize", handleResize)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geom.dispose()
      mat.dispose()
      outerGeom.dispose()
      outerMat.dispose()
      coreGeom.dispose()
      coreMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b]/90 backdrop-blur-md flex flex-col items-center justify-center">
      <div className="w-64 h-64 relative flex items-center justify-center">
        {hasWebGL ? (
          <div ref={canvasMountRef} className="w-full h-full" />
        ) : (
          // CSS 3D Hologram fallback spinner
          <div className="relative w-24 h-24 transform-style-3d animate-spin" style={{ animationDuration: "8s" }}>
            <div className="absolute inset-0 border-2 border-accent-glow rounded-xl opacity-30 transform rotate-x-45" />
            <div className="absolute inset-0 border-2 border-accent-purple rounded-xl opacity-50 transform rotate-y-45 animate-pulse" />
            <div className="absolute inset-8 bg-accent-glow/40 rounded-full animate-ping" />
          </div>
        )}
      </div>

      <div className="mt-8 text-center max-w-sm px-4">
        <h3 className="text-xl font-bold tracking-tight text-zinc-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400">
          Synthesizing Insights
        </h3>
        <p className="mt-2 text-sm font-semibold tracking-wide uppercase text-blue-400 animate-pulse">
          {step || "Consulting AI Tutor..."}
        </p>
        <div className="mt-6 w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse-glow" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  )
}
