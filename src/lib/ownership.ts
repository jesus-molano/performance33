// Who may do what, in the same terms as the database rules (supabase/schema.sql).
// The UI uses these to hide controls; the database is what actually enforces them.

import type { AppData, ClientNote, StaffAccessPatch, StaffMember } from '@/types'

export const isActiveAdmin = (staff: StaffMember | null): boolean => staff?.role === 'admin' && staff.active

/** Only the author or an admin can edit or delete a note. */
export const canEditNote = (note: Pick<ClientNote, 'authorId'>, staff: StaffMember | null): boolean =>
  staff !== null && (isActiveAdmin(staff) || note.authorId === staff.id)

/** Spanish reason why this access change is not allowed, or null when it is. */
export function accessChangeError(
  team: readonly StaffMember[],
  actor: StaffMember | null,
  targetId: string,
  patch: StaffAccessPatch,
): string | null {
  if (!isActiveAdmin(actor)) return 'Solo un administrador puede hacer esto.'
  if (actor?.id === targetId) return 'No puedes cambiar tu propio acceso.'
  const target = team.find((member) => member.id === targetId)
  if (!target) return 'Esa persona ya no está en el equipo.'
  const staysAdmin = (patch.role ?? target.role) === 'admin' && (patch.active ?? target.active)
  const otherAdmin = team.some((member) => member.id !== targetId && isActiveAdmin(member))
  return isActiveAdmin(target) && !staysAdmin && !otherAdmin ? 'Tiene que quedar al menos un administrador.' : null
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
