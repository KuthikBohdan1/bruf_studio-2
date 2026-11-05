import { ArrowUpRight, Instagram, Send, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'
import { telegramChat, type SocialProfile } from '@/lib/text'
import { useT, type Strings } from '@/lib/i18n'

type Network = 'telegram' | 'instagram'

const NETWORKS: Record<Network, { Icon: LucideIcon; label: (t: Strings) => string; text: (t: Strings) => string; tone: string }> = {
  telegram: {
    Icon: Send,
    label: (t) => t.social.telegramLabel,
    text: (t) => t.social.telegramText,
    tone: 'bg-inverse text-inverse-foreground',
  },
  instagram: {
    Icon: Instagram,
    label: () => 'Instagram',
    text: (t) => t.social.instagramText,
    tone: 'bg-primary text-primary-foreground',
  },
}

interface SocialCardProps {
  network: Network
  profile: SocialProfile
  className?: string
}

/** A large card for one of the two channels we actively push. */
export function SocialCard({ network, profile, className }: SocialCardProps) {
  const t = useT()
  const { Icon, label, text, tone } = NETWORKS[network]

  return (
    <a
      href={network === 'telegram' ? telegramChat(profile.url, t.telegram.message) : profile.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('group relative block overflow-hidden rounded-2xl p-6 lg:p-8', tone, className)}
    >
      <span className="flex items-center justify-between">
        <span className="label inline-flex items-center gap-2">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label(t)}
        </span>
        <ArrowUpRight
          className="h-6 w-6 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1"
          aria-hidden="true"
        />
      </span>
      <span className="mt-10 block font-display text-3xl font-medium tracking-tight break-all sm:text-4xl">
        {profile.handle}
      </span>
      <span className="mt-3 block max-w-xs text-sm opacity-75">{text(t)}</span>
    </a>
  )
}
