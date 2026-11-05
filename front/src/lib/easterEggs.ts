import { useEffect } from 'react'

/**
 * Small, original nods to space opera hidden around the site. Nothing here
 * uses another studio's names, ships, logos, music or lines — only the
 * genre's moves: a jump to hyperspace, the dark side.
 *
 * - The dot field (DotField) warps into a hyperspace jump on `HYPERSPACE_EVENT`:
 *   the classic cheat code, five taps on the footer wordmark, or the 404 button.
 * - Three quick theme switches ending on dark greet you on the dark side (ThemeToggle).
 * - The browser console says hello.
 */

export const HYPERSPACE_EVENT = 'bruf:hyperspace'

/** How long a jump lasts, in ms (DotField draws it). */
export const HYPERSPACE_MS = 1800

export function jumpToHyperspace(): void {
  window.dispatchEvent(new Event(HYPERSPACE_EVENT))
}

const CHEAT_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/** Jumps to hyperspace when the classic cheat code is typed (outside form fields). */
export function useCheatCode(): void {
  useEffect(() => {
    let position = 0

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable]')) return

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      position = key === CHEAT_CODE[position] ? position + 1 : key === CHEAT_CODE[0] ? 1 : 0
      if (position === CHEAT_CODE.length) {
        position = 0
        jumpToHyperspace()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Counts taps; calls `onBurst` when `count` of them land within `windowMs`. */
export function tapCounter(count: number, windowMs: number, onBurst: () => void): () => void {
  let taps: number[] = []
  return () => {
    const now = Date.now()
    taps = [...taps.filter((time) => now - time < windowMs), now]
    if (taps.length >= count) {
      taps = []
      onBurst()
    }
  }
}

let greeted = false

/** A note for whoever opens the developer console. */
export function greetInConsole(): void {
  if (greeted) return
  greeted = true
  console.log(
    '%cДавно-давно, у студії зовсім недалеко — у Львові…',
    'font: 600 14px/1.6 system-ui; color: #c8f03c; background: #0e0e0e; padding: 6px 10px; border-radius: 6px',
  )
  console.log(
    'Ви тут, бо любите зазирати під капот. Нам таке подобається.\n' +
      '↑ ↑ ↓ ↓ ← → ← → B A — і зорі перейдуть на світлову швидкість.\n' +
      'Шукаєте розробника? t.me/brief_studio',
  )
}
