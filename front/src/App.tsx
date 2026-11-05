import { useEffect, useMemo } from 'react'

import { CursorFollower } from '@/components/layout/CursorFollower'
import { DotField } from '@/components/layout/DotField'
import { Footer } from '@/components/layout/Footer'
import { Navbar, type NavItem } from '@/components/layout/Navbar'
import { TelegramButton } from '@/components/layout/TelegramButton'
import { EmptyScreen, ErrorScreen, LoadingScreen } from '@/components/StatusScreen'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useSiteData } from '@/hooks/useSiteData'
import type { SiteData } from '@/lib/api'
import { routeOf, STRINGS, useLang, type Lang } from '@/lib/i18n'
import { BLOG_PATH, PRIVACY_PATH, matchCase, matchService, matchPost, restoreScroll, usePathname } from '@/lib/router'
import { findProfile } from '@/lib/text'
import { BlogPage } from '@/pages/BlogPage'
import { CasePage } from '@/pages/CasePage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PostPage } from '@/pages/PostPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { ServicePage } from '@/pages/ServicePage'

const section = (id: string, label: string): NavItem => ({ id, label, href: `/#${id}` })

/**
 * Only advertise sections that have content, in the order HomePage renders
 * them. The blog has no home section and links to its own page; it is lit
 * there and on articles.
 */
function homeNavItems(data: SiteData, lang: Lang): NavItem[] {
  const { nav } = STRINGS[lang]
  return [
    data.projects.length > 0 && section('projects', nav.projects),
    data.services.length > 0 && section('pricing', nav.pricing),
    data.site_types.length > 0 && section('site-types', nav.siteTypes),
    data.process.length > 0 && section('process', nav.process),
    data.posts.length > 0 && { id: 'blog', label: nav.blog, href: BLOG_PATH },
    data.faq.length > 0 && section('faq', nav.faq),
    section('contact', nav.contact),
  ].filter((item): item is NavItem => Boolean(item))
}

const MORE_POSTS = 2
const SERVICE_CASES = 2

export default function App() {
  const lang = useLang()
  const t = STRINGS[lang]
  const { status, data, error } = useSiteData(lang)
  // Routes are matched without the /en prefix.
  const pathname = routeOf(usePathname())
  const caseSlug = matchCase(pathname)
  const postSlug = matchPost(pathname)
  const serviceSlug = matchService(pathname)
  const isHome = pathname === '/'
  const isBlog = pathname === BLOG_PATH
  const isPrivacy = pathname === PRIVACY_PATH

  const navItems = useMemo(() => (data ? homeNavItems(data, lang) : []), [data, lang])
  const project = caseSlug ? (data?.projects.find((item) => item.slug === caseSlug) ?? null) : null
  const service = serviceSlug ? (data?.services.find((item) => item.slug === serviceSlug) ?? null) : null
  const post = postSlug ? (data?.posts.find((item) => item.slug === postSlug) ?? null) : null

  // 'top' (the hero) is observed too, so no nav entry is highlighted there.
  const sectionIds = useMemo(() => ['top', ...navItems.map((item) => item.id)], [navItems])
  const activeId = useActiveSection(sectionIds, status === 'ready' && isHome)

  // After each route renders: Back restores the old position, links with a
  // #hash land on their section, anything else starts at the top.
  useEffect(() => {
    if (status === 'ready') restoreScroll()
  }, [status, pathname])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Django renders the right <title> for the first load; keep it in sync afterwards.
  useEffect(() => {
    const settings = data?.settings
    if (!settings) return
    // Mirrors the titles in main/seo.py.
    if (project) document.title = t.casePage.title(project.title, settings.name)
    else if (service) document.title = service.seo_title || `${service.headline || service.title} | ${settings.name}`
    else if (post) document.title = `${post.title} | ${settings.name}`
    else if (isBlog) document.title = t.blog.title(settings.name)
    else if (isPrivacy) document.title = `${t.privacy.title} | ${settings.name}`
    else if (!isHome) document.title = `${t.notFound.title} | ${settings.name}`
    else document.title = settings.seo_title || `${settings.name} — ${settings.tagline}`
  }, [data, project, service, post, isBlog, isPrivacy, isHome, t])

  if (status === 'loading') return <LoadingScreen />
  if (status === 'error') return <ErrorScreen message={error} />
  if (!data.settings) return <EmptyScreen />

  const { settings, services, projects, socials } = data
  const telegram = findProfile(socials, 'telegram')

  let page
  if (isHome) {
    page = <HomePage {...data} settings={settings} />
  } else if (isPrivacy) {
    page = <PrivacyPage email={settings.email} />
  } else if (isBlog) {
    page = <BlogPage posts={data.posts} />
  } else if (post) {
    const more = data.posts.filter((item) => item !== post).slice(0, MORE_POSTS)
    page = <PostPage key={post.slug} post={post} more={more} telegram={telegram} />
  } else if (service) {
    const own = projects.filter((item) => item.service === service.id)
    page = (
      <ServicePage
        key={service.slug}
        service={service}
        projects={own.length > 0 ? own : projects.slice(0, SERVICE_CASES)}
        others={services.filter((item) => item !== service)}
        telegram={telegram}
      />
    )
  } else if (project) {
    const next = projects[(projects.indexOf(project) + 1) % projects.length]
    page = (
      <CasePage
        key={project.slug}
        project={project}
        next={next === project ? null : next}
        service={services.find((item) => item.id === project.service) ?? null}
      />
    )
  } else {
    page = <NotFoundPage />
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t.skipToContent}
      </a>

      <DotField />
      <Navbar settings={settings} socials={socials} items={navItems} activeId={isHome ? activeId : isBlog || post ? 'blog' : service ? 'pricing' : project ? 'projects' : ''} />
      <main id="main">{page}</main>
      <Footer settings={settings} socials={socials} services={services} items={navItems} />
      <CursorFollower />
      {telegram ? <TelegramButton profile={telegram} /> : null}
    </>
  )
}
