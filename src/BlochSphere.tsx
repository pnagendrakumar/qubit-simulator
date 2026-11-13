import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface BlochSphereProps {
  vector: { x: number; y: number; z: number }
}

export function BlochSphere({ vector }: BlochSphereProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const vectorRef = useRef(vector)
  vectorRef.current = vector

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(1.9, 1.5, 2.8)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x18243a, transparent: true, opacity: 0.72, wireframe: true }),
    )
    scene.add(sphere)
    const axes = new THREE.AxesHelper(1.25)
    scene.add(axes)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6a7fa8, transparent: true, opacity: 0.45 })
    for (const rotation of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]]) {
      const circle = new THREE.LineLoop(new THREE.CircleGeometry(1, 64), lineMaterial)
      circle.rotation.set(rotation[0], rotation[1], rotation[2])
      scene.add(circle)
    }
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, 0x6ee7d8, 0.12, 0.08)
    scene.add(arrow)
    const onResize = () => {
      const size = Math.max(180, Math.min(mount.clientWidth, 300))
      renderer.setSize(size, size, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
    onResize()
    let dragging = false
    let lastX = 0
    let lastY = 0
    const down = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY }
    const move = (event: PointerEvent) => {
      if (!dragging) return
      sphere.rotation.y += (event.clientX - lastX) * 0.01
      sphere.rotation.x += (event.clientY - lastY) * 0.01
      lastX = event.clientX
      lastY = event.clientY
    }
    const up = () => { dragging = false }
    renderer.domElement.addEventListener('pointerdown', down)
    renderer.domElement.addEventListener('pointermove', move)
    renderer.domElement.addEventListener('pointerup', up)
    renderer.domElement.addEventListener('pointerleave', up)
    let frameId = 0
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const current = vectorRef.current
      const direction = new THREE.Vector3(current.x, current.z, -current.y)
      if (direction.lengthSq() > 0.0001) {
        arrow.setDirection(direction.normalize())
        arrow.setLength(Math.min(1.15, Math.max(0.18, Math.sqrt(current.x ** 2 + current.y ** 2 + current.z ** 2))), 0.12, 0.08)
      }
      scene.rotation.y += dragging ? 0 : 0.0015
      renderer.render(scene, camera)
    }
    animate()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', down)
      renderer.domElement.removeEventListener('pointermove', move)
      renderer.domElement.removeEventListener('pointerup', up)
      cancelAnimationFrame(frameId)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="bloch-canvas" ref={mountRef} aria-label="Interactive Bloch sphere" />
}
