import { useMemo } from 'react'
import { getProgramStatus, type ProgramStatus } from '@/lib/program'
import { useCurrentProgram } from '@/store'
import type { Program } from '@/types'

export interface ClientStatus {
  program: Program | null
  status: ProgramStatus
}

/** Current routine of a client and its status ('Semana 2 de 4', 'Termina en 3 días'…). */
export function useClientStatus(clientId: string): ClientStatus {
  const program = useCurrentProgram(clientId)
  const status = useMemo(() => getProgramStatus(program), [program])
  return { program, status }
}
