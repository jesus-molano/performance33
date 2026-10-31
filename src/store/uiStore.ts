// UI-only state: NOT part of the persisted data and NOT in undo history.

import { create } from 'zustand'
import { STORAGE_KEYS } from '@/config/app'
import { readStorage, removeStorage, writeStorage } from '@/lib/safeStorage'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const readStoredCoach = (): string | null => readStorage(STORAGE_KEYS.currentCoach)

function storeCoach(id: string | null): void {
  if (id) writeStorage(STORAGE_KEYS.currentCoach, id)
  else removeStorage(STORAGE_KEYS.currentCoach)
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
