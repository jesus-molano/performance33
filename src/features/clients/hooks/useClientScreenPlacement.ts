import { useCallback, useMemo } from 'react'
import { useToast } from '@/hooks'
import type { Client } from '@/types'
import { SEND_COPY, useScreenActions, useScreens, type SectionChange } from '@/features/screens'
import { CLIENT_PLACEMENT_COPY } from '@/features/clients/config'
import { placementsByClient, placementsOf, type ClientPlacement } from '@/features/clients/utils/screenPlacements'

export interface ClientScreenPlacement {
  /** Where the user shows on the TVs now, the one sent last first (none when archived: the TV shows nobody). */
  placements: readonly ClientPlacement[]
  /** Empties those sections; the toast's 'Deshacer' (or Ctrl+Z while it is up) puts back the ones nobody changed since. */
  remove: () => void
}

/** Merges the changes of several clears into one, so a single 'Deshacer' puts them all back. */
const mergeChanges = (changes: readonly SectionChange[]): Pick<SectionChange, 'written' | 'previous'> => ({
  written: changes.flatMap((c) => c.written),
  previous: changes.flatMap((c) => c.previous),
})

export function useClientScreenPlacement(client: Pick<Client, 'id' | 'firstName' | 'archived'>): ClientScreenPlacement {
  const { screens } = useScreens()
  const actions = useScreenActions()
  const { toast, toastUndoAction } = useToast()
  const placements = useMemo(
    () => (client.archived ? [] : placementsOf(placementsByClient(screens, new Set([client.id])), client.id)),
    [client.archived, client.id, screens],
  )

  const warnIfFailed = useCallback(
    (saved: Promise<boolean>[]) =>
      void Promise.all(saved).then((results) => {
        if (results.includes(false)) toast({ message: CLIENT_PLACEMENT_COPY.failed, tone: 'error' })
      }),
    [toast],
  )

  const remove = useCallback(() => {
    const changes = placements.map((p) => actions.clear({ screen: p.screen, section: p.section })).filter((c) => c.written.length)
    if (!changes.length) return
    const where = placements.map((p) => SEND_COPY.where(p.screenName, p.section)).join(' y ')
    const change = mergeChanges(changes)
    toastUndoAction({
      message: CLIENT_PLACEMENT_COPY.removed(client.firstName, where),
      onUndo: () => {
        const { skipped, saved } = actions.undo(change)
        if (skipped) toast({ message: SEND_COPY.undoSkipped(skipped) })
        warnIfFailed([saved])
      },
    })
    warnIfFailed(changes.map((c) => c.saved))
  }, [actions, client.firstName, placements, toast, toastUndoAction, warnIfFailed])

  return { placements, remove }
}
