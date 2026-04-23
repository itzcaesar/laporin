'use client'
// ── hooks/useConfetti.ts ──
// Triggers a confetti burst at a given DOM element or screen position.

import { useCallback } from 'react'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316']
const SHAPES = ['■', '●', '▲', '◆']

export function useConfetti() {
  const burst = useCallback((originX?: number, originY?: number) => {
    const x = originX ?? window.innerWidth / 2
    const y = originY ?? window.innerHeight / 3

    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-particle'
      el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)]

      const angle = Math.random() * 360
      const distance = 60 + Math.random() * 120
      const dx = Math.cos((angle * Math.PI) / 180) * distance
      const dy = Math.sin((angle * Math.PI) / 180) * distance

      el.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        color: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        font-size: ${8 + Math.random() * 10}px;
        transform-origin: center center;
        animation: confetti-fall ${0.6 + Math.random() * 0.6}s ease-out forwards;
        animation-delay: ${Math.random() * 0.2}s;
        --dx: ${dx}px;
        --dy: ${dy}px;
      `

      // Manually override animation to use translate with random direction
      el.style.animation = 'none'
      el.style.transition = `transform ${0.6 + Math.random() * 0.5}s ease-out, opacity ${0.5 + Math.random() * 0.4}s ease-out`
      el.style.opacity = '1'

      document.body.appendChild(el)

      // Trigger reflow then animate
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 720}deg) scale(0.3)`
          el.style.opacity = '0'
        })
      })

      setTimeout(() => el.remove(), 1200)
    }
  }, [])

  return { burst }
}
