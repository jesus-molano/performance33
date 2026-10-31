// Pure rules for copying a block into other days.

import { insertAt } from '../../lib/arrays'
import { cloneBlock } from '../../lib/factories'
import type { Block, Day } from '../../types'

/** Copy into one day: warm-up goes first, everything else is appended. */
export function copyIntoDay(day: Day, source: Block): { day: Day; copy: Block } {
  const copy = cloneBlock(source)
  const blocks = source.type === 'warmup' ? [copy, ...day.blocks] : [...day.blocks, copy]
  return { day: { ...day, blocks }, copy }
}

/**
 * Copy for 'Copiar a todos los días': warm-up/mobility replace an existing block of the same type
 * (or go first/last); other types are inserted at `position`.
 */
export function copyIntoDayAt(day: Day, source: Block, position: number): Day {
  const copy = cloneBlock(source)
  if (source.type !== 'warmup' && source.type !== 'cooldown') {
    return { ...day, blocks: insertAt(day.blocks, position, copy) }
  }
  const existing = day.blocks.findIndex((b) => b.type === source.type)
  if (existing !== -1) return { ...day, blocks: day.blocks.map((b, i) => (i === existing ? copy : b)) }
  const blocks = source.type === 'warmup' ? [copy, ...day.blocks] : [...day.blocks, copy]
  return { ...day, blocks }
}
