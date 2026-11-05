import { useEffect, useState } from 'react'

import { fetchSiteData, type SiteData } from '@/lib/api'
import type { Lang } from '@/lib/i18n'

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: SiteData; error: null }
  | { status: 'error'; data: null; error: string }

// Payloads already loaded this visit, so switching back to a language is instant.
const loaded = new Map<Lang, SiteData>()

function initial(lang: Lang): State {
  const data = loaded.get(lang)
  return data ? { status: 'ready', data, error: null } : { status: 'loading', data: null, error: null }
}

/** Loads the whole site, in the page's language, in a single request. */
export function useSiteData(lang: Lang): State {
  const [state, setState] = useState<State>(() => initial(lang))
  const [current, setCurrent] = useState(lang)

  // Language switched: show what is cached (or the loader) right away, during render.
  if (current !== lang) {
    setCurrent(lang)
    setState(initial(lang))
  }

  useEffect(() => {
    if (loaded.has(lang)) return
    const controller = new AbortController()

    fetchSiteData(lang, controller.signal)
      .then((data) => {
        loaded.set(lang, data)
        setState({ status: 'ready', data, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Could not load the site content.',
        })
      })

    return () => controller.abort()
  }, [lang])

  return state
}
