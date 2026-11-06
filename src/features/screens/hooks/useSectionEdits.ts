import { useToast } from '@/hooks'
import { useNextDayLookup } from '@/features/sessions'
import { REMOTE_COPY } from '@/features/screens/config/remote'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { ScreenView, SectionChange } from '@/features/screens/types'
import { movedFromSection, replacedOccupant, screenNameOf } from '@/features/screens/utils/picker'
import { startDayFor, type RemotePerson, type RemoteTile } from '@/features/screens/utils/remote'
import { useScreenActions } from './useScreenActions'

export interface SectionEdits {
  /** Puts that person there (on the day they show elsewhere, else their next day), taking them out of any other section. */
  putPerson: (tile: RemoteTile, person: RemotePerson) => void
  changeDay: (tile: RemoteTile, day: number) => void
  clear: (tile: RemoteTile) => void
  /** The two sections of one screen swap what they show. */
  swap: (tile: RemoteTile, other: RemoteTile) => void
}

/**
 * What the phone remote does to a section. Each change shows at once on the TV and toasts 'Deshacer' (or Ctrl+Z while
 * it is up), which puts back only the sections nobody has changed since.
 */
export function useSectionEdits(views: readonly ScreenView[], people: readonly RemotePerson[]): SectionEdits {
  const actions = useScreenActions()
  const { toast, toastUndoAction } = useToast()
  const names = new Map(people.map((person) => [person.id, person.firstName]))
  const nextDayOf = useNextDayLookup()

  const warnIfFailed = (saved: Promise<boolean>) =>
    void saved.then((ok) => {
      if (!ok) toast({ message: SEND_COPY.failed, tone: 'error' })
    })

  const announce = (change: SectionChange, message: string) => {
    if (!change.written.length) return
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
  }

  const putPerson = (tile: RemoteTile, person: RemotePerson) => {
    if (tile.person?.id === person.id) return
    const day = startDayFor(person, views, nextDayOf(person.id))
    const replaced = replacedOccupant(views, tile.ref, person.id, names)
    const from = movedFromSection(views, tile.ref, person.id)
    const movedFrom = from ? SEND_COPY.where(screenNameOf(views, from.screen), from.section) : null
    announce(actions.send(tile.ref, { clientId: person.id, day }), SEND_COPY.sent({ name: person.firstName, day, where: tile.where, replaced, movedFrom }))
  }

  const changeDay = (tile: RemoteTile, day: number) => {
    if (!tile.person || tile.day === day) return
    announce(actions.assign(tile.ref, { clientId: tile.person.id, day }), REMOTE_COPY.dayChanged(tile.person.firstName, day, tile.where))
  }

  const clear = (tile: RemoteTile) => announce(actions.clear(tile.ref), REMOTE_COPY.removed(tile.person?.firstName ?? null, tile.where))

  const swap = (tile: RemoteTile, other: RemoteTile) => announce(actions.swap(tile.ref, other.ref), REMOTE_COPY.swapped(screenNameOf(views, tile.ref.screen), tile.ref.section, other.ref.section))

  return { putPerson, changeDay, clear, swap }
}
