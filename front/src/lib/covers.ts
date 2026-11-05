import type { Post } from '@/lib/api'

/**
 * A block in a cover composition, positioned in percent of the cover so the
 * drawing scales with the card: [left, top, width, height, classes].
 */
export type Shape = [number, number, number, number, string]

export interface Composition {
  background: string
  shapes: Shape[]
}

// The bruf "B": a stem with two rounded bowls between two bars.
const MONOGRAM: Shape[] = [
  [12, 20, 46, 6, 'bg-primary-foreground'],
  [12, 32, 16, 48, 'bg-primary-foreground'],
  [31, 32, 27, 21, 'rounded-r-full bg-primary-foreground'],
  [31, 58, 31, 22, 'rounded-r-full bg-primary-foreground'],
  [12, 86, 46, 6, 'bg-primary-foreground'],
]

export const FEATURED_COVER: Composition = { background: 'bg-primary', shapes: MONOGRAM }

/** Abstract page layouts: a header and buttons, a sidebar, a chart... */
const COMPOSITIONS: Composition[] = [
  {
    background: 'bg-muted',
    shapes: [
      [10, 18, 22, 22, 'rounded-full bg-foreground'],
      [38, 18, 52, 22, 'bg-primary'],
      [10, 48, 80, 6, 'bg-foreground'],
      [10, 62, 60, 6, 'bg-foreground/20'],
      [10, 76, 70, 6, 'bg-foreground/20'],
    ],
  },
  {
    background: 'bg-card',
    shapes: [
      [9, 16, 28, 68, 'bg-primary'],
      [44, 16, 46, 5, 'bg-foreground'],
      [44, 30, 36, 5, 'bg-foreground'],
      [44, 44, 42, 5, 'bg-foreground'],
      [44, 79, 46, 5, 'bg-primary'],
    ],
  },
  {
    background: 'bg-inverse',
    shapes: [
      [8, 20, 84, 4, 'bg-primary'],
      [8, 34, 50, 18, 'bg-inverse-foreground/15'],
      [8, 58, 76, 18, 'bg-inverse-foreground/15'],
      [62, 34, 18, 18, 'bg-primary'],
    ],
  },
  {
    background: 'bg-muted',
    shapes: [
      [12, 22, 30, 56, 'border-3 border-foreground bg-card'],
      [50, 22, 38, 24, 'bg-primary'],
      [50, 54, 38, 24, 'bg-foreground'],
    ],
  },
  {
    background: 'bg-inverse',
    shapes: [
      [10, 16, 40, 4, 'bg-inverse-foreground/15'],
      [10, 68, 12, 14, 'bg-primary'],
      [26, 54, 12, 28, 'bg-primary'],
      [42, 40, 12, 42, 'bg-primary'],
      [58, 26, 12, 56, 'bg-inverse-foreground'],
    ],
  },
  { background: 'bg-primary', shapes: MONOGRAM },
]

/** Same post, same drawing: the pick depends on the id, not on list position. */
export function coverFor(post: Post): Composition {
  return COMPOSITIONS[post.id % COMPOSITIONS.length]
}
