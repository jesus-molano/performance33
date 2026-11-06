// Days of the current routine that the users list offers to send to a TV.

import { formatDayTitle } from '@/lib/format'
import type { Day } from '@/types'

export interface ScreenDayOption {
  /** 1-based, as the TV sections keep it. */
  day: number
  /** 'Día 2 · Pierna'. */
  label: string
}

/** The app has no 'next session' yet: someone on no TV starts on Día 1. */
export const DEFAULT_SCREEN_DAY = 1

export function screenDayOptions(days: readonly Pick<Day, 'name' | 'label'>[]): ScreenDayOption[] {
  return days.map((day, index) => ({ day: index + 1, label: formatDayTitle(day) }))
}

/** A chosen day that still exists, else the default (a day may be removed while the picker is open). */
export function pickedScreenDay(options: readonly ScreenDayOption[], day: number): ScreenDayOption | null {
  return options.find((option) => option.day === day) ?? options[0] ?? null
}

interface ShownContent {
  clientId: string | null
  day: number
  /** ISO time it was sent there ('' for a section never used). */
  assignedAt: string
}

/** The day a person shows on a TV right now (the section sent to last when there are several), or null. */
export function shownScreenDay(screens: ReadonlyArray<{ contents: readonly ShownContent[] }>, clientId: string): number | null {
  let latest: ShownContent | null = null
  for (const content of screens.flatMap((screen) => screen.contents)) {
    if (content.clientId === clientId && (!latest || content.assignedAt > latest.assignedAt)) latest = content
  }
  return latest?.day ?? null
}

/** Where the day chips start: the day she shows on a TV now, so moving her to another section keeps it; else Día 1. */
export function initialScreenDay(options: readonly ScreenDayOption[], shownDay: number | null): number {
  return shownDay !== null && options.some((option) => option.day === shownDay) ? shownDay : DEFAULT_SCREEN_DAY
}
