import type { CSSProperties } from 'react'

import type { Post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { type Composition, coverFor, type Shape } from '@/lib/covers'

function shapeStyle([left, top, width, height]: Shape): CSSProperties {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }
}

interface PostCoverProps {
  post: Post
  composition?: Composition
  className?: string
}

/** The uploaded cover, or a geometric placeholder in the site palette. */
export function PostCover({ post, composition = coverFor(post), className }: PostCoverProps) {
  if (post.cover) {
    return (
      <img
        src={post.cover}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn('w-full object-cover', className)}
      />
    )
  }

  return (
    <div aria-hidden="true" className={cn('relative overflow-hidden', composition.background, className)}>
      <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
        {composition.shapes.map((shape, index) => (
          <span key={index} className={cn('absolute', shape[4])} style={shapeStyle(shape)} />
        ))}
      </div>
    </div>
  )
}
