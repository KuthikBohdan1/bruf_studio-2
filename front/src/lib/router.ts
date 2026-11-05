import { useSyncExternalStore, type MouseEvent } from 'react'

/**
 * A deliberately tiny History API router: the site has four route shapes
 * (`/`, `/cases/<slug>/`, `/blog/`, `/blog/<slug>/`), which does not justify a
 * routing library. Django serves the same shell for all of them (main/seo.py).
 */

const NAVIGATE_EVENT = 'app:navigate'

interface HistoryState {
  scrollY?: number
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(NAVIGATE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAVIGATE_EVENT, onChange)
  }
}

/** Current pathname; re-renders on navigate() and Back/Forward. */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname)
}

/** Remember where the visitor was, so Back returns to the same spot. */
function saveScroll(): void {
  history.replaceState({ ...(history.state as HistoryState), scrollY: window.scrollY }, '')
}

export function navigate(to: string): void {
  const url = new URL(to, window.location.href)

  if (url.pathname === window.location.pathname && url.hash) {
    // Same page, different anchor: just scroll there.
    history.pushState(null, '', url)
    scrollToHash(url.hash)
    return
  }

  saveScroll()
  history.pushState(null, '', url)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

/** Scrolls to the element named by `#hash`; smooth for in-page jumps, instant after a route change. */
export function scrollToHash(hash: string, smooth = true): boolean {
  const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
  if (!target) return false

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto' })
  return true
}

/** After a route renders: restore the saved position, jump to the anchor, or go to the top. */
export function restoreScroll(): void {
  const saved = (history.state as HistoryState | null)?.scrollY

  if (saved !== undefined) {
    window.scrollTo(0, saved)
  } else if (!scrollToHash(window.location.hash, false)) {
    window.scrollTo(0, 0)
  }
}

/** Click handler for internal links; lets the browser handle new-tab clicks. */
export function handleLinkClick(event: MouseEvent<HTMLAnchorElement>): void {
  const anchor = event.currentTarget
  const isPlainClick =
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

  if (!isPlainClick || anchor.target === '_blank' || anchor.origin !== window.location.origin) return

  event.preventDefault()
  navigate(anchor.href)
}

export const BLOG_PATH = '/blog/'
export const PRIVACY_PATH = '/privacy/'

export function postUrl(slug: string): string {
  return `${BLOG_PATH}${slug}/`
}

/** `/blog/<slug>/` → slug, anything else → null. */
export function matchPost(pathname: string): string | null {
  return /^\/blog\/([^/]+)\/?$/.exec(pathname)?.[1] ?? null
}

export function serviceUrl(slug: string): string {
  return `/services/${slug}/`
}

/** `/services/<slug>/` → slug, anything else → null. */
export function matchService(pathname: string): string | null {
  return /^\/services\/([^/]+)\/?$/.exec(pathname)?.[1] ?? null
}

export function caseUrl(slug: string): string {
  return `/cases/${slug}/`
}

/** `/cases/<slug>/` → slug, anything else → null. */
export function matchCase(pathname: string): string | null {
  return /^\/cases\/([^/]+)\/?$/.exec(pathname)?.[1] ?? null
}
