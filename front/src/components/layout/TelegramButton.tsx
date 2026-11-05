import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import { telegramChat, type SocialProfile } from '@/lib/text'

/**
 * A floating Telegram button, the fastest way to reach the studio. It shows
 * up once the first screen is scrolled past and steps aside while the
 * pricing banner, the contact section or the footer (which carry their own
 * Telegram links) are on screen.
 */
export function TelegramButton({ profile }: { profile: SocialProfile }) {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const viewport = window.innerHeight
      const covered = ['pricing-telegram', 'contact', 'site-footer'].some((id) => {
        const rect = document.getElementById(id)?.getBoundingClientRect()
        return rect ? rect.top < viewport && rect.bottom > 0 : false
      })
      setVisible(window.scrollY > viewport * 0.8 && !covered)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <a
      href={telegramChat(profile.url, t.telegram.message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.telegramButton.label(profile.handle)}
      tabIndex={visible ? undefined : -1}
      aria-hidden={visible ? undefined : true}
      className={cn(
        'fixed right-4 bottom-4 z-40 inline-flex h-14 items-center gap-2.5 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45)]',
        'transition-[opacity,translate] duration-500 ease-out-expo hover:-translate-y-0.5 sm:right-6 sm:bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
      )}
    >
      <Send className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">{t.telegramButton.short}</span>
    </a>
  )
}
