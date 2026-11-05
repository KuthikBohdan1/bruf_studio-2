import { PostCover } from '@/components/blog/PostCover'
import { PostMeta } from '@/components/blog/PostMeta'
import { Link } from '@/components/ui/Link'
import type { Post } from '@/lib/api'
import { postUrl } from '@/lib/router'

/** A card in the blog grid: drawn or uploaded cover, meta, title, excerpt. */
export function PostTile({ post }: { post: Post }) {
  return (
    <article>
      <Link href={postUrl(post.slug)} className="group block">
        <PostCover post={post} className="aspect-[405/280] ring-1 ring-border ring-inset" />
        <div className="mt-5">
          <PostMeta post={post} />
        </div>
        <h3 className="mt-3 font-display text-xl leading-snug font-medium tracking-tight text-balance decoration-primary decoration-[0.12em] underline-offset-4 group-hover:underline lg:text-2xl">
          {post.title}
        </h3>
        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-pretty text-muted-foreground">{post.excerpt}</p>
      </Link>
    </article>
  )
}
