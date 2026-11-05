import { ArrowDown, Send } from 'lucide-react'
import type { CSSProperties } from 'react'

import { HeroBackdrop } from '@/components/home/HeroBackdrop'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { SplitText } from '@/components/ui/SplitText'
import { useStudioTime } from '@/hooks/useClock'
import type { SiteSettings } from '@/lib/api'
import { cityOf, telegramChat, type SocialProfile } from '@/lib/text'
import { useT } from '@/lib/i18n'

interface HeroProps {
  settings: SiteSettings
  /** Service titles, listed under the headline as "what we do". */
  services: string[]
  hasProjects: boolean
  instagram: SocialProfile | null
  telegram: SocialProfile | null
}

/**
 * First screen, centred: status line, headline with the last word on the
 * highlighter, the services in one line, and the two calls to action over the
 * portfolio reel (HeroBackdrop).
 */
export function Hero({ settings, services, hasProjects, instagram, telegram }: HeroProps) {
  const t = useT()
  const time = useStudioTime()
  const words = settings.tagline.split(/\s+/).filter(Boolean)

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-svh flex-col overflow-hidden px-4 pt-28 pb-10 sm:px-6 lg:px-10 lg:pt-32"
    >
      <HeroBackdrop video={settings.hero_video} poster={settings.hero_poster} />

      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col items-center justify-center text-center">
        <Reveal className="label flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-muted-foreground">
          {settings.availability ? (
            <span className="inline-flex items-center gap-2 text-foreground">
              <span className="pulse-dot h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              {settings.availability}
            </span>
          ) : null}
          {instagram ? (
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="marker transition-opacity hover:opacity-80"
            >
              {instagram.handle} ↗
            </a>
          ) : null}
          <span className="hidden sm:inline">
            {settings.address ? `${cityOf(settings.address)}, ` : ''}
            <time>{time}</time>
          </span>
        </Reveal>

        <SplitText
          as="h1"
          id="hero-heading"
          text={settings.tagline}
          delay={150}
          highlight={[words.length - 1]}
          className="mt-8 max-w-[16ch] font-display text-[clamp(2.3rem,6vw,6.4rem)] leading-[1] font-medium tracking-[-0.045em] text-balance lg:mt-10"
        />

        {services.length > 0 ? (
          <Reveal delay={450} className="mt-8 lg:mt-10">
            <ul
              aria-label={t.hero.services}
              className="label flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-foreground/80"
            >
              {/* The dot belongs to the item after it, so a wrapped line never ends on a dot.
                  --i staggers the dots' wave (.hero-service in styles.css). */}
              {services.map((title, index) => (
                <li
                  key={title}
                  style={{ '--i': index } as CSSProperties}
                  className="hero-service inline-flex items-center gap-4 not-first:before:h-1.5 not-first:before:w-1.5 not-first:before:rounded-full not-first:before:bg-primary not-first:before:content-['']"
                >
                  {title}
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {settings.description ? (
          <Reveal delay={550} className="mt-6">
            <p className="max-w-xl text-pretty text-foreground/70 lg:text-lg">{settings.description}</p>
          </Reveal>
        ) : null}

        <Reveal delay={650} className="mt-10 flex flex-col items-center gap-4">
          {/* Telegram is the fastest way in, so it leads; the form is the fallback. */}
          <div className="flex flex-wrap justify-center gap-3">
            {telegram ? (
              <ButtonLink
                size="lg"
                href={telegramChat(telegram.url, t.telegram.message)}
                target="_blank"
                rel="noopener noreferrer"
                className="shadow-[0_14px_40px_-12px_var(--primary)]"
              >
                <Send className="h-5 w-5" aria-hidden="true" />
                {t.telegram.cta}
              </ButtonLink>
            ) : (
              <ButtonLink size="lg" href="/#contact">
                {t.cta.discuss}
              </ButtonLink>
            )}
            {hasProjects ? (
              <ButtonLink size="lg" variant="outline" href="/#projects" className="bg-background/40 backdrop-blur-sm">
                {t.cta.ourWork}
              </ButtonLink>
            ) : null}
          </div>
          {telegram ? (
            <a
              href="/#contact"
              className="py-1 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              {t.telegram.request}
            </a>
          ) : null}
        </Reveal>
      </div>

      <a
        href="#after-hero"
        aria-label={t.hero.scroll}
        className="mx-auto mt-8 hidden h-12 w-12 items-center justify-center rounded-full border border-foreground/25 transition-colors hover:bg-foreground hover:text-background lg:flex"
      >
        <ArrowDown className="h-5 w-5" aria-hidden="true" />
      </a>
    </section>
  )
}
