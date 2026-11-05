import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface MarqueeProps {
  items: ReactNode[]
  className?: string
  /** Seconds for one full loop. */
  duration?: number
  separator?: ReactNode
}

/**
 * An endless ticker. The item list is rendered twice and the track slides by
 * exactly half its width, so the loop has no visible seam. Purely decorative:
 * the copy is hidden from assistive tech, which reads the real content elsewhere.
 */
export function Marquee({ items, className, duration = 40, separator = '✳' }: MarqueeProps) {
  const sequence = items.flatMap((item, index) => [
    <span key={`item-${index}`}>{item}</span>,
    <span key={`sep-${index}`} className="opacity-50">
      {separator}
    </span>,
  ])

  return (
    <div aria-hidden="true" className={cn('marquee overflow-hidden whitespace-nowrap select-none', className)}>
      <div
        className="marquee-track flex w-max items-center gap-[0.6em]"
        style={{ '--duration': `${duration}s` } as CSSProperties}
      >
        <div className="flex items-center gap-[0.6em] pr-[0.6em]">{sequence}</div>
        <div className="flex items-center gap-[0.6em] pr-[0.6em]">{sequence}</div>
      </div>
    </div>
  )
}
