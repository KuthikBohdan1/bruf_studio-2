import { useCallback, useSyncExternalStore } from 'react'

import { setManualTheme, type Theme } from '@/lib/theme'

function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** The theme lives in the `dark` class on <html>; re-render whenever it changes. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/**
 * Reads the theme applied by lib/theme.ts (automatically, by time of day and
 * OS scheme) and lets the visitor flip it until the next scheduled switch.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, currentTheme)
  const toggle = useCallback(() => setManualTheme(theme === 'dark' ? 'light' : 'dark'), [theme])

  return { theme, toggle }
}
