import { DEFAULT_PROGRAM_WEEKS } from '@/config/app'
import { removeById, updateById } from '@/lib/arrays'
import { endDateFor, todayISO } from '@/lib/dates'
import { cloneDay, createDay } from '@/lib/factories'
import { newId } from '@/lib/ids'
import { getClientPrograms } from '@/lib/program'
import { applyProgramDates, nextBlockStart } from '@/lib/programDates'
import type { AppData, Program } from '@/types'
import { getCurrentProfileId } from '@/store/sessionStore'
import type { ProgramActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

function addProgram(data: AppData, program: Program, makeCurrent: boolean): AppData {
  return {
    ...data,
    programs: [...data.programs, program],
    clients: makeCurrent
      ? updateById(data.clients, program.clientId, (c) => ({ ...c, currentProgramId: program.id }))
      : data.clients,
  }
}

function removeProgram(data: AppData, id: string): AppData {
  const program = data.programs.find((p) => p.id === id)
  if (!program) return data
  const programs = removeById(data.programs, id)
  const fallback = getClientPrograms(program.clientId, programs)[0]
  return {
    ...data,
    programs,
    clients: updateById(data.clients, program.clientId, (c) =>
      c.currentProgramId === id ? { ...c, currentProgramId: fallback?.id ?? null } : c,
    ),
  }
}

export function createProgramSlice({ commit, getData }: SliceContext): ProgramActions {
  return {
    createProgram: (clientId, opts = {}) => {
      const client = getData().clients.find((c) => c.id === clientId)
      const startDate = opts.startDate ?? todayISO()
      const weeks = Math.max(1, opts.weeks ?? DEFAULT_PROGRAM_WEEKS)
      const dayCount = Math.max(1, opts.dayCount ?? client?.trainingDays ?? 3)
      const program: Program = {
        id: newId('prg'),
        clientId,
        name: opts.name ?? '',
        startDate,
        weeks,
        endDate: endDateFor(startDate, weeks),
        days: Array.from({ length: dayCount }, (_, i) => createDay(i)),
        createdAt: new Date().toISOString(),
        createdBy: getCurrentProfileId(),
      }
      commit((d) => addProgram(d, program, opts.makeCurrent ?? true))
      return program.id
    },
    updateProgram: (id, patch) =>
      commit((d) => ({ ...d, programs: updateById(d.programs, id, (p) => ({ ...p, ...patch })) }), groupKey('program', id, patch)),
    setProgramDates: (id, patch) =>
      commit(
        (d) => ({ ...d, programs: updateById(d.programs, id, (p) => ({ ...p, ...applyProgramDates(p, patch) })) }),
        groupKey('dates', id, patch),
      ),
    duplicateProgram: (id, opts = {}) => {
      const source = getData().programs.find((p) => p.id === id)
      if (!source) return ''
      const startDate = opts.startDate ?? nextBlockStart(source)
      const copy: Program = {
        ...source,
        id: newId('prg'),
        name: '',
        startDate,
        endDate: endDateFor(startDate, source.weeks),
        days: source.days.map(cloneDay),
        createdAt: new Date().toISOString(),
        createdBy: getCurrentProfileId(),
      }
      commit((d) => addProgram(d, copy, opts.makeCurrent ?? true))
      return copy.id
    },
    setCurrentProgram: (clientId, programId) =>
      commit((d) => ({
        ...d,
        clients: updateById(d.clients, clientId, (c) => ({ ...c, currentProgramId: programId })),
      })),
    deleteProgram: (id) => commit((d) => removeProgram(d, id)),
  }
}
