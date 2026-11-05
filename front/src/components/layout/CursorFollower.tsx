import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

/** How quickly the bubble catches up with the pointer (0…1 per frame). */
const EASING = 0.2

/**
 * A lime bubble that trails the pointer over any element with
 * `data-cursor="Label"` and shows that label. Mouse devices only; purely
 * decorative — the links underneath remain normal, labelled links.
 */
export function CursorFollower() {
  const ref = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let active = false
    let frame = 0

    const tick = () => {
      current.x += (target.x - current.x) * EASING
      current.y += (target.y - current.y) * EASING
      element.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`

      const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.5
      frame = settled ? 0 : requestAnimationFrame(tick)
    }

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX
      target.y = event.clientY

      const text = (event.target as Element | null)?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor ?? ''
      if (text && !active) {
        // Appear under the pointer instead of flying in from the last position.
        current.x = target.x
        current.y = target.y
      }
      active = Boolean(text)
      setVisible(active)
      if (text) setLabel(text)

      if (!frame) frame = requestAnimationFrame(tick)
    }

    const onLeave = () => {
      active = false
      setVisible(false)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-[90] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div
        className={cn(
          'label flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary p-3 text-center text-primary-foreground transition-[scale,opacity] duration-500 ease-out-expo',
          visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      >
        {label}
      </div>
    </div>
  )
}
