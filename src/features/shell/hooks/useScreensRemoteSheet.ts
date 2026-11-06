import { useState } from 'react'
import { useScreensRemote, useSectionEdits, type RemotePerson, type RemoteScreen, type RemoteTile, type ScreensRemote, type SectionRef } from '@/features/screens'

/** The small sheet of one section: what can be done, then who or which day. */
export type RemoteSectionStep = 'menu' | 'person' | 'day'

export interface PickedSection {
  screen: RemoteScreen
  /** Live: it follows changes from other coaches. */
  tile: RemoteTile
  step: RemoteSectionStep
}

export interface ScreensRemoteSheet {
  remote: ScreensRemote
  /**
   * The section being changed; null when none, when it is gone (its screen lost sections meanwhile) or when, past the
   * menu, another coach put someone else there (the person or day lists were for who it showed).
   */
  picked: PickedSection | null
  pick: (tile: RemoteTile) => void
  setStep: (step: RemoteSectionStep) => void
  closeSection: () => void
  /** Each one closes the section's sheet, so the change and its 'Deshacer' are seen on the screens. */
  putPerson: (person: RemotePerson) => void
  changeDay: (day: number) => void
  swap: (other: RemoteTile) => void
  clear: () => void
}

interface Selection {
  ref: SectionRef
  step: RemoteSectionStep
  /** Who the section showed when its lists were opened. */
  personId: string | null
}

const personOf = (tile: RemoteTile): string | null => tile.person?.id ?? null

/** 'Pantallas' on a phone: the screens, the section being changed and the changes, each with 'Deshacer'. */
export function useScreensRemoteSheet(): ScreensRemoteSheet {
  const remote = useScreensRemote()
  const edits = useSectionEdits(remote.views, remote.people)
  const [selection, setSelection] = useState<Selection | null>(null)

  const screen = selection ? remote.screens.find((s) => s.id === selection.ref.screen) : undefined
  const found = selection ? screen?.tiles[selection.ref.section - 1] : undefined
  const tile = found && selection && (selection.step === 'menu' || personOf(found) === selection.personId) ? found : undefined
  const picked = selection && screen && tile ? { screen, tile, step: selection.step } : null
  // A section that went away (or changed hands past the menu) closes its sheet for good: it doesn't pop up again by
  // itself when the sections come back (adjusting state while rendering, as React recommends over an effect).
  if (selection && !picked) setSelection(null)

  const closeSection = () => setSelection(null)
  const finish = (edit: (tile: RemoteTile) => void) => {
    closeSection()
    if (tile) edit(tile)
  }

  return {
    remote,
    picked,
    pick: (target) => setSelection({ ref: target.ref, step: 'menu', personId: personOf(target) }),
    // From the menu (live), the lists are for who the section shows right now.
    setStep: (step) => setSelection((current) => (current && tile ? { ...current, step, personId: personOf(tile) } : current)),
    closeSection,
    putPerson: (person) => finish((target) => edits.putPerson(target, person)),
    changeDay: (day) => finish((target) => edits.changeDay(target, day)),
    swap: (other) => finish((target) => edits.swap(target, other)),
    clear: () => finish(edits.clear),
  }
}
