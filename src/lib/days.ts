// Automatic day names ('Día 1', 'Día 2'…) follow the day's position; custom names are kept.

import type { Day } from '@/types'

const DEFAULT_NAME = /^Día \d+( \(copia\))?$/

export const defaultDayName = (index: number): string => `Día ${index + 1}`

export const isDefaultDayName = (name: string): boolean => name.trim() === '' || DEFAULT_NAME.test(name.trim())

/** Name for a copy of `source`: automatic names stay automatic, custom ones get ' (copia)'. */
export const copiedDayName = (source: Pick<Day, 'name'>): string =>
  isDefaultDayName(source.name) ? source.name : `${source.name} (copia)`

/** Renames automatic days to match their position after adding, moving or deleting days. */
export function renumberDays(days: Day[]): Day[] {
  return days.map((day, index) => {
    if (!isDefaultDayName(day.name)) return day
    const name = defaultDayName(index)
    return day.name === name ? day : { ...day, name }
  })
}
