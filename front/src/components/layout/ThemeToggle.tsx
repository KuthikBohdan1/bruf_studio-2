import { useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { tapCounter } from '@/lib/easterEggs'
import { useT } from '@/lib/i18n'

const DARK_SIDE_TAPS = 3
const DARK_SIDE_WINDOW_MS = 3000
const TOAST_MS = 4500

export function ThemeToggle() {
  const t = useT()
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? t.theme.toLight : t.theme.toDark
  const [greeting, setGreeting] = useState(false)

  // Easter egg: a few quick switches that end on dark are a step to the dark side.
  const countTap = useMemo(() => tapCounter(DARK_SIDE_TAPS, DARK_SIDE_WINDOW_MS, () => setGreeting(true)), [])

  useEffect(() => {
    if (!greeting) return
    const id = window.setTimeout(() => setGreeting(false), TOAST_MS)
    return () => window.clearTimeout(id)
  }, [greeting])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          // The switch about to happen lands on dark only when the theme is light now.
          if (theme === 'light') countTap()
          toggle()
        }}
        aria-label={label}
        title={label}
      >
        {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </Button>
      {greeting ? (
        <p
          role="status"
          className="fixed bottom-4 left-4 z-[60] max-w-xs rounded-2xl bg-inverse px-5 py-4 text-sm text-inverse-foreground shadow-xl sm:bottom-6 sm:left-6"
        >
          <span className="block font-display text-lg font-medium">{t.eggs.darkSideTitle}</span>
          <span className="mt-1 block opacity-75">{t.eggs.darkSideText}</span>
        </p>
      ) : null}
    </>
  )
}
