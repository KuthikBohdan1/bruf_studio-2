import { useCallback, useEffect, useState } from 'react'
import { Send } from 'lucide-react'

import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Wordmark } from '@/components/layout/Wordmark'
import { ButtonLink } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
import type { SiteSettings, SocialLink } from '@/lib/api'
import { cn } from '@/lib/cn'
import { findProfile, telegramChat } from '@/lib/text'
import { useT } from '@/lib/i18n'

export interface NavItem {
  /** Section id on the home page, also used to highlight the active entry. */
  id: string
  label: string
  /** `/#section` for home sections, a path for pages such as `/blog/`. */
  href: string
}

interface NavbarProps {
  settings: SiteSettings
  socials: SocialLink[]
  items: NavItem[]
  activeId: string
}

export function Navbar({ settings, socials, items, activeId }: NavbarProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const closeMenu = useCallback(() => setOpen(false), [])
  const { hidden, scrolled } = useHideOnScroll()

  // Close the mobile menu when the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return

    const query = window.matchMedia('(min-width: 1280px)')
    const close = () => setOpen(false)

    query.addEventListener('change', close)
    return () => query.removeEventListener('change', close)
  }, [open])

  const telegram = findProfile(socials, 'telegram')

  // The menu is a sibling of <header>, not a child: the header's transform and
  // backdrop-filter would make it the containing block of the fixed overlay.
  return (
    <>
      <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-out-expo',
        hidden && !open && '-translate-y-full',
        scrolled || open ? 'border-b border-border bg-background/80 backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <nav aria-label={t.nav.main} className="mx-auto flex h-16 max-w-[90rem] items-center px-4 sm:px-6 lg:h-20 lg:px-10">
        <Wordmark settings={settings} onClick={closeMenu} />

        <ul className="ml-auto hidden items-center gap-1 xl:flex">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={activeId === item.id ? 'true' : undefined}
                className={cn(
                  'label relative rounded-full px-3 py-2 transition-colors',
                  activeId === item.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {activeId === item.id ? (
                  <span aria-hidden="true" className="absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                ) : null}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1 xl:ml-4">
          <LanguageSwitch onClick={closeMenu} />
          <ThemeToggle />
          <div className="ml-1 hidden sm:block">
            {telegram ? (
              <ButtonLink href={telegramChat(telegram.url, t.telegram.message)} target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4" aria-hidden="true" />
                {t.telegram.cta}
              </ButtonLink>
            ) : (
              <ButtonLink href="/#contact">{t.cta.discuss}</ButtonLink>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="label ml-1 flex h-11 items-center gap-2 rounded-full border border-foreground/25 px-4 xl:hidden"
          >
            <span className="relative block h-2 w-4" aria-hidden="true">
              <span className={cn('absolute left-0 h-px w-4 bg-current transition-transform', open ? 'top-1 rotate-45' : 'top-0')} />
              <span className={cn('absolute left-0 h-px w-4 bg-current transition-transform', open ? 'top-1 -rotate-45' : 'top-2')} />
            </span>
            {open ? t.nav.close : t.nav.menu}
          </button>
        </div>
      </nav>
      </header>

      <MobileMenu open={open} onClose={closeMenu} settings={settings} socials={socials} items={items} />
    </>
  )
}
