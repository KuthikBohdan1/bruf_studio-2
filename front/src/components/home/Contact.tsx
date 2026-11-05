import { ContactForm } from '@/components/home/ContactForm'
import { SocialCard } from '@/components/layout/SocialCard'
import { Section } from '@/components/ui/Section'
import type { Service, SiteSettings, SocialLink } from '@/lib/api'
import { findProfile, phoneHref } from '@/lib/text'
import { useT } from '@/lib/i18n'

interface ContactProps {
  settings: SiteSettings
  socials: SocialLink[]
  services: Service[]
}

export function Contact({ settings, socials, services }: ContactProps) {
  const t = useT()
  const telegram = findProfile(socials, 'telegram')
  const instagram = findProfile(socials, 'instagram')
  const featured = [telegram?.url, instagram?.url]
  const otherSocials = socials.filter((social) => !featured.includes(social.url))
  const details = [
    settings.email && { label: t.contact.email, value: settings.email, href: `mailto:${settings.email}` },
    settings.phone && { label: t.contact.phone, value: settings.phone, href: phoneHref(settings.phone) },
    settings.address && { label: t.contact.address, value: settings.address },
  ].filter((detail): detail is { label: string; value: string; href?: string } => Boolean(detail))

  return (
    <Section
      id="contact"
      label={t.nav.contact}
      title={t.contact.title}
      aside={<p className="label max-w-[22ch] text-muted-foreground lg:text-right">{t.contact.reply}</p>}
    >
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-4">
          {telegram || instagram ? (
            <div className="space-y-3">
              {telegram ? <SocialCard network="telegram" profile={telegram} /> : null}
              {instagram ? <SocialCard network="instagram" profile={instagram} /> : null}
            </div>
          ) : null}

          <dl className="space-y-8">
            {details.map(({ label, value, href }) => (
              <div key={label}>
                <dt className="label text-muted-foreground">{label}</dt>
                <dd className="mt-2 text-xl">
                  {href ? (
                    <a href={href} className="underline decoration-border underline-offset-4 hover:decoration-foreground">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {otherSocials.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {otherSocials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center rounded-full border border-foreground/25 px-4 text-sm transition-colors hover:border-foreground"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <ContactForm projectTypes={services.map((service) => service.title)} />
        </div>
      </div>
    </Section>
  )
}
