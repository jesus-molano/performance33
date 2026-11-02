import { useCallback } from 'react'
import { TV_DEFAULT_SCREEN } from '@/config/app'
import { useConfirm, useDisplayWindow } from '@/hooks'
import { useClients } from '@/store'
import { describeScreenClients, initialTvSlots, loadStoredSlots, storeSlots, tvScreenTitle, useOpenTvScreens, useTvScreenList } from '@/features/display'
import { TV_LAUNCHER } from '@/features/shell/config'

export interface TvScreenEntry {
  screen: number
  title: string
  /** People on it ('Laura, Javier'), or a short note. */
  people: string
  isOpen: boolean
}

export interface TvLauncher {
  entries: TvScreenEntry[]
  canAdd: boolean
  canRemove: boolean
  open: (screen: number) => void
  add: () => void
  remove: (screen: number) => void
}

/**
 * The 'Pantallas' menu. Opening a screen restores its setup on this device or, the first time, the people the other
 * screens are not showing, and only ever touches that screen's own window.
 */
export function useTvLauncher(): TvLauncher {
  const { openTv } = useDisplayWindow()
  const clients = useClients()
  const confirm = useConfirm()
  const list = useTvScreenList()
  const openScreens = useOpenTvScreens()
  const { screens } = list

  const open = useCallback(
    (screen: number) => {
      const others = screens.filter((other) => other !== screen)
      const slots = initialTvSlots(screen, others, clients)
      storeSlots(screen, slots)
      openTv(screen, slots)
    },
    [openTv, clients, screens],
  )

  const add = useCallback(() => {
    const screen = list.add()
    if (screen !== null) open(screen)
  }, [list, open])

  const remove = useCallback(
    (screen: number) => {
      const { title, description, confirmLabel } = TV_LAUNCHER.removeConfirm
      void confirm({ title: title(tvScreenTitle(screen)), description, confirmLabel, danger: true }).then((confirmed) => {
        if (confirmed) list.remove(screen)
      })
    },
    [confirm, list],
  )

  const entries = screens.map((screen) => ({
    screen,
    title: tvScreenTitle(screen),
    people: describeScreenClients(loadStoredSlots(screen), clients) || TV_LAUNCHER.nobody,
    isOpen: openScreens.has(screen),
  }))

  return { entries, canAdd: list.canAdd, canRemove: list.canRemove, open, add, remove }
}

/** 'Pantallas' in the phone bar: there is no menu of TVs on a phone, it goes straight to the list of people. */
export function usePhoneTvButton(): () => void {
  const { openTv } = useDisplayWindow()
  return useCallback(() => openTv(TV_DEFAULT_SCREEN), [openTv])
}
