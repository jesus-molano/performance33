import { useEffect, useState } from 'react'

const MINUTE_MS = 60_000

/** The current time, updated every minute: "Quedan 3 plazas" turns into "Ya ha empezado" on its own. */
export function useNow(intervalMs: number = MINUTE_MS): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
