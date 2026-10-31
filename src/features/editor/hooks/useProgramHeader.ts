import { useCallback } from 'react'
import { MAX_PROGRAM_WEEKS } from '../../../config/app'
import { useDisplayWindow } from '../../../hooks'
import { clamp } from '../../../lib/numbers'
import { getProgramStatus, type ProgramStatus } from '../../../lib/program'
import { useAppActions } from '../../../store'
import type { Client, ISODate, Program } from '../../../types'

export interface ProgramHeaderApi {
  status: ProgramStatus
  isCurrent: boolean
  rename: (name: string) => void
  makeCurrent: () => void
  setStartDate: (date: ISODate) => void
  setEndDate: (date: ISODate) => void
  setWeeks: (weeks: number) => void
  /** Opens the Pantalla popup on the given 0-based day. Call inside the click handler. */
  openOnScreen: (dayIndex: number) => void
}

export function useProgramHeader(client: Client, program: Program): ProgramHeaderApi {
  const actions = useAppActions()
  const { openDisplay } = useDisplayWindow()
  const { id } = program

  const openOnScreen = useCallback(
    (dayIndex: number) => openDisplay(client.id, dayIndex >= 0 ? dayIndex + 1 : null, id),
    [openDisplay, client.id, id],
  )

  return {
    status: getProgramStatus(program),
    isCurrent: client.currentProgramId === id,
    rename: (name) => actions.updateProgram(id, { name }),
    makeCurrent: () => actions.setCurrentProgram(client.id, id),
    setStartDate: (startDate) => actions.setProgramDates(id, { startDate }),
    setEndDate: (endDate) => actions.setProgramDates(id, { endDate }),
    setWeeks: (weeks) => actions.setProgramDates(id, { weeks: clamp(weeks, 1, MAX_PROGRAM_WEEKS) }),
    openOnScreen,
  }
}
