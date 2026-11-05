import { ArrowUpRight } from 'lucide-react'

import { Link } from '@/components/ui/Link'
import type { Post } from '@/lib/api'
import { formatDate, readingMinutes } from '@/lib/markup'
import { postUrl } from '@/lib/router'
import { useT } from '@/lib/i18n'

/** One article in a list: date, title, excerpt. Optional cover on the side. */
export function PostCard({ post, headingLevel: Heading = 'h2' }: { post: Post; headingLevel?: 'h2' | 'h3' }) {
  const t = useT()

  return (
    <Link
      href={postUrl(post.slug)}
      className="group grid gap-6 border-t border-border py-8 lg:grid-cols-12 lg:py-10"
    >
      <p className="label text-muted-foreground lg:col-span-3">
        <time dateTime={post.published_at}>{formatDate(post.published_at, t.locale)}</time>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        {t.blog.minutes(readingMinutes(post.body), true)}
      </p>

      <div className="lg:col-span-7">
        <Heading className="font-display text-2xl font-medium tracking-tight transition-transform duration-500 ease-out-expo group-hover:translate-x-2 lg:text-3xl">
          {post.title}
        </Heading>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{post.excerpt}</p>
      </div>

      <div className="flex items-start justify-between gap-6 lg:col-span-2 lg:justify-end">
        {post.cover ? (
          <img
            src={post.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-40 rounded-xl object-cover lg:w-full"
          />
        ) : null}
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/25 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
    </Link>
  )
}
