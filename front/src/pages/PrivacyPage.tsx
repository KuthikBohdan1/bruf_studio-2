import { ArrowLeft } from 'lucide-react'

import { Link } from '@/components/ui/Link'
import { useT } from '@/lib/i18n'

export function PrivacyPage({ email }: { email: string }) {
  const t = useT()

  return (
    <article aria-labelledby="privacy-heading" className="px-4 pt-28 pb-24 sm:px-6 lg:px-10 lg:pt-36">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t.privacy.home}
        </Link>
        <h1
          id="privacy-heading"
          className="mt-10 font-display text-[clamp(1.45rem,7.4vw,4rem)] leading-[1.05] font-medium tracking-[-0.04em] text-balance"
        >
          {t.privacy.title}
        </h1>
        <p className="label mt-6 text-muted-foreground">{t.privacy.updated}</p>

        <div className="mt-12 space-y-10">
          {t.privacy.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-pretty text-foreground/80">{section.text}</p>
            </section>
          ))}
          {email ? (
            <p className="text-lg">
              <a href={`mailto:${email}`} className="underline underline-offset-4">
                {email}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
