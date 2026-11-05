import { useEffect, useState } from 'react'

/**
 * Highlights the nav entry for the section currently in view.
 * Uses IntersectionObserver rather than scroll listeners — no work on the main
 * thread while scrolling.
 */
export function useActiveSection(ids: readonly string[], enabled: boolean): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    )

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [ids, enabled])

  return active
}
