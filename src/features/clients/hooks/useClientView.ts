import { useCallback, useState } from 'react'
import { readStorage, writeStorage } from '@/lib/safeStorage'
import { CLIENT_VIEW_OPTIONS, CLIENT_VIEW_STORAGE_KEY, DEFAULT_CLIENT_VIEW, type ClientView } from '@/features/clients/config'

const readStoredView = (): ClientView => {
  const stored = readStorage(CLIENT_VIEW_STORAGE_KEY)
  return CLIENT_VIEW_OPTIONS.find((option) => option.value === stored)?.value ?? DEFAULT_CLIENT_VIEW
}

export interface ClientViewApi {
  view: ClientView
  setView: (view: ClientView) => void
}

/** Cuadrícula or Lista, remembered on this device. */
export function useClientView(): ClientViewApi {
  const [view, setStateView] = useState(readStoredView)
  const setView = useCallback((next: ClientView) => {
    writeStorage(CLIENT_VIEW_STORAGE_KEY, next)
    setStateView(next)
  }, [])
  return { view, setView }
}
