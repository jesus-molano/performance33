// The persisted data store: zustand + zundo. Only `data` is tracked for undo/redo;
// UI state (current coach, save status, toasts) lives in separate stores.

import { temporal } from 'zundo'
import { create } from 'zustand'
import { UNDO_GROUP_MS, UNDO_LIMIT } from '../config/app'
import { createEmptyData } from '../lib/factories'
import { createBlockSlice } from './slices/blockSlice'
import { createClientSlice } from './slices/clientSlice'
import { createCoachSlice } from './slices/coachSlice'
import { createDaySlice } from './slices/daySlice'
import { createExerciseSlice } from './slices/exerciseSlice'
import { createNoteSlice } from './slices/noteSlice'
import { createProgramSlice } from './slices/programSlice'
import { createSettingsSlice } from './slices/settingsSlice'
import type { AppState, SliceContext } from './types'
import { createUndoGrouper } from './undoGroup'

export const undoGrouper = createUndoGrouper(UNDO_GROUP_MS)

type TrackedState = Pick<AppState, 'data'>

export const useAppStore = create<AppState>()(
  temporal(
    (set, get) => {
      const ctx: SliceContext = {
        commit: (recipe, key) => {
          const next = recipe(get().data)
          if (next === get().data) return
          if (!undoGrouper.shouldMerge(key)) {
            set({ data: next })
            return
          }
          // Same field edited again within the window: update without a new undo step.
          const history = useAppStore.temporal.getState()
          history.pause()
          set({ data: next })
          history.resume()
        },
        getData: () => get().data,
        clearHistory: () => {
          undoGrouper.reset()
          useAppStore.temporal.getState().clear()
        },
      }
      return {
        data: createEmptyData(),
        ...createCoachSlice(ctx),
        ...createClientSlice(ctx),
        ...createProgramSlice(ctx),
        ...createDaySlice(ctx),
        ...createBlockSlice(ctx),
        ...createExerciseSlice(ctx),
        ...createNoteSlice(ctx),
        ...createSettingsSlice(ctx),
      }
    },
    {
      partialize: (state): TrackedState => ({ data: state.data }),
      equality: (past, current) => past.data === current.data,
      limit: UNDO_LIMIT,
    },
  ),
)
