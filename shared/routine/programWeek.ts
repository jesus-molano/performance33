// Where a routine is in its dates: which week applies and the header line ('Semana 2 de 4'). Pure.

import { diffDays, formatDate, todayISO } from './dates.ts'
import type { ISODate, Program } from './types.ts'

export type ProgramPhase = 'upcoming' | 'active' | 'expired'

export interface ProgramWeekInfo {
  phase: ProgramPhase
  /** 1-based current week, clamped to 1..totalWeeks (1 if upcoming, totalWeeks if expired). */
  week: number
  totalWeeks: number
  /** Days until endDate inclusive (0 = last day is today). Negative if expired. */
  daysLeft: number
  /** Days until start (>0 only when upcoming). */
  daysUntilStart: number
}

export function getProgramWeekInfo(program: Pick<Program, 'startDate' | 'endDate' | 'weeks'>, today: ISODate = todayISO()): ProgramWeekInfo {
  const totalWeeks = Math.max(1, program.weeks)
  const sinceStart = diffDays(program.startDate, today)
  const daysLeft = diffDays(today, program.endDate)
  if (sinceStart < 0) {
    return { phase: 'upcoming', week: 1, totalWeeks, daysLeft, daysUntilStart: -sinceStart }
  }
  if (daysLeft < 0) {
    return { phase: 'expired', week: totalWeeks, totalWeeks, daysLeft, daysUntilStart: 0 }
  }
  const week = Math.min(totalWeeks, Math.floor(sinceStart / 7) + 1)
  return { phase: 'active', week, totalWeeks, daysLeft, daysUntilStart: 0 }
}

/**
 * Week whose progression values apply: only while the program is running. Before it starts or
 * after it ends the base values are shown (same policy in the editor and on the TV).
 */
export function getProgressionWeek(info: Pick<ProgramWeekInfo, 'phase' | 'week'>): number | null {
  return info.phase === 'active' ? info.week : null
}

/** Header line for the TV: 'Semana 2 de 4', 'Empieza el 03/11/2026' or 'Rutina finalizada'. */
export function formatProgramPeriod(info: ProgramWeekInfo, startDate: ISODate): string {
  if (info.phase === 'upcoming') return `Empieza el ${formatDate(startDate)}`
  if (info.phase === 'expired') return 'Rutina finalizada'
  return formatWeekOf(info.week, info.totalWeeks)
}

/** 'Semana 2 de 4'. */
export function formatWeekOf(week: number, totalWeeks: number): string {
  return `Semana ${week} de ${totalWeeks}`
}

