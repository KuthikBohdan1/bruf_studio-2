import { Search } from 'lucide-react'

import { POST_CATEGORIES, type PostCategory } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'

export type CategoryFilter = PostCategory | 'all'

interface BlogFiltersProps {
  /** Only categories that have at least one post get a pill. */
  categories: PostCategory[]
  category: CategoryFilter
  onCategoryChange: (category: CategoryFilter) => void
  query: string
  onQueryChange: (query: string) => void
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-10.5 shrink-0 rounded-full border px-4.5 text-[0.95rem] font-medium transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Category pills and a search box, between two rules. */
export function BlogFilters({ categories, category, onCategoryChange, query, onQueryChange }: BlogFiltersProps) {
  const t = useT()
  const pills = POST_CATEGORIES.filter((value) => categories.includes(value))

  return (
    <div className="flex flex-col gap-4 border-y border-border py-6 lg:flex-row lg:items-center lg:py-8">
      <div
        role="group"
        aria-label={t.blog.categories}
        className="-mx-4 flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <Pill active={category === 'all'} onClick={() => onCategoryChange('all')}>
          {t.blog.allPosts}
        </Pill>
        {pills.map((value) => (
          <Pill key={value} active={category === value} onClick={() => onCategoryChange(value)}>
            {t.blog.categoryNames[value]}
          </Pill>
        ))}
      </div>

      <label className="flex h-10.5 items-center gap-2.5 border border-border px-4 transition-colors focus-within:border-foreground lg:ml-auto lg:w-70">
        <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{t.blog.search}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.blog.search}
          className="w-full bg-transparent text-[0.95rem] outline-none placeholder:text-muted-foreground"
        />
      </label>
    </div>
  )
}
