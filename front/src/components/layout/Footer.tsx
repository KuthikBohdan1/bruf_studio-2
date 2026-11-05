import type { CSSProperties, ReactNode } from 'react'
import { ArrowUp, Instagram, Send } from 'lucide-react'

import type { NavItem } from '@/components/layout/Navbar'
import { Link } from '@/components/ui/Link'
import { useStudioTime } from '@/hooks/useClock'
import { useInView } from '@/hooks/useInView'
import { jumpToHyperspace, tapCounter } from '@/lib/easterEggs'
import { serviceUrl } from '@/lib/router'
import type { Service, SiteSettings, SocialLink } from '@/lib/api'
import { findProfile, phoneHref, telegramChat } from '@/lib/text'
import { useT } from '@/lib/i18n'

const PILL =
  'inline-flex items-center gap-2 rounded-full bg-primary py-2 pr-5 pl-4 font-medium text-primary-foreground ' +
  'transition-transform duration-300 hover:-translate-y-0.5'

interface FooterProps {
  settings: SiteSettings
  socials: SocialLink[]
  services: Service[]
  items: NavItem[]
}

export function Footer({ settings, socials, services, items }: FooterProps) {
  const t = useT()
  const time = useStudioTime()
  const telegram = findProfile(socials, 'telegram')
  const instagram = findProfile(socials, 'instagram')

  return (
    <footer id="site-footer" className="overflow-hidden bg-inverse text-inverse-foreground">
      <div className="mx-auto max-w-[90rem] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label opacity-60">{t.footer.newProject}</p>
            {settings.email ? (
              <a
                href={`mailto:${settings.email}`}
                className="mt-4 inline-block font-display text-3xl font-medium tracking-tight decoration-primary decoration-4 underline-offset-8 hover:underline sm:text-4xl"
              >
                {settings.email}
              </a>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-2">
              {telegram ? (
                <a href={telegramChat(telegram.url, t.telegram.message)} target="_blank" rel="noopener noreferrer" className={PILL}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Telegram {telegram.handle}
                </a>
              ) : null}
              {instagram ? (
                <a href={instagram.url} target="_blank" rel="noopener noreferrer" className={PILL}>
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                  {instagram.handle}
                </a>
              ) : null}
            </div>
            {settings.phone ? (
              <p className="mt-4">
                <a href={phoneHref(settings.phone)} className="text-lg opacity-80 hover:opacity-100">
                  {settings.phone}
                </a>
              </p>
            ) : null}
          </div>

          <FooterColumn title={t.footer.site} className="lg:col-span-2 lg:col-start-7">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="opacity-80 hover:opacity-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          {services.length > 0 ? (
            <FooterColumn title={t.footer.services} className="lg:col-span-2">
              {services.map((service) => (
                <li key={service.id}>
                  <Link href={serviceUrl(service.slug)} className="opacity-80 hover:opacity-100">
                    {service.title}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          ) : null}

          {socials.length > 0 ? (
            <FooterColumn title={t.footer.socials} className="lg:col-span-2">
              {socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url === telegram?.url ? telegramChat(social.url, t.telegram.message) : social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-80 hover:opacity-100"
                  >
                    {social.name} ↗
                  </a>
                </li>
              ))}
            </FooterColumn>
          ) : null}
        </div>

        <div className="label mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-current/15 py-6 opacity-70">
          <p className="flex flex-col gap-1.5">
            <span className="normal-case">
              © {new Date().getFullYear()} {capitalized(settings.name)}
            </span>
            <span>{t.footer.madeIn}</span>
          </p>
          {settings.address ? <p>{settings.address}</p> : null}
          <p>
            {t.footer.studioTime} <time>{time}</time>
          </p>
          <Link href="/privacy/" className="hover:opacity-100">
            {t.footer.privacy}
          </Link>
          <Link href="/#top" className="inline-flex items-center gap-2 hover:opacity-100">
            {t.footer.toTop} <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <FooterWordmark name={settings.name} />
    </footer>
  )
}

function capitalized(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Oversized wordmark closing the page. Its letters rise into place one by one
 * when the footer comes into view, then keep drifting gently, each a little out
 * of step with the others (`.footer-letter` in styles.css).
 */
// Easter egg: five quick taps on the wordmark jump the dot field to hyperspace.
const onWordmarkTap = tapCounter(5, 2500, jumpToHyperspace)

function FooterWordmark({ name }: { name: string }) {
  const { ref, inView } = useInView<HTMLParagraphElement>('0px')

  return (
    <p
      ref={ref}
      aria-hidden="true"
      data-shown={inView ? '' : undefined}
      onClick={onWordmarkTap}
      className="footer-wordmark pb-[3vw] text-center font-display text-[27vw] leading-none font-semibold tracking-[-0.035em] select-none"
    >
      {[...name].map((letter, index) => (
        <span key={index} className="footer-letter" style={{ '--i': index } as CSSProperties}>
          {letter}
        </span>
      ))}
    </p>
  )
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <p className="label mb-5 opacity-60">{title}</p>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}
