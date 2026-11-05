import { ArrowLeft, Send } from 'lucide-react'

import { PostBody } from '@/components/blog/PostBody'
import { CaseCard } from '@/components/home/Cases'
import { FaqList } from '@/components/home/Faq'
import { ButtonLink } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { Reveal } from '@/components/ui/Reveal'
import { SplitText } from '@/components/ui/SplitText'
import type { Project, Service } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { serviceUrl } from '@/lib/router'
import { telegramChat, type SocialProfile } from '@/lib/text'

interface ServicePageProps {
  service: Service
  /** The service's own cases, or a few others when it has none yet. */
  projects: Project[]
  others: Service[]
  telegram: SocialProfile | null
}

const BLOCK = 'grid gap-6 border-t border-border pt-8 lg:grid-cols-12'
const BLOCK_LABEL = 'label self-start text-muted-foreground lg:col-span-3'
const BLOCK_BODY = 'lg:col-span-8 lg:col-start-5'

/** A service written for one search query: what it is, what is included, what it costs. */
export function ServicePage({ service, projects, others, telegram }: ServicePageProps) {
  const t = useT()
  const headline = service.headline || service.title
  const chat = telegram ? telegramChat(telegram.url, t.telegram.about(service.title)) : null

  return (
    <>
      <article aria-labelledby="service-heading" className="px-4 pt-28 pb-20 sm:px-6 lg:px-10 lg:pt-36">
        <div className="mx-auto max-w-[90rem]">
          <Link
            href="/#pricing"
            className="label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.servicePage.all}
          </Link>

          <SplitText
            as="h1"
            id="service-heading"
            text={headline}
            className="mt-10 max-w-[20ch] font-display text-[clamp(2.1rem,6vw,5.5rem)] leading-[1.02] font-medium tracking-[-0.04em] text-balance"
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-7">
              <p className="text-xl leading-relaxed text-pretty lg:text-2xl">{service.intro || service.description}</p>
            </Reveal>

            <Reveal delay={150} className="rounded-2xl border border-border bg-card p-6 lg:col-span-4 lg:col-start-9 lg:p-8">
              <p className="label text-muted-foreground">{service.duration}</p>
              <p className="mt-3 font-display text-[clamp(1.6rem,8.5vw,2.25rem)] leading-tight font-medium tracking-tight lg:text-[clamp(1.4rem,2.3vw,2.25rem)]">
                {service.price_from}
              </p>
              <div className="mt-6 flex flex-col items-start gap-3">
                {chat ? (
                  <ButtonLink href={chat} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {t.telegram.cta}
                  </ButtonLink>
                ) : null}
                <Link href="/#contact" className="py-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  {t.telegram.request}
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="mt-20 space-y-16 lg:mt-28 lg:space-y-24">
            {service.deliverables.length > 0 ? (
              <section aria-labelledby="service-included" className={BLOCK}>
                <h2 id="service-included" className={BLOCK_LABEL}>
                  {t.servicePage.included}
                </h2>
                <ul className={`grid gap-x-8 gap-y-3 sm:grid-cols-2 ${BLOCK_BODY}`}>
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex gap-3 text-lg">
                      <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {service.details ? (
              <div className={BLOCK}>
                <p className={BLOCK_LABEL}>{t.servicePage.details}</p>
                <div className={`[&>div>h2:first-child]:mt-0 ${BLOCK_BODY}`}>
                  <PostBody body={service.details} />
                </div>
              </div>
            ) : null}

            <section aria-labelledby="service-process" className={BLOCK}>
              <h2 id="service-process" className={BLOCK_LABEL}>
                {t.nav.process}
              </h2>
              <p className={`text-lg text-pretty ${BLOCK_BODY}`}>
                {t.servicePage.process}{' '}
                <Link href="/#process" className="underline underline-offset-4">
                  {t.servicePage.processLink}
                </Link>
              </p>
            </section>

            {service.questions.length > 0 ? (
              <section aria-labelledby="service-faq" className={BLOCK}>
                <h2 id="service-faq" className={BLOCK_LABEL}>
                  {t.nav.faq}
                </h2>
                <div className={BLOCK_BODY}>
                  <FaqList items={service.questions} />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </article>

      {projects.length > 0 ? (
        <section aria-labelledby="service-cases" className="px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[90rem] border-t border-border pt-8">
            <h2 id="service-cases" className="label text-muted-foreground">
              {t.servicePage.cases}
            </h2>
            <ul className="mt-8 grid gap-x-6 gap-y-14 md:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <CaseCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section aria-label={t.cta.discuss} className="bg-inverse px-4 py-16 text-inverse-foreground sm:px-6 lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-3xl font-medium tracking-tight text-balance lg:text-5xl">{t.servicePage.ctaTitle}</p>
            <p className="mt-4 max-w-md opacity-80">{t.servicePage.ctaText}</p>
          </div>
          {chat ? (
            <ButtonLink href={chat} size="lg" target="_blank" rel="noopener noreferrer">
              <Send className="h-5 w-5" aria-hidden="true" />
              {t.telegram.cta}
            </ButtonLink>
          ) : (
            <ButtonLink href="/#contact" size="lg">
              {t.cta.discuss}
            </ButtonLink>
          )}
        </div>
      </section>

      {others.length > 0 ? (
        <nav aria-labelledby="service-others" className="px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[90rem]">
            <h2 id="service-others" className="label text-muted-foreground">
              {t.servicePage.others}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    href={serviceUrl(other.slug)}
                    className="inline-flex h-11 items-center rounded-full border border-foreground/25 px-5 text-sm transition-colors hover:border-foreground"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </>
  )
}
