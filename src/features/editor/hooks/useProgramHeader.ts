import { MAX_PROGRAM_WEEKS } from '@/config/app'
import { clamp } from '@/lib/numbers'
import { getProgramStatus, type ProgramStatus } from '@/lib/program'
import { useAppActions } from '@/store'
import type { Client, ISODate, Program } from '@/types'

export interface ProgramHeaderApi {
  status: ProgramStatus
  isCurrent: boolean
  rename: (name: string) => void
  makeCurrent: () => void
  setStartDate: (date: ISODate) => void
  setEndDate: (date: ISODate) => void
  setWeeks: (weeks: number) => void
}

export function useProgramHeader(client: Client, program: Program): ProgramHeaderApi {
  const actions = useAppActions()
  const { id } = program

  return {
    status: getProgramStatus(program),
    isCurrent: client.currentProgramId === id,
    rename: (name) => actions.updateProgram(id, { name }),
    makeCurrent: () => actions.setCurrentProgram(client.id, id),
    setStartDate: (startDate) => actions.setProgramDates(id, { startDate }),
    setEndDate: (endDate) => actions.setProgramDates(id, { endDate }),
    setWeeks: (weeks) => actions.setProgramDates(id, { weeks: clamp(weeks, 1, MAX_PROGRAM_WEEKS) }),
  }
}
