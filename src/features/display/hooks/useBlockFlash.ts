import { useEffect, useRef, useState } from 'react'
import type { DisplayDay } from '../../../lib/display'
import { FLASH_MS } from '../config/display'
import { findChangedBlockIds } from '../utils/changedBlocks'

const NONE: ReadonlySet<string> = new Set()

/**
 * Blocks to highlight with 'Actualizado' after a live edit of the SAME day.
 * Switching day or the first render never flashes.
 */
export function useBlockFlash(day: DisplayDay | null): ReadonlySet<string> {
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(NONE)
  const previous = useRef(day)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const prev = previous.current
    previous.current = day
    if (!prev || !day || prev === day || prev.id !== day.id) return
    const changed = findChangedBlockIds(prev, day)
    if (changed.size === 0) return
    setFlashing(changed)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setFlashing(NONE), FLASH_MS)
  }, [day])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return flashing
}
