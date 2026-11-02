// Who may do what, in the same terms as the server (supabase/schema.sql and the admin-users function).
// The UI uses these to hide controls; the server is what actually enforces them.

import { accountErrorMessage } from './accountMessages'
import { accessChangeRefusal, type AccessChange } from './accountRules'
import type { AppData, ClientNote, TeamMember } from '@/types'

export const isActiveAdmin = (member: TeamMember | null): boolean => member?.role === 'admin' && member.active

/** Only the author or an admin can edit or delete a note. */
export const canEditNote = (note: Pick<ClientNote, 'authorId'>, member: TeamMember | null): boolean =>
  member !== null && (isActiveAdmin(member) || note.authorId === member.id)

/** Deleting a client takes everyone's notes with it, so only an admin can. Monitors archive. */
export const canDeleteClient = isActiveAdmin

/** Spanish reason why this access change is not allowed, or null when it is. */
export function accessChangeError(
  team: readonly TeamMember[],
  actor: TeamMember | null,
  targetId: string,
  change: AccessChange,
): string | null {
  if (!isActiveAdmin(actor)) return 'Solo un administrador puede hacer esto.'
  const refusal = accessChangeRefusal(team, actor?.id ?? null, targetId, change)
  return refusal ? accountErrorMessage(refusal) : null
}

/**
 * Data coming from a backup or the demo: signatures from people outside this team pass to
 * `fallbackId`, and notes of clients that are not in the data are dropped.
 */
export function adoptImportedData(data: AppData, teamIds: ReadonlySet<string>, fallbackId: string | null): AppData {
  const adopt = (id: string): string => (teamIds.has(id) ? id : (fallbackId ?? ''))
  const clientIds = new Set(data.clients.map((client) => client.id))
  return {
    ...data,
    notes: data.notes.filter((note) => clientIds.has(note.clientId)).map((note) => ({ ...note, authorId: adopt(note.authorId) })),
    programs: data.programs.map((program) => (program.createdBy ? { ...program, createdBy: adopt(program.createdBy) } : program)),
  }
}
