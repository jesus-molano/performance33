import { insertAt, moveItem, removeById } from '@/lib/arrays'
import { clampExerciseTexts, getDayChangeRefusal } from '@/lib/capacity'
import { cloneExercise, createExercise } from '@/lib/factories'
import type { ExerciseEntry } from '@/types'
import { blockAt, dayAt, exerciseAt, locateBlock, locateExercise, sameBlock, withBlock, withExercise } from '@/store/locate'
import type { ExerciseActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

/** Fields a new row copies from the row above (most rows in a block share sets × reps). */
function inheritedFields(previous: ExerciseEntry | undefined): Partial<ExerciseEntry> {
  if (!previous) return {}
  return { sets: previous.sets, reps: previous.reps, restSec: previous.restSec, loadUnit: previous.loadUnit }
}

export function createExerciseSlice({ commit, commitSilently, getData }: SliceContext): ExerciseActions {
  return {
    addExercise: (blockId, init = {}, opts = {}) => {
      const loc = locateBlock(getData(), blockId)
      if (!loc) return ''
      const { exercises } = blockAt(getData(), loc)
      const index = opts.index ?? exercises.length
      const previous = exercises[index - 1] ?? exercises[exercises.length - 1]
      const inherited = (opts.inherit ?? true) ? inheritedFields(previous) : {}
      const entry = createExercise(clampExerciseTexts({ ...inherited, ...init }))
      const next = withBlock(getData(), loc, (b) => ({ ...b, exercises: insertAt(b.exercises, index, entry) }))
      if (getDayChangeRefusal(dayAt(getData(), loc), dayAt(next, loc))) return ''
      commit(() => next)
      return entry.id
    },
    updateExercise: (exerciseId, patch) => {
      const loc = locateExercise(getData(), exerciseId)
      if (!loc) return
      commit((d) => withExercise(d, loc, (e) => ({ ...e, ...clampExerciseTexts(patch) })), groupKey('exercise', exerciseId, patch))
    },
    duplicateExercise: (exerciseId) => {
      const loc = locateExercise(getData(), exerciseId)
      if (!loc) return ''
      const copy = cloneExercise(exerciseAt(getData(), loc))
      const next = withBlock(getData(), loc, (b) => ({ ...b, exercises: insertAt(b.exercises, loc.ei + 1, copy) }))
      if (getDayChangeRefusal(dayAt(getData(), loc), dayAt(next, loc))) return ''
      commit(() => next)
      return copy.id
    },
    deleteExercise: (exerciseId) => {
      const loc = locateExercise(getData(), exerciseId)
      if (!loc) return
      commit((d) => withBlock(d, loc, (b) => ({ ...b, exercises: removeById(b.exercises, exerciseId) })))
    },
    discardUnnamedExercise: (exerciseId) => {
      const loc = locateExercise(getData(), exerciseId)
      if (!loc || exerciseAt(getData(), loc).name.trim() !== '') return false
      commitSilently((d) => withBlock(d, loc, (b) => ({ ...b, exercises: removeById(b.exercises, exerciseId) })))
      return true
    },
    moveExercise: (exerciseId, toBlockId, toIndex) => {
      const data = getData()
      const from = locateExercise(data, exerciseId)
      const to = locateBlock(data, toBlockId)
      if (!from || !to) return
      if (sameBlock(from, to)) {
        if (from.ei !== toIndex) {
          commit((d) => withBlock(d, from, (b) => ({ ...b, exercises: moveItem(b.exercises, from.ei, toIndex) })))
        }
        return
      }
      const entry = exerciseAt(data, from)
      const next = withBlock(
        withBlock(data, from, (b) => ({ ...b, exercises: removeById(b.exercises, exerciseId) })),
        to,
        (b) => ({ ...b, exercises: insertAt(b.exercises, toIndex, entry) }),
      )
      if (getDayChangeRefusal(dayAt(data, to), dayAt(next, to))) return
      commit(() => next)
    },
  }
}
