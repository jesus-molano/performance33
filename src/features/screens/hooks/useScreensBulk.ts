// "Rellenar" and "Vaciar pantallas": each change shows at once on the TVs and toasts 'Deshacer' (or Ctrl+Z while it is
// up), which puts back only the sections nobody has changed since.

import { useCallback } from 'react'
import { useToast, useTvDisplays } from '@/hooks'
import { isPhoneScreen, openTvWindow } from '@/lib/displayWindow'
import { FILL_COPY } from '@/features/screens/config/fill'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { SectionChange } from '@/features/screens/types'
import { useScreensStore } from '@/features/screens/store/screensStore'
import { planClearAll, type FillPerson } from '@/features/screens/utils/fill'
import { screensToOpen } from '@/features/screens/utils/screensToOpen'
import { useScreenActions } from './useScreenActions'
import { useBrowserScreenPresence } from './useScreenPresence'
import { useScreensConnection } from './useScreensConnection'

/** Toasts what a change did, with 'Deshacer' when it wrote something. */
function useAnnounce(): (change: SectionChange, message: string) => void {
  const actions = useScreenActions()
  const { toast, toastUndoAction } = useToast()
  return useCallback(
    (change, message) => {
      const warnIfFailed = (saved: Promise<boolean>) =>
        void saved.then((ok) => {
          if (!ok) toast({ message: SEND_COPY.failed, tone: 'error' })
        })
      if (!change.written.length) {
        toast({ message })
        return
      }
      toastUndoAction({
        message,
        tone: 'success',
        onUndo: () => {
          const { skipped, saved } = actions.undo(change)
          if (skipped) toast({ message: SEND_COPY.undoSkipped(skipped) })
          warnIfFailed(saved)
        },
      })
      warnIfFailed(change.saved)
    },
    [actions, toast, toastUndoAction],
  )
}

/**
 * On the gym's TV laptop, opens the windows of the screens that just got people and are not open yet. Called in the
 * click, before anything async: Chrome only lets a click open windows, and several only when the site may open
 * pop-ups (PopupsAllowedForUrls in public/teles/activar-pantalla-completa.reg). Returns how many were blocked.
 */
function useOpenFilledScreens(): (change: SectionChange) => number {
  const openHere = useBrowserScreenPresence()
  const { displayFor } = useTvDisplays()
  return useCallback(
    (change) => {
      if (isPhoneScreen()) return 0
      let blocked = 0
      for (const screen of screensToOpen(change.written, openHere, (s) => displayFor(s) !== null)) {
        if (!openTvWindow(screen, displayFor(screen)?.bounds ?? null)) blocked += 1
      }
      return blocked
    },
    [displayFor, openHere],
  )
}

/** Puts the people of a class in the free sections, on their next day (`hidden`: archived people, shown as nobody). */
export function useFillScreens(): (people: readonly FillPerson[], hidden: ReadonlySet<string>) => void {
  const actions = useScreenActions()
  const announce = useAnnounce()
  const openFilled = useOpenFilledScreens()
  const { toast } = useToast()
  return useCallback(
    (people, hidden) => {
      if (!people.length) {
        toast({ message: FILL_COPY.nobodyBooked })
        return
      }
      const { plan, change } = actions.fillFromClass(people, hidden)
      const blocked = openFilled(change)
      announce(change, [FILL_COPY.done(plan), blocked ? FILL_COPY.windowsBlocked(blocked) : ''].filter(Boolean).join(' · '))
    },
    [actions, announce, openFilled, toast],
  )
}

/** Empties every section of every screen. */
export function useClearScreens(): () => void {
  const actions = useScreenActions()
  const announce = useAnnounce()
  return useCallback(() => {
    const change = actions.clearAll()
    announce(change, change.written.length ? FILL_COPY.cleared : FILL_COPY.alreadyEmpty)
  }, [actions, announce])
}

/** No section of any screen shows anyone ('Vaciar pantallas' has nothing to do). */
export function useScreensEmpty(): boolean {
  useScreensConnection()
  return useScreensStore((state) => planClearAll(state.sections, state.screens, '').length === 0)
}
