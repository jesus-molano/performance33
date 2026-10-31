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

/** Picker options: active clients (plus the selected one, even if archived), sorted by label. */
export function buildClientOptions(data: DisplayData | null, selectedId: string | null): ClientOption[] {
  if (!data) return []
  const withRoutine = new Set(getDisplayableClients(data).map((c) => c.id))
  return data.clients
    .filter((c) => !c.archived || c.id === selectedId)
    .map((client) => ({ client, label: fullName(client), hasRoutine: withRoutine.has(client.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/** Accent- and case-insensitive filter on the full name ('lau mar' finds 'Laura Martín'). */
export function filterClientOptions(options: readonly ClientOption[], query: string): ClientOption[] {
  return options.filter((o) => matchesQuery(query, o.label))
}
