import { PLAN_BY_ID } from '../../config/plans'
import { removeById, updateById } from '../../lib/arrays'
import { pickColor } from '../../lib/color'
import { todayISO } from '../../lib/dates'
import { newId } from '../../lib/ids'
import type { Client, NewClientInput } from '../../types'
import type { ClientActions, SliceContext } from '../types'
import { groupKey } from '../undoGroup'

function buildClient(id: string, input: NewClientInput): Client {
  const plan = input.plan ?? 'plus'
  const lastName = (input.lastName ?? '').trim()
  return {
    id,
    firstName: input.firstName.trim(),
    lastName,
    plan,
    trainingDays: input.trainingDays ?? PLAN_BY_ID[plan].defaultDays,
    startDate: input.startDate ?? todayISO(),
    goal: input.goal ?? '',
    color: input.color ?? pickColor(input.firstName + lastName),
    archived: false,
    currentProgramId: null,
    createdAt: new Date().toISOString(),
  }
}

export function createClientSlice({ commit }: SliceContext): ClientActions {
  const setArchived = (id: string, archived: boolean) =>
    commit((d) => ({ ...d, clients: updateById(d.clients, id, (c) => ({ ...c, archived })) }))

  return {
    addClient: (input) => {
      const id = newId('cli')
      commit((d) => ({ ...d, clients: [...d.clients, buildClient(id, input)] }))
      return id
    },
    updateClient: (id, patch) =>
      commit((d) => ({ ...d, clients: updateById(d.clients, id, (c) => ({ ...c, ...patch })) }), groupKey('client', id, patch)),
    archiveClient: (id) => setArchived(id, true),
    restoreClient: (id) => setArchived(id, false),
    deleteClient: (id) =>
      commit((d) => ({
        ...d,
        clients: removeById(d.clients, id),
        programs: d.programs.filter((p) => p.clientId !== id),
        notes: d.notes.filter((n) => n.clientId !== id),
      })),
  }
}
