"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Children, type ReactNode } from "react"

type StaggerGridProps = {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
  duration?: number
  direction?: "up" | "down" | "none"
  distance?: number
  once?: boolean
}

const OFFSETS = { up: 20, down: -20, none: 0 }

export function StaggerGrid({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  duration = 0.55,
  direction = "up",
  distance,
  once = true,
}: StaggerGridProps) {
  const prefersReduced = useReducedMotion()
  const yOffset = distance ?? OFFSETS[direction]

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15, margin: "0px 0px -60px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: yOffset },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
