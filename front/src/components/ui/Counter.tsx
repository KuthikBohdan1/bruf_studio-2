import { useEffect, useState } from 'react'

import { useInView } from '@/hooks/useInView'

const DURATION_MS = 1600

/** Splits "40+" into 40 and "+", "7 років" into 7 and " років", "4.9" into 4.9 and "". */
function parse(value: string): { number: number; decimals: number; prefix: string; suffix: string } | null {
  const match = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/.exec(value)
  if (!match) return null

  const [, prefix, digits, suffix] = match
  const decimals = digits.split(/[.,]/)[1]?.length ?? 0
  return { number: Number(digits.replace(',', '.')), decimals, prefix, suffix }
}

/** Counts a headline number up from zero the first time it is seen. */
export function Counter({ value }: { value: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const parsed = parse(value)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const target = parse(value)?.number
    if (!inView || target === undefined) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(target)
      return
    }

    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / DURATION_MS)
      setCurrent(target * (1 - Math.pow(1 - t, 4)))
      if (t < 1) frame = requestAnimationFrame(tick)
    })

    return () => cancelAnimationFrame(frame)
  }, [inView, value])

  if (!parsed) return <span>{value}</span>

  return (
    <span ref={ref}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {parsed.prefix}
        {current.toFixed(parsed.decimals)}
        {parsed.suffix}
      </span>
    </span>
  )
}
