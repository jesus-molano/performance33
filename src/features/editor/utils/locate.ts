import type { Block, Day, ExerciseEntry, Program } from '../../../types'

export interface RowLocation {
  day: Day
  block: Block
  blockIndex: number
  entry: ExerciseEntry
  index: number
}

/** Finds an exercise row inside one program (null if it is not there any more). */
export function findRowInProgram(program: Program, exerciseId: string): RowLocation | null {
  for (const day of program.days) {
    for (let blockIndex = 0; blockIndex < day.blocks.length; blockIndex++) {
      const block = day.blocks[blockIndex]
      const index = block.exercises.findIndex((e) => e.id === exerciseId)
      if (index !== -1) return { day, block, blockIndex, entry: block.exercises[index], index }
    }
  }
  return null
}
