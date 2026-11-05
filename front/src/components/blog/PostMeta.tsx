import type { Post } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDate, readingMinutes } from '@/lib/markup'
import { useT } from '@/lib/i18n'

/** Category, reading time and (optionally) the date, in the mono label voice. */
export function PostMeta({ post, withDate = false, long = false }: { post: Post; withDate?: boolean; long?: boolean }) {
  const t = useT()

  return (
    <p className="label flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
      <span className="marker">{t.blog.categoryNames[post.category]}</span>
      <span>{t.blog.minutes(readingMinutes(post.body), long)}</span>
      {withDate ? <time dateTime={post.published_at}>{formatDate(post.published_at, t.locale)}</time> : null}
    </p>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

/** Initials avatar, name and role. Renders nothing for posts without an author. */
export function PostAuthor({ post, className }: { post: Post; className?: string }) {
  if (!post.author) return null

  return (
    <div className={cn('flex items-center gap-3.5', className)}>
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground font-semibold text-background"
      >
        {initials(post.author)}
      </span>
      <span>
        <span className="block font-semibold">{post.author}</span>
        {post.author_role ? <span className="block text-[0.95rem] text-muted-foreground">{post.author_role}</span> : null}
      </span>
    </div>
  )
}
