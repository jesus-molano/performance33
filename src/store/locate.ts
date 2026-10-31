// Pure lookup + immutable path-update helpers over AppData (ids are globally unique).

import { replaceAt } from '../lib/arrays'
import type { AppData, Block, Day, ExerciseEntry, Program } from '../types'

export interface DayLoc {
  pi: number
  di: number
}
export interface BlockLoc extends DayLoc {
  bi: number
}
export interface ExerciseLoc extends BlockLoc {
  ei: number
}

export function locateProgram(data: AppData, programId: string): number {
  return data.programs.findIndex((p) => p.id === programId)
}

export function locateDay(data: AppData, dayId: string): DayLoc | null {
  for (let pi = 0; pi < data.programs.length; pi++) {
    const di = data.programs[pi].days.findIndex((d) => d.id === dayId)
    if (di !== -1) return { pi, di }
  }
  return null
}

export function locateBlock(data: AppData, blockId: string): BlockLoc | null {
  for (let pi = 0; pi < data.programs.length; pi++) {
    const days = data.programs[pi].days
    for (let di = 0; di < days.length; di++) {
      const bi = days[di].blocks.findIndex((b) => b.id === blockId)
      if (bi !== -1) return { pi, di, bi }
    }
  }
  return null
}

export function locateExercise(data: AppData, exerciseId: string): ExerciseLoc | null {
  for (let pi = 0; pi < data.programs.length; pi++) {
    const days = data.programs[pi].days
    for (let di = 0; di < days.length; di++) {
      const blocks = days[di].blocks
      for (let bi = 0; bi < blocks.length; bi++) {
        const ei = blocks[bi].exercises.findIndex((e) => e.id === exerciseId)
        if (ei !== -1) return { pi, di, bi, ei }
      }
    }
  }
  return null
}

export const dayAt = (data: AppData, loc: DayLoc): Day => data.programs[loc.pi].days[loc.di]
export const blockAt = (data: AppData, loc: BlockLoc): Block => dayAt(data, loc).blocks[loc.bi]
export const exerciseAt = (data: AppData, loc: ExerciseLoc): ExerciseEntry => blockAt(data, loc).exercises[loc.ei]

export const sameDay = (a: DayLoc, b: DayLoc): boolean => a.pi === b.pi && a.di === b.di
export const sameBlock = (a: BlockLoc, b: BlockLoc): boolean => sameDay(a, b) && a.bi === b.bi

export function withProgram(data: AppData, pi: number, update: (p: Program) => Program): AppData {
  return { ...data, programs: replaceAt(data.programs, pi, update) }
}

export function withDay(data: AppData, loc: DayLoc, update: (d: Day) => Day): AppData {
  return withProgram(data, loc.pi, (p) => ({ ...p, days: replaceAt(p.days, loc.di, update) }))
}

export function withBlock(data: AppData, loc: BlockLoc, update: (b: Block) => Block): AppData {
  return withDay(data, loc, (d) => ({ ...d, blocks: replaceAt(d.blocks, loc.bi, update) }))
}

export function withExercise(data: AppData, loc: ExerciseLoc, update: (e: ExerciseEntry) => ExerciseEntry): AppData {
  return withBlock(data, loc, (b) => ({ ...b, exercises: replaceAt(b.exercises, loc.ei, update) }))
}
