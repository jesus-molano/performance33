import { useEffect, useState } from 'react'

/** True for the first `ms` milliseconds after mount (one-off hints). */
export function useTimedFlag(ms: number): boolean {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setOn(false), ms)
    return () => window.clearTimeout(timer)
  }, [ms])
  return on
}
