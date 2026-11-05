import { ArrowRight, ArrowUpRight, Send } from 'lucide-react'

import { ButtonLink } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import type { Post, Service } from '@/lib/api'
import { requestContact } from '@/lib/contact'
import { useT } from '@/lib/i18n'
import { BLOG_PATH, postUrl, serviceUrl } from '@/lib/router'
import { telegramChat, type SocialProfile } from '@/lib/text'

interface PricingProps {
  services: Service[]
  /** The article linked under the prices: the blog's featured post (else the newest). */
  article: Post | null
  /** Telegram is the main way to ask about a price; without it the cards fall back to the form. */
  telegram: SocialProfile | null
}

export function Pricing({ services, article, telegram }: PricingProps) {
  const t = useT()

  return (
    <Section id="pricing" label={t.nav.pricing} title={t.pricing.title}>
      {/* One card per service: what it is, what is included, how long, how much. */}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => (
          <Reveal
            as="li"
            key={service.id}
            delay={(index % 3) * 80}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 lg:p-8"
          >
            <p className="label text-muted-foreground">{service.duration}</p>
            <h3 className="mt-6 text-xl font-semibold">
              <Link
                href={serviceUrl(service.slug)}
                className="decoration-primary decoration-2 underline-offset-4 hover:underline"
              >
                {service.title}
              </Link>
            </h3>
            <p className="mt-2 font-display text-[clamp(1.6rem,8.5vw,2.25rem)] leading-tight font-medium tracking-tight">
              {service.price_from}
            </p>
            {service.description ? (
              <p className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">{service.description}</p>
            ) : null}
            {service.deliverables.length > 0 ? (
              <ul className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href={serviceUrl(service.slug)}
              className="mt-5 inline-flex items-center gap-2 self-start py-1 text-sm font-medium underline underline-offset-4"
            >
              {t.servicePage.more}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <div className="mt-auto flex flex-col items-start gap-3 pt-8">
              {telegram ? (
                <ButtonLink
                  href={telegramChat(telegram.url, t.telegram.about(service.title))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {t.pricing.telegram}
                </ButtonLink>
              ) : null}
              <button
                type="button"
                onClick={() => requestContact(service.title)}
                className={
                  telegram
                    ? 'py-1 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground'
                    : 'inline-flex h-11 items-center gap-2 rounded-full border border-foreground/25 px-5 text-sm font-medium hover:border-foreground'
                }
              >
                {telegram ? t.pricing.request : t.cta.discussShort}
                {telegram ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </Reveal>
        ))}
      </ul>

      <div className="mt-16 grid gap-8 border-t border-border pt-8 lg:grid-cols-12">
        <h3 className="label text-muted-foreground lg:col-span-3">{t.pricing.factorsTitle}</h3>
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:col-span-6">
          {/* What moves an estimate up or down, so "from" prices do not feel like a trick. */}
          {t.pricing.factors.map((factor) => (
            <li key={factor} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {factor}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground lg:col-span-3">
          {t.pricing.note}
        </p>
      </div>

      {telegram ? (
        <div id="pricing-telegram" className="mt-16">
        <Reveal className="flex flex-col gap-8 rounded-2xl bg-primary p-8 text-primary-foreground lg:flex-row lg:items-center lg:justify-between lg:p-12">
          <div className="max-w-2xl">
            <p className="font-display text-3xl font-medium tracking-tight text-balance lg:text-5xl">{t.pricing.bannerTitle}</p>
            <p className="mt-4 text-pretty opacity-80 lg:text-lg">{t.pricing.bannerText}</p>
          </div>
          <ButtonLink
            href={telegramChat(telegram.url, t.telegram.message)}
            target="_blank"
            rel="noopener noreferrer"
            variant="inverse"
            size="lg"
            className="shrink-0 self-start lg:self-center"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
            {telegram.handle}
          </ButtonLink>
        </Reveal>
        </div>
      ) : null}

      {article ? (
        <div className="mt-16 grid gap-6 border-t border-border pt-8 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-3 lg:col-span-3">
            <p className="label text-muted-foreground">{t.pricing.readMore}</p>
            <Link href={BLOG_PATH} className="label inline-flex items-center gap-2 underline underline-offset-4">
              {t.pricing.allArticles} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <Link href={postUrl(article.slug)} className="group flex items-start justify-between gap-6 lg:col-span-9">
            <span>
              <span className="block font-display text-2xl font-medium tracking-tight text-balance decoration-primary decoration-[0.1em] underline-offset-[0.15em] group-hover:underline lg:text-3xl">
                {article.title}
              </span>
              <span className="mt-3 block max-w-2xl text-pretty text-muted-foreground">{article.excerpt}</span>
            </span>
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/25 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
            >
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      ) : null}
    </Section>
  )
}
