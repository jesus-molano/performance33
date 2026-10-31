import { insertAt, moveItem, removeById } from '../../lib/arrays'
import { cloneDay, createDay } from '../../lib/factories'
import { dayAt, locateDay, locateProgram, withDay, withProgram } from '../locate'
import type { DayActions, SliceContext } from '../types'
import { groupKey } from '../undoGroup'

export function createDaySlice({ commit, getData }: SliceContext): DayActions {
  return {
    addDay: (programId, init = {}) => {
      const pi = locateProgram(getData(), programId)
      if (pi === -1) return ''
      const day = createDay(getData().programs[pi].days.length, init)
      commit((d) => withProgram(d, pi, (p) => ({ ...p, days: [...p.days, day] })))
      return day.id
    },
    updateDay: (dayId, patch) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return
      commit((d) => withDay(d, loc, (day) => ({ ...day, ...patch })), groupKey('day', dayId, patch))
    },
    duplicateDay: (dayId) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return ''
      const source = dayAt(getData(), loc)
      const copy = { ...cloneDay(source), name: `${source.name} (copia)` }
      commit((d) => withProgram(d, loc.pi, (p) => ({ ...p, days: insertAt(p.days, loc.di + 1, copy) })))
      return copy.id
    },
    deleteDay: (dayId) => {
      const loc = locateDay(getData(), dayId)
      if (!loc) return
      commit((d) => withProgram(d, loc.pi, (p) => ({ ...p, days: removeById(p.days, dayId) })))
    },
    moveDay: (dayId, toIndex) => {
      const loc = locateDay(getData(), dayId)
      if (!loc || loc.di === toIndex) return
      commit((d) => withProgram(d, loc.pi, (p) => ({ ...p, days: moveItem(p.days, loc.di, toIndex) })))
    },
  }
}
