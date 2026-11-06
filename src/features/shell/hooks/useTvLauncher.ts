import { useCallback } from 'react'
import { TV_DEFAULT_SCREEN } from '@/config/app'
import { useConfirm, useDisplayWindow, useTvDisplays, type ScreenDetailsApi } from '@/hooks'
import { describeTvPlacement, type TvPlacement } from '@/lib/tvPlacement'
import { useClients } from '@/store'
import { describeScreenClients, tvScreenTitle, useTvScreenList } from '@/features/display'
import { useScreenPresence, useScreens } from '@/features/screens'
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
  canAdd: boolean
  canRemove: boolean
  open: (screen: number) => void
  add: () => void
  remove: (screen: number) => void
}

/** The 'Pantallas' menu: what each screen shows comes from the gym's screens; opening one only touches its own window. */
export function useTvLauncher(): TvLauncher {
  const { openTv } = useDisplayWindow()
  const clients = useClients()
  const confirm = useConfirm()
  const list = useTvScreenList()
  const online = useScreenPresence()
  const { screens: views } = useScreens()
  const { detection, tvCount, displayFor } = useTvDisplays()

  const add = useCallback(() => {
    const screen = list.add()
    if (screen !== null) openTv(screen)
  }, [list, openTv])

  const remove = useCallback(
    (screen: number) => {
      const { title, description, confirmLabel } = TV_LAUNCHER.removeConfirm
      void confirm({ title: title(tvScreenTitle(screen)), description, confirmLabel, danger: true }).then((confirmed) => {
        if (confirmed) list.remove(screen)
      })
    },
    [confirm, list],
  )

  const entries = list.screens.map((screen) => {
    const view = views.find((v) => v.id === screen)
    const title = view?.name ?? tvScreenTitle(screen)
    const isOpen = online.has(screen)
    return {
      screen,
      title,
      people: describeScreenClients(view?.contents ?? null, clients) || TV_LAUNCHER.nobody,
      isOpen,
      placement: describeTvPlacement({ title, isOpen, display: displayFor(screen), tvsDetected: detection.state === 'ok' && tvCount > 0 }),
    }
  })

  return { entries, detection, tvCount, canAdd: list.canAdd, canRemove: list.canRemove, open: openTv, add, remove }
}

/** 'Pantallas' in the phone bar: there is no menu of TVs on a phone, it goes straight to the list of people. */
export function usePhoneTvButton(): () => void {
  const { openTv } = useDisplayWindow()
  return useCallback(() => openTv(TV_DEFAULT_SCREEN), [openTv])
}
