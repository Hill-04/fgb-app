"use client"

import { animate, useInView, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

type CountUpProps = {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  once?: boolean
  /** Format function takes precedence over decimals/prefix/suffix. */
  format?: (n: number) => string
}

const DEFAULT_LOCALE = "pt-BR"

export function CountUp({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  once = true,
  format,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once, amount: 0.4 })
  const [display, setDisplay] = useState<string>(() =>
    formatNumber(0, decimals, prefix, suffix, format),
  )
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      setDisplay(formatNumber(value, decimals, prefix, suffix, format))
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) =>
        setDisplay(formatNumber(n, decimals, prefix, suffix, format)),
    })
    return () => controls.stop()
  }, [inView, value, duration, decimals, prefix, suffix, format, prefersReduced])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

function formatNumber(
  n: number,
  decimals: number,
  prefix: string,
  suffix: string,
  format?: (n: number) => string,
) {
  if (format) return format(n)
  const fixed = n.toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${prefix}${fixed}${suffix}`
}
