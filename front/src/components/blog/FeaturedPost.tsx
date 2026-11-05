import { ArrowRight } from 'lucide-react'

import { PostCover } from '@/components/blog/PostCover'
import { PostAuthor, PostMeta } from '@/components/blog/PostMeta'
import { Link } from '@/components/ui/Link'
import type { Post } from '@/lib/api'
import { FEATURED_COVER } from '@/lib/covers'
import { postUrl } from '@/lib/router'
import { useT } from '@/lib/i18n'

/** The lead article: large cover on the left, the pitch and author on the right. */
export function FeaturedPost({ post }: { post: Post }) {
  const t = useT()
  const href = postUrl(post.slug)

  return (
    <article className="grid gap-8 lg:grid-cols-[760fr_456fr] lg:items-center lg:gap-16">
      {/* The title link below is the accessible one; the cover only enlarges the target. */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className="group block">
        <PostCover
          post={post}
          composition={FEATURED_COVER}
          className="aspect-[760/480] ring-1 ring-border ring-inset"
        />
      </Link>

      <div>
        <PostMeta post={post} withDate long />
        <h2 className="mt-5 font-display text-[clamp(1.85rem,3vw,2.75rem)] leading-[1.08] font-medium tracking-[-0.035em] text-balance">
          <Link href={href} className="decoration-primary decoration-[0.1em] underline-offset-[0.12em] hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-5 text-[1.06rem] leading-relaxed text-pretty text-muted-foreground">{post.excerpt}</p>

        <PostAuthor post={post} className="mt-8" />

        <Link
          href={href}
          className="group mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 font-semibold"
        >
          {t.blog.read}
          <ArrowRight
            className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  )
}
