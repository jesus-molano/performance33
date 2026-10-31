// Pure walks over the program → day → block → exercise tree.

import type { Block, Day, ExerciseEntry, Program } from '@/types'

export interface ExerciseIndices {
  di: number
  bi: number
  ei: number
}

/** Where an exercise row sits inside one program. */
export interface ExerciseContext {
  day: Day
  dayIndex: number
  block: Block
  blockIndex: number
  exercise: ExerciseEntry
  exerciseIndex: number
}

export function findExerciseIndices(program: Pick<Program, 'days'>, exerciseId: string): ExerciseIndices | null {
  for (let di = 0; di < program.days.length; di++) {
    const blocks = program.days[di].blocks
    for (let bi = 0; bi < blocks.length; bi++) {
      const ei = blocks[bi].exercises.findIndex((e) => e.id === exerciseId)
      if (ei !== -1) return { di, bi, ei }
    }
  }
  return null
}

/** The row with its day and block, or null when it is not in this program (any more). */
export function locateExerciseInProgram(program: Pick<Program, 'days'>, exerciseId: string): ExerciseContext | null {
  const at = findExerciseIndices(program, exerciseId)
  if (!at) return null
  const day = program.days[at.di]
  const block = day.blocks[at.bi]
  return { day, dayIndex: at.di, block, blockIndex: at.bi, exercise: block.exercises[at.ei], exerciseIndex: at.ei }
}

/** Applies `update` to every exercise row; returns the same program when nothing changed. */
export function mapProgramExercises(program: Program, update: (entry: ExerciseEntry) => ExerciseEntry): Program {
  let changed = false
  const days = program.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((entry) => {
        const next = update(entry)
        if (next !== entry) changed = true
        return next
      }),
    })),
  }))
  return changed ? { ...program, days } : program
}
