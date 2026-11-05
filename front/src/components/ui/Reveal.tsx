import type { CSSProperties, ElementType, ReactNode } from 'react'

import { useInView } from '@/hooks/useInView'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  className?: string
  /** Extra delay in ms, for staggering siblings. */
  delay?: number
}

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ children, as: Tag = 'div', className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>()

  return (
    <Tag
      ref={ref}
      data-reveal={inView ? 'shown' : 'hidden'}
      style={{ '--delay': delay } as CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  )
}
