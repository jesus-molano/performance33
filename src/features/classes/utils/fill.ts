// Who of a class goes to the screens: the people with a place, in arrival order, each with the day that is next for them.

import type { Client } from '@/types'
import type { FillPerson } from '@/features/screens'
import type { Booking } from '@/features/classes/types'

export interface ClassFill {
  people: FillPerson[]
  /** Archived people: the TVs show nobody for them, so a section showing one counts as free. */
  hidden: Set<string>
}

/** The waitlist never goes; an archived or deleted person has no routine to show. */
export function classFillOf(
  bookings: readonly Booking[],
  slotId: string,
  clients: ReadonlyMap<string, Pick<Client, 'id' | 'firstName' | 'archived'>>,
  nextDay: (clientId: string) => number | null,
): ClassFill {
  const hidden = new Set([...clients.values()].filter((client) => client.archived).map((client) => client.id))
  const people = bookings
    .filter((b) => b.slotId === slotId && b.status === 'booked')
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .flatMap((b): FillPerson[] => {
      const client = clients.get(b.clientId)
      if (!client) return []
      return [{ clientId: client.id, name: client.firstName, day: client.archived ? null : nextDay(client.id) }]
    })
  return { people, hidden }
}
