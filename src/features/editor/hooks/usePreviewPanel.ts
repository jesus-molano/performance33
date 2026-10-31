import { useCallback, useState } from 'react'
import { useMediaQuery } from '../../../hooks'
import { PREVIEW_STORAGE_KEY, WIDE_MEDIA_QUERY } from '../config'

function readStoredVisibility(): boolean {
  try {
    return window.localStorage.getItem(PREVIEW_STORAGE_KEY) !== 'hidden'
  } catch {
    return true
  }
}

function storeVisibility(visible: boolean): void {
  try {
    window.localStorage.setItem(PREVIEW_STORAGE_KEY, visible ? 'visible' : 'hidden')
  } catch {
    // Storage blocked (private mode): the preference simply is not remembered.
  }
}

export interface PreviewPanelState {
  /** Wide screens show the preview as a side panel; narrow ones in a sheet. */
  isWide: boolean
  /** Side panel visible (wide screens only). */
  showAside: boolean
  /** Preview sheet open (narrow screens only). */
  sheetOpen: boolean
  toggle: () => void
  closeSheet: () => void
}

/** 'Vista pantalla': side panel on wide screens (remembered per browser), bottom sheet elsewhere. */
export function usePreviewPanel(): PreviewPanelState {
  const isWide = useMediaQuery(WIDE_MEDIA_QUERY)
  const [asideVisible, setAsideVisible] = useState(readStoredVisibility)
  const [sheetOpen, setSheetOpen] = useState(false)

  const toggle = useCallback(() => {
    if (!isWide) {
      setSheetOpen((open) => !open)
      return
    }
    storeVisibility(!asideVisible)
    setAsideVisible(!asideVisible)
  }, [isWide, asideVisible])

  const closeSheet = useCallback(() => setSheetOpen(false), [])

  return { isWide, showAside: isWide && asideVisible, sheetOpen: !isWide && sheetOpen, toggle, closeSheet }
}
