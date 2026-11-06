import { useCallback } from 'react'
import { TV_DEFAULT_SCREEN } from '@/config/app'
import { useDisplayWindow, useTvDisplays, type ScreenDetailsApi } from '@/hooks'
import { describeTvPlacement, type TvPlacement } from '@/lib/tvPlacement'
import { useClients } from '@/store'
import { describeScreenClients } from '@/features/display'
import { useScreensPanel } from '@/features/screens'
import { TV_LAUNCHER } from '@/features/shell/config'

export interface TvScreenEntry {
  screen: number
  title: string
  /** People on it ('Laura, Javier'), or a short note. */
  people: string
  isOpen: boolean
  /** Where it opens and the label of its button. */
  placement: TvPlacement
}

export interface TvLauncher {
  entries: TvScreenEntry[]
  detection: ScreenDetailsApi
  tvCount: number
  /** 'Añadir pantalla' is offered only when the TVs cannot be seen (each TV seen gets its screen by itself). */
  showAdd: boolean
  canAdd: boolean
  canRemove: boolean
  open: (screen: number) => void
  add: () => void
  remove: (screen: number) => void
}

/**
 * The 'Pantallas' menu: the gym's screens (the same list as Ajustes → Pantallas, so adding or removing one here does
 * it for everybody). Opening one only touches its own window; one already open goes back to its TV, fullscreen.
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

  const remove = useCallback(
    (screen: number) => {
      const view = panel.screens.find((s) => s.id === screen)
      if (view) void panel.remove(view)
    },
    [panel],
  )

  const entries = panel.screens.map((view) => ({
    screen: view.id,
    title: view.name,
    people: describeScreenClients(view.contents, clients) || TV_LAUNCHER.nobody,
    isOpen: view.online,
    placement: describeTvPlacement({
      title: view.name,
      isOpen: view.online,
      display: displayFor(view.id),
      tvsDetected: detection.state === 'ok' && tvCount > 0,
    }),
  }))

  return { entries, detection, tvCount, showAdd: !panel.followsTvs, canAdd: panel.canAdd, canRemove: panel.canRemove, open: openTv, add, remove }
}

/** 'Pantallas' in the phone bar: there is no menu of TVs on a phone, it goes straight to the list of people. */
export function usePhoneTvButton(): () => void {
  const { openTv } = useDisplayWindow()
  return useCallback(() => openTv(TV_DEFAULT_SCREEN), [openTv])
}
