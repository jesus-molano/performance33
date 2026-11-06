import { useMemo } from 'react'
import { useAppData, useClients } from '@/store'
import type { ScreensStatus, ScreenView } from '@/features/screens/types'
import { buildRemotePeople, buildRemoteScreens, placesByPerson, type RemotePerson, type RemoteScreen } from '@/features/screens/utils/remote'
import { useScreensPanel } from './useScreensPanel'

export interface ScreensRemote {
  status: ScreensStatus
  screens: RemoteScreen[]
  /** As the store lists them (the edits need them to plan an undo and keep a person's day). */
  views: ScreenView[]
  people: RemotePerson[]
  /** Where each person shows now. */
  places: ReadonlyMap<string, string>
  /** At once for everybody; fewer sections that leave people out offer 'Deshacer' (the same one as the menu). */
  setSections: (screen: number, sections: number) => void
}

/** 'Pantallas' on a phone: what each gym screen shows, live, and who can be put there. */
export function useScreensRemote(): ScreensRemote {
  const panel = useScreensPanel()
  const clients = useClients()
  const programs = useAppData((data) => data.programs)
  const people = useMemo(() => buildRemotePeople(clients, programs), [clients, programs])
  const screens = useMemo(() => buildRemoteScreens(panel.screens, people), [panel.screens, people])
  const places = useMemo(() => placesByPerson(screens), [screens])

  const setSections = (screen: number, sections: number) => {
    const view = panel.screens.find((s) => s.id === screen)
    if (view && view.sections !== sections) panel.setSections(view, sections)
  }

  return { status: panel.status, screens, views: panel.screens, people, places, setSections }
}
