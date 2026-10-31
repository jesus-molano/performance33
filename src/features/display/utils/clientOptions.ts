import { getDisplayableClients } from '@/lib/display'
import { matchesQuery, normalizeText } from '@/lib/search'
import type { DisplayData, PublicClient } from '@/types'

export interface ClientOption {
  client: PublicClient
  /** First name, plus the surname initial only when another client shares it ('Laura M.'). */
  label: string
  /** False when the client has no current routine (the column would show 'Sin rutina asignada'). */
  hasRoutine: boolean
}

/** Picker labels never carry the surname: it is private and the picker sits on the gym TV. */
function pickerLabel(client: PublicClient, firstNameCounts: ReadonlyMap<string, number>): string {
  const shared = (firstNameCounts.get(normalizeText(client.firstName)) ?? 0) > 1
  return shared && client.lastInitial ? `${client.firstName} ${client.lastInitial}.` : client.firstName
}

/** Picker options: active clients (plus the selected one, even if archived), sorted by label. */
export function buildClientOptions(data: DisplayData | null, selectedId: string | null): ClientOption[] {
  if (!data) return []
  const withRoutine = new Set(getDisplayableClients(data).map((c) => c.id))
  const clients = data.clients.filter((c) => !c.archived || c.id === selectedId)
  const firstNameCounts = new Map<string, number>()
  for (const c of clients) {
    const key = normalizeText(c.firstName)
    firstNameCounts.set(key, (firstNameCounts.get(key) ?? 0) + 1)
  }
  return clients
    .map((client) => ({ client, label: pickerLabel(client, firstNameCounts), hasRoutine: withRoutine.has(client.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/** Accent- and case-insensitive filter on the label ('lau m' finds 'Laura M.'). */
export function filterClientOptions(options: readonly ClientOption[], query: string): ClientOption[] {
  return options.filter((o) => matchesQuery(query, o.label))
}
