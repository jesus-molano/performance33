// Program timing / status helpers (pure).

import type { Client, ISODate, Program } from '@/types'
import { EXPIRING_THRESHOLD_DAYS } from '@/config/app'
import { diffDays, formatDateShort, todayISO } from './dates'

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

/** Header line for the TV: 'Semana 2 de 4', 'Empieza el 3 nov' or 'Rutina terminada'. */
export function formatProgramPeriod(info: ProgramWeekInfo, startDate: ISODate): string {
  if (info.phase === 'upcoming') return `Empieza el ${formatDateShort(startDate)}`
  if (info.phase === 'expired') return 'Rutina terminada'
  return formatWeekOf(info.week, info.totalWeeks)
}

/** 'Semana 2 de 4'. */
export function formatWeekOf(week: number, totalWeeks: number): string {
  return `Semana ${week} de ${totalWeeks}`
}

export type ProgramStatusKind = 'none' | 'upcoming' | 'active' | 'expiring' | 'expired'
export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface ProgramStatus {
  kind: ProgramStatusKind
  /** Main label: 'Sin rutina' | 'Empieza en 3 días' | 'Semana 2 de 4' | 'Caduca en 3 días' | 'Caduca hoy' | 'Caducada'. */
  label: string
  /** Secondary detail: 'Semana 4 de 4 · termina 2 nov', 'Terminó hace 10 días'… */
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
    return { kind: 'upcoming', label, detail: `Empieza el ${formatDateShort(program.startDate)}`, tone: 'info', info }
  }
  if (info.phase === 'expired') {
    const ago = -info.daysLeft
    return {
      kind: 'expired',
      label: 'Caducada',
      detail: ago === 1 ? 'Terminó ayer' : `Terminó hace ${ago} días`,
      tone: 'danger',
      info,
    }
  }
  const weekLabel = formatWeekOf(info.week, info.totalWeeks)
  if (info.daysLeft <= EXPIRING_THRESHOLD_DAYS) {
    const label =
      info.daysLeft === 0 ? 'Caduca hoy' : info.daysLeft === 1 ? 'Caduca mañana' : `Caduca en ${info.daysLeft} días`
    return { kind: 'expiring', label, detail: weekLabel, tone: 'warning', info }
  }
  return {
    kind: 'active',
    label: weekLabel,
    detail: `Termina el ${formatDateShort(program.endDate)}`,
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

/** Name to show for a program: its name, or 'Rutina del 27 oct'. */
export function getProgramDisplayName(program: Pick<Program, 'name' | 'startDate'>): string {
  return program.name.trim() || `Rutina del ${formatDateShort(program.startDate)}`
}
