import { insertAt, moveItem, removeById } from '@/lib/arrays'
import { getAddDayRefusal } from '@/lib/capacity'
import { copiedDayName, renumberDays } from '@/lib/days'
import { cloneDay, createDay } from '@/lib/factories'
import type { AppData, Day } from '@/types'
import { dayAt, locateDay, locateProgram, withDay, withProgram } from '@/store/locate'
import type { DayActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

/** Structural day change; automatic names ('Día N') are renumbered to their new position. */
function withDays(data: AppData, pi: number, update: (days: Day[]) => Day[]): AppData {
  return withProgram(data, pi, (p) => ({ ...p, days: renumberDays(update(p.days)) }))
}

export function createDaySlice({ commit, getData }: SliceContext): DayActions {
  return {
    addDay: (programId, init = {}) => {
      const pi = locateProgram(getData(), programId)
      if (pi === -1 || getAddDayRefusal(getData().programs[pi].days.length)) return ''
      const day = createDay(getData().programs[pi].days.length, init)
      commit((d) => withDays(d, pi, (days) => [...days, day]))
      return day.id
    },
    updateDay: (dayId, patch) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return
      commit((d) => withDay(d, loc, (day) => ({ ...day, ...patch })), groupKey('day', dayId, patch))
    },
    settleDayNames: (dayId) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return
      const { days } = getData().programs[loc.pi]
      if (renumberDays(days).every((day, index) => day === days[index])) return
      commit((d) => withDays(d, loc.pi, (current) => current), groupKey('day', dayId, { name: '' }))
    },
    duplicateDay: (dayId) => {
      const loc = locateDay(getData(), dayId)
      if (!loc || getAddDayRefusal(getData().programs[loc.pi].days.length)) return ''
      const source = dayAt(getData(), loc)
      const copy = { ...cloneDay(source), name: copiedDayName(source) }
      commit((d) => withDays(d, loc.pi, (days) => insertAt(days, loc.di + 1, copy)))
      return copy.id
    },
    deleteDay: (dayId) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return
      commit((d) => withDays(d, loc.pi, (days) => removeById(days, dayId)))
    },
    moveDay: (dayId, toIndex) => {
      const loc = locateDay(getData(), dayId)
      if (!loc || loc.di === toIndex) return
      commit((d) => withDays(d, loc.pi, (days) => moveItem(days, loc.di, toIndex)))
    },
  }
}
