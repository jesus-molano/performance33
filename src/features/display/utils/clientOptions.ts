import { getDisplayableClients } from '@/lib/display'
import { matchesQuery } from '@/lib/search'
import type { DisplayData, PublicClient } from '@/types'

export interface ClientOption {
  client: PublicClient
  /** Full name ('Laura Martín'): coaches search by first name and surname. */
  label: string
  /** False when the client has no current routine (the column would show 'Sin rutina asignada'). */
  hasRoutine: boolean
}

const fullName = (client: PublicClient) => `${client.firstName} ${client.lastName}`.trim()

/** Picker options: active clients, sorted by label. */
export function buildClientOptions(data: DisplayData | null): ClientOption[] {
  if (!data) return []
  const withRoutine = new Set(getDisplayableClients(data).map((c) => c.id))
  return data.clients
    .filter((c) => !c.archived)
    .map((client) => ({ client, label: fullName(client), hasRoutine: withRoutine.has(client.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/** Accent- and case-insensitive filter on the full name ('lau mar' finds 'Laura Martín'). */
export function filterClientOptions(options: readonly ClientOption[], query: string): ClientOption[] {
  return options.filter((o) => matchesQuery(query, o.label))
}

/**
 * Who a section shows on the TV: an archived client shows as nobody, so their name and routine leave the wall without
 * anyone emptying the section. A client that no longer exists keeps its id ('Usuario no disponible', no name).
 */
export function shownClientId(data: DisplayData | null, clientId: string | null): string | null {
  if (!data || !clientId) return clientId
  return data.clients.find((c) => c.id === clientId)?.archived ? null : clientId
}
