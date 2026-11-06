// What 'Pantallas' shows on a phone: each screen with who each section shows, and the people that can be put there.
// Pure: no React, no storage.

import { getCurrentProgram } from '@/lib/program'
import { matchesQuery } from '@/lib/search'
import type { Client, Program } from '@/types'
import { REMOTE_COPY } from '@/features/screens/config/remote'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { ScreenView, SectionRef } from '@/features/screens/types'
import { initialScreenDay, screenDayOptions, shownScreenDay, type ScreenDayOption } from './screenDays'
import { gridFor } from './sections'

export interface RemotePerson {
  id: string
  firstName: string
  /** 'Laura Martín': coaches search by first name and surname. */
  fullName: string
  color: string
  /** Days of the current routine (none without one). */
  days: ScreenDayOption[]
}

export interface RemoteTile {
  ref: SectionRef
  /** 'Pantalla 1 · Sección 2'. */
  where: string
  /** Who it shows; null when free, or when that person is archived or gone (the TV shows nobody there). */
  person: RemotePerson | null
  day: number
  /** 'Día 2 · Pierna' ('Día 2' when the routine no longer has that day); null when free. */
  dayLabel: string | null
}

export interface RemoteScreen {
  id: number
  name: string
  online: boolean
  sections: number
  columns: number
  rows: number
  tiles: RemoteTile[]
}

const fullName = (client: Pick<Client, 'firstName' | 'lastName'>) => `${client.firstName} ${client.lastName}`.trim()

/** Active people by full name, each with the days of their current routine. */
export function buildRemotePeople(
  clients: readonly Pick<Client, 'id' | 'firstName' | 'lastName' | 'color' | 'archived' | 'currentProgramId'>[],
  programs: Program[],
): RemotePerson[] {
  return clients
    .filter((client) => !client.archived)
    .map((client) => ({
      id: client.id,
      firstName: client.firstName,
      fullName: fullName(client),
      color: client.color,
      days: screenDayOptions(getCurrentProgram(client, programs)?.days ?? []),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'))
}

/** Who can be put on a screen: people with a routine, found by any part of the name ('lau mar'). */
export function findRemotePeople(people: readonly RemotePerson[], query: string): RemotePerson[] {
  return people.filter((person) => person.days.length > 0 && matchesQuery(query, person.fullName))
}

export const dayLabelOf = (person: Pick<RemotePerson, 'days'>, day: number): string =>
  person.days.find((option) => option.day === day)?.label ?? REMOTE_COPY.day(day)

/** One card per screen, its sections in the order and grid the TV uses. */
export function buildRemoteScreens(views: readonly ScreenView[], people: readonly RemotePerson[]): RemoteScreen[] {
  const byId = new Map(people.map((person) => [person.id, person]))
  return views.map((view) => ({
    id: view.id,
    name: view.name,
    online: view.online,
    sections: view.sections,
    ...gridFor(view.sections),
    tiles: view.contents.map((content, i) => {
      const person = content.clientId ? (byId.get(content.clientId) ?? null) : null
      return {
        ref: { screen: view.id, section: i + 1 },
        where: SEND_COPY.where(view.name, i + 1),
        person,
        day: content.day,
        dayLabel: person ? dayLabelOf(person, content.day) : null,
      }
    }),
  }))
}

/** Where each person shows now ('Pantalla 1 · Sección 2'), the first section when there are several. */
export function placesByPerson(screens: readonly RemoteScreen[]): Map<string, string> {
  const places = new Map<string, string>()
  for (const tile of screens.flatMap((screen) => screen.tiles)) {
    if (tile.person && !places.has(tile.person.id)) places.set(tile.person.id, tile.where)
  }
  return places
}

/** The day a person starts on when put in a section: the one they show elsewhere now, else their next day, else Día 1. */
export const startDayFor = (person: Pick<RemotePerson, 'id' | 'days'>, views: readonly ScreenView[], nextDay: number | null): number =>
  initialScreenDay(person.days, shownScreenDay(views, person.id), nextDay)
