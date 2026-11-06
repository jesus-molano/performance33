// Program timing / status helpers (pure). Week and phase come from shared/routine/programWeek.ts.

import type { Client, ISODate, Program } from '@/types'
import { EXPIRING_THRESHOLD_DAYS } from '@/config/app'
import { formatWeekOf, getProgramWeekInfo, type ProgramWeekInfo } from '@shared/routine/programWeek.ts'
import { formatDate, todayISO } from './dates'

export {
  formatProgramPeriod,
  formatWeekOf,
  getProgramWeekInfo,
  getProgressionWeek,
  type ProgramPhase,
  type ProgramWeekInfo,
} from '@shared/routine/programWeek.ts'

export type ProgramStatusKind = 'none' | 'upcoming' | 'active' | 'expiring' | 'expired'
export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface ProgramStatus {
  kind: ProgramStatusKind
  /** Main label: 'Sin rutina' | 'Empieza en 3 días' | 'Semana 2 de 4' | 'Termina en 3 días' | 'Termina hoy' | 'Finalizada'. */
  label: string
  /** Secondary detail: 'Semana 4 de 4 · termina el 02/11/2026', 'Terminó hace 10 días'… */
  detail: string
  tone: StatusTone
  info: ProgramWeekInfo | null
}

export function getProgramStatus(program: Program | null | undefined, today: ISODate = todayISO()): ProgramStatus {
  if (!program) {
    return { kind: 'none', label: 'Sin rutina', detail: 'Crea su primera rutina', tone: 'neutral', info: null }
  }
  const info = getProgramWeekInfo(program, today)
  if (info.phase === 'upcoming') {
    const label = info.daysUntilStart === 1 ? 'Empieza mañana' : `Empieza en ${info.daysUntilStart} días`
    return { kind: 'upcoming', label, detail: `Empieza el ${formatDate(program.startDate)}`, tone: 'info', info }
  }
  if (info.phase === 'expired') {
    const ago = -info.daysLeft
    return {
      kind: 'expired',
      label: 'Finalizada',
      detail: ago === 1 ? 'Terminó ayer' : `Terminó hace ${ago} días`,
      tone: 'danger',
      info,
    }
  }
  const weekLabel = formatWeekOf(info.week, info.totalWeeks)
  if (info.daysLeft <= EXPIRING_THRESHOLD_DAYS) {
    const label =
      info.daysLeft === 0 ? 'Termina hoy' : info.daysLeft === 1 ? 'Termina mañana' : `Termina en ${info.daysLeft} días`
    return { kind: 'expiring', label, detail: weekLabel, tone: 'warning', info }
  }
  return {
    kind: 'active',
    label: weekLabel,
    detail: `Termina el ${formatDate(program.endDate)}`,
    tone: 'success',
    info,
  }
}

/** The client's current program (by currentProgramId), or null. */
export function getCurrentProgram(client: Pick<Client, 'currentProgramId'>, programs: Program[]): Program | null {
  if (!client.currentProgramId) return null
  return programs.find((p) => p.id === client.currentProgramId) ?? null
}

/** All programs of a client, newest start date first. */
export function getClientPrograms(clientId: string, programs: Program[]): Program[] {
  return programs
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0))
}

/** Name to show for a program: its name, or 'Rutina del 27/10/2026'. */
export function getProgramDisplayName(program: Pick<Program, 'name' | 'startDate'>): string {
  return program.name.trim() || `Rutina del ${formatDate(program.startDate)}`
}
