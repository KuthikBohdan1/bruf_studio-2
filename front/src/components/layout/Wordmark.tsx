import { LogoMark } from '@/components/layout/LogoMark'
import { Link } from '@/components/ui/Link'
import type { SiteSettings } from '@/lib/api'
import { useT } from '@/lib/i18n'

/** Logo from the admin if uploaded, otherwise the mark and the studio name set in the display face. */
export function Wordmark({ settings, onClick }: { settings: SiteSettings; onClick?: () => void }) {
  const t = useT()

  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5" aria-label={`${settings.name} — ${t.nav.home}`}>
      {settings.logo ? (
        <img src={settings.logo} alt="" width={96} height={28} className="h-7 w-auto dark:invert" />
      ) : (
        <LogoMark className="h-7 w-auto" />
      )}
      <span className="flex items-baseline gap-1">
        {settings.logo ? null : <span className="font-display text-xl font-semibold tracking-tight">{settings.name}</span>}
        <span className="label text-muted-foreground">.pro</span>
      </span>
    </Link>
  )
}
