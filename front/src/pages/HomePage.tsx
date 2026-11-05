import { Cases } from '@/components/home/Cases'
import { Contact } from '@/components/home/Contact'
import { Facts } from '@/components/home/Facts'
import { Faq } from '@/components/home/Faq'
import { Hero } from '@/components/home/Hero'
import { Pricing } from '@/components/home/Pricing'
import { Process } from '@/components/home/Process'
import { ServicesTicker } from '@/components/home/ServicesTicker'
import { SiteTypes } from '@/components/home/SiteTypes'
import type { SiteData, SiteSettings } from '@/lib/api'
import { findProfile } from '@/lib/text'

type HomePageProps = Omit<SiteData, 'settings'> & { settings: SiteSettings }

/**
 * Section order here must match `homeNavItems()` in App.tsx, so the menu
 * reads top-to-bottom the same way the page does.
 */
export function HomePage({ settings, services, projects, site_types, process, facts, faq, posts, socials }: HomePageProps) {
  const telegram = findProfile(socials, 'telegram')

  return (
    <>
      <Hero
        settings={settings}
        services={services.map((service) => service.title)}
        hasProjects={projects.length > 0}
        instagram={findProfile(socials, 'instagram')}
        telegram={telegram}
      />

      <div id="after-hero">
        {services.length > 0 ? <ServicesTicker services={services} /> : null}
      </div>

      {facts.length > 0 ? <Facts facts={facts} /> : null}
      {projects.length > 0 ? <Cases projects={projects} /> : null}
      {/* Services and their prices in one place: one card per service. */}
      {services.length > 0 ? (
        <Pricing
          services={services}
          article={posts.find((post) => post.is_featured) ?? posts[0] ?? null}
          telegram={telegram}
        />
      ) : null}
      {site_types.length > 0 ? <SiteTypes types={site_types} projects={projects} /> : null}
      {process.length > 0 ? <Process steps={process} telegram={telegram} /> : null}
      {faq.length > 0 ? <Faq items={faq} /> : null}
      <Contact settings={settings} socials={socials} services={services} />
    </>
  )
}
