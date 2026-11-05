import { useEffect, useRef, type RefObject } from 'react'

import type { Project } from '@/lib/api'
import { cn } from '@/lib/cn'
import { textOn } from '@/lib/text'

interface CaseMediaProps {
  project: Project
  eager?: boolean
  className?: string
}

const FALLBACK_COLOR = '#1b1b1b'

/**
 * Cover of a case: preview video, image, or — when the admin uploaded neither —
 * a typographic poster in the case colour, so a fresh case never looks broken.
 */
export function CaseMedia({ project, eager = false, className }: CaseMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const color = project.color || FALLBACK_COLOR

  useCasePlayback(videoRef)

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl ring-1 ring-border', className)}
      style={{ backgroundColor: color }}
    >
      {project.image ? (
        <img
          src={project.image}
          alt={project.title}
          width={1600}
          height={1200}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          // Covers are usually site screenshots, which read from the top.
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]"
        />
      ) : (
        <Poster project={project} tone={textOn(color)} />
      )}

      {project.video ? (
        <video
          ref={videoRef}
          src={project.video}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          // Same crop as the cover, so the first frame takes over without a jump.
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : null}
    </div>
  )
}

/** Leads with the case's headline result; falls back to the title when there are no metrics. */
function Poster({ project, tone }: { project: Project; tone: 'light' | 'dark' }) {
  const headline = project.metrics[0]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 flex flex-col justify-between p-6 transition-transform duration-1000 ease-out-expo group-hover:scale-[1.03] lg:p-10',
        tone === 'light' ? 'text-white' : 'text-black',
      )}
    >
      <span className="label flex justify-between opacity-60">
        <span>{project.client || project.category}</span>
        <span>{project.year}</span>
      </span>

      {headline ? (
        <span>
          <span className="block font-display text-[clamp(3.5rem,11vw,10rem)] leading-[0.9] font-medium tracking-[-0.05em]">
            {headline.value}
          </span>
          <span className="mt-3 block max-w-xs text-lg opacity-80">{headline.label}</span>
        </span>
      ) : (
        <span className="font-display text-[clamp(2rem,6vw,5.5rem)] leading-[0.95] font-medium tracking-[-0.04em] text-balance">
          {project.title}
        </span>
      )}

      <span className="label opacity-60">{project.stack.join(' / ')}</span>
    </div>
  )
}

/** Plays while on screen, paused otherwise. With reduced motion the cover stays still. */
function useCasePlayback(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => undefined)
      else video.pause()
    })
    observer.observe(video)
    return () => observer.disconnect()
  }, [ref])
}
