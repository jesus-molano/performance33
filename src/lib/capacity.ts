// Pure capacity rules: what a day may hold so it still reads well on the TV.
// One rule (getDayChangeRefusal) backs the store actions and the editor's disabled buttons.

import {
  CAPACITY_TEXTS,
  EXERCISE_CUE_MAX_LENGTH,
  EXERCISE_NAME_MAX_LENGTH,
  LENGTH_HINT_MARGIN,
  MAX_BLOCKS_PER_DAY,
  MAX_EXERCISES_PER_BLOCK,
  MAX_EXERCISES_PER_DAY,
  NEAR_LIMIT_EXERCISES,
} from '@/config/capacity'

export type CapacityRefusal = 'blocks' | 'blockExercises' | 'dayExercises'
export type CapacityLevel = 'ok' | 'near' | 'over'

interface CapacityBlock {
  id: string
  exercises: readonly unknown[]
}

export interface CapacityDay {
  blocks: readonly CapacityBlock[]
}

export interface DayCapacity {
  blocks: number
  exercises: number
  level: CapacityLevel
  /** Why no further block fits, or null. */
  addBlockRefusal: CapacityRefusal | null
}

export function countDayExercises(day: CapacityDay): number {
  return day.blocks.reduce((total, block) => total + block.exercises.length, 0)
}

/**
 * Why a change to a day is refused, or null when allowed. A number already over its limit
 * (imported data) may stay as it is or go down, it just cannot grow.
 */
export function getDayChangeRefusal(previous: CapacityDay, next: CapacityDay): CapacityRefusal | null {
  if (next.blocks.length > Math.max(MAX_BLOCKS_PER_DAY, previous.blocks.length)) return 'blocks'
  const sizeBefore = new Map(previous.blocks.map((block) => [block.id, block.exercises.length]))
  const blockGrewTooMuch = next.blocks.some(
    (block) => block.exercises.length > Math.max(MAX_EXERCISES_PER_BLOCK, sizeBefore.get(block.id) ?? 0),
  )
  if (blockGrewTooMuch) return 'blockExercises'
  const exercises = countDayExercises(next)
  return exercises > Math.max(MAX_EXERCISES_PER_DAY, countDayExercises(previous)) ? 'dayExercises' : null
}

/** Why a new block with this many exercises does not fit, or null. */
export function getAddBlockRefusal(day: CapacityDay, exerciseCount = 0): CapacityRefusal | null {
  const block: CapacityBlock = { id: '', exercises: Array.from({ length: exerciseCount }) }
  return getDayChangeRefusal(day, { blocks: [...day.blocks, block] })
}

/** Why one more exercise in this block does not fit, or null. */
export function getAddExerciseRefusal(day: CapacityDay, blockId: string): CapacityRefusal | null {
  const blocks = day.blocks.map((block) =>
    block.id === blockId ? { ...block, exercises: [...block.exercises, null] } : block,
  )
  return getDayChangeRefusal(day, { blocks })
}

/** Same check when only the block id is known. */
export function findAddExerciseRefusal(days: readonly CapacityDay[], blockId: string): CapacityRefusal | null {
  const day = days.find((candidate) => candidate.blocks.some((block) => block.id === blockId))
  return day ? getAddExerciseRefusal(day, blockId) : null
}

function getCapacityLevel(blocks: number, exercises: number, largestBlock: number): CapacityLevel {
  if (blocks > MAX_BLOCKS_PER_DAY || exercises > MAX_EXERCISES_PER_DAY || largestBlock > MAX_EXERCISES_PER_BLOCK) return 'over'
  return blocks === MAX_BLOCKS_PER_DAY || exercises >= NEAR_LIMIT_EXERCISES ? 'near' : 'ok'
}

export function getDayCapacity(day: CapacityDay): DayCapacity {
  const exercises = countDayExercises(day)
  const largestBlock = Math.max(0, ...day.blocks.map((block) => block.exercises.length))
  return {
    blocks: day.blocks.length,
    exercises,
    level: getCapacityLevel(day.blocks.length, exercises, largestBlock),
    addBlockRefusal: getAddBlockRefusal(day),
  }
}

/** '40/44 · …' once a text gets close to its maximum, or null. The field itself stops at the maximum. */
export function getLengthHint(value: string, max: number): string | null {
  return value.length >= max - LENGTH_HINT_MARGIN ? CAPACITY_TEXTS.lengthHint(value.length, max) : null
}

/** Cuts the texts that go on the TV to their maximum length; other fields pass through. */
export function clampExerciseTexts<T extends { name?: string; cue?: string }>(patch: T): T {
  const clamped = { ...patch }
  if (clamped.name !== undefined) clamped.name = clamped.name.slice(0, EXERCISE_NAME_MAX_LENGTH)
  if (clamped.cue !== undefined) clamped.cue = clamped.cue.slice(0, EXERCISE_CUE_MAX_LENGTH)
  return clamped
}
