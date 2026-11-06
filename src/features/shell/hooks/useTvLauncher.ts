import { useCallback } from 'react'
import { useDisplayWindow, useTvDisplays, type ScreenDetailsApi } from '@/hooks'
import { describeTvPlacement, type TvPlacement } from '@/lib/tvPlacement'
import { useClients } from '@/store'
import { describeScreenClients } from '@/features/display'
import { useScreensPanel } from '@/features/screens'
import { TV_LAUNCHER } from '@/features/shell/config'
import { screenRowAction, screenStatusLine } from '@/features/shell/utils/tvLauncher'

export interface TvScreenEntry {
  screen: number
  title: string
  /** People on it ('Laura, Javier'), or a short note. */
  people: string
  isOpen: boolean
  /** 'Sin abrir · En «LG TV»'. */
  status: string
  /** What its button does: 'Abrir', 'Colocar' or 'Ver'. */
  action: string
  sections: number
  /** Where it opens and the label of its button. */
  placement: TvPlacement
}

export interface TvLauncher {
  entries: TvScreenEntry[]
  detection: ScreenDetailsApi
  tvCount: number
  /** 'Añadir pantalla' is offered only when the screens cannot be seen (each one seen gets its Pantalla by itself). */
  showAdd: boolean
  canAdd: boolean
  /** The last screen stays; with the screens seen, so does one that is connected. */
  canRemove: (screen: number) => boolean
  open: (screen: number) => void
  add: () => void
  remove: (screen: number) => void
  /** At once for everybody; fewer sections that leave people out offer 'Deshacer'. */
  setSections: (screen: number, sections: number) => void
}

/**
 * The 'Pantallas' menu: the gym's screens (the same list as Ajustes → Pantallas, so adding or removing one here does
 * it for everybody). Opening one only touches its own window; one already open goes back to its place, fullscreen.
 */
export function useTvLauncher(): TvLauncher {
  const { openTv } = useDisplayWindow()
  const clients = useClients()
  const panel = useScreensPanel()
  const { detection, tvCount, displayFor } = useTvDisplays()

  const add = useCallback(() => {
    const screen = panel.add()
    if (screen !== null) openTv(screen)
  }, [panel, openTv])

  const viewOf = (screen: number) => panel.screens.find((s) => s.id === screen)

  const remove = (screen: number) => {
    const view = viewOf(screen)
    if (view) void panel.remove(view)
  }

  const setSections = (screen: number, sections: number) => {
    const view = viewOf(screen)
    if (view && view.sections !== sections) panel.setSections(view, sections)
  }

  const entries = panel.screens.map((view) => {
    const display = displayFor(view.id)
    const placement = describeTvPlacement({
      title: view.name,
      isOpen: view.online,
      display,
      tvsDetected: detection.state === 'ok' && tvCount > 0,
    })
    return {
      screen: view.id,
      title: view.name,
      people: describeScreenClients(view.contents, clients) || TV_LAUNCHER.nobody,
      isOpen: view.online,
      status: screenStatusLine(view.online, placement),
      action: screenRowAction(view.online, display !== null),
      sections: view.sections,
      placement,
    }
  })

  return {
    entries,
    detection,
    tvCount,
    showAdd: !panel.followsTvs,
    canAdd: panel.canAdd,
    canRemove: panel.canRemove,
    open: openTv,
    add,
    remove,
    setSections,
  }
}

