// Pure selectors over AppData (no React). Hooks in ./hooks wrap these with memoisation.

import type { AppData, Block, Client, ClientNote, Coach, Day, ExerciseEntry, Program } from '../types'
import { locateBlock, locateDay, locateExercise } from './locate'

export const findCoach = (data: AppData, id: string | null): Coach | null =>
  (id && data.coaches.find((c) => c.id === id)) || null

export const findClient = (data: AppData, id: string): Client | null => data.clients.find((c) => c.id === id) ?? null

export const findProgram = (data: AppData, id: string): Program | null => data.programs.find((p) => p.id === id) ?? null

/** Clients sorted by first name (Spanish collation); archived ones only when asked. */
export function sortClients(clients: Client[], includeArchived = false): Client[] {
  return clients
    .filter((c) => includeArchived || !c.archived)
    .sort((a, b) => a.firstName.localeCompare(b.firstName, 'es') || a.lastName.localeCompare(b.lastName, 'es'))
}

/** A client's notes, pinned first, then newest first. */
export function selectClientNotes(notes: ClientNote[], clientId: string): ClientNote[] {
  return notes
    .filter((n) => n.clientId === clientId)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
}

/** Number of pinned (alert) notes per client id. */
export function countPinnedNotes(notes: ClientNote[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const note of notes) if (note.pinned) counts[note.clientId] = (counts[note.clientId] ?? 0) + 1
  return counts
}

export interface DayContext {
  program: Program
  day: Day
  dayIndex: number
}

export function findDayContext(data: AppData, dayId: string): DayContext | null {
  const loc = locateDay(data, dayId)
  if (!loc) return null
  const program = data.programs[loc.pi]
  return { program, day: program.days[loc.di], dayIndex: loc.di }
}

export interface BlockContext extends DayContext {
  block: Block
  blockIndex: number
}

export function findBlockContext(data: AppData, blockId: string): BlockContext | null {
  const loc = locateBlock(data, blockId)
  if (!loc) return null
  const program = data.programs[loc.pi]
  const day = program.days[loc.di]
  return { program, day, dayIndex: loc.di, block: day.blocks[loc.bi], blockIndex: loc.bi }
}

export interface ExerciseContext extends BlockContext {
  exercise: ExerciseEntry
  exerciseIndex: number
}

export function findExerciseContext(data: AppData, exerciseId: string): ExerciseContext | null {
  const loc = locateExercise(data, exerciseId)
  if (!loc) return null
  const program = data.programs[loc.pi]
  const day = program.days[loc.di]
  const block = day.blocks[loc.bi]
  return {
    program,
    day,
    dayIndex: loc.di,
    block,
    blockIndex: loc.bi,
    exercise: block.exercises[loc.ei],
    exerciseIndex: loc.ei,
  }
}
