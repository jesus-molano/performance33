// Pure selectors over AppData (no React). Hooks in ./hooks wrap these with memoisation.

import type { AppData, Client, ClientNote, Program } from '@/types'

export const findClient = (data: AppData, id: string): Client | null => data.clients.find((c) => c.id === id) ?? null

export const findProgram = (data: AppData, id: string): Program | null => data.programs.find((p) => p.id === id) ?? null

/** Clients sorted by first name (Spanish collation); archived ones only when asked. */
export function sortClients(clients: Client[], includeArchived = false): Client[] {
  return clients
    .filter((c) => includeArchived || !c.archived)
    .sort((a, b) => a.firstName.localeCompare(b.firstName, 'es') || a.lastName.localeCompare(b.lastName, 'es'))
}

/** A client's notes, pinned first, then newest first. */
export function selectClientNotes(notes: ClientNote[], clientId: string): ClientNote[] {
  return notes
    .filter((n) => n.clientId === clientId)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
}

/** Number of important notifications (pinned notes) per client id. */
export function countPinnedNotes(notes: ClientNote[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const note of notes) if (note.pinned) counts[note.clientId] = (counts[note.clientId] ?? 0) + 1
  return counts
}
