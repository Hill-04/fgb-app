'use client'

import React, { useEffect, useRef, useState } from 'react'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: 1 | 2 | 3 | 4
  element?: keyof React.JSX.IntrinsicElements
  style?: React.CSSProperties
}

export function AnimatedSection({ 
  children, 
  className = '', 
  delay,
  element: Element = 'div',
  style
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<any>(null)

  useEffect(() => {
    const currentRef = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [])

  const delayClass = delay ? `fgb-delay-${delay}` : ''
  const animClass = isVisible ? `fgb-anim-up ${delayClass}` : 'opacity-0 translate-y-4'

  return React.createElement(
    Element,
    {
      ref,
      className: `${animClass} ${className}`.trim(),
      style,
    },
    children
  )
}
