import { useEffect, useRef } from 'react'

import { HYPERSPACE_EVENT, HYPERSPACE_MS, useCheatCode } from '@/lib/easterEggs'

/** A cloud of dots: centre and spread as fractions of the viewport, rotated by `tilt` radians. */
interface Cloud {
  x: number
  y: number
  spreadX: number
  spreadY: number
  tilt: number
  /** Dots per full-size (1440×900) viewport; scaled down with the area on small screens. */
  count: number
}

// Laid out for the first screen. Lopsided on purpose: heavier drifts on the
// left and lower right, lighter ones at the top and bottom, and nothing dense
// behind the hero headline.
const CLOUDS: Cloud[] = [
  { x: 0.08, y: 0.32, spreadX: 0.11, spreadY: 0.2, tilt: 0.5, count: 1500 },
  { x: 0.18, y: 0.12, spreadX: 0.07, spreadY: 0.06, tilt: -0.3, count: 380 },
  { x: 0.93, y: 0.64, spreadX: 0.1, spreadY: 0.21, tilt: -0.4, count: 1500 },
  { x: 0.8, y: 0.86, spreadX: 0.08, spreadY: 0.06, tilt: 0.2, count: 420 },
  { x: 0.74, y: 0.04, spreadX: 0.12, spreadY: 0.06, tilt: 0.1, count: 600 },
  { x: 0.26, y: 0.94, spreadX: 0.1, spreadY: 0.05, tilt: -0.2, count: 480 },
]
const SCATTER = 380

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

interface Dot {
  x: number
  y: number
  size: number
  alpha: number
  /** 0 (far) … 1 (near): near dots react more to scrolling and sway more. */
  depth: number
  phase: number
}

function gaussian(random: () => number) {
  return Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random())
}

/** Small seeded generator, so the dots land in the same places on every visit. */
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
}

function scatterDots(scale: number): Dot[] {
  const random = seeded(11)
  const dots: Dot[] = []
  const add = (x: number, y: number) => {
    if (x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) return
    const depth = random()
    dots.push({ x, y, depth, size: 0.6 + depth * 1.1, alpha: 0.35 + random() * 0.65, phase: random() * Math.PI * 2 })
  }

  for (const cloud of CLOUDS) {
    const cos = Math.cos(cloud.tilt)
    const sin = Math.sin(cloud.tilt)
    for (let i = 0; i < Math.round(cloud.count * scale); i++) {
      const u = gaussian(random) * cloud.spreadX
      const v = gaussian(random) * cloud.spreadY
      add(cloud.x + u * cos - v * sin, cloud.y + u * sin + v * cos)
    }
  }
  for (let i = 0; i < Math.round(SCATTER * scale); i++) add(random(), random())
  return dots
}

// How the field answers the scroll (all scaled by a dot's depth):
const PARALLAX = 0.35 // share of the scroll distance a near dot travels, so layers slide past each other
const DRAG = 0.75 // how far a near dot is dragged along before it settles back
const FOLLOW = 5 // spring rate (1/s) of the smoothed scroll the dots catch up with
const STREAK = 0.0025 // px of streak per px/s of scroll speed
const MAX_STREAK = 5
// Past the first screen the field steps back behind the content.
const FAR_FADE = 0.45

// The sway is under a pixel per second, so at rest a low frame rate looks the
// same and leaves the phone's battery alone.
const IDLE_FRAME_MS = 66
const THEME_TRANSITION_MS = 450

/**
 * Dots that accompany the visitor down the page. The canvas is fixed behind
 * all content (sections with their own background cover it); the dots start
 * in drifts around the hero and answer the scroll like something with mass:
 * dragged along with the page, then catching up on a spring, stretched into
 * streaks by fast scrolling, near ones moving more than far ones, and wrapping
 * around so the field never runs out. The amount of dots follows the screen
 * area; with reduced motion it draws once and stays still.
 */
export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null)
  useCheatCode()

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const still = window.matchMedia(REDUCED_MOTION).matches
    let dots: Dot[] = []
    let dotsForWidth = 0
    let width = 0
    let height = 0
    let frame = 0
    let last = 0
    let smooth = window.scrollY
    let previous = window.scrollY
    let speed = 0
    let warpStart = -Infinity
    // The canvas carries `text-foreground`, so the dots follow the theme.
    let ink = getComputedStyle(canvas).color

    const resize = () => {
      // Dots this small gain nothing from a 3× canvas, and phones pay for every pixel.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      // Mobile browsers resize the viewport height while scrolling (address
      // bar); only a new width is worth a new set of dots.
      if (width !== dotsForWidth) {
        dotsForWidth = width
        dots = scatterDots(Math.max(0.35, Math.min(1, (width * height) / (1440 * 900))))
      }
    }

    const draw = (time: number) => {
      const dt = last ? Math.min((time - last) / 1000, 0.1) : 1 / 60
      last = time
      const scroll = still ? 0 : Math.max(0, window.scrollY)
      const seconds = still ? 0 : time / 1000

      smooth += (scroll - smooth) * (1 - Math.exp(-FOLLOW * dt))
      speed += ((scroll - previous) / dt - speed) * 0.25
      previous = scroll
      const lag = scroll - smooth
      const streak = Math.min(Math.abs(speed) * STREAK, MAX_STREAK)
      const fade = 1 - FAR_FADE * Math.min(1, scroll / Math.max(height, 1))
      const span = height + 8

      context.clearRect(0, 0, width, height)
      context.fillStyle = ink

      // Hyperspace: every dot streaks away from the centre and back.
      const warpProgress = (time - warpStart) / HYPERSPACE_MS
      const warp = warpProgress >= 0 && warpProgress < 1 ? Math.sin(Math.PI * warpProgress) ** 2 : 0
      if (warp > 0) {
        context.strokeStyle = ink
        context.lineCap = 'round'
      }

      for (const dot of dots) {
        const sway = 6 + dot.depth * 10
        const x = dot.x * width + Math.sin(seconds * 0.25 + dot.phase) * sway
        const shift = smooth * dot.depth * PARALLAX + lag * (0.25 + dot.depth * DRAG)
        const raw = dot.y * height + Math.cos(seconds * 0.2 + dot.phase) * sway - shift
        const y = ((raw % span) + span) % span - 4
        if (warp > 0) {
          const dx = x - width / 2
          const dy = y - height / 2
          const distance = Math.hypot(dx, dy) || 1
          const push = warp * (40 + dot.depth * 260)
          const tail = warp * (20 + dot.depth * 160)
          const headX = x + (dx / distance) * push
          const headY = y + (dy / distance) * push
          context.globalAlpha = Math.min(1, dot.alpha * (0.6 + warp))
          context.lineWidth = dot.size
          context.beginPath()
          context.moveTo(headX, headY)
          context.lineTo(headX - (dx / distance) * tail, headY - (dy / distance) * tail)
          context.stroke()
          continue
        }
        const stretch = streak * dot.depth * dot.depth
        const length = dot.size + stretch
        // A longer streak is fainter, so fast scrolling blurs the dots instead of brightening them.
        context.globalAlpha = (dot.alpha * fade) / (1 + stretch / 3)
        // A streak trails behind the direction of travel.
        context.fillRect(x, speed > 0 ? y : y - length + dot.size, dot.size, length)
      }
      context.globalAlpha = 1
    }

    const loop = (time: number) => {
      frame = 0
      const busy =
        time - warpStart < HYPERSPACE_MS ||
        Math.abs(window.scrollY - smooth) > 0.5 ||
        Math.abs(speed) > 1
      if (busy || time - last >= IDLE_FRAME_MS) draw(time)
      if (!still && !document.hidden) frame = requestAnimationFrame(loop)
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(loop)
    }

    resize()
    start()

    const onResize = () => {
      resize()
      start()
    }
    const onHyperspace = () => {
      if (still) return
      warpStart = performance.now()
      start()
    }
    const onVisibility = () => {
      last = 0
      if (!document.hidden) start()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener(HYPERSPACE_EVENT, onHyperspace)
    document.addEventListener('visibilitychange', onVisibility)

    // A theme switch changes the dot colour; redraw even when the loop is idle.
    const themeWatcher = new MutationObserver(() => {
      // The body's colour transition has to finish before the new colour can be read.
      window.setTimeout(() => {
        ink = getComputedStyle(canvas).color
        start()
      }, THEME_TRANSITION_MS)
    })
    themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(HYPERSPACE_EVENT, onHyperspace)
      document.removeEventListener('visibilitychange', onVisibility)
      themeWatcher.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="dot-field pointer-events-none fixed inset-0 -z-10 h-full w-full text-foreground"
    />
  )
}
