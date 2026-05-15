'use client'

import { useRef, useState, useEffect } from 'react'

interface BasketballHoopProps {
  onScore?: () => void
  className?: string
}

const BALL_HOME = { x: 100, y: 340 }
const RIM_CENTER = { x: 248, y: 142 }
const RIM_WIDTH = 36
const RIM_HEIGHT = 18

export function BasketballHoop({ onScore, className = '' }: BasketballHoopProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const ballGroupRef = useRef<SVGGElement>(null)
  const ballShadowRef = useRef<SVGEllipseElement>(null)
  const netGroupRef = useRef<SVGGElement>(null)
  const pointsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [showHint, setShowHint] = useState(true)
  const isAnimatingRef = useRef(false)
  const isDraggingRef = useRef(false)

  const ballPosRef = useRef({ x: BALL_HOME.x, y: BALL_HOME.y })
  const dragHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([])

  function setBallTransform(x: number, y: number) {
    ballPosRef.current = { x, y }
    if (ballGroupRef.current) {
      ballGroupRef.current.setAttribute('transform', `translate(${x}, ${y})`)
    }
    if (ballShadowRef.current) {
      const heightFromHome = BALL_HOME.y - y
      const shadowOpacity = Math.max(0.05, 0.25 - heightFromHome * 0.001)
      const shadowScale = Math.max(0.5, 1 - heightFromHome * 0.003)
      ballShadowRef.current.setAttribute('opacity', String(shadowOpacity))
      ballShadowRef.current.setAttribute('rx', String(28 * shadowScale))
    }
  }

  function screenToSvg(clientX: number, clientY: number) {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 500
    const y = ((clientY - rect.top) / rect.height) * 420
    return { x, y }
  }

  function svgToScreen(svgX: number, svgY: number) {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const x = rect.left + (svgX / 500) * rect.width
    const y = rect.top + (svgY / 420) * rect.height
    return { x, y }
  }

  function animateBallTo(targetX: number, targetY: number, duration: number, callback?: () => void) {
    const startX = ballPosRef.current.x
    const startY = ballPosRef.current.y
    const startTime = performance.now()
    function frame(now: number) {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const x = startX + (targetX - startX) * eased
      const y = startY + (targetY - startY) * eased
      setBallTransform(x, y)
      if (t < 1) requestAnimationFrame(frame)
      else if (callback) callback()
    }
    requestAnimationFrame(frame)
  }

  function spawnConfetti() {
    if (!containerRef.current) return
    const rimScreen = svgToScreen(RIM_CENTER.x, RIM_CENTER.y)
    const containerRect = containerRef.current.getBoundingClientRect()
    const cx = rimScreen.x - containerRect.left
    const cy = rimScreen.y - containerRect.top
    const colors = ['#1B7340', '#F5C200', '#E87E2C', '#FFFFFF', '#DC2626', '#3B82F6']

    for (let i = 0; i < 36; i++) {
      const c = document.createElement('div')
      c.style.position = 'absolute'
      c.style.left = `${cx}px`
      c.style.top = `${cy}px`
      const size = 6 + Math.random() * 6
      c.style.width = `${size}px`
      c.style.height = `${size}px`
      c.style.background = colors[Math.floor(Math.random() * colors.length)]
      c.style.zIndex = '15'
      c.style.pointerEvents = 'none'
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      containerRef.current.appendChild(c)

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI
      const vel = 4 + Math.random() * 6
      let vx = Math.cos(angle) * vel
      let vy = Math.sin(angle) * vel
      let px = 0, py = 0, op = 1, rot = Math.random() * 360
      const rs = (Math.random() - 0.5) * 20

      function ani() {
        px += vx; py += vy; vy += 0.2; vx *= 0.99
        op -= 0.012; rot += rs
        c.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`
        c.style.opacity = String(op)
        if (op > 0) requestAnimationFrame(ani)
        else c.remove()
      }
      ani()
    }
  }

  function handleScore() {
    if (onScore) onScore()

    if (netGroupRef.current) {
      netGroupRef.current.classList.remove('shake')
      void netGroupRef.current.getBoundingClientRect()
      netGroupRef.current.classList.add('shake')
      setTimeout(() => netGroupRef.current?.classList.remove('shake'), 800)
    }

    if (pointsRef.current && containerRef.current) {
      const rimScreen = svgToScreen(RIM_CENTER.x, RIM_CENTER.y)
      const containerRect = containerRef.current.getBoundingClientRect()
      pointsRef.current.style.left = `${rimScreen.x - containerRect.left - 30}px`
      pointsRef.current.style.top = `${rimScreen.y - containerRect.top - 30}px`
      pointsRef.current.classList.remove('show')
      void pointsRef.current.offsetWidth
      pointsRef.current.classList.add('show')
    }

    spawnConfetti()
  }

  function throwBall(vx: number, vy: number) {
    console.log('[BasketballHoop] throwBall START', { vx, vy, ballPos: ballPosRef.current })
    isAnimatingRef.current = true
    setShowHint(false)
    if (ballGroupRef.current) {
      ballGroupRef.current.classList.add('ball-spin')
    }
    const gravity = 0.45
    let dx = vx
    let dy = vy
    let didScore = false
    let frameCount = 0

    function frame() {
      frameCount++
      const newX = ballPosRef.current.x + dx
      const newY = ballPosRef.current.y + dy
      setBallTransform(newX, newY)
      dy += gravity

      if (!didScore && dy > 0) {
        const distX = Math.abs(newX - RIM_CENTER.x)
        const distY = Math.abs(newY - RIM_CENTER.y)
        if (distX < RIM_WIDTH && distY < RIM_HEIGHT) {
          didScore = true
          console.log('[BasketballHoop] SCORE!', { newX, newY })
          handleScore()
        }
      }

      const outOfBounds = newY > 400 || newX < -80 || newX > 580
      if (outOfBounds) {
        console.log('[BasketballHoop] throwBall END', { frameCount, didScore, finalPos: { x: newX, y: newY } })
        isAnimatingRef.current = false
        if (ballGroupRef.current) {
          ballGroupRef.current.classList.remove('ball-spin')
        }
        setTimeout(() => {
          animateBallTo(BALL_HOME.x, BALL_HOME.y, 400, () => {
            if (!didScore) setShowHint(true)
          })
        }, didScore ? 500 : 200)
        return
      }
      requestAnimationFrame(frame)
    }
    frame()
  }

  useEffect(() => {
    const ballGroup = ballGroupRef.current
    if (!ballGroup) return

    function handleStart(clientX: number, clientY: number, e?: Event) {
      if (isAnimatingRef.current) return
      isDraggingRef.current = true
      const svgPt = screenToSvg(clientX, clientY)
      dragHistoryRef.current = [{ x: svgPt.x, y: svgPt.y, time: performance.now() }]
      e?.preventDefault()
    }

    function handleMove(clientX: number, clientY: number, e?: Event) {
      if (!isDraggingRef.current) return
      e?.preventDefault()
      const svgPt = screenToSvg(clientX, clientY)
      const now = performance.now()
      setBallTransform(svgPt.x, svgPt.y)
      dragHistoryRef.current.push({ x: svgPt.x, y: svgPt.y, time: now })
      dragHistoryRef.current = dragHistoryRef.current.filter(p => now - p.time < 150)
    }

    function handleEnd(e?: Event) {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      e?.preventDefault()
      const history = dragHistoryRef.current
      if (history.length < 2) {
        console.log('[BasketballHoop] handleEnd: history < 2, returning to home')
        animateBallTo(BALL_HOME.x, BALL_HOME.y, 300)
        return
      }
      const last = history[history.length - 1]
      const first = history[0]
      const dt = (last.time - first.time) / 1000
      const dx = last.x - first.x
      const dy = last.y - first.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      console.log('[BasketballHoop] handleEnd', { dx, dy, dt, distance })
      if (distance < 30 || dt > 0.4) {
        console.log('[BasketballHoop] handleEnd: drag too small/slow, returning to home')
        animateBallTo(BALL_HOME.x, BALL_HOME.y, 300)
        return
      }
      const speedScale = 0.012
      const vx = (dx / dt) * speedScale
      const vy = (dy / dt) * speedScale - 4
      throwBall(vx, vy)
    }

    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY, e)
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY, e)
    const onMouseUp = (e: MouseEvent) => handleEnd(e)
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      handleStart(t.clientX, t.clientY, e)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      const t = e.touches[0]
      handleMove(t.clientX, t.clientY, e)
    }
    const onTouchEnd = (e: TouchEvent) => handleEnd(e)

    ballGroup.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    ballGroup.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      ballGroup.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      ballGroup.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  useEffect(() => {
    setBallTransform(BALL_HOME.x, BALL_HOME.y)
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full h-[420px] select-none touch-none ${className}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 500 420"
        className="w-full h-full overflow-visible block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="ballGradient" cx="30%" cy="25%" r="80%">
            <stop offset="0%" stopColor="#FFC178" />
            <stop offset="25%" stopColor="#F09340" />
            <stop offset="70%" stopColor="#D2691E" />
            <stop offset="100%" stopColor="#7A3508" />
          </radialGradient>
          <linearGradient id="backboardGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F5" />
            <stop offset="40%" stopColor="#EAEAEA" />
            <stop offset="100%" stopColor="#DDDDDD" />
          </linearGradient>
          <linearGradient id="backboardShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="20%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="rimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F37458" />
            <stop offset="50%" stopColor="#E55B3C" />
            <stop offset="100%" stopColor="#B8421F" />
          </linearGradient>
        </defs>

        <rect x="142" y="48" width="220" height="100" fill="rgba(0,0,0,0.06)" rx="2" />

        <rect x="138" y="42" width="220" height="100" fill="#B5B5B5" rx="2" />

        <rect x="120" y="130" width="256" height="22" fill="#4A3A5A" rx="2" />
        <rect x="120" y="130" width="256" height="6" fill="rgba(0,0,0,0.2)" rx="2" />

        <rect x="146" y="50" width="204" height="84" fill="url(#backboardGlass)" />
        <rect x="146" y="50" width="204" height="84" fill="url(#backboardShine)" opacity="0.7" />

        <g opacity="0.15">
          <line x1="170" y1="50" x2="170" y2="134" stroke="#999" strokeWidth="0.4" />
          <line x1="195" y1="50" x2="195" y2="134" stroke="#999" strokeWidth="0.4" />
          <line x1="220" y1="50" x2="220" y2="134" stroke="#999" strokeWidth="0.4" />
          <line x1="245" y1="50" x2="245" y2="134" stroke="#999" strokeWidth="0.4" />
          <line x1="270" y1="50" x2="270" y2="134" stroke="#999" strokeWidth="0.4" />
          <line x1="295" y1="50" x2="295" y2="134" stroke="#999" strokeWidth="0.4" />
          <line x1="320" y1="50" x2="320" y2="134" stroke="#999" strokeWidth="0.4" />
        </g>

        <rect x="216" y="92" width="64" height="42" fill="none" stroke="#B5B5B5" strokeWidth="4" />

        <g>
          <rect x="244" y="130" width="8" height="14" fill="url(#rimGradient)" />
          <rect x="212" y="138" width="72" height="8" fill="url(#rimGradient)" rx="4" />
          <rect x="216" y="139" width="64" height="2" fill="rgba(255,200,180,0.6)" rx="1" />
        </g>

        <g ref={netGroupRef} className="net-group">
          <path d="M 215 146 L 225 165 L 220 184 L 230 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 227 146 L 237 165 L 232 184 L 242 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 239 146 L 249 165 L 244 184 L 254 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 251 146 L 261 165 L 256 184 L 266 200" stroke="#DC2626" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 263 146 L 273 165 L 268 184 L 278 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 275 146 L 285 165 L 280 184 L 290 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 281 146 L 271 165 L 276 184 L 266 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 269 146 L 259 165 L 264 184 L 254 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 257 146 L 247 165 L 252 184 L 242 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 245 146 L 235 165 L 240 184 L 230 200" stroke="#DC2626" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 233 146 L 223 165 L 228 184 L 218 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 221 146 L 211 165 L 216 184 L 206 200" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        <g ref={ballGroupRef} className="ball-group cursor-grab" transform="translate(100, 340)">
          <ellipse ref={ballShadowRef} cx="0" cy="35" rx="28" ry="6" fill="rgba(0,0,0,0.25)" />
          <g>
            <circle cx="0" cy="0" r="30" fill="url(#ballGradient)" />
            <path d="M 0 -30 Q 0 0, 0 30" stroke="rgba(40,15,5,0.85)" strokeWidth="1.8" fill="none" />
            <path d="M -30 0 Q 0 -4, 30 0" stroke="rgba(40,15,5,0.85)" strokeWidth="1.8" fill="none" />
            <path d="M -17 -25 Q -24 0, -17 25" stroke="rgba(40,15,5,0.8)" strokeWidth="1.8" fill="none" />
            <path d="M 17 -25 Q 24 0, 17 25" stroke="rgba(40,15,5,0.8)" strokeWidth="1.8" fill="none" />
            <ellipse cx="-10" cy="-12" rx="10" ry="7" fill="rgba(255,240,200,0.55)" transform="rotate(-25 -10 -12)" />
            <ellipse cx="-14" cy="-16" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.7)" />
            <ellipse cx="6" cy="16" rx="16" ry="10" fill="rgba(80,30,5,0.25)" />
            <path d="M -22 22 Q 0 32, 22 22" stroke="rgba(60,20,5,0.3)" strokeWidth="1" fill="none" />
          </g>
        </g>
      </svg>

      <div ref={pointsRef} className="basketball-points">+3</div>
      <div className={`basketball-hint ${!showHint ? 'hide' : ''}`}>
        Deslize a bola na direção da cesta 🏀
      </div>
    </div>
  )
}
