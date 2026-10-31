import { BLOCK_TYPE_META } from '../../config/blockTypes'
import type { DisplayData, ISODate, PublicClient, PublicDay } from '../../types'
import { blockShowsSets } from '../blocks'
import { todayISO } from '../dates'
import { formatDayTitle, getBlockHeader, getEntryParts, getExerciseLabels } from '../format'
import { formatWeekOf, getProgramWeekInfo } from '../program'
import { getProgressionValue } from '../progression'
import type { DisplayBlock, DisplayDay, DisplayRoutine } from './types'

export interface BuildRoutineOptions {
  /** Program to show; default the client's current program. */
  programId?: string | null
  today?: ISODate
}

function formatBlock(day: PublicDay, blockIndex: number, week: number): DisplayBlock {
  const block = day.blocks[blockIndex]
  const labels = getExerciseLabels(day.blocks, blockIndex)
  const showSets = blockShowsSets(block.type)
  return {
    id: block.id,
    type: block.type,
    ...getBlockHeader(block),
    note: block.note.trim(),
    text: block.text.trim(),
    muted: BLOCK_TYPE_META[block.type].muted,
    exercises: block.exercises.map((entry, i) => {
      const parts = getEntryParts(entry, { showSets, week })
      return {
        id: entry.id,
        label: labels[i] ?? null,
        name: entry.name.trim() || 'Ejercicio',
        volume: parts.volume,
        load: parts.load,
        detail: [parts.tempo, parts.rest].filter(Boolean).join(' · '),
        cue: entry.cue.trim(),
        progressed: getProgressionValue(entry, week) != null,
      }
    }),
  }
}

function formatDay(day: PublicDay, index: number, week: number): DisplayDay {
  return {
    id: day.id,
    number: index + 1,
    name: day.name,
    label: day.label,
    title: formatDayTitle(day),
    blocks: day.blocks.map((_, blockIndex) => formatBlock(day, blockIndex, week)),
  }
}

/** Formatted routine for a client (current program by default). null if client/program missing. */
export function buildDisplayRoutine(
  data: DisplayData,
  clientId: string,
  opts: BuildRoutineOptions = {},
): DisplayRoutine | null {
  const client = data.clients.find((c) => c.id === clientId)
  if (!client) return null
  const programId = opts.programId ?? client.currentProgramId
  const program = data.programs.find((p) => p.id === programId && p.clientId === clientId)
  if (!program) return null
  const info = getProgramWeekInfo(program, opts.today ?? todayISO())
  return {
    branding: data.branding,
    clientId: client.id,
    clientFirstName: client.firstName,
    clientColor: client.color,
    programId: program.id,
    programName: program.name,
    startDate: program.startDate,
    endDate: program.endDate,
    phase: info.phase,
    week: info.week,
    totalWeeks: info.totalWeeks,
    weekLabel: formatWeekOf(info.week, info.totalWeeks),
    days: program.days.map((day, index) => formatDay(day, index, info.week)),
  }
}

/** Clients that can be picked on the TV (active, with a current program), sorted by first name. */
export function getDisplayableClients(data: DisplayData): PublicClient[] {
  return data.clients
    .filter((c) => !c.archived && c.currentProgramId && data.programs.some((p) => p.id === c.currentProgramId))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, 'es'))
}

/** Clamp a 1-based day number into the routine's range (1 when out of range or missing). */
export function clampDayNumber(routine: Pick<DisplayRoutine, 'days'>, day: number | null | undefined): number {
  if (!day || day < 1 || day > routine.days.length) return 1
  return day
}
