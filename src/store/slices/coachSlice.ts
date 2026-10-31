import { removeById, updateById } from '@/lib/arrays'
import { newId } from '@/lib/ids'
import type { CoachActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

export function createCoachSlice({ commit, getData }: SliceContext): CoachActions {
  return {
    addCoach: (input) => {
      const id = newId('coach')
      commit((d) => ({ ...d, coaches: [...d.coaches, { id, name: input.name.trim(), color: input.color }] }))
      return id
    },
    updateCoach: (id, patch) =>
      commit((d) => ({ ...d, coaches: updateById(d.coaches, id, (c) => ({ ...c, ...patch })) }), groupKey('coach', id, patch)),
    deleteCoach: (id) => {
      if (getData().coaches.length <= 1) return false
      commit((d) => ({ ...d, coaches: removeById(d.coaches, id) }))
      return true
    },
  }
}
