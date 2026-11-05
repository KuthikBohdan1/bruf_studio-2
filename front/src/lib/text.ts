/** Admin text fields use blank lines between paragraphs. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function pad(index: number): string {
  return String(index).padStart(2, '0')
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

/** Ink or paper text, whichever stays readable on the given `#RRGGBB` fill. */
export function textOn(hex: string): 'light' | 'dark' {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) return 'light'

  // Relative luminance per WCAG, from sRGB channels.
  const [r, g, b] = match.slice(1).map((channel) => {
    const value = parseInt(channel, 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? 'dark' : 'light'
}

/** First part of an address, e.g. "Львів, Україна · працюємо віддалено" → "Львів". */
export function cityOf(address: string): string {
  return address.split(/[,·]/)[0].trim()
}

export interface SocialProfile {
  url: string
  handle: string
}

const PROFILE_PATTERNS = {
  instagram: /instagram\.com\/([A-Za-z0-9_.]+)/i,
  telegram: /(?:t\.me|telegram\.me)\/([A-Za-z0-9_]+)/i,
} as const

/** The studio's Instagram or Telegram among the admin's social links, with its @handle. */
export function findProfile(
  socials: Array<{ url: string }>,
  network: keyof typeof PROFILE_PATTERNS,
): SocialProfile | null {
  for (const { url } of socials) {
    const handle = PROFILE_PATTERNS[network].exec(url)?.[1]
    if (handle) return { url, handle: `@${handle}` }
  }
  return null
}

/**
 * A Telegram chat link with the message box already filled in
 * (`t.me/<user>?text=…`, supported by the Telegram apps).
 */
export function telegramChat(url: string, message: string): string {
  return `${url.split('?')[0]}?text=${encodeURIComponent(message)}`
}
