import { useEffect, useState } from 'react'

/**
 * Hides the header while the visitor scrolls down and brings it back as soon
 * as they scroll up — content gets the full screen, navigation stays one
 * flick away. Also reports whether the page has left the very top.
 */
export function useHideOnScroll(threshold = 8) {
  const [state, setState] = useState({ hidden: false, scrolled: false })

  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - lastY
      const moved = Math.abs(delta) >= threshold
      if (moved) lastY = y

      setState((previous) => {
        const hidden = moved ? delta > 0 && y > 160 : previous.hidden
        const scrolled = y > 24
        return hidden === previous.hidden && scrolled === previous.scrolled ? previous : { hidden, scrolled }
      })
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
    }
  }, [threshold])

  return state
}
