import type { ReactNode } from 'react'

import { SplitText } from '@/components/ui/SplitText'
import { cn } from '@/lib/cn'

interface SectionProps {
  id: string
  /** Mono label above the heading, e.g. "Послуги". */
  label: string
  title: string
  /** Sits to the right of the heading on wide screens. */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

/** Numbered section with an editorial, left-aligned header. */
export function Section({ id, label, title, aside, children, className }: SectionProps) {
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('scroll-mt-20 px-4 py-24 sm:px-6 lg:px-10 lg:py-36', className)}
    >
      <div className="mx-auto max-w-[90rem]">
        <header className="mb-14 grid gap-8 border-t border-border pt-6 lg:mb-20 lg:grid-cols-12">
          <p className="label text-muted-foreground lg:col-span-3">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden="true" />
            {label}
          </p>
          <SplitText
            id={headingId}
            text={title}
            className="font-display text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl lg:col-span-6 lg:text-6xl"
          />
          {aside ? <div className="self-end lg:col-span-3 lg:justify-self-end">{aside}</div> : null}
        </header>
        {children}
      </div>
    </section>
  )
}
