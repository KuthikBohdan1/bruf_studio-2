import { useMemo, useRef, useState } from 'react'

import { type CategoryFilter, BlogFilters } from '@/components/blog/BlogFilters'
import { FeaturedPost } from '@/components/blog/FeaturedPost'
import { Newsletter } from '@/components/blog/Newsletter'
import { Pagination } from '@/components/blog/Pagination'
import { PostTile } from '@/components/blog/PostTile'
import { Reveal } from '@/components/ui/Reveal'
import { SplitText } from '@/components/ui/SplitText'
import type { Post, PostCategory } from '@/lib/api'
import { useT, type Strings } from '@/lib/i18n'

const PAGE_SIZE = 6

function matches(post: Post, query: string, t: Strings): boolean {
  const haystack = `${post.title} ${post.excerpt} ${t.blog.categoryNames[post.category]}`.toLowerCase()
  return haystack.includes(query)
}

export function BlogPage({ posts }: { posts: Post[] }) {
  const t = useT()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)

  const needle = query.trim().toLowerCase()
  const browsing = category === 'all' && !needle
  const featured = posts.find((post) => post.is_featured) ?? posts[0]

  const categories = useMemo(() => [...new Set(posts.map((post) => post.category))] as PostCategory[], [posts])

  // Unfiltered, the lead article sits above the grid; once the visitor
  // filters or searches, every match goes into the grid instead.
  const results = browsing
    ? posts.filter((post) => post !== featured)
    : posts.filter((post) => (category === 'all' || post.category === category) && matches(post, needle, t))
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function changeCategory(next: CategoryFilter) {
    setCategory(next)
    setPage(1)
  }

  function changeQuery(next: string) {
    setQuery(next)
    setPage(1)
  }

  function changePage(next: number) {
    setPage(next)
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    listRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  function reset() {
    changeCategory('all')
    setQuery('')
  }

  return (
    <>
      <section aria-labelledby="blog-heading" className="px-4 pt-28 pb-20 sm:px-6 lg:px-10 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-[90rem]">
          <p className="label flex items-center gap-3 text-muted-foreground">
            <span className="h-1.5 w-7 bg-primary" aria-hidden="true" />
            {t.blog.label}
          </p>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SplitText
              as="h1"
              id="blog-heading"
              text={t.blog.heading}
              className="font-display text-[clamp(4.5rem,10.4vw,9.4rem)] leading-[0.95] font-medium tracking-[-0.05em]"
            />
            <Reveal delay={250}>
              <p className="max-w-[32.5rem] pb-3 text-lg leading-relaxed text-pretty text-muted-foreground lg:text-[1.3rem]">
                {t.blog.intro}
              </p>
            </Reveal>
          </div>

          {posts.length === 0 ? (
            <p className="mt-16 text-lg text-muted-foreground">{t.blog.empty}</p>
          ) : (
            <>
              <div className="mt-12 lg:mt-14">
                <BlogFilters
                  categories={categories}
                  category={category}
                  onCategoryChange={changeCategory}
                  query={query}
                  onQueryChange={changeQuery}
                />
              </div>

              {browsing && current === 1 && featured ? (
                <Reveal className="pt-14 pb-6 lg:pt-18 lg:pb-10">
                  <FeaturedPost post={featured} />
                </Reveal>
              ) : null}

              <div ref={listRef} className="scroll-mt-28 pt-14">
                {visible.length > 0 ? (
                  <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((post, index) => (
                      <Reveal as="li" key={post.id} delay={(index % 3) * 90}>
                        <PostTile post={post} />
                      </Reveal>
                    ))}
                  </ul>
                ) : browsing ? null : (
                  <p className="text-lg text-muted-foreground">
                    {t.blog.nothing}{' '}
                    <button type="button" onClick={reset} className="font-medium text-foreground underline underline-offset-4">
                      {t.blog.showAll}
                    </button>
                  </p>
                )}

                <Pagination page={current} pages={pages} onChange={changePage} />
              </div>
            </>
          )}
        </div>
      </section>

      <Newsletter />
    </>
  )
}
