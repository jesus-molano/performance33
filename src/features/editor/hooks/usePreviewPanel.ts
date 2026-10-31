import { useCallback, useState } from 'react'
import { useMediaQuery } from '@/hooks'
import { readStorage, writeStorage } from '@/lib/safeStorage'
import { PREVIEW_STORAGE_KEY, WIDE_MEDIA_QUERY } from '@/features/editor/config'

const readStoredVisibility = (): boolean => readStorage(PREVIEW_STORAGE_KEY) !== 'hidden'
const storeVisibility = (visible: boolean): void => writeStorage(PREVIEW_STORAGE_KEY, visible ? 'visible' : 'hidden')

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

/** Live preview: side panel on wide screens (remembered per browser), bottom sheet elsewhere. */
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
