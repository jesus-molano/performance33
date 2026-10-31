// UI-only state: NOT part of the persisted data and NOT in undo history.

import { create } from 'zustand'
import { STORAGE_KEYS } from '../config/app'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function readStoredCoach(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.currentCoach)
  } catch {
    return null
  }
}

function storeCoach(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEYS.currentCoach, id)
    else localStorage.removeItem(STORAGE_KEYS.currentCoach)
  } catch {
    // Storage unavailable (private mode): the choice simply is not remembered.
  }
}

interface UiState {
  /** Coach using this device (remembered per device). null → show '¿Quién eres?'. */
  currentCoachId: string | null
  saveStatus: SaveStatus
  lastSavedAt: number | null
  setCurrentCoach: (id: string | null) => void
  setSaveStatus: (status: SaveStatus) => void
}

export const useUiStore = create<UiState>()((set) => ({
  currentCoachId: readStoredCoach(),
  saveStatus: 'idle',
  lastSavedAt: null,
  setCurrentCoach: (id) => {
    storeCoach(id)
    set({ currentCoachId: id })
  },
  setSaveStatus: (status) =>
    set((s) => ({ saveStatus: status, lastSavedAt: status === 'saved' ? Date.now() : s.lastSavedAt })),
}))

/** Non-hook accessor (used by store actions to stamp authorship). */
export const getCurrentCoachId = (): string | null => useUiStore.getState().currentCoachId
