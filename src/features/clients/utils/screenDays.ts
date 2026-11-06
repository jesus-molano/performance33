// Days of the current routine that the users list offers to send to a TV.

import { formatDayTitle } from '@/lib/format'
import type { Day } from '@/types'

export interface ScreenDayOption {
  /** 1-based, as the TV sections keep it. */
  day: number
  /** 'Día 2 · Pierna'. */
  label: string
}

/** The app has no 'next session' yet, so the list always starts on Día 1. */
export const DEFAULT_SCREEN_DAY = 1

export function screenDayOptions(days: readonly Pick<Day, 'name' | 'label'>[]): ScreenDayOption[] {
  return days.map((day, index) => ({ day: index + 1, label: formatDayTitle(day) }))
}

/** A chosen day that still exists, else the default (a day may be removed while the picker is open). */
export function pickedScreenDay(options: readonly ScreenDayOption[], day: number): ScreenDayOption | null {
  return options.find((option) => option.day === day) ?? options[0] ?? null
}
