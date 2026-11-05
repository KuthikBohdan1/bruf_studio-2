import { ArrowLeft, Send } from 'lucide-react'

import { PostBody } from '@/components/blog/PostBody'
import { PostCard } from '@/components/blog/PostCard'
import { PostAuthor, PostMeta } from '@/components/blog/PostMeta'
import { ButtonLink } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { SplitText } from '@/components/ui/SplitText'
import type { Post } from '@/lib/api'
import { BLOG_PATH } from '@/lib/router'
import { telegramChat, type SocialProfile } from '@/lib/text'
import { useT } from '@/lib/i18n'

interface PostPageProps {
  post: Post
  more: Post[]
  telegram: SocialProfile | null
}

export function PostPage({ post, more, telegram }: PostPageProps) {
  const t = useT()

  return (
    <>
      <article aria-labelledby="post-heading" className="px-4 pt-28 pb-20 sm:px-6 lg:px-10 lg:pt-36">
        <div className="mx-auto max-w-[90rem]">
          <Link
            href={BLOG_PATH}
            className="label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.post.all}
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <header className="lg:col-span-9">
              <PostMeta post={post} withDate long />
              <SplitText
                as="h1"
                id="post-heading"
                text={post.title}
                className="mt-6 font-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.04em] text-balance"
              />
              <p className="mt-8 max-w-[60ch] text-xl leading-relaxed text-pretty text-muted-foreground">
                {post.excerpt}
              </p>
              <PostAuthor post={post} className="mt-8" />
            </header>
          </div>

          {post.cover ? (
            <img
              src={post.cover}
              alt=""
              className="mt-12 aspect-[21/9] w-full rounded-2xl bg-muted object-cover ring-1 ring-border"
            />
          ) : null}

          <div className="mt-12 grid gap-10 border-t border-border pt-4 lg:grid-cols-12">
            <div className="lg:col-span-8 lg:col-start-4">
              <PostBody body={post.body} />
            </div>
          </div>
        </div>
      </article>

      <section aria-label={t.post.ctaLabel} className="bg-inverse px-4 py-16 text-inverse-foreground sm:px-6 lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-3xl font-medium tracking-tight lg:text-5xl">{t.post.ctaTitle}</p>
            <p className="mt-4 max-w-md opacity-70">{t.post.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {telegram ? (
              <ButtonLink
                href={telegramChat(telegram.url, t.telegram.about(post.title))}
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {t.post.telegram}
              </ButtonLink>
            ) : null}
            <ButtonLink href="/#contact" size="lg" variant="outline" className="border-current/30">
              {t.post.request}
            </ButtonLink>
          </div>
        </div>
      </section>

      {more.length > 0 ? (
        <section aria-labelledby="more-heading" className="px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[90rem]">
            <h2 id="more-heading" className="label mb-6 text-muted-foreground">
              {t.post.more}
            </h2>
            <ul className="border-b border-border">
              {more.map((item) => (
                <li key={item.id}>
                  <PostCard post={item} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}
