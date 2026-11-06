import { useConfirm, useDisplayWindow, useToast } from '@/hooks'
import { closeTvScreen } from '@/features/display/utils/tvScreenStore'
import { canAddTvScreen, canRemoveTvScreen, nextTvScreen } from '@/features/display/utils/tvScreens'
import { SCREENS_PANEL_COPY } from '@/features/screens/config/panel'
import type { ScreensStatus, ScreenView } from '@/features/screens/types'
import { occupiedBeyond } from '@/features/screens/utils/panel'
import { defaultScreen } from '@/features/screens/utils/sections'
import { useScreenActions } from './useScreenActions'
import { useScreens } from './useScreens'

export interface ScreensPanelApi {
  status: ScreensStatus
  screens: ScreenView[]
  canAdd: boolean
  canRemove: boolean
  /** Adds the lowest free number for the whole gym; returns it, or null at the maximum. */
  add: () => number | null
  rename: (screen: ScreenView, name: string) => void
  /** Fewer sections empties the ones past the new count, with an undo. */
  setSections: (screen: ScreenView, sections: number) => void
  remove: (screen: ScreenView) => Promise<void>
  /** Opens (or focuses) its TV window. Call inside the click handler. */
  open: (screen: ScreenView) => void
}

/** Ajustes → Pantallas and the 'Pantallas' menu: the gym's screens, their name and sections, shared by the whole team. */
export function useScreensPanel(): ScreensPanelApi {
  const { status, screens } = useScreens()
  const actions = useScreenActions()
  const confirm = useConfirm()
  const { toast, toastUndoAction } = useToast()
  const { openTv } = useDisplayWindow()
  const ids = screens.map((screen) => screen.id)

  const warnIfFailed = (saved: Promise<boolean>) => {
    void saved.then((ok) => {
      if (!ok) toast({ message: SCREENS_PANEL_COPY.saveFailed, tone: 'error' })
    })
  }

  const add = () => {
    const id = nextTvScreen(ids)
    if (id !== null) warnIfFailed(actions.saveScreen(defaultScreen(id)))
    return id
  }

  const rename = (screen: ScreenView, name: string) => warnIfFailed(actions.saveScreen({ ...screen, name }))

  const setSections = (screen: ScreenView, sections: number) => {
    const cleared = occupiedBeyond(screen, sections)
    warnIfFailed(actions.saveScreen({ ...screen, sections }))
    if (!cleared.length) return
    toastUndoAction({
      message: SCREENS_PANEL_COPY.sectionsCleared(cleared.length),
      // The count comes back first, so the sections it emptied can be written again.
      onUndo: () => {
        warnIfFailed(actions.saveScreen(screen))
        warnIfFailed(actions.restore(cleared).saved)
      },
    })
  }

  const remove = async (screen: ScreenView) => {
    const ok = await confirm({
      title: SCREENS_PANEL_COPY.removeTitle(screen.name),
      description: SCREENS_PANEL_COPY.removeDescription,
      confirmLabel: SCREENS_PANEL_COPY.removeConfirm,
      danger: true,
    })
    if (!ok) return
    warnIfFailed(actions.removeScreen(screen.id))
    closeTvScreen(screen.id)
  }

  return {
    status,
    screens,
    canAdd: canAddTvScreen(ids),
    canRemove: canRemoveTvScreen(ids),
    add,
    rename,
    setSections,
    remove,
    open: (screen) => openTv(screen.id),
  }
}
