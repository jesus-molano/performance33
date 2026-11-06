// Who "Añadir usuario" offers: active users not already in the class, found by any part of the name.

import { formatFullName } from '@/lib/format'
import { matchesQuery } from '@/lib/search'
import type { Client } from '@/types'
import type { RosterClient } from './slotView'

export interface AddablePerson {
  client: RosterClient
  name: string
}

export interface AddablePeople {
  results: AddablePerson[]
  /** Nobody is left to add, whatever the search. */
  allIn: boolean
}

export function findAddablePeople(
  clients: readonly Pick<Client, 'id' | 'firstName' | 'lastName' | 'color' | 'plan' | 'trainingDays' | 'archived'>[],
  inSlot: ReadonlySet<string>,
  query: string,
  max: number,
): AddablePeople {
  const candidates = clients
    .filter((client) => !client.archived && !inSlot.has(client.id))
    .map((client) => ({ client, name: formatFullName(client.firstName, client.lastName) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return { results: candidates.filter((person) => matchesQuery(query, person.name)).slice(0, max), allIn: candidates.length === 0 }
}
