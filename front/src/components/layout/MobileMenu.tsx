import { useEffect, type CSSProperties } from 'react'

import { ButtonLink } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import type { NavItem } from '@/components/layout/Navbar'
import type { SiteSettings, SocialLink } from '@/lib/api'
import { cn } from '@/lib/cn'
import { findProfile, telegramChat } from '@/lib/text'
import { useT } from '@/lib/i18n'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  settings: SiteSettings
  socials: SocialLink[]
  items: NavItem[]
}

/**
 * Full-screen menu below the header with large, staggered links. While closed
 * it is `invisible`, which also keeps its links out of the tab order.
 */
export function MobileMenu({ open, onClose, settings, socials, items }: MobileMenuProps) {
  const t = useT()
  const telegram = findProfile(socials, 'telegram')

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeOnEscape)
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.documentElement.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      id="mobile-menu"
      className={cn(
        'fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-background px-4 pt-8 pb-8 transition-[opacity,visibility] duration-300 sm:px-6 xl:hidden',
        open ? 'visible opacity-100' : 'invisible opacity-0',
      )}
    >
      <ul className="space-y-1">
        {[...items, { id: 'top', label: t.nav.toTop, href: '/#top' }].map((item, index) => (
          <li
            key={item.id}
            style={{ '--i': index } as CSSProperties}
            className={cn(
              'transition-[opacity,transform] delay-[calc(var(--i)*50ms)] duration-500 ease-out-expo',
              open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
            )}
          >
            <Link
              href={item.href}
              onClick={onClose}
              className="flex items-baseline gap-4 py-2 font-display text-4xl font-medium tracking-tight sm:text-5xl"
            >
              <span className="label text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-6">
        <div className="grid gap-2">
          <ButtonLink href="/#contact" size="lg" onClick={onClose}>
            {t.cta.discuss}
          </ButtonLink>
          {telegram ? (
            <ButtonLink
              href={telegramChat(telegram.url, t.telegram.message)}
              size="lg"
              variant="outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram {telegram.handle}
            </ButtonLink>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : null}
          {socials.map((social) => (
            <a
              key={social.id}
              href={social.url === telegram?.url ? telegramChat(social.url, t.telegram.message) : social.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
