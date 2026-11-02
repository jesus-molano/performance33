// UI-only state: NOT part of the persisted data and NOT in undo history.

import { create } from 'zustand'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UiState {
  saveStatus: SaveStatus
  lastSavedAt: number | null
  setSaveStatus: (status: SaveStatus) => void
}

export const useUiStore = create<UiState>()((set) => ({
  saveStatus: 'idle',
  lastSavedAt: null,
  setSaveStatus: (status) =>
    set((s) => ({ saveStatus: status, lastSavedAt: status === 'saved' ? Date.now() : s.lastSavedAt })),
}))
