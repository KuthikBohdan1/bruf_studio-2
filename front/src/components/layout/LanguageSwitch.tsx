import { STRINGS, switchLanguage, useLang } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import { handleLinkClick, usePathname } from '@/lib/router'

const CODES = { uk: 'UA', en: 'EN' } as const

/**
 * Link to the same page in the other language. A plain anchor rather than
 * `<Link>`: its target already carries the right prefix and must not get `/en` added.
 */
export function LanguageSwitch({ className, onClick }: { className?: string; onClick?: () => void }) {
  const lang = useLang()
  const pathname = usePathname()
  const other = lang === 'uk' ? 'en' : 'uk'

  return (
    <a
      href={switchLanguage(pathname, window.location.hash, other)}
      hrefLang={other}
      lang={other}
      aria-label={STRINGS[other].switchTo}
      title={STRINGS[other].switchTo}
      onClick={(event) => {
        onClick?.()
        handleLinkClick(event)
      }}
      className={cn(
        'label flex h-11 items-center rounded-full px-3 text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      {CODES[other]}
    </a>
  )
}
