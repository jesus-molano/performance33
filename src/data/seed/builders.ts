// Small builders that keep the demo routines readable.

import { endDateFor } from '@/lib/dates'
import { createBlock, createDay, createExercise, exercisePatchFromLibrary } from '@/lib/factories'
import { newId } from '@/lib/ids'
import type { Block, BlockType, Day, ExerciseEntry, ISODate, Program } from '@/types'
import { EXERCISE_LIBRARY } from '@/data/exercises'

/** Exercise row from the library (throws on a typo so the seed never ships broken ids). */
export function ex(libraryId: string, fields: Partial<ExerciseEntry> = {}): ExerciseEntry {
  const lib = EXERCISE_LIBRARY.find((e) => e.id === libraryId)
  if (!lib) throw new Error(`Seed: exercise '${libraryId}' not in library`)
  return createExercise({ ...exercisePatchFromLibrary(lib), ...fields })
}

/** Row without series (circuits, EMOM, AMRAP… where rounds live on the block). */
export function roundEx(libraryId: string, fields: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return ex(libraryId, { sets: null, ...fields })
}

/** Weekly load progression in kg: kg('20', '22,5', '25', '20'). */
export function kgProgression(...values: string[]): ExerciseEntry['progression'] {
  return { target: 'load', values }
}

export function block(
  type: BlockType,
  exercises: ExerciseEntry[],
  init: Partial<Omit<Block, 'id' | 'type' | 'exercises'>> = {},
): Block {
  return createBlock(type, { ...init, exercises })
}

export function day(index: number, label: string, blocks: Block[]): Day {
  return createDay(index, { label, blocks })
}

interface ProgramInit {
  clientId: string
  coachId: string
  startDate: ISODate
  days: Day[]
  name?: string
  weeks?: number
}

export function program({ clientId, coachId, startDate, days, name = '', weeks = 4 }: ProgramInit): Program {
  return {
    id: newId('prg'),
    clientId,
    name,
    startDate,
    weeks,
    endDate: endDateFor(startDate, weeks),
    days,
    createdAt: new Date().toISOString(),
    createdBy: coachId,
  }
}

/** Shared warm-up written as free text, the way coaches write it today in Word. */
export const WARMUP_TEXT = [
  '5′ bici o remo suave',
  '10 gato-camello',
  '10 rotaciones torácicas c/lado',
  '10 puentes de glúteo',
  '2 rondas de 8 sentadillas al aire + 5 flexiones',
].join('\n')
