// Ephemeral editor UI state (never persisted, never undone): which row is open,
// pending focus requests and collapsed blocks.

import { create } from 'zustand'

/** Fields of an exercise row reachable with Enter, in order. */
export type RowField = 'name' | 'sets' | 'value' | 'load'

export interface FocusRequest {
  exerciseId: string
  field: RowField
}

interface EditorUiState {
  expandedExerciseId: string | null
  focusRequest: FocusRequest | null
  /** Block whose first row should be opened once it renders (right after creating it). */
  pendingBlockFocus: string | null
  collapsedBlocks: Record<string, true>
  /** Opens a row and focuses one of its fields. */
  openRow: (exerciseId: string, field?: RowField) => void
  closeRow: () => void
  requestFocus: (exerciseId: string, field: RowField) => void
  clearFocus: () => void
  focusFirstRowOf: (blockId: string) => void
  clearPendingBlock: () => void
  toggleBlock: (blockId: string) => void
}

export const useEditorUi = create<EditorUiState>()((set) => ({
  expandedExerciseId: null,
  focusRequest: null,
  pendingBlockFocus: null,
  collapsedBlocks: {},
  openRow: (exerciseId, field = 'name') => set({ expandedExerciseId: exerciseId, focusRequest: { exerciseId, field } }),
  closeRow: () => set({ expandedExerciseId: null, focusRequest: null }),
  requestFocus: (exerciseId, field) => set({ focusRequest: { exerciseId, field } }),
  clearFocus: () => set({ focusRequest: null }),
  focusFirstRowOf: (blockId) => set({ pendingBlockFocus: blockId }),
  clearPendingBlock: () => set({ pendingBlockFocus: null }),
  toggleBlock: (blockId) =>
    set((s) => {
      const next = { ...s.collapsedBlocks }
      if (next[blockId]) delete next[blockId]
      else next[blockId] = true
      return { collapsedBlocks: next }
    }),
}))
