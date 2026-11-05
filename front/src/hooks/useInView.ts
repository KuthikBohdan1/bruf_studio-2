import { useEffect, useRef, useState } from 'react'

/**
 * `true` once the element has scrolled into view, and it stays `true`:
 * reveal animations play once, not every time the visitor scrolls past.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || inView) return

    // Anything already on screen at mount plays right away; the shrunken
    // rootMargin is only for content scrolled into view later. Otherwise a
    // block near the bottom edge of the first screen would never appear.
    if (element.getBoundingClientRect().top < window.innerHeight) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return { ref, inView }
}
