import { useEffect, useRef } from 'react'

/**
 * - `enter`:   0 when the element's top touches the bottom of the viewport,
 *              1 when it reaches the top.
 * - `through`: 0 when the element's top crosses the middle of the viewport,
 *              1 when its bottom does.
 * - `leave`:   0 when the element's top is at the top of the viewport,
 *              1 when its bottom is.
 */
export type ScrollProgressMode = 'enter' | 'through' | 'leave'

/**
 * Writes scroll progress (0…1) into the CSS variable `--progress` on the
 * returned element. Updates go straight to the DOM inside requestAnimationFrame,
 * so scroll-driven effects never re-render React.
 */
export function useScrollProgress<T extends HTMLElement>(mode: ScrollProgressMode) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let frame = 0

    const update = () => {
      frame = 0
      const { top, height } = element.getBoundingClientRect()
      const viewport = window.innerHeight
      const raw =
        mode === 'enter' ? (viewport - top) / viewport : mode === 'through' ? (viewport / 2 - top) / height : -top / height
      element.style.setProperty('--progress', Math.min(1, Math.max(0, raw)).toFixed(4))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [mode])

  return ref
}
