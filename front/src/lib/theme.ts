/**
 * Automatic theme: dark from 20:00 to 08:00 (visitor's local time); during the
 * day it follows the OS colour scheme. A click on the toggle overrides it only
 * until the next 08:00/20:00 switch, so the schedule always comes back.
 *
 * The inline script in index.html applies the same rules before first paint —
 * keep the two in sync.
 */

export type Theme = 'light' | 'dark'

export const DAY_START_HOUR = 8
export const NIGHT_START_HOUR = 20

const OVERRIDE_KEY = 'theme-override'
const CHECK_INTERVAL_MS = 60_000

interface Override {
  theme: Theme
  /** Epoch ms after which the override no longer applies. */
  until: number
}

function osPrefersDark(): MediaQueryList {
  return window.matchMedia('(prefers-color-scheme: dark)')
}

export function isNight(date = new Date()): boolean {
  const hour = date.getHours()
  return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR
}

/** The next 08:00 or 20:00 after `date`. */
export function nextSwitch(date = new Date()): Date {
  const next = new Date(date)
  next.setMinutes(0, 0, 0)

  if (!isNight(date)) {
    next.setHours(NIGHT_START_HOUR)
  } else {
    if (date.getHours() >= NIGHT_START_HOUR) next.setDate(next.getDate() + 1)
    next.setHours(DAY_START_HOUR)
  }
  return next
}

function readOverride(): Theme | null {
  try {
    const override = JSON.parse(localStorage.getItem(OVERRIDE_KEY) ?? 'null') as Override | null
    const valid = override && (override.theme === 'dark' || override.theme === 'light')
    return valid && override.until > Date.now() ? override.theme : null
  } catch {
    // Private mode or a malformed value: fall back to the schedule.
    return null
  }
}

export function resolveTheme(): Theme {
  return readOverride() ?? (isNight() || osPrefersDark().matches ? 'dark' : 'light')
}

export function applyTheme(theme: Theme = resolveTheme()): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** The visitor's explicit choice, kept until the next scheduled switch. */
export function setManualTheme(theme: Theme): void {
  try {
    const override: Override = { theme, until: nextSwitch().getTime() }
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(override))
  } catch {
    /* private mode: the choice lasts for this page view only */
  }
  applyTheme(theme)
}

/**
 * Re-evaluates the theme when the OS scheme changes, when the tab comes back
 * into view, and once a minute — polling survives sleep and clock changes,
 * which a single long timeout until 20:00 would not.
 */
export function startAutoTheme(): () => void {
  const update = () => applyTheme()
  const query = osPrefersDark()

  query.addEventListener('change', update)
  document.addEventListener('visibilitychange', update)
  const interval = window.setInterval(update, CHECK_INTERVAL_MS)

  return () => {
    query.removeEventListener('change', update)
    document.removeEventListener('visibilitychange', update)
    window.clearInterval(interval)
  }
}
