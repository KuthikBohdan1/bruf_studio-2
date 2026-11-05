import { useEffect, useState } from 'react'

const FORMAT = new Intl.DateTimeFormat('uk-UA', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Kyiv',
})

/** Studio local time in Ukraine ("14:32"), refreshed every 15 s. */
export function useStudioTime(): string {
  const [time, setTime] = useState(() => FORMAT.format(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setTime(FORMAT.format(new Date())), 15_000)
    return () => window.clearInterval(id)
  }, [])

  return time
}
