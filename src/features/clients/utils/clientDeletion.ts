import { plural } from '@/lib/format'
import type { AppData } from '@/types'

/** Spanish warning naming what deleting a client takes with it. */
export function describeClientDeletion(data: Pick<AppData, 'programs' | 'notes'>, clientId: string): string {
  const routines = data.programs.filter((p) => p.clientId === clientId).length
  const notes = data.notes.filter((n) => n.clientId === clientId).length
  if (routines === 0 && notes === 0) return 'No tiene rutinas ni notas internas.'
  const parts = [routines > 0 && plural(routines, 'rutina', 'rutinas'), notes > 0 && plural(notes, 'nota interna', 'notas internas')].filter(Boolean)
  return `Se borrarán también ${parts.join(' y ')}. Después de cerrar la app ya no podrás recuperarlo.`
}
