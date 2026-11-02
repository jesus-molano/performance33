import { useCallback, useEffect, useRef, useState } from 'react'
import { TV_SIZE_LIMIT_CHECK_MS, TV_SIZE_LIMIT_NOTE_MS } from '@/features/display/config/display'

export interface SharedTextSize {
  /** The smallest size any column of the screen can show: all of them use it, so a TV reads as one. */
  unitCap: number | undefined
  report: (columnId: string, unit: number | null) => void
  /** A+ was pressed and the text could not grow: today's routines already fill the screen. */
  atLimit: boolean
}

/** One text size for all the columns of a TV window, and whether A+ had any effect. */
export function useSharedTextSize(fontScale: number): SharedTextSize {
  const [units, setUnits] = useState<Readonly<Record<string, number>>>({})
  const [atLimit, setAtLimit] = useState(false)

  const report = useCallback((columnId: string, unit: number | null) => {
    setUnits((current) => {
      if (unit === (current[columnId] ?? null)) return current
      const next = { ...current }
      if (unit === null) delete next[columnId]
      else next[columnId] = unit
      return next
    })
  }, [])

  const values = Object.values(units)
  const unitCap = values.length > 0 ? Math.min(...values) : undefined

  const latestCap = useRef(unitCap)
  const previousScale = useRef(fontScale)
  useEffect(() => {
    latestCap.current = unitCap
  }, [unitCap])
  useEffect(() => {
    const grew = fontScale > previousScale.current
    previousScale.current = fontScale
    if (!grew) return
    const capBefore = latestCap.current
    // The columns report their new size a moment after the scale changes.
    const check = window.setTimeout(() => {
      setAtLimit(capBefore !== undefined && latestCap.current !== undefined && latestCap.current <= capBefore)
    }, TV_SIZE_LIMIT_CHECK_MS)
    return () => {
      window.clearTimeout(check)
      setAtLimit(false)
    }
  }, [fontScale])
  useEffect(() => {
    if (!atLimit) return
    const hide = window.setTimeout(() => setAtLimit(false), TV_SIZE_LIMIT_NOTE_MS)
    return () => window.clearTimeout(hide)
  }, [atLimit])

  return { unitCap, report, atLimit }
}
