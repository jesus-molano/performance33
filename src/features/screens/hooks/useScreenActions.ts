import { screensActions, type ScreensActions } from '@/features/screens/store/screensActions'

/** Every change to screens and sections (assign, send, clear, swap, reorder, restore, saveScreen, removeScreen…). Stable. */
export function useScreenActions(): ScreensActions {
  return screensActions
}
