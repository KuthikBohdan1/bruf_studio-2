import type { CSSProperties, ElementType } from 'react'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/cn'

interface SplitTextProps {
  text: string
  as?: ElementType
  id?: string
  className?: string
  delay?: number
  /** Indexes of words to paint with the highlighter. */
  highlight?: number[]
}

/**
 * Splits a heading into words that slide up one after another. Screen readers
 * get the plain sentence via aria-label; the animated spans are hidden.
 */
export function SplitText({ text, as: Tag = 'h2', id, className, delay = 0, highlight = [] }: SplitTextProps) {
  const { ref, inView } = useInView<HTMLElement>('0px 0px -5% 0px')
  const words = text.split(/\s+/).filter(Boolean)

  return (
    <Tag
      ref={ref}
      id={id}
      aria-label={text}
      data-reveal={inView ? 'shown' : 'hidden'}
      style={{ '--delay': delay } as CSSProperties}
      className={cn('split-text', className)}
    >
      {words.map((word, index) => (
        <span key={index} aria-hidden="true">
          <span className="split-word">
            <span
              style={{ '--i': index } as CSSProperties}
              className={highlight.includes(index) ? 'marker' : undefined}
            >
              {word}
            </span>
          </span>{' '}
        </span>
      ))}
    </Tag>
  )
}
