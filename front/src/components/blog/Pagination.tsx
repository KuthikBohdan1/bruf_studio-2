import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'

interface PaginationProps {
  page: number
  pages: number
  onChange: (page: number) => void
}

const CELL = 'flex h-12 w-12 items-center justify-center border font-semibold transition-colors'

export function Pagination({ page, pages, onChange }: PaginationProps) {
  const t = useT()
  if (pages < 2) return null

  return (
    <nav aria-label={t.blog.pages} className="flex justify-center gap-2 pt-16 lg:pt-20">
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
          className={cn(
            CELL,
            number === page ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground',
          )}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        aria-label={t.blog.nextPage}
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className={cn(CELL, 'border-border hover:border-foreground disabled:pointer-events-none disabled:opacity-40')}
      >
        <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
      </button>
    </nav>
  )
}
