import { useEffect, useRef } from 'react'

import { useScrollProgress } from '@/hooks/useScrollProgress'

interface HeroBackdropProps {
  video: string | null
  poster: string | null
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
/** Let the page settle before the video starts downloading. */
const VIDEO_DELAY_MS = 800

/** Data saver or a slow connection: the poster is enough. Not every browser reports this. */
function onSlowConnection(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return Boolean(connection?.saveData) || /2g|3g/.test(connection?.effectiveType ?? '')
}

/**
 * The first screen's backdrop: a round "lens" playing the portfolio reel,
 * framed by the page's dot field (DotField). Decoration only — the lens is
 * veiled so the headline on top stays readable in both themes. While the page
 * scrolls away the lens sinks and grows a little (via `--progress`). The video
 * plays only while it is on screen; with reduced motion the poster stays still.
 */
export function HeroBackdrop({ video, poster }: HeroBackdropProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const backdropRef = useScrollProgress<HTMLDivElement>('leave')

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia(REDUCED_MOTION).matches || onSlowConnection()) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Autoplay can still be refused (e.g. power saving); the poster stays then.
        element.play().catch(() => {})
      } else {
        element.pause()
      }
    })

    const timer = window.setTimeout(() => observer.observe(element), VIDEO_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [video])

  return (
    <div ref={backdropRef} aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10">
      <div className="hero-orb">
        <div className="hero-lens">
          {video ? (
            <video
              ref={ref}
              src={video}
              poster={poster ?? undefined}
              muted
              loop
              playsInline
              preload="none"
              className="hero-video"
            />
          ) : null}
        </div>
      </div>
      <div className="hero-veil absolute inset-0" />
    </div>
  )
}
