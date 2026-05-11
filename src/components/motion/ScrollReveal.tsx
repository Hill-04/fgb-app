"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

type ScrollRevealProps = {
  children: ReactNode
  delay?: number
  direction?: Direction
  distance?: number
  duration?: number
  className?: string
  once?: boolean
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  distance,
  duration = 0.6,
  className,
  once = true,
}: ScrollRevealProps) {
  const prefersReduced = useReducedMotion()
  const offset = OFFSETS[direction]
  const factor = distance !== undefined ? distance / 24 : 1

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x * factor, y: offset.y * factor }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
