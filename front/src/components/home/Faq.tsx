import { Plus } from 'lucide-react'

import type { FaqItem } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { paragraphs } from '@/lib/text'

/**
 * Questions, kept deliberately quiet: a small heading beside a compact list,
 * so they answer doubts without competing with prices and contacts.
 */
/** Question rows, shared with the service pages. */
export function FaqList({ items }: { items: Array<Pick<FaqItem, 'id' | 'question' | 'answer'>> }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} className="border-b border-border first:border-t lg:first:border-t-0">
          {/* Native <details>: keyboard and screen-reader support for free. */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-3.5 text-[0.95rem] text-foreground/85 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
              {item.question}
              <Plus
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-500 ease-out-expo group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            <div className="max-w-2xl space-y-2 pb-5 text-sm leading-relaxed text-muted-foreground">
              {paragraphs(item.answer).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}

export function Faq({ items }: { items: FaqItem[] }) {
  const t = useT()

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
      <div className="mx-auto grid max-w-[90rem] gap-6 border-t border-border pt-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <p className="label text-muted-foreground">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden="true" />
            {t.nav.faq}
          </p>
          <h2 id="faq-heading" className="mt-3 max-w-[18ch] text-lg font-medium text-balance">
            {t.faq.title}
          </h2>
        </div>

        <div className="lg:col-span-9 lg:col-start-4">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  )
}
